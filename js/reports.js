/**
 * ATTENDANCE TRACKER PRO - REPORTS MODULE
 * 
 * Handles reporting functionality:
 * - Generate attendance reports
 * - Display charts and analytics
 * - Export to CSV
 * - Filter by date range
 * 
 * ERROR PREVENTION:
 * - Validate date inputs
 * - Handle empty data sets
 * - Prevent chart rendering errors
 * - Validate export data
 */

const Reports = {
  
  // Chart instances
  pieChart: null,
  trendChart: null,
  
  /**
   * Initialize reports module
   */
  init() {
    this.setupEventListeners();
    this.setDefaultMonth();
  },
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Generate report button
    const generateBtn = document.getElementById('generateReportBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateReport());
    }
    
    // Export CSV button
    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportToCSV());
    }
  },
  
  /**
   * Set default month to current month
   */
  setDefaultMonth() {
    const monthInput = document.getElementById('reportMonth');
    if (monthInput) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      monthInput.value = `${year}-${month}`;
    }
  },
  
  /**
   * Generate attendance report
   */
  generateReport() {
    const monthInput = document.getElementById('reportMonth');
    if (!monthInput || !monthInput.value) {
      Utils.showToast('Please select a month', 'warning');
      return;
    }
    
    const [year, month] = monthInput.value.split('-').map(Number);
    
    Utils.showLoading();
    
    // Small delay for better UX
    setTimeout(() => {
      this.renderAttendanceSummary(year, month);
      this.renderMonthlyTrend(year, month);
      this.populateHistoryTable(year, month);
      
      Utils.hideLoading();
      Utils.showToast('Report generated successfully', 'success');
    }, 500);
  },
  
  /**
   * Render attendance summary pie chart
   * @param {number} year - Year
   * @param {number} month - Month
   */
  renderAttendanceSummary(year, month) {
    const canvas = document.getElementById('attendancePieChart');
    if (!canvas) return;
    
    // Destroy existing chart
    if (this.pieChart) {
      this.pieChart.destroy();
    }
    
    // Get monthly data
    const records = Storage.getMonthlyAttendance(year, month);
    
    if (records.length === 0) {
      canvas.parentElement.innerHTML = `
        <h3>Attendance Summary</h3>
        <div class="empty-state">
          <i class="fas fa-chart-pie"></i>
          <p>No attendance data for this month</p>
        </div>
      `;
      return;
    }
    
    // Calculate statistics
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const earlyLeave = records.filter(r => r.earlyLeave).length;
    
    const ctx = canvas.getContext('2d');
    
    try {
      this.pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Present', 'Late', 'Early Leave'],
          datasets: [{
            data: [present, late, earlyLeave],
            backgroundColor: [
              CONFIG.REPORTS.chartColors.present,
              CONFIG.REPORTS.chartColors.late,
              CONFIG.REPORTS.chartColors.earlyLeave
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Pie chart rendering error:', error);
      canvas.parentElement.innerHTML = `
        <h3>Attendance Summary</h3>
        <div class="empty-state">
          <i class="fas fa-chart-pie"></i>
          <p>Unable to render chart</p>
        </div>
      `;
    }
  },
  
  /**
   * Render monthly trend chart
   * @param {number} year - Year
   * @param {number} month - Month
   */
  renderMonthlyTrend(year, month) {
    const canvas = document.getElementById('monthlyTrendChart');
    if (!canvas) return;
    
    // Destroy existing chart
    if (this.trendChart) {
      this.trendChart.destroy();
    }
    
    // Get monthly data
    const records = Storage.getMonthlyAttendance(year, month);
    
    if (records.length === 0) {
      canvas.parentElement.innerHTML = `
        <h3>Monthly Trends</h3>
        <div class="empty-state">
          <i class="fas fa-chart-line"></i>
          <p>No attendance data for this month</p>
        </div>
      `;
      return;
    }
    
    // Prepare data
    const chartData = this.prepareMonthlyTrendData(records, year, month);
    
    const ctx = canvas.getContext('2d');
    
    try {
      this.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: [{
            label: 'Work Hours',
            data: chartData.hours,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
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
      console.error('Trend chart rendering error:', error);
      canvas.parentElement.innerHTML = `
        <h3>Monthly Trends</h3>
        <div class="empty-state">
          <i class="fas fa-chart-line"></i>
          <p>Unable to render chart</p>
        </div>
      `;
    }
  },
  
  /**
   * Prepare data for monthly trend chart
   * @param {Array} records - Attendance records
   * @param {number} year - Year
   * @param {number} month - Month
   * @returns {object} Chart data
   */
  prepareMonthlyTrendData(records, year, month) {
    const labels = [];
    const hours = [];
    
    // Get days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Create data for each day
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = Utils.formatDate(new Date(year, month - 1, day));
      labels.push(day);
      
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
   * Populate attendance history table
   * @param {number} year - Year
   * @param {number} month - Month
   */
  populateHistoryTable(year, month) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    const records = Storage.getMonthlyAttendance(year, month);
    
    if (records.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>No attendance records found</p>
          </td>
        </tr>
      `;
      return;
    }
    
    // Sort by date descending
    records.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    
    tbody.innerHTML = records.map(record => {
      const workHours = record.totalWorkMinutes 
        ? `${Math.floor(record.totalWorkMinutes / 60)}h ${record.totalWorkMinutes % 60}m`
        : 'In Progress';
      
      let statusBadge = '';
      if (record.status === 'present') {
        statusBadge = '<span style="color: var(--success-color); font-weight: 500;">✓ Present</span>';
      } else if (record.status === 'late') {
        statusBadge = '<span style="color: var(--warning-color); font-weight: 500;">⚠ Late</span>';
      } else if (record.status === 'early_leave') {
        statusBadge = '<span style="color: var(--danger-color); font-weight: 500;">← Early Leave</span>';
      }
      
      const location = `${record.location.latitude.toFixed(4)}, ${record.location.longitude.toFixed(4)}`;
      
      return `
        <tr>
          <td>${record.date}</td>
          <td>${record.timeInFormatted || '-'}</td>
          <td>${record.timeOutFormatted || '-'}</td>
          <td>${workHours}</td>
          <td>${statusBadge}</td>
          <td><small>${location}</small></td>
        </tr>
      `;
    }).join('');
  },
  
  /**
   * Export attendance data to CSV
   */
  exportToCSV() {
    const monthInput = document.getElementById('reportMonth');
    if (!monthInput || !monthInput.value) {
      Utils.showToast('Please select a month first', 'warning');
      return;
    }
    
    const [year, month] = monthInput.value.split('-').map(Number);
    const records = Storage.getMonthlyAttendance(year, month);
    
    if (records.length === 0) {
      Utils.showToast('No data to export', 'warning');
      return;
    }
    
    // Prepare CSV content
    const headers = [
      'Date',
      'Day',
      'Time In',
      'Time Out',
      'Work Hours',
      'Status',
      'Latitude',
      'Longitude',
      'Face Verified'
    ];
    
    const rows = records.map(record => {
      const date = new Date(record.dateTime);
      const dayName = Utils.getDayName(date);
      const workHours = record.totalWorkMinutes 
        ? `${Math.floor(record.totalWorkMinutes / 60)}:${String(record.totalWorkMinutes % 60).padStart(2, '0')}`
        : '';
      
      return [
        record.date,
        dayName,
        record.timeInFormatted || '',
        record.timeOutFormatted || '',
        workHours,
        record.status,
        record.location.latitude,
        record.location.longitude,
        record.faceVerified ? 'Yes' : 'No'
      ];
    });
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const monthName = Utils.getMonthName(month);
    const filename = `attendance_${monthName}_${year}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    Utils.showToast(`Report exported as ${filename}`, 'success');
  },
  
  /**
   * Get summary statistics for a month
   * @param {number} year - Year
   * @param {number} month - Month
   * @returns {object} Summary statistics
   */
  getSummaryStats(year, month) {
    const records = Storage.getMonthlyAttendance(year, month);
    
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const earlyLeaveDays = records.filter(r => r.earlyLeave).length;
    
    let totalWorkMinutes = 0;
    records.forEach(record => {
      if (record.totalWorkMinutes) {
        totalWorkMinutes += record.totalWorkMinutes;
      }
    });
    
    const avgWorkMinutes = totalDays > 0 ? totalWorkMinutes / totalDays : 0;
    const avgWorkHours = Math.floor(avgWorkMinutes / 60);
    const avgWorkMins = Math.floor(avgWorkMinutes % 60);
    
    return {
      totalDays,
      presentDays,
      lateDays,
      earlyLeaveDays,
      totalWorkHours: Math.floor(totalWorkMinutes / 60),
      avgWorkHours,
      avgWorkMins,
      attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
    };
  }
};

// Initialize reports when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Reports.init());
} else {
  Reports.init();
}