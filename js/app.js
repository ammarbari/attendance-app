/**
 * ATTENDANCE TRACKER PRO - MAIN APPLICATION CONTROLLER
 * 
 * Main application logic and coordination:
 * - Initialize all modules
 * - Handle navigation
 * - Manage application state
 * - Coordinate between modules
 * 
 * ERROR PREVENTION:
 * - Initialize modules in correct order
 * - Handle navigation errors
 * - Validate user session
 * - Provide fallbacks for missing elements
 */

const App = {
  
  // Application state
  currentPage: 'auth',
  
  /**
   * Initialize application
   */
  async init() {
    console.log('Initializing Attendance Tracker Pro...');
    
    try {
      // Check configuration
      const configValidation = CONFIG.validate();
      if (!configValidation.isValid) {
        console.warn('Configuration incomplete:', configValidation.missing);
      }
      
      // Setup navigation
      this.setupNavigation();
      
      // Setup theme toggle
      this.setupTheme();
      
      // Setup cookie notice
      this.setupCookieNotice();
      
      // Setup settings page
      this.setupSettings();
      
      // Hide loading overlay
      setTimeout(() => {
        Utils.hideLoading();
      }, 500);
      
      console.log('Application initialized successfully');
      
    } catch (error) {
      console.error('Application initialization error:', error);
      Utils.hideLoading();
      Utils.showToast('Application initialization failed', 'error');
    }
  },
  
  /**
   * Setup navigation between pages
   */
  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    // Navigation link click handlers
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const page = link.dataset.page;
        
        // Check if user is authenticated
        if (!Auth.isAuthenticated() && page !== 'auth') {
          Utils.showToast('Please login first', 'warning');
          return;
        }
        
        this.navigateTo(page);
        
        // Update active link
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Close mobile menu
        if (navMenu) {
          navMenu.classList.remove('active');
        }
      });
    });
    
    // Mobile menu toggle
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        
        // Animate hamburger icon
        const spans = navToggle.querySelectorAll('span');
        if (navMenu.classList.contains('active')) {
          spans[0].style.transform = 'rotate(45deg) translateY(10px)';
          spans[1].style.opacity = '0';
          spans[2].style.transform = 'rotate(-45deg) translateY(-10px)';
        } else {
          spans[0].style.transform = '';
          spans[1].style.opacity = '';
          spans[2].style.transform = '';
        }
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
          navMenu.classList.remove('active');
          
          const spans = navToggle.querySelectorAll('span');
          spans[0].style.transform = '';
          spans[1].style.opacity = '';
          spans[2].style.transform = '';
        }
      });
    }
  },
  
  /**
   * Navigate to a specific page
   * @param {string} pageName - Page name
   */
  navigateTo(pageName) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    const targetPage = document.getElementById(`${pageName}Page`);
    if (targetPage) {
      targetPage.classList.add('active');
      this.currentPage = pageName;
      
      // Load page-specific data
      this.loadPageData(pageName);
      
      // Refresh map if on attendance page
      if (pageName === 'attendance') {
        setTimeout(() => {
          Location.refreshMap();
        }, 100);
      }
    } else {
      console.error('Page not found:', pageName);
      Utils.showToast('Page not found', 'error');
    }
  },
  
  /**
   * Load page-specific data
   * @param {string} pageName - Page name
   */
  loadPageData(pageName) {
    switch (pageName) {
      case 'dashboard':
        if (Dashboard && typeof Dashboard.loadDashboard === 'function') {
          Dashboard.loadDashboard();
        }
        break;
      
      case 'attendance':
        if (Attendance && typeof Attendance.loadTodayAttendance === 'function') {
          Attendance.loadTodayAttendance();
        }
        break;
      
      case 'reports':
        // Reports are generated on demand
        break;
      
      case 'settings':
        this.loadSettings();
        break;
    }
  },
  
  /**
   * Setup theme toggle functionality
   */
  setupTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    // Load saved theme
    const savedTheme = Storage.getTheme();
    this.applyTheme(savedTheme);
    
    // Update icon
    this.updateThemeIcon(savedTheme);
    
    // Toggle theme on click
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      this.applyTheme(newTheme);
      Storage.saveTheme(newTheme);
      this.updateThemeIcon(newTheme);
      
      Utils.showToast(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`, 'info');
    });
  },
  
  /**
   * Apply theme to document
   * @param {string} theme - Theme name ('light' or 'dark')
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  },
  
  /**
   * Update theme toggle icon
   * @param {string} theme - Current theme
   */
  updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const icon = themeToggle.querySelector('i');
    if (icon) {
      if (theme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
      } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
      }
    }
  },
  
  /**
   * Setup cookie notice
   */
  setupCookieNotice() {
    const cookieNotice = document.getElementById('cookieNotice');
    const acceptBtn = document.getElementById('acceptCookies');
    
    if (!cookieNotice || !acceptBtn) return;
    
    // Check if already accepted
    const accepted = Storage.getCookieConsent();
    
    if (accepted) {
      cookieNotice.classList.add('hidden');
    }
    
    // Accept button handler
    acceptBtn.addEventListener('click', () => {
      Storage.saveCookieConsent(true);
      cookieNotice.classList.add('hidden');
      Utils.showToast('Cookie preferences saved', 'success');
    });
  },
  
  /**
   * Setup settings page functionality
   */
  setupSettings() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('profileName').value.trim();
        
        if (!name) {
          Utils.showToast('Please enter your name', 'warning');
          return;
        }
        
        const success = await Auth.updateProfile({ name });
        
        if (success) {
          // Update username in dashboard
          const userNameEl = document.getElementById('userName');
          if (userNameEl) {
            userNameEl.textContent = name;
          }
        }
      });
    }
    
    // Change face button
    const changeFaceBtn = document.getElementById('changeFaceBtn');
    if (changeFaceBtn) {
      changeFaceBtn.addEventListener('click', async () => {
        const success = await Camera.showFaceModal();
        
        if (success) {
          Utils.showToast(CONFIG.getSuccess('faceUpdated'), 'success');
        }
      });
    }
    
    // Change password button
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', () => {
        this.showChangePasswordDialog();
      });
    }
  },
  
  /**
   * Load settings data
   */
  loadSettings() {
    const user = Auth.getCurrentUser();
    
    if (!user) return;
    
    // Populate profile fields
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileDepartment = document.getElementById('profileDepartment');
    
    if (profileName) profileName.value = user.name || '';
    if (profileEmail) profileEmail.value = user.email || '';
    if (profileDepartment) profileDepartment.value = user.department || '';
    
    // Office location
    const officeLocation = document.getElementById('officeLocation');
    if (officeLocation) {
      officeLocation.textContent = CONFIG.OFFICE_LOCATION.name;
    }
  },
  
  /**
   * Show change password dialog
   */
  showChangePasswordDialog() {
    const currentPassword = prompt('Enter current password:');
    
    if (!currentPassword) return;
    
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    
    if (!newPassword) return;
    
    const confirmPassword = prompt('Confirm new password:');
    
    if (newPassword !== confirmPassword) {
      Utils.showToast('Passwords do not match', 'error');
      return;
    }
    
    Auth.changePassword(currentPassword, newPassword);
  },
  
  /**
   * Get application state
   * @returns {object} Application state
   */
  getState() {
    return {
      currentPage: this.currentPage,
      isAuthenticated: Auth.isAuthenticated(),
      currentUser: Auth.getCurrentUser(),
      theme: document.documentElement.getAttribute('data-theme')
    };
  },
  
  /**
   * Handle errors globally
   * @param {Error} error - Error object
   */
  handleError(error) {
    console.error('Application error:', error);
    
    // Show user-friendly error message
    let message = 'An unexpected error occurred';
    
    if (error.message) {
      message = error.message;
    }
    
    Utils.showToast(message, 'error');
  }
};

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Prevent default browser error handling
  event.preventDefault();
  
  // Handle error through app
  if (App) {
    App.handleError(event.error);
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevent default handling
  event.preventDefault();
  
  // Handle error through app
  if (App) {
    App.handleError(event.reason);
  }
});

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Make App available globally for debugging
window.App = App;

// Log startup message
console.log('%c🎯 Attendance Tracker Pro', 'color: #3b82f6; font-size: 20px; font-weight: bold;');
console.log('%cVersion: ' + CONFIG.APP_VERSION, 'color: #8b5cf6; font-size: 14px;');
console.log('%cDeveloped with ❤️', 'color: #10b981; font-size: 14px;');