/**
 * ATTENDANCE TRACKER PRO - CONFIGURATION
 * 
 * This file contains all configuration settings for the application.
 * Replace placeholder values with your actual API keys and settings.
 * 
 * SECURITY NOTE: Never commit actual API keys to version control.
 * Use environment variables in production.
 */

const CONFIG = {
  // ========== APPLICATION SETTINGS ==========
  APP_NAME: 'Attendance Tracker Pro',
  APP_VERSION: '1.0.0',
  
  // ========== FIREBASE AUTHENTICATION ==========
  // Get these from Firebase Console: https://console.firebase.google.com
  FIREBASE: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID'
  },
  
  // ========== OFFICE LOCATION SETTINGS ==========
  // Main office coordinates - Replace with your actual office location
  OFFICE_LOCATION: {
    latitude: 24.969478,    // Karachi, Pakistan (example)
    longitude: 67.177018,
    name: 'Main Office'
  },
  
  // Geo-fence radius in meters (attendance only allowed within this radius)
  GEO_FENCE_RADIUS: 1000,
  
  // Maximum distance to show on map (in meters)
  MAX_MAP_DISTANCE: 5000,
  
  // ========== WORKING HOURS ==========
  WORK_SCHEDULE: {
    startTime: '09:00',      // Work start time (24-hour format)
    endTime: '17:00',        // Work end time (24-hour format)
    lateThreshold: 15,       // Minutes after start time to mark as late
    earlyLeaveThreshold: 30  // Minutes before end time to mark as early leave
  },
  
  // ========== FACE RECOGNITION SETTINGS ==========
  FACE_API: {
    // Models are loaded from CDN - these paths are relative to face-api.js CDN
    modelsPath: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/',
    
    // Face detection options
    detectionOptions: {
      scoreThreshold: 0.5,        // Minimum confidence score (0-1)
      inputSize: 512,             // Input size for face detection
      maxFaces: 1                 // Only detect single face for attendance
    },
    
    // Face matching threshold (lower = more strict)
    matchThreshold: 0.6
  },
  
  // ========== LOCATION SETTINGS ==========
  LOCATION: {
    // Geolocation API options
    timeout: 10000,              // Timeout in milliseconds
    maximumAge: 0,               // Don't use cached position
    enableHighAccuracy: true,    // Use GPS if available
    
    // Map settings (using OpenStreetMap)
    mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    mapAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    defaultZoom: 16
  },
  
  // ========== CAMERA SETTINGS ==========
  CAMERA: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user'  // 'user' for front camera, 'environment' for back
    },
    
    // Photo quality for storage (0.0 - 1.0)
    photoQuality: 0.8,
    
    // Photo format
    photoFormat: 'image/jpeg'
  },
  
  // ========== STORAGE SETTINGS ==========
  STORAGE: {
    // LocalStorage keys
    keys: {
      user: 'attendance_user',
      token: 'attendance_token',
      theme: 'attendance_theme',
      attendance: 'attendance_records',
      faceDescriptor: 'face_descriptor',
      cookies: 'cookies_accepted'
    },
    
    // IndexedDB settings (for offline support)
    dbName: 'AttendanceDB',
    dbVersion: 1,
    storeName: 'attendance'
  },
  
  // ========== API ENDPOINTS ==========
  // If you have a backend server, configure these endpoints
  API: {
    baseUrl: 'http://localhost:3000/api',  // Change to your backend URL
    endpoints: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      checkIn: '/attendance/checkin',
      checkOut: '/attendance/checkout',
      getAttendance: '/attendance/history',
      getReports: '/reports',
      updateProfile: '/user/profile'
    },
    
    // Request timeout in milliseconds
    timeout: 30000
  },
  
  // ========== UI SETTINGS ==========
  UI: {
    // Toast notification duration (milliseconds)
    toastDuration: 4000,
    
    // Animation durations (milliseconds)
    animationDuration: 300,
    
    // Date format for display
    dateFormat: 'DD/MM/YYYY',
    
    // Time format for display
    timeFormat: 'HH:mm:ss',
    
    // Items per page for pagination
    itemsPerPage: 10
  },
  
  // ========== OFFLINE SUPPORT ==========
  OFFLINE: {
    enabled: true,
    
    // Sync interval when back online (milliseconds)
    syncInterval: 30000,
    
    // Maximum retry attempts for sync
    maxRetries: 3,
    
    // Retry delay (milliseconds)
    retryDelay: 5000
  },
  
  // ========== VALIDATION RULES ==========
  VALIDATION: {
    password: {
      minLength: 6,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false
    },
    
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    
    name: {
      minLength: 2,
      maxLength: 50
    }
  },
  
  // ========== SECURITY SETTINGS ==========
  SECURITY: {
    // Token expiration time (hours)
    tokenExpiration: 24,
    
    // Enable CSRF protection
    csrfProtection: true,
    
    // Maximum login attempts before lockout
    maxLoginAttempts: 5,
    
    // Lockout duration (minutes)
    lockoutDuration: 15
  },
  
  // ========== REPORTS SETTINGS ==========
  REPORTS: {
    // Available report types
    types: ['daily', 'weekly', 'monthly', 'custom'],
    
    // Export formats
    exportFormats: ['csv', 'pdf', 'json'],
    
    // Chart colors
    chartColors: {
      present: '#10b981',
      absent: '#ef4444',
      late: '#f59e0b',
      earlyLeave: '#8b5cf6',
      halfDay: '#06b6d4'
    }
  },
  
  // ========== FEATURE FLAGS ==========
  FEATURES: {
    faceRecognition: true,
    geolocation: true,
    offlineMode: true,
    notifications: true,
    reports: true,
    darkMode: true,
    multiLanguage: false,
    adminPanel: false
  },
  
  // ========== ERROR MESSAGES ==========
  ERRORS: {
    // Authentication errors
    invalidEmail: 'Please enter a valid email address',
    invalidPassword: 'Password must be at least 6 characters',
    emailExists: 'Email already registered',
    invalidCredentials: 'Invalid email or password',
    accountLocked: 'Account locked due to multiple failed attempts',
    
    // Location errors
    locationDenied: 'Location access denied. Please enable location services.',
    locationTimeout: 'Location request timed out. Please try again.',
    locationUnavailable: 'Location unavailable. Please check your device settings.',
    outsideGeofence: 'You are outside the office area. Please move closer to mark attendance.',
    
    // Camera errors
    cameraNotFound: 'Camera not found. Please check camera permissions.',
    cameraDenied: 'Camera access denied. Please enable camera permissions.',
    cameraInUse: 'Camera is already in use by another application.',
    
    // Face recognition errors
    noFaceDetected: 'No face detected. Please position your face clearly.',
    multipleFaces: 'Multiple faces detected. Please ensure only one person is visible.',
    faceNotMatched: 'Face verification failed. Please try again.',
    poorLighting: 'Poor lighting conditions. Please move to better lighting.',
    
    // Network errors
    networkError: 'Network error. Please check your internet connection.',
    serverError: 'Server error. Please try again later.',
    timeout: 'Request timeout. Please try again.',
    
    // General errors
    unknownError: 'An unexpected error occurred. Please try again.',
    invalidData: 'Invalid data provided.',
    alreadyCheckedIn: 'You have already checked in today.',
    notCheckedIn: 'You must check in before checking out.',
    sessionExpired: 'Session expired. Please login again.'
  },
  
  // ========== SUCCESS MESSAGES ==========
  SUCCESS: {
    loginSuccess: 'Login successful! Welcome back.',
    registerSuccess: 'Registration successful! Please login.',
    checkinSuccess: 'Checked in successfully!',
    checkoutSuccess: 'Checked out successfully!',
    profileUpdated: 'Profile updated successfully!',
    faceUpdated: 'Face recognition updated successfully!',
    passwordChanged: 'Password changed successfully!'
  }
};

// ========== HELPER FUNCTIONS ==========

/**
 * Get configuration value by path
 * @param {string} path - Dot notation path (e.g., 'FIREBASE.apiKey')
 * @returns {*} Configuration value
 */
CONFIG.get = function(path) {
  return path.split('.').reduce((obj, key) => obj?.[key], this);
};

/**
 * Check if a feature is enabled
 * @param {string} feature - Feature name
 * @returns {boolean} True if enabled
 */
CONFIG.isFeatureEnabled = function(feature) {
  return this.FEATURES[feature] === true;
};

/**
 * Get error message
 * @param {string} errorType - Error type key
 * @returns {string} Error message
 */
CONFIG.getError = function(errorType) {
  return this.ERRORS[errorType] || this.ERRORS.unknownError;
};

/**
 * Get success message
 * @param {string} successType - Success type key
 * @returns {string} Success message
 */
CONFIG.getSuccess = function(successType) {
  return this.SUCCESS[successType] || 'Operation successful!';
};

/**
 * Validate if required configurations are set
 * @returns {object} Validation result
 */
CONFIG.validate = function() {
  const missing = [];
  
  // Check Firebase config
  if (this.FIREBASE.apiKey === 'YOUR_FIREBASE_API_KEY') {
    missing.push('Firebase API Key');
  }
  
  return {
    isValid: missing.length === 0,
    missing: missing
  };
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}