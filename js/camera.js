/**
 * ATTENDANCE TRACKER PRO - CAMERA & FACE RECOGNITION MODULE
 * 
 * Handles camera and face recognition functionality:
 * - Access device camera
 * - Capture photos
 * - Face detection using face-api.js
 * - Face verification
 * 
 * ERROR PREVENTION:
 * - Handle camera not found
 * - Handle camera permission denial
 * - Handle camera already in use
 * - Handle no face detected
 * - Handle multiple faces detected
 * - Handle poor lighting conditions
 */

const Camera = {
  
  // Video stream
  stream: null,
  
  // Face API models loaded status
  modelsLoaded: false,
  
  // Face descriptor for current user
  userFaceDescriptor: null,
  
  /**
   * Initialize camera module
   */
  async init() {
    // Load face-api models
    if (CONFIG.isFeatureEnabled('faceRecognition')) {
      await this.loadFaceAPIModels();
    }
    
    // Load saved face descriptor
    this.userFaceDescriptor = Storage.getFaceDescriptor();
  },
  
  /**
   * Load face-api.js models
   * @returns {Promise<boolean>} True if successful
   */
  async loadFaceAPIModels() {
    try {
      console.log('Loading face-api.js models...');
      
      // Check if face-api is available
      if (typeof faceapi === 'undefined') {
        console.error('face-api.js not loaded');
        return false;
      }
      
      const modelsPath = CONFIG.FACE_API.modelsPath;
      
      // Load required models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath)
      ]);
      
      this.modelsLoaded = true;
      console.log('Face-api.js models loaded successfully');
      return true;
      
    } catch (error) {
      console.error('Error loading face-api models:', error);
      this.modelsLoaded = false;
      return false;
    }
  },
  
  /**
   * Start camera stream
   * @param {string} videoElementId - ID of video element
   * @returns {Promise<boolean>} True if successful
   */
  async startCamera(videoElementId = 'videoPreview') {
    try {
      const videoElement = document.getElementById(videoElementId);
      if (!videoElement) {
        console.error('Video element not found:', videoElementId);
        return false;
      }
      
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        Utils.showToast(CONFIG.getError('cameraNotFound'), 'error');
        return false;
      }
      
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: CONFIG.CAMERA.video,
        audio: false
      });
      
      // Set stream to video element
      videoElement.srcObject = this.stream;
      
      // Hide camera overlay
      const overlay = document.getElementById('cameraOverlay');
      if (overlay) {
        overlay.style.display = 'none';
      }
      
      console.log('Camera started successfully');
      return true;
      
    } catch (error) {
      console.error('Camera error:', error);
      this.handleCameraError(error);
      return false;
    }
  },
  
  /**
   * Stop camera stream
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      
      // Show camera overlay
      const overlay = document.getElementById('cameraOverlay');
      if (overlay) {
        overlay.style.display = 'flex';
      }
      
      console.log('Camera stopped');
    }
  },
  
  /**
   * Handle camera errors
   * @param {object} error - Error object
   */
  handleCameraError(error) {
    let errorMessage = '';
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = CONFIG.getError('cameraDenied');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMessage = CONFIG.getError('cameraNotFound');
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMessage = CONFIG.getError('cameraInUse');
    } else {
      errorMessage = 'Camera error: ' + error.message;
    }
    
    Utils.showToast(errorMessage, 'error');
  },
  
  /**
   * Capture photo from video stream
   * @param {string} videoElementId - ID of video element
   * @param {string} canvasElementId - ID of canvas element
   * @returns {string|null} Data URL of captured image or null
   */
  capturePhoto(videoElementId = 'videoPreview', canvasElementId = 'photoCanvas') {
    try {
      const video = document.getElementById(videoElementId);
      const canvas = document.getElementById(canvasElementId);
      
      if (!video || !canvas) {
        console.error('Video or canvas element not found');
        return null;
      }
      
      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data URL
      const dataUrl = canvas.toDataURL(CONFIG.CAMERA.photoFormat, CONFIG.CAMERA.photoQuality);
      
      console.log('Photo captured successfully');
      return dataUrl;
      
    } catch (error) {
      console.error('Photo capture error:', error);
      Utils.showToast('Failed to capture photo', 'error');
      return null;
    }
  },
  
  /**
   * Detect face in video element
   * @param {string} videoElementId - ID of video element
   * @returns {Promise<object|null>} Detection result or null
   */
  async detectFace(videoElementId = 'videoPreview') {
    try {
      if (!this.modelsLoaded) {
        console.warn('Face-api models not loaded');
        return null;
      }
      
      const video = document.getElementById(videoElementId);
      if (!video) {
        console.error('Video element not found');
        return null;
      }
      
      // Detect faces with landmarks and descriptors
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions(CONFIG.FACE_API.detectionOptions))
        .withFaceLandmarks()
        .withFaceDescriptors();
      
      return detections;
      
    } catch (error) {
      console.error('Face detection error:', error);
      return null;
    }
  },
  
  /**
   * Verify face against saved descriptor
   * @param {Array} currentDescriptor - Current face descriptor
   * @returns {boolean} True if face matches
   */
  verifyFace(currentDescriptor) {
    if (!this.userFaceDescriptor || !currentDescriptor) {
      return false;
    }
    
    // Calculate Euclidean distance between descriptors
    const distance = faceapi.euclideanDistance(this.userFaceDescriptor, currentDescriptor);
    
    // Check if distance is below threshold
    const isMatch = distance < CONFIG.FACE_API.matchThreshold;
    
    console.log('Face verification distance:', distance, 'Match:', isMatch);
    
    return isMatch;
  },
  
  /**
   * Register user face
   * @param {string} videoElementId - ID of video element
   * @returns {Promise<boolean>} True if successful
   */
  async registerFace(videoElementId = 'faceVideo') {
    try {
      // Detect face
      const detections = await this.detectFace(videoElementId);
      
      if (!detections || detections.length === 0) {
        Utils.showToast(CONFIG.getError('noFaceDetected'), 'error');
        return false;
      }
      
      if (detections.length > 1) {
        Utils.showToast(CONFIG.getError('multipleFaces'), 'error');
        return false;
      }
      
      // Save face descriptor
      const descriptor = Array.from(detections[0].descriptor);
      this.userFaceDescriptor = descriptor;
      Storage.saveFaceDescriptor(descriptor);
      
      console.log('Face registered successfully');
      return true;
      
    } catch (error) {
      console.error('Face registration error:', error);
      Utils.showToast('Failed to register face', 'error');
      return false;
    }
  },
  
  /**
   * Perform face verification for attendance
   * @param {string} videoElementId - ID of video element
   * @returns {Promise<object>} Verification result
   */
  async performFaceVerification(videoElementId = 'videoPreview') {
    try {
      // Check if user has registered face
      if (!this.userFaceDescriptor) {
        return {
          success: false,
          message: 'No face registered. Please register your face first.',
          requiresRegistration: true
        };
      }
      
      // Detect face
      const detections = await this.detectFace(videoElementId);
      
      if (!detections || detections.length === 0) {
        return {
          success: false,
          message: CONFIG.getError('noFaceDetected')
        };
      }
      
      if (detections.length > 1) {
        return {
          success: false,
          message: CONFIG.getError('multipleFaces')
        };
      }
      
      // Get current descriptor
      const currentDescriptor = Array.from(detections[0].descriptor);
      
      // Verify face
      const isMatch = this.verifyFace(currentDescriptor);
      
      if (isMatch) {
        return {
          success: true,
          message: 'Face verified successfully',
          confidence: detections[0].detection.score
        };
      } else {
        return {
          success: false,
          message: CONFIG.getError('faceNotMatched')
        };
      }
      
    } catch (error) {
      console.error('Face verification error:', error);
      return {
        success: false,
        message: 'Face verification failed. Please try again.'
      };
    }
  },
  
  /**
   * Show face detection modal
   * @returns {Promise<boolean>} True if face captured successfully
   */
  async showFaceModal() {
    return new Promise((resolve) => {
      const modal = document.getElementById('faceModal');
      if (!modal) {
        console.error('Face modal not found');
        resolve(false);
        return;
      }
      
      // Show modal
      modal.classList.add('active');
      
      // Start camera
      this.startCamera('faceVideo');
      
      // Update status
      const faceStatus = document.getElementById('faceStatus');
      if (faceStatus) {
        faceStatus.innerHTML = '<i class="fas fa-camera"></i><p>Position your face in the frame</p>';
      }
      
      // Capture button handler
      const captureBtn = document.getElementById('captureFaceBtn');
      const cancelBtn = document.getElementById('cancelFaceBtn');
      const closeBtn = modal.querySelector('.modal-close');
      
      const cleanup = () => {
        this.stopCamera();
        modal.classList.remove('active');
      };
      
      const captureHandler = async () => {
        if (faceStatus) {
          faceStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Detecting face...</p>';
        }
        
        const result = await this.registerFace('faceVideo');
        
        cleanup();
        resolve(result);
      };
      
      const cancelHandler = () => {
        cleanup();
        resolve(false);
      };
      
      captureBtn.addEventListener('click', captureHandler, { once: true });
      cancelBtn.addEventListener('click', cancelHandler, { once: true });
      closeBtn.addEventListener('click', cancelHandler, { once: true });
    });
  },
  
  /**
   * Check camera availability
   * @returns {Promise<boolean>} True if camera available
   */
  async isCameraAvailable() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      return videoDevices.length > 0;
    } catch (error) {
      console.error('Error checking camera availability:', error);
      return false;
    }
  },
  
  /**
   * Get available cameras
   * @returns {Promise<Array>} Array of camera devices
   */
  async getAvailableCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error getting cameras:', error);
      return [];
    }
  },
  
  /**
   * Switch camera (front/back)
   * @param {string} deviceId - Device ID
   * @param {string} videoElementId - Video element ID
   * @returns {Promise<boolean>} True if successful
   */
  async switchCamera(deviceId, videoElementId = 'videoPreview') {
    try {
      // Stop current stream
      this.stopCamera();
      
      // Start new stream with specified device
      const constraints = {
        video: {
          deviceId: { exact: deviceId },
          ...CONFIG.CAMERA.video
        },
        audio: false
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const videoElement = document.getElementById(videoElementId);
      if (videoElement) {
        videoElement.srcObject = this.stream;
      }
      
      return true;
      
    } catch (error) {
      console.error('Camera switch error:', error);
      this.handleCameraError(error);
      return false;
    }
  },
  
  /**
   * Check lighting conditions
   * @param {string} videoElementId - Video element ID
   * @returns {Promise<object>} Lighting assessment
   */
  async checkLighting(videoElementId = 'videoPreview') {
    try {
      const video = document.getElementById(videoElementId);
      const canvas = document.createElement('canvas');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let brightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        brightness += (r + g + b) / 3;
      }
      
      brightness = brightness / (data.length / 4);
      
      let status = 'good';
      let message = 'Lighting is good';
      
      if (brightness < 50) {
        status = 'too_dark';
        message = 'Lighting is too dark. Please move to better lighting.';
      } else if (brightness > 200) {
        status = 'too_bright';
        message = 'Lighting is too bright. Please adjust lighting.';
      }
      
      return {
        brightness,
        status,
        message
      };
      
    } catch (error) {
      console.error('Lighting check error:', error);
      return {
        brightness: 0,
        status: 'unknown',
        message: 'Unable to check lighting'
      };
    }
  }
};

// Initialize camera when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Camera.init());
} else {
  Camera.init();
}