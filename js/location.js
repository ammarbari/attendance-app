/**
 * ATTENDANCE TRACKER PRO - LOCATION & MAP MODULE
 * 
 * Handles geolocation and map functionality:
 * - Get user's current location
 * - Display location on map using Leaflet.js + OpenStreetMap
 * - Geo-fencing validation
 * - Location error handling
 * 
 * ERROR PREVENTION:
 * - Handle location permission denial
 * - Handle timeout errors
 * - Handle position unavailable errors
 * - Validate coordinates before use
 * - Clear error messages for users
 */

const Location = {
  
  // Map instance
  map: null,
  
  // User marker
  userMarker: null,
  
  // Office marker
  officeMarker: null,
  
  // Geo-fence circle
  geofenceCircle: null,
  
  // Current position
  currentPosition: null,
  
  /**
   * Initialize location module
   */
  init() {
    // Check if geolocation is supported
    if (!('geolocation' in navigator)) {
      console.error('Geolocation not supported');
      Utils.showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    
    // Initialize map if on attendance page
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      this.initializeMap();
    }
  },
  
  /**
   * Initialize Leaflet map
   */
  initializeMap() {
    try {
      const mapElement = document.getElementById('map');
      if (!mapElement) return;
      
      // Create map centered on office location
      this.map = L.map('map').setView(
        [CONFIG.OFFICE_LOCATION.latitude, CONFIG.OFFICE_LOCATION.longitude],
        CONFIG.LOCATION.defaultZoom
      );
      
      // Add OpenStreetMap tile layer
      L.tileLayer(CONFIG.LOCATION.mapTileUrl, {
        attribution: CONFIG.LOCATION.mapAttribution,
        maxZoom: 19
      }).addTo(this.map);
      
      // Add office marker
      this.addOfficeMarker();
      
      // Add geo-fence circle
      this.addGeofenceCircle();
      
      // Get user's current location
      this.getCurrentLocation();
      
    } catch (error) {
      console.error('Map initialization error:', error);
      this.showLocationError('Failed to initialize map. Please refresh the page.');
    }
  },
  
  /**
   * Add office location marker to map
   */
  addOfficeMarker() {
    if (!this.map) return;
    
    // Custom icon for office
    const officeIcon = L.divIcon({
      className: 'office-marker',
      html: '<i class="fas fa-building" style="color: #3b82f6; font-size: 24px;"></i>',
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });
    
    this.officeMarker = L.marker(
      [CONFIG.OFFICE_LOCATION.latitude, CONFIG.OFFICE_LOCATION.longitude],
      { icon: officeIcon }
    ).addTo(this.map);
    
    this.officeMarker.bindPopup(`
      <div style="text-align: center;">
        <strong>${CONFIG.OFFICE_LOCATION.name}</strong><br>
        <small>Office Location</small>
      </div>
    `);
  },
  
  /**
   * Add geo-fence circle to map
   */
  addGeofenceCircle() {
    if (!this.map) return;
    
    this.geofenceCircle = L.circle(
      [CONFIG.OFFICE_LOCATION.latitude, CONFIG.OFFICE_LOCATION.longitude],
      {
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.1,
        radius: CONFIG.GEO_FENCE_RADIUS
      }
    ).addTo(this.map);
    
    this.geofenceCircle.bindPopup(`
      <div style="text-align: center;">
        <strong>Geo-fence Area</strong><br>
        <small>Radius: ${CONFIG.GEO_FENCE_RADIUS}m</small>
      </div>
    `);
  },
  
  /**
   * Get user's current location
   * @returns {Promise<object>} Position object
   */
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      this.showLocationInfo('<i class="fas fa-spinner fa-spin"></i> Getting your location...');
      
      const options = {
        enableHighAccuracy: CONFIG.LOCATION.enableHighAccuracy,
        timeout: CONFIG.LOCATION.timeout,
        maximumAge: CONFIG.LOCATION.maximumAge
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.handleLocationSuccess(position);
          resolve(position);
        },
        (error) => {
          this.handleLocationError(error);
          reject(error);
        },
        options
      );
    });
  },
  
  /**
   * Handle successful location retrieval
   * @param {object} position - Position object from geolocation API
   */
  handleLocationSuccess(position) {
    const { latitude, longitude, accuracy } = position.coords;
    
    this.currentPosition = {
      latitude,
      longitude,
      accuracy,
      timestamp: position.timestamp
    };
    
    // Add or update user marker
    this.updateUserMarker(latitude, longitude);
    
    // Check if within geo-fence
    const isWithinFence = Utils.isWithinGeofence(
      latitude,
      longitude,
      CONFIG.OFFICE_LOCATION.latitude,
      CONFIG.OFFICE_LOCATION.longitude,
      CONFIG.GEO_FENCE_RADIUS
    );
    
    // Calculate distance
    const distance = Utils.calculateDistance(
      latitude,
      longitude,
      CONFIG.OFFICE_LOCATION.latitude,
      CONFIG.OFFICE_LOCATION.longitude
    );
    
    // Update location info
    const statusIcon = isWithinFence 
      ? '<i class="fas fa-check-circle" style="color: #10b981;"></i>' 
      : '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>';
    
    const statusText = isWithinFence 
      ? 'Within office area' 
      : `Outside office area (${Math.round(distance)}m away)`;
    
    this.showLocationInfo(`${statusIcon} ${statusText} | Accuracy: ±${Math.round(accuracy)}m`);
    
    // Center map on user location
    if (this.map) {
      this.map.setView([latitude, longitude], CONFIG.LOCATION.defaultZoom);
    }
  },
  
  /**
   * Handle location errors
   * @param {object} error - Geolocation error object
   */
  handleLocationError(error) {
    let errorMessage = '';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = CONFIG.getError('locationDenied');
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = CONFIG.getError('locationUnavailable');
        break;
      case error.TIMEOUT:
        errorMessage = CONFIG.getError('locationTimeout');
        break;
      default:
        errorMessage = 'An unknown location error occurred';
    }
    
    console.error('Location error:', error);
    this.showLocationError(errorMessage);
    Utils.showToast(errorMessage, 'error');
  },
  
  /**
   * Update user marker on map
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   */
  updateUserMarker(latitude, longitude) {
    if (!this.map) return;
    
    // Custom icon for user
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          animation: pulse 2s infinite;
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    
    // Remove old marker if exists
    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }
    
    // Add new marker
    this.userMarker = L.marker([latitude, longitude], { icon: userIcon }).addTo(this.map);
    
    this.userMarker.bindPopup(`
      <div style="text-align: center;">
        <strong>Your Location</strong><br>
        <small>Lat: ${latitude.toFixed(6)}<br>
        Lng: ${longitude.toFixed(6)}</small>
      </div>
    `);
  },
  
  /**
   * Validate if user is within geo-fence
   * @returns {Promise<boolean>} True if within geo-fence
   */
  async validateGeofence() {
    try {
      const position = await this.getCurrentLocation();
      const { latitude, longitude } = position.coords;
      
      const isWithin = Utils.isWithinGeofence(
        latitude,
        longitude,
        CONFIG.OFFICE_LOCATION.latitude,
        CONFIG.OFFICE_LOCATION.longitude,
        CONFIG.GEO_FENCE_RADIUS
      );
      
      if (!isWithin) {
        const distance = Utils.calculateDistance(
          latitude,
          longitude,
          CONFIG.OFFICE_LOCATION.latitude,
          CONFIG.OFFICE_LOCATION.longitude
        );
        
        Utils.showToast(
          `You are ${Math.round(distance)}m away from office. Please move closer.`,
          'error'
        );
      }
      
      return isWithin;
      
    } catch (error) {
      console.error('Geofence validation error:', error);
      return false;
    }
  },
  
  /**
   * Get current position data
   * @returns {object|null} Position data or null
   */
  getPosition() {
    return this.currentPosition;
  },
  
  /**
   * Get formatted address from coordinates (reverse geocoding)
   * Note: This uses Nominatim API (free, but rate-limited)
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<string>} Address string
   */
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'AttendanceTrackerPro/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      return data.display_name || 'Address not found';
      
    } catch (error) {
      console.error('Geocoding error:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  },
  
  /**
   * Watch user position (continuous tracking)
   * @param {Function} callback - Callback function for position updates
   * @returns {number} Watch ID
   */
  watchPosition(callback) {
    const options = {
      enableHighAccuracy: CONFIG.LOCATION.enableHighAccuracy,
      timeout: CONFIG.LOCATION.timeout,
      maximumAge: CONFIG.LOCATION.maximumAge
    };
    
    return navigator.geolocation.watchPosition(
      (position) => {
        this.handleLocationSuccess(position);
        if (callback) callback(position);
      },
      (error) => {
        this.handleLocationError(error);
      },
      options
    );
  },
  
  /**
   * Stop watching position
   * @param {number} watchId - Watch ID from watchPosition
   */
  stopWatchingPosition(watchId) {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  },
  
  /**
   * Show location info message
   * @param {string} message - Message to display
   */
  showLocationInfo(message) {
    const locationInfo = document.getElementById('locationInfo');
    if (locationInfo) {
      locationInfo.innerHTML = message;
      locationInfo.style.color = 'var(--text-secondary)';
    }
  },
  
  /**
   * Show location error message
   * @param {string} message - Error message to display
   */
  showLocationError(message) {
    const locationInfo = document.getElementById('locationInfo');
    if (locationInfo) {
      locationInfo.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
      locationInfo.style.color = 'var(--danger-color)';
    }
  },
  
  /**
   * Refresh map size (useful when container size changes)
   */
  refreshMap() {
    if (this.map) {
      setTimeout(() => {
        this.map.invalidateSize();
      }, 100);
    }
  },
  
  /**
   * Calculate distance to office
   * @returns {number} Distance in meters
   */
  getDistanceToOffice() {
    if (!this.currentPosition) {
      return null;
    }
    
    return Utils.calculateDistance(
      this.currentPosition.latitude,
      this.currentPosition.longitude,
      CONFIG.OFFICE_LOCATION.latitude,
      CONFIG.OFFICE_LOCATION.longitude
    );
  },
  
  /**
   * Check if location services are enabled
   * @returns {boolean} True if enabled
   */
  isLocationEnabled() {
    return 'geolocation' in navigator;
  }
};

// Initialize location when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Location.init());
} else {
  Location.init();
}

// Add CSS for marker animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
  }
`;
document.head.appendChild(style);