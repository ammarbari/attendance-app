/**
 * ATTENDANCE TRACKER PRO - DASHBOARD MODULE
 * 
 * Handles dashboard functionality:
 * - Display attendance statistics
 * - Show recent activity
 * - Render charts
 * - Update data in real-time
 * 
 * ERROR PREVENTION:
 * - Validate data before rendering
 * - Handle missing chart elements
 * - Prevent chart rendering errors
 * - Handle empty data gracefully
 */

const Dashboard = {
  
  // Chart instances
  weeklyChart: null,
  
  /**
   * Initialize dashboard
   */
  init() {
    // Dashboard will be loaded when user navigates to it
  },
  
  /**
   * Load dashboard data
   */
  loadDashboard() {
    this.updateStatusCards();
    this.loadRecentActivity();
    this.renderWeeklyChart();
  },
  
  /**
   * Update status cards with current data
   */
  updateStatusCards() {
    const stats = Attendance.getStatistics();
    const todayRecord = Storage.getTodayAttendance();
    
    // Today's Status
    const todayStatusEl = document.getElementById('todayStatus');
    if (todayStatusEl) {
      if (!todayRecord) {
        todayStatusEl.textContent = 'Not Checked In';
        todayStatusEl.style.color = 'var(--text-secondary)';
      } else if (todayRecord.timeOut) {
        todayStatusEl.textContent = 'Checked Out';
        todayStatusEl.style.color = 'var(--success-color)';
      } else {
        todayStatusEl.textContent = 'Checked In';
        todayStatusEl.style.color = 'var(--success-color)';
      }
    }
    
    // Monthly Attendance
    const monthlyAttendanceEl = document.getElementById('monthlyAttendance');
    if (monthlyAttendanceEl) {
      monthlyAttendanceEl.textContent = `${stats.totalDays} Days`;
    }
    
    // Work Hours
    const workHoursEl = document.getElementById('workHours');
    if (workHoursEl) {
      if (todayRecord && todayRecord.timeIn && !todayRecord.timeOut) {
        // Calculate current work hours
        const timeIn = new Date(todayRecord.timeIn);
        const now = new Date();
        const duration = Utils.calculateTimeDifference(timeIn, now);
        workHoursEl.textContent = duration.total;
      } else if (todayRecord && todayRecord.workHours !== undefined) {
        workHoursEl.textContent = `${todayRecord.workHours}h ${todayRecord.workMinutes}m`;
      } else {
        workHoursEl.textContent = '0h 0m';
      }
    }
    
    // Attendance Rate
    const attendanceRateEl = document.getElementById('attendanceRate');
    if (attendanceRateEl) {
      attendanceRateEl.textContent = `${stats.attendanceRate}%`;
    }
    
    // Update work hours every minute if checked in
    if (todayRecord && todayRecord.timeIn && !todayRecord.timeOut) {
      setTimeout(() => this.updateStatusCards(), 60000);
    }
  },
  
  /**
   * Load and display recent activity
   */
  loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    const records = Storage.getAttendanceRecords();
    
    // Get last 5 records
    const recentRecords = records
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
      .slice(0, 5);
    
    if (recentRecords.length === 0) {
      activityList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No recent activity</p>
        </div>
      `;
      return;
    }
    
    activityList.innerHTML = recentRecords.map(record => {
      const date = new Date(record.dateTime);
      const dayName = Utils.getDayName(date);
      const formattedDate = Utils.formatDate(date);
      
      let statusIcon = 'fa-check-circle';
      let statusClass = 'success';
      let statusText = 'Present';
      
      if (record.status === 'late') {
        statusIcon = 'fa-clock';
        statusClass = 'warning';
        statusText = 'Late';
      } else if (record.earlyLeave) {
        statusIcon = 'fa-sign-out-alt';
        statusClass = 'danger';
        statusText = 'Early Leave';
      }
      
      const timeInfo = record.timeOut 
        ? `${record.timeInFormatted} - ${record.timeOutFormatted}`
        : `${record.timeInFormatted} (In Progress)`;
      
      return `
        <div class="activity-item">
          <div class="activity-icon ${statusClass}">
            <i class="fas ${statusIcon}"></i>
          </div>
          <div class="activity-content">
            <h4>${dayName}, ${formattedDate}</h4>
            <p>${timeInfo} • ${statusText}</p>
          </div>
        </div>
      `;
    }).join('');
  },
  
  /**
   * Render weekly attendance chart
   */
  renderWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return;
    
    // Destroy existing chart if any
    if (this.weeklyChart) {
      this.weeklyChart.destroy();
    }
    
    // Get data for last 7 days
    const chartData = this.getWeeklyChartData();
    
    const ctx = canvas.getContext('2d');
    
    try {
      this.weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: chartData.labels,
          datasets: [{
            label: 'Work Hours',
            data: chartData.hours,
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.parsed.y.toFixed(1)} hours`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return value + 'h';
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Chart rendering error:', error);
      canvas.parentElement.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-chart-bar"></i>
          <p>Unable to render chart</p>
        </div>
      `;
    }
  },
  
  /**
   * Get data for weekly chart
   * @returns {object} Chart data
   */
  getWeeklyChartData() {
    const records = Storage.getAttendanceRecords();
    const labels = [];
    const hours = [];
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dateStr = Utils.formatDate(date);
      const dayName = Utils.getDayName(date).substring(0, 3); // Mon, Tue, etc.
      
      labels.push(dayName);
      
      // Find record for this date
      const record = records.find(r => r.date === dateStr);
      
      if (record && record.totalWorkMinutes) {
        hours.push(record.totalWorkMinutes / 60);
      } else {
        hours.push(0);
      }
    }
    
    return { labels, hours };
  },
  
  /**
   * Update dashboard in real-time
   */
  startRealtimeUpdates() {
    // Update every minute
    setInterval(() => {
      if (document.getElementById('dashboardPage').classList.contains('active')) {
        this.updateStatusCards();
      }
    }, 60000);
  },
  
  /**
   * Refresh dashboard data
   */
  refresh() {
    this.loadDashboard();
    Utils.showToast('Dashboard refreshed', 'info');
  }
};

// Make Dashboard available globally
window.Dashboard = Dashboard;

// Initialize dashboard
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Dashboard.init());
} else {
  Dashboard.init();
}