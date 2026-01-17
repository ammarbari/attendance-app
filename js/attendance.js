/**
 * ATTENDANCE TRACKER PRO - ATTENDANCE MODULE
 * 
 * Handles attendance marking functionality:
 * - Time In/Time Out
 * - Location verification
 * - Face verification
 * - Offline support
 * 
 * ERROR PREVENTION:
 * - Validate user authentication
 * - Check geo-fence before marking
 * - Verify face recognition
 * - Handle offline scenarios
 * - Allow multiple Time Ins per day
 */

const Attendance = {
  
  // Today's attendance record
  todayRecord: null,
  
  // Offline queue
  offlineQueue: [],
  
  /**
   * Initialize attendance module
   */
  init() {
    this.setupEventListeners();
    this.loadTodayAttendance();
    this.startClock();
    
    // Setup offline support
    if (CONFIG.OFFLINE.enabled) {
      this.setupOfflineSupport();
    }
  },
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Time In button
    const timeInBtn = document.getElementById('timeInBtn');
    if (timeInBtn) {
      timeInBtn.addEventListener('click', () => this.handleTimeIn());
    }
    
    // Time Out button
    const timeOutBtn = document.getElementById('timeOutBtn');
    if (timeOutBtn) {
      timeOutBtn.addEventListener('click', () => this.handleTimeOut());
    }
  },
  
  /**
   * Start real-time clock
   */
  startClock() {
    const updateClock = () => {
      const currentTimeEl = document.getElementById('currentTime');
      if (currentTimeEl) {
        const now = new Date();
        currentTimeEl.textContent = Utils.formatTime(now);
      }
    };
    
    updateClock();
    setInterval(updateClock, 1000);
  },
  
  /**
   * Load today's attendance record
   */
  loadTodayAttendance() {
    this.todayRecord = Storage.getTodayAttendance();
    this.updateAttendanceUI();
  },
  
  /**
   * Update attendance UI based on current status
   */
  updateAttendanceUI() {
    const timeInBtn = document.getElementById('timeInBtn');
    const timeOutBtn = document.getElementById('timeOutBtn');
    const attendanceInfo = document.getElementById('attendanceInfo');
    
    if (!timeInBtn || !timeOutBtn || !attendanceInfo) return;
    
    if (!this.todayRecord) {
      timeInBtn.disabled = false;
      timeOutBtn.disabled = true;
      attendanceInfo.innerHTML = '<i class="fas fa-info-circle"></i> Click Time In to start your day';
    } else if (this.todayRecord.timeIn && !this.todayRecord.timeOut) {
      timeInBtn.disabled = false; // allow multiple Time Ins
      timeOutBtn.disabled = false;
      
      const timeIn = new Date(this.todayRecord.timeIn);
      attendanceInfo.innerHTML = `
        <i class="fas fa-check-circle" style="color: var(--success-color);"></i> 
        Checked in at ${Utils.formatTime(timeIn)}
      `;
    } else if (this.todayRecord.timeOut) {
      timeInBtn.disabled = false; // still allow Time In after Time Out
      timeOutBtn.disabled = false;
      
      const timeOut = new Date(this.todayRecord.timeOut);
      attendanceInfo.innerHTML = `
        <i class="fas fa-check-circle" style="color: var(--success-color);"></i> 
        Last check out at ${Utils.formatTime(timeOut)}. You can Time In again.
      `;
    }
  },
  
  /**
   * Handle Time In
   */
  async handleTimeIn() {
    try {
      if (!Auth.isAuthenticated()) {
        Utils.showToast('Please login first', 'error');
        return;
      }
      
      Utils.showLoading();
      
      const locationValid = await this.validateLocation();
      if (!locationValid) {
        Utils.hideLoading();
        return;
      }
      
      const position = Location.getPosition();
      
      let faceVerified = false;
      let photoData = null;
      
      if (CONFIG.isFeatureEnabled('faceRecognition')) {
        const cameraStarted = await Camera.startCamera();
        if (cameraStarted) {
          Utils.hideLoading();
          await this.delay(1000);
          
          const faceResult = await Camera.performFaceVerification();
          
          if (!faceResult.success) {
            if (faceResult.requiresRegistration) {
              const registered = await Camera.showFaceModal();
              if (!registered) {
                Camera.stopCamera();
                Utils.showToast('Face registration required for attendance', 'error');
                return;
              }
              Utils.showLoading();
              await Camera.startCamera();
              await this.delay(1000);
              const retryResult = await Camera.performFaceVerification();
              if (!retryResult.success) {
                Camera.stopCamera();
                Utils.hideLoading();
                Utils.showToast(retryResult.message, 'error');
                return;
              }
              faceVerified = true;
            } else {
              Camera.stopCamera();
              Utils.showToast(faceResult.message, 'error');
              return;
            }
          } else {
            faceVerified = true;
          }
          
          Utils.showLoading();
          photoData = Camera.capturePhoto();
          Camera.stopCamera();
        }
      }
      
      const now = new Date();
      const timeString = Utils.formatTime(now);
      const isLate = Utils.isLate(timeString, CONFIG.WORK_SCHEDULE.startTime, CONFIG.WORK_SCHEDULE.lateThreshold);
      
      const attendanceRecord = {
        id: Utils.generateId(),
        userId: Auth.getCurrentUser().id,
        userName: Auth.getCurrentUser().name,
        date: Utils.formatDate(now),
        dateTime: now.toISOString(),
        timeIn: now.toISOString(),
        timeInFormatted: timeString,
        timeOut: null,
        location: {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy
        },
        photo: photoData,
        faceVerified: faceVerified,
        status: isLate ? 'late' : 'present',
        synced: false
      };
      
      const saved = Storage.saveAttendanceRecord(attendanceRecord);
      
      if (saved) {
        this.todayRecord = attendanceRecord;
        this.updateAttendanceUI();
        
        Utils.hideLoading();
        Utils.showToast(CONFIG.getSuccess('checkinSuccess'), 'success');
        
        if (navigator.onLine) {
          this.syncAttendance(attendanceRecord);
        } else {
          this.addToOfflineQueue(attendanceRecord);
        }
      } else {
        Utils.hideLoading();
        Utils.showToast('Failed to save attendance. Please try again.', 'error');
      }
      
    } catch (error) {
      Utils.hideLoading();
      console.error('Time In error:', error);
      Utils.showToast(CONFIG.getError('unknownError'), 'error');
    }
  },
  
  /**
   * Handle Time Out
   */
  async handleTimeOut() {
    try {
      if (!Auth.isAuthenticated()) {
        Utils.showToast('Please login first', 'error');
        return;
      }
      
      if (!this.todayRecord || !this.todayRecord.timeIn) {
        Utils.showToast(CONFIG.getError('notCheckedIn'), 'error');
        return;
      }
      
      Utils.showLoading();
      
      const locationValid = await this.validateLocation();
      if (!locationValid) {
        Utils.hideLoading();
        return;
      }
      
      const position = Location.getPosition();
      let photoData = null;
      
      if (CONFIG.isFeatureEnabled('faceRecognition')) {
        const cameraStarted = await Camera.startCamera();
        if (cameraStarted) {
          Utils.hideLoading();
          await this.delay(1000);
          photoData = Camera.capturePhoto();
          Camera.stopCamera();
          Utils.showLoading();
        }
      }
      
      const now = new Date();
      const timeString = Utils.formatTime(now);
      const timeIn = new Date(this.todayRecord.timeIn);
      const workDuration = Utils.calculateTimeDifference(timeIn, now);
      const isEarlyLeave = this.isEarlyLeave(timeString);
      
      const updates = {
        timeOut: now.toISOString(),
        timeOutFormatted: timeString,
        checkoutLocation: {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy
        },
        checkoutPhoto: photoData,
        workHours: workDuration.hours,
        workMinutes: workDuration.minutes,
        totalWorkMinutes: workDuration.totalMinutes,
        earlyLeave: isEarlyLeave,
        synced: false
      };
      
      if (isEarlyLeave && this.todayRecord.status === 'present') {
        updates.status = 'early_leave';
      }
      
      const updated = Storage.updateAttendanceRecord(this.todayRecord.id, updates);
      
      if (updated) {
        this.todayRecord = { ...this.todayRecord, ...updates };
        this.updateAttendanceUI();
        
        Utils.hideLoading();
        Utils.showToast(CONFIG.getSuccess('checkoutSuccess'), 'success');
        
        if (navigator.onLine) {
          this.syncAttendance(this.todayRecord);
        } else {
          this.addToOfflineQueue(this.todayRecord);
        }
      } else {
        Utils.hideLoading();
        Utils.showToast('Failed to update attendance. Please try again.', 'error');
      }
      
    } catch (error) {
      Utils.hideLoading();
      console.error('Time Out error:', error);
      Utils.showToast(CONFIG.getError('unknownError'), 'error');
    }
  },
  
  async validateLocation() {
    try {
      const isValid = await Location.validateGeofence();
      if (!isValid) {
        Utils.showToast(CONFIG.getError('outsideGeofence'), 'error');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Location validation error:', error);
      Utils.showToast('Failed to validate location. Please try again.', 'error');
      return false;
    }
  },
  
  isEarlyLeave(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const [endHours, endMinutes] = CONFIG.WORK_SCHEDULE.endTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return totalMinutes < (endTotalMinutes - CONFIG.WORK_SCHEDULE.earlyLeaveThreshold);
  },
  
  async syncAttendance(record) {
    try {
      console.log('Syncing attendance:', record);
      Storage.updateAttendanceRecord(record.id, { synced: true });
    } catch (error) {
      console.error('Sync error:', error);
      this.addToOfflineQueue(record);
    }
  },
  
  addToOfflineQueue(record) {
    this.offlineQueue.push(record);
    console.log('Added to offline queue:', record);
    Utils.showToast('Attendance saved offline. Will sync when online.', 'info');
  },
  
  setupOfflineSupport() {
    window.addEventListener('online', () => this.syncOfflineQueue());
    window.addEventListener('offline', () => Utils.showToast('You are offline.', 'info'));
    if (CONFIG.OFFLINE.enabled) {
      setInterval(() => {
        if (navigator.onLine && this.offlineQueue.length > 0) this.syncOfflineQueue();
      }, CONFIG.OFFLINE.syncInterval);
    }
  },
  
  async syncOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    for (const record of queue) {
      try { await this.syncAttendance(record); } 
      catch (error) { this.offlineQueue.push(record); }
    }
    if (this.offlineQueue.length === 0) {
      Utils.showToast('All offline records synced successfully', 'success');
    }
  },
  
getStatistics() {
    const records = Storage.getAttendanceRecords();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Filter records for current month
    const monthlyRecords = records.filter(record => {
      const recordDate = new Date(record.dateTime);
      return recordDate.getMonth() + 1 === currentMonth &&
             recordDate.getFullYear() === currentYear;
    });

    // Count unique dates
    const uniqueDates = [...new Set(monthlyRecords.map(r => r.date))];
    const totalDays = uniqueDates.length;

    // Get the latest record per day for accurate stats
    const latestRecordsByDate = uniqueDates.map(date => {
      const dailyRecords = monthlyRecords.filter(r => r.date === date);
      return dailyRecords[dailyRecords.length - 1]; // latest record (last Time Out)
    });

    const presentDays = latestRecordsByDate.filter(r => r.status === 'present').length;
    const lateDays = latestRecordsByDate.filter(r => r.status === 'late').length;
    const earlyLeaveDays = latestRecordsByDate.filter(r => r.earlyLeave).length;

    // Total work time
    let totalWorkMinutes = 0;
    latestRecordsByDate.forEach(record => {
      if (record.totalWorkMinutes) totalWorkMinutes += record.totalWorkMinutes;
    });

    const totalWorkHours = Math.floor(totalWorkMinutes / 60);
    const remainingMinutes = totalWorkMinutes % 60;

    return {
      totalDays,
      presentDays,
      lateDays,
      earlyLeaveDays,
      totalWorkHours,
      totalWorkMinutes: remainingMinutes,
      attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
    };
},

delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Attendance.init());
} else {
    Attendance.init();
}