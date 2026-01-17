/**
 * ATTENDANCE TRACKER PRO - STORAGE MANAGEMENT
 * 
 * Handles all data storage operations including:
 * - LocalStorage for simple data
 * - IndexedDB for complex data and offline support
 * - Session management
 * 
 * ERROR PREVENTION:
 * - Always check localStorage availability
 * - Handle quota exceeded errors
 * - Validate data before storage
 * - Provide fallbacks for unavailable storage
 */

const Storage = {
  
  /**
   * Check if localStorage is available
   * @returns {boolean} True if available
   */
  isLocalStorageAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('LocalStorage not available:', e);
      return false;
    }
  },
  
  /**
   * Set item in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store (will be JSON stringified)
   * @returns {boolean} True if successful
   */
  setItem(key, value) {
    if (!this.isLocalStorageAvailable()) {
      console.error('LocalStorage not available');
      return false;
    }
    
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded');
        Utils.showToast('Storage quota exceeded. Please clear some data.', 'error');
      } else {
        console.error('Error saving to localStorage:', e);
      }
      return false;
    }
  },
  
  /**
   * Get item from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Stored value or default
   */
  getItem(key, defaultValue = null) {
    if (!this.isLocalStorageAvailable()) {
      return defaultValue;
    }
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return defaultValue;
    }
  },
  
  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} True if successful
   */
  removeItem(key) {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from localStorage:', e);
      return false;
    }
  },
  
  /**
   * Clear all localStorage data
   * @returns {boolean} True if successful
   */
  clear() {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }
    
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Error clearing localStorage:', e);
      return false;
    }
  },
  
  /**
   * Save user data
   * @param {object} userData - User data object
   * @returns {boolean} True if successful
   */
  saveUser(userData) {
    return this.setItem(CONFIG.STORAGE.keys.user, userData);
  },
  
  /**
   * Get user data
   * @returns {object|null} User data or null
   */
  getUser() {
    return this.getItem(CONFIG.STORAGE.keys.user);
  },
  
  /**
   * Remove user data
   * @returns {boolean} True if successful
   */
  removeUser() {
    return this.removeItem(CONFIG.STORAGE.keys.user);
  },
  
  /**
   * Save authentication token
   * @param {string} token - Auth token
   * @returns {boolean} True if successful
   */
  saveToken(token) {
    return this.setItem(CONFIG.STORAGE.keys.token, {
      token,
      timestamp: Date.now()
    });
  },
  
  /**
   * Get authentication token
   * @returns {string|null} Token or null
   */
  getToken() {
    const data = this.getItem(CONFIG.STORAGE.keys.token);
    if (!data) return null;
    
    // Check if token is expired (24 hours)
    const expirationTime = CONFIG.SECURITY.tokenExpiration * 60 * 60 * 1000;
    const isExpired = Date.now() - data.timestamp > expirationTime;
    
    if (isExpired) {
      this.removeToken();
      return null;
    }
    
    return data.token;
  },
  
  /**
   * Remove authentication token
   * @returns {boolean} True if successful
   */
  removeToken() {
    return this.removeItem(CONFIG.STORAGE.keys.token);
  },
  
  /**
   * Save theme preference
   * @param {string} theme - Theme name ('light' or 'dark')
   * @returns {boolean} True if successful
   */
  saveTheme(theme) {
    return this.setItem(CONFIG.STORAGE.keys.theme, theme);
  },
  
  /**
   * Get theme preference
   * @returns {string} Theme name
   */
  getTheme() {
    return this.getItem(CONFIG.STORAGE.keys.theme, 'light');
  },
  
  /**
   * Save attendance record
   * @param {object} record - Attendance record
   * @returns {boolean} True if successful
   */
  saveAttendanceRecord(record) {
    const records = this.getAttendanceRecords();
    
    // Add unique ID if not present
    if (!record.id) {
      record.id = Utils.generateId();
    }
    
    // Always push, do not overwrite
    records.push(record);
    return this.setItem(CONFIG.STORAGE.keys.attendance, records);
  },
  
  /**
   * Get all attendance records
   * @returns {Array} Array of attendance records
   */
  getAttendanceRecords() {
    return this.getItem(CONFIG.STORAGE.keys.attendance, []);
  },
  
  /**
   * Get today's attendance record
   * @returns {object|null} Last record of today
   */
  getTodayAttendance() {
    const records = this.getAttendanceRecords();
    const today = Utils.formatDate(new Date());
    
    // Return the LAST record of today instead of first
    const todayRecords = records.filter(record => record.date === today);
    if (todayRecords.length === 0) return null;
    
    return todayRecords[todayRecords.length - 1];
  },
  
  /**
   * Update attendance record
   * @param {string} id - Record ID
   * @param {object} updates - Updates to apply
   * @returns {boolean} True if successful
   */
  updateAttendanceRecord(id, updates) {
    const records = this.getAttendanceRecords();
    const index = records.findIndex(record => record.id === id);
    
    if (index === -1) {
      console.error('Record not found:', id);
      return false;
    }
    
    records[index] = { ...records[index], ...updates };
    return this.setItem(CONFIG.STORAGE.keys.attendance, records);
  },
  
  /**
   * Delete attendance record
   * @param {string} id - Record ID
   * @returns {boolean} True if successful
   */
  deleteAttendanceRecord(id) {
    const records = this.getAttendanceRecords();
    const filtered = records.filter(record => record.id !== id);
    return this.setItem(CONFIG.STORAGE.keys.attendance, filtered);
  },
  
  /**
   * Get attendance records for a specific month
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Array} Array of records
   */
  getMonthlyAttendance(year, month) {
    const records = this.getAttendanceRecords();
    const monthRange = Utils.getMonthRange(year, month);
    
    return records.filter(record => {
      const recordDate = new Date(record.dateTime);
      return recordDate >= monthRange.start && recordDate <= monthRange.end;
    });
  },
  
  /**
   * Save face descriptor for face recognition
   * @param {Array} descriptor - Face descriptor array
   * @returns {boolean} True if successful
   */
  saveFaceDescriptor(descriptor) {
    return this.setItem(CONFIG.STORAGE.keys.faceDescriptor, {
      descriptor,
      timestamp: Date.now()
    });
  },
  
  /**
   * Get face descriptor
   * @returns {Array|null} Face descriptor or null
   */
  getFaceDescriptor() {
    const data = this.getItem(CONFIG.STORAGE.keys.faceDescriptor);
    return data ? data.descriptor : null;
  },
  
  /**
   * Remove face descriptor
   * @returns {boolean} True if successful
   */
  removeFaceDescriptor() {
    return this.removeItem(CONFIG.STORAGE.keys.faceDescriptor);
  },
  
  /**
   * Save cookie consent
   * @param {boolean} accepted - True if accepted
   * @returns {boolean} True if successful
   */
  saveCookieConsent(accepted) {
    return this.setItem(CONFIG.STORAGE.keys.cookies, {
      accepted,
      timestamp: Date.now()
    });
  },
  
  /**
   * Get cookie consent status
   * @returns {boolean} True if accepted
   */
  getCookieConsent() {
    const data = this.getItem(CONFIG.STORAGE.keys.cookies);
    return data ? data.accepted : false;
  },
  
  /**
   * Calculate storage usage
   * @returns {object} Storage statistics
   */
  getStorageStats() {
    if (!this.isLocalStorageAvailable()) {
      return { used: 0, total: 0, percentage: 0 };
    }
    
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    // Most browsers allow ~5-10MB for localStorage
    const total = 5 * 1024 * 1024; // 5MB estimate
    
    return {
      used,
      total,
      percentage: Math.round((used / total) * 100),
      usedFormatted: Utils.formatFileSize(used),
      totalFormatted: Utils.formatFileSize(total)
    };
  },
  
  // ========== IndexedDB Operations ==========
  
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CONFIG.STORAGE.dbName, CONFIG.STORAGE.dbVersion);
      
      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(CONFIG.STORAGE.storeName)) {
          const objectStore = db.createObjectStore(CONFIG.STORAGE.storeName, {
            keyPath: 'id',
            autoIncrement: true
          });
          objectStore.createIndex('date', 'date', { unique: false });
          objectStore.createIndex('userId', 'userId', { unique: false });
          objectStore.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  },
  
  async addToIndexedDB(record) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([CONFIG.STORAGE.storeName], 'readwrite');
      const objectStore = transaction.objectStore(CONFIG.STORAGE.storeName);
      const request = objectStore.add(record);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error adding to IndexedDB:', error);
      throw error;
    }
  },
  
  async getAllFromIndexedDB() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([CONFIG.STORAGE.storeName], 'readonly');
      const objectStore = transaction.objectStore(CONFIG.STORAGE.storeName);
      const request = objectStore.getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting from IndexedDB:', error);
      return [];
    }
  },
  
  async getUnsyncedRecords() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([CONFIG.STORAGE.storeName], 'readonly');
      const objectStore = transaction.objectStore(CONFIG.STORAGE.storeName);
      const index = objectStore.index('synced');
      const request = index.getAll(false);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting unsynced records:', error);
      return [];
    }
  },
  
  async updateInIndexedDB(id, updates) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([CONFIG.STORAGE.storeName], 'readwrite');
      const objectStore = transaction.objectStore(CONFIG.STORAGE.storeName);
      const getRequest = objectStore.get(id);
      return new Promise((resolve, reject) => {
        getRequest.onsuccess = () => {
          const record = getRequest.result;
          if (!record) return reject(new Error('Record not found'));
          const updatedRecord = { ...record, ...updates };
          const updateRequest = objectStore.put(updatedRecord);
          updateRequest.onsuccess = () => resolve(true);
          updateRequest.onerror = () => reject(updateRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch (error) {
      console.error('Error updating IndexedDB:', error);
      return false;
    }
  },
  
  async deleteFromIndexedDB(id) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([CONFIG.STORAGE.storeName], 'readwrite');
      const objectStore = transaction.objectStore(CONFIG.STORAGE.storeName);
      const request = objectStore.delete(id);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting from IndexedDB:', error);
      return false;
    }
  },
  
  async clearIndexedDB() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([CONFIG.STORAGE.storeName], 'readwrite');
      const objectStore = transaction.objectStore(CONFIG.STORAGE.storeName);
      const request = objectStore.clear();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
      return false;
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
