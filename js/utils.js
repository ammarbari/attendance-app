/**
 * ATTENDANCE TRACKER PRO - UTILITY FUNCTIONS
 * 
 * Common utility functions used throughout the application.
 * All functions are pure and reusable.
 */

const Utils = {
  
  /**
   * Format date to readable string
   * @param {Date|string} date - Date object or string
   * @param {string} format - Format string (default: 'DD/MM/YYYY')
   * @returns {string} Formatted date
   */
  formatDate(date, format = 'DD/MM/YYYY') {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year);
  },
  
  /**
   * Format time to readable string
   * @param {Date|string} date - Date object or string
   * @param {string} format - Format string (default: 'HH:mm:ss')
   * @returns {string} Formatted time
   */
  formatTime(date, format = 'HH:mm:ss') {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
      return 'Invalid Time';
    }
    
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },
  
  /**
   * Get current date and time
   * @returns {object} Object with date, time, and timestamp
   */
  getCurrentDateTime() {
    const now = new Date();
    return {
      date: this.formatDate(now),
      time: this.formatTime(now),
      timestamp: now.getTime(),
      dateTime: now.toISOString()
    };
  },
  
  /**
   * Calculate time difference in hours and minutes
   * @param {Date|string} startTime - Start time
   * @param {Date|string} endTime - End time
   * @returns {object} Hours and minutes difference
   */
  calculateTimeDifference(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { hours: 0, minutes: 0, total: '0h 0m' };
    }
    
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    return {
      hours,
      minutes,
      totalMinutes: diffMins,
      total: `${hours}h ${minutes}m`
    };
  },
  
  /**
   * Check if time is late based on scheduled start time
   * @param {string} actualTime - Actual check-in time (HH:mm)
   * @param {string} scheduledTime - Scheduled start time (HH:mm)
   * @param {number} threshold - Late threshold in minutes
   * @returns {boolean} True if late
   */
  isLate(actualTime, scheduledTime = '09:00', threshold = 15) {
    const [actualHour, actualMin] = actualTime.split(':').map(Number);
    const [schedHour, schedMin] = scheduledTime.split(':').map(Number);
    
    const actualMins = actualHour * 60 + actualMin;
    const schedMins = schedHour * 60 + schedMin;
    
    return actualMins > (schedMins + threshold);
  },
  
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  },
  
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @param {object} rules - Validation rules
   * @returns {object} Validation result
   */
  validatePassword(password, rules = {}) {
    const {
      minLength = 6,
      requireUppercase = false,
      requireLowercase = false,
      requireNumbers = false,
      requireSpecialChars = false
    } = rules;
    
    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`);
    }
    
    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }
    
    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter');
    }
    
    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain a number');
    }
    
    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain a special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in meters
  },
  
  /**
   * Check if coordinates are within geo-fence
   * @param {number} userLat - User latitude
   * @param {number} userLon - User longitude
   * @param {number} officeLat - Office latitude
   * @param {number} officeLon - Office longitude
   * @param {number} radius - Geo-fence radius in meters
   * @returns {boolean} True if within geo-fence
   */
  isWithinGeofence(userLat, userLon, officeLat, officeLon, radius) {
    const distance = this.calculateDistance(userLat, userLon, officeLat, officeLon);
    return distance <= radius;
  },
  
  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  
  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  /**
   * Throttle function
   * @param {Function} func - Function to throttle
   * @param {number} limit - Limit time in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  /**
   * Convert data URL to Blob
   * @param {string} dataUrl - Data URL
   * @returns {Blob} Blob object
   */
  dataUrlToBlob(dataUrl) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  },
  
  /**
   * Sanitize HTML to prevent XSS
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  },
  
  /**
   * Deep clone object
   * @param {object} obj - Object to clone
   * @returns {object} Cloned object
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item));
    }
    
    if (obj instanceof Object) {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  },
  
  /**
   * Format file size to human readable
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },
  
  /**
   * Get month name from number
   * @param {number} month - Month number (1-12)
   * @returns {string} Month name
   */
  getMonthName(month) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Invalid Month';
  },
  
  /**
   * Get day name from date
   * @param {Date|string} date - Date object or string
   * @returns {string} Day name
   */
  getDayName(date) {
    const d = new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()] || 'Invalid Day';
  },
  
  /**
   * Check if date is today
   * @param {Date|string} date - Date to check
   * @returns {boolean} True if today
   */
  isToday(date) {
    const d = new Date(date);
    const today = new Date();
    
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  },
  
  /**
   * Get start and end of month
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {object} Start and end dates
   */
  getMonthRange(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return {
      start: startDate,
      end: endDate,
      startStr: this.formatDate(startDate),
      endStr: this.formatDate(endDate)
    };
  },
  
  /**
   * Convert object to query string
   * @param {object} obj - Object to convert
   * @returns {string} Query string
   */
  objectToQueryString(obj) {
    return Object.keys(obj)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
      .join('&');
  },
  
  /**
   * Parse query string to object
   * @param {string} queryString - Query string
   * @returns {object} Parsed object
   */
  queryStringToObject(queryString) {
    const params = new URLSearchParams(queryString);
    const obj = {};
    
    for (const [key, value] of params) {
      obj[key] = value;
    }
    
    return obj;
  },
  
  /**
   * Show loading overlay
   */
  showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  },
  
  /**
   * Hide loading overlay
   */
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  },
  
  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds
   */
  showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fas ${icons[type]}"></i>
      </div>
      <div class="toast-content">
        <p>${this.sanitizeHTML(message)}</p>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  
  /**
   * Confirm dialog
   * @param {string} message - Message to display
   * @returns {Promise<boolean>} True if confirmed
   */
  async confirm(message) {
    return new Promise((resolve) => {
      const result = window.confirm(message);
      resolve(result);
    });
  },
  
  /**
   * Get browser information
   * @returns {object} Browser info
   */
  getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (ua.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)[1];
    } else if (ua.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)[1];
    } else if (ua.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = ua.match(/Version\/([0-9.]+)/)[1];
    } else if (ua.indexOf('Edge') > -1) {
      browserName = 'Edge';
      browserVersion = ua.match(/Edge\/([0-9.]+)/)[1];
    }
    
    return {
      name: browserName,
      version: browserVersion,
      userAgent: ua,
      platform: navigator.platform,
      language: navigator.language
    };
  },
  
  /**
   * Check if device is mobile
   * @returns {boolean} True if mobile
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} True if successful
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}