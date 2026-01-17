/**
 * ATTENDANCE TRACKER PRO - AUTHENTICATION MODULE
 * 
 * Handles user authentication including:
 * - User registration
 * - User login
 * - Session management
 * - Password validation
 * 
 * ERROR PREVENTION:
 * - Validate all inputs before submission
 * - Handle network errors gracefully
 * - Provide clear error messages
 * - Prevent duplicate submissions
 */

const Auth = {
  
  // Current user object
  currentUser: null,
  
  // Login attempt tracking
  loginAttempts: {},
  
  /**
   * Initialize authentication module
   */
  init() {
    this.setupEventListeners();
    this.checkExistingSession();
    this.setupPasswordToggles();
  },
  
  /**
   * Setup event listeners for auth forms
   */
  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }
    
    // Show register card
    const showRegister = document.getElementById('showRegister');
    if (showRegister) {
      showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleAuthCard('register');
      });
    }
    
    // Show login card
    const showLogin = document.getElementById('showLogin');
    if (showLogin) {
      showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleAuthCard('login');
      });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.handleLogout();
      });
    }
  },
  
  /**
   * Setup password visibility toggles
   */
  setupPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
      button.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        const icon = this.querySelector('i');
        
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      });
    });
  },
  
  /**
   * Toggle between login and register cards
   * @param {string} cardType - 'login' or 'register'
   */
  toggleAuthCard(cardType) {
    const loginCard = document.querySelector('#loginForm').closest('.auth-card');
    const registerCard = document.getElementById('registerCard');
    
    if (cardType === 'register') {
      loginCard.style.display = 'none';
      registerCard.style.display = 'block';
    } else {
      loginCard.style.display = 'block';
      registerCard.style.display = 'none';
    }
  },
  
  /**
   * Check for existing session
   */
  checkExistingSession() {
    const user = Storage.getUser();
    const token = Storage.getToken();
    
    if (user && token) {
      this.currentUser = user;
      this.showDashboard();
    } else {
      this.showAuthPage();
    }
  },
  
  /**
   * Handle user login
   */
  async handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Validate inputs
    if (!this.validateLoginInputs(email, password)) {
      return;
    }
    
    // Check if account is locked
    if (this.isAccountLocked(email)) {
      Utils.showToast(CONFIG.getError('accountLocked'), 'error');
      return;
    }
    
    Utils.showLoading();
    
    try {
      // Simulate API call (replace with actual Firebase auth in production)
      await this.delay(1000);
      
      // Check if user exists in localStorage (demo mode)
      const users = Storage.getItem('registered_users', []);
      const user = users.find(u => u.email === email && u.password === password);
      
      if (!user) {
        this.recordFailedLogin(email);
        Utils.hideLoading();
        Utils.showToast(CONFIG.getError('invalidCredentials'), 'error');
        return;
      }
      
      // Generate token (in production, this comes from backend)
      const token = this.generateToken();
      
      // Save user and token
      Storage.saveUser({
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department
      });
      Storage.saveToken(token);
      
      this.currentUser = user;
      this.clearFailedLogins(email);
      
      Utils.hideLoading();
      Utils.showToast(CONFIG.getSuccess('loginSuccess'), 'success');
      
      // Navigate to dashboard after short delay
      setTimeout(() => {
        this.showDashboard();
      }, 500);
      
    } catch (error) {
      Utils.hideLoading();
      console.error('Login error:', error);
      Utils.showToast(CONFIG.getError('networkError'), 'error');
    }
  },
  
  /**
   * Handle user registration
   */
  async handleRegister() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const department = document.getElementById('registerDepartment').value;
    
    // Validate inputs
    if (!this.validateRegisterInputs(name, email, password, department)) {
      return;
    }
    
    Utils.showLoading();
    
    try {
      // Simulate API call
      await this.delay(1000);
      
      // Check if email already exists
      const users = Storage.getItem('registered_users', []);
      if (users.find(u => u.email === email)) {
        Utils.hideLoading();
        Utils.showToast(CONFIG.getError('emailExists'), 'error');
        return;
      }
      
      // Create new user
      const newUser = {
        id: Utils.generateId(),
        name,
        email,
        password, // In production, hash this on backend
        department,
        createdAt: new Date().toISOString()
      };
      
      // Save user
      users.push(newUser);
      Storage.setItem('registered_users', users);
      
      Utils.hideLoading();
      Utils.showToast(CONFIG.getSuccess('registerSuccess'), 'success');
      
      // Switch to login form
      setTimeout(() => {
        this.toggleAuthCard('login');
        document.getElementById('loginEmail').value = email;
      }, 1000);
      
    } catch (error) {
      Utils.hideLoading();
      console.error('Registration error:', error);
      Utils.showToast(CONFIG.getError('networkError'), 'error');
    }
  },
  
  /**
   * Handle user logout
   */
  async handleLogout() {
    const confirmed = await Utils.confirm('Are you sure you want to logout?');
    
    if (!confirmed) {
      return;
    }
    
    Utils.showLoading();
    
    // Clear user data
    Storage.removeUser();
    Storage.removeToken();
    this.currentUser = null;
    
    // Clear forms
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    
    Utils.hideLoading();
    Utils.showToast('Logged out successfully', 'info');
    
    // Show auth page
    this.showAuthPage();
  },
  
  /**
   * Validate login inputs
   * @param {string} email - Email address
   * @param {string} password - Password
   * @returns {boolean} True if valid
   */
  validateLoginInputs(email, password) {
    if (!email) {
      Utils.showToast('Please enter your email address', 'warning');
      return false;
    }
    
    if (!Utils.validateEmail(email)) {
      Utils.showToast(CONFIG.getError('invalidEmail'), 'error');
      return false;
    }
    
    if (!password) {
      Utils.showToast('Please enter your password', 'warning');
      return false;
    }
    
    return true;
  },
  
  /**
   * Validate registration inputs
   * @param {string} name - Full name
   * @param {string} email - Email address
   * @param {string} password - Password
   * @param {string} department - Department
   * @returns {boolean} True if valid
   */
  validateRegisterInputs(name, email, password, department) {
    if (!name || name.length < 2) {
      Utils.showToast('Please enter a valid name (at least 2 characters)', 'warning');
      return false;
    }
    
    if (!Utils.validateEmail(email)) {
      Utils.showToast(CONFIG.getError('invalidEmail'), 'error');
      return false;
    }
    
    const passwordValidation = Utils.validatePassword(password, CONFIG.VALIDATION.password);
    if (!passwordValidation.isValid) {
      Utils.showToast(passwordValidation.errors[0], 'error');
      return false;
    }
    
    if (!department) {
      Utils.showToast('Please select your department', 'warning');
      return false;
    }
    
    return true;
  },
  
  /**
   * Record failed login attempt
   * @param {string} email - Email address
   */
  recordFailedLogin(email) {
    if (!this.loginAttempts[email]) {
      this.loginAttempts[email] = {
        count: 0,
        lastAttempt: Date.now()
      };
    }
    
    this.loginAttempts[email].count++;
    this.loginAttempts[email].lastAttempt = Date.now();
    
    const remaining = CONFIG.SECURITY.maxLoginAttempts - this.loginAttempts[email].count;
    
    if (remaining > 0) {
      Utils.showToast(`Invalid credentials. ${remaining} attempts remaining.`, 'warning');
    }
  },
  
  /**
   * Check if account is locked
   * @param {string} email - Email address
   * @returns {boolean} True if locked
   */
  isAccountLocked(email) {
    const attempts = this.loginAttempts[email];
    
    if (!attempts) {
      return false;
    }
    
    if (attempts.count >= CONFIG.SECURITY.maxLoginAttempts) {
      const lockoutTime = CONFIG.SECURITY.lockoutDuration * 60 * 1000;
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      
      if (timeSinceLastAttempt < lockoutTime) {
        return true;
      } else {
        // Lockout period expired, reset
        this.clearFailedLogins(email);
        return false;
      }
    }
    
    return false;
  },
  
  /**
   * Clear failed login attempts
   * @param {string} email - Email address
   */
  clearFailedLogins(email) {
    delete this.loginAttempts[email];
  },
  
  /**
   * Generate authentication token
   * @returns {string} Token
   */
  generateToken() {
    // In production, this comes from backend
    return 'token_' + Utils.generateId() + '_' + Date.now();
  },
  
  /**
   * Show authentication page
   */
  showAuthPage() {
    const authPage = document.getElementById('authPage');
    const dashboardPage = document.getElementById('dashboardPage');
    const attendancePage = document.getElementById('attendancePage');
    const reportsPage = document.getElementById('reportsPage');
    const settingsPage = document.getElementById('settingsPage');
    
    if (authPage) authPage.classList.add('active');
    if (dashboardPage) dashboardPage.classList.remove('active');
    if (attendancePage) attendancePage.classList.remove('active');
    if (reportsPage) reportsPage.classList.remove('active');
    if (settingsPage) settingsPage.classList.remove('active');
    
    // Hide nav menu on mobile
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
      navMenu.classList.remove('active');
    }
  },
  
  /**
   * Show dashboard page
   */
  showDashboard() {
    const authPage = document.getElementById('authPage');
    const dashboardPage = document.getElementById('dashboardPage');
    
    if (authPage) authPage.classList.remove('active');
    if (dashboardPage) dashboardPage.classList.add('active');
    
    // Update user name in dashboard
    if (this.currentUser) {
      const userNameEl = document.getElementById('userName');
      if (userNameEl) {
        userNameEl.textContent = this.currentUser.name;
      }
    }
    
    // Load dashboard data
    if (window.Dashboard && typeof window.Dashboard.loadDashboard === 'function') {
      window.Dashboard.loadDashboard();
    }
  },
  
  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return this.currentUser !== null && Storage.getToken() !== null;
  },
  
  /**
   * Get current user
   * @returns {object|null} User object or null
   */
  getCurrentUser() {
    return this.currentUser;
  },
  
  /**
   * Update user profile
   * @param {object} updates - Profile updates
   * @returns {Promise<boolean>} True if successful
   */
  async updateProfile(updates) {
    if (!this.isAuthenticated()) {
      Utils.showToast('Please login first', 'error');
      return false;
    }
    
    Utils.showLoading();
    
    try {
      // Simulate API call
      await this.delay(1000);
      
      // Update current user
      this.currentUser = { ...this.currentUser, ...updates };
      
      // Save to storage
      Storage.saveUser(this.currentUser);
      
      // Update registered users list
      const users = Storage.getItem('registered_users', []);
      const userIndex = users.findIndex(u => u.id === this.currentUser.id);
      
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        Storage.setItem('registered_users', users);
      }
      
      Utils.hideLoading();
      Utils.showToast(CONFIG.getSuccess('profileUpdated'), 'success');
      return true;
      
    } catch (error) {
      Utils.hideLoading();
      console.error('Profile update error:', error);
      Utils.showToast(CONFIG.getError('networkError'), 'error');
      return false;
    }
  },
  
  /**
   * Change password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} True if successful
   */
  async changePassword(currentPassword, newPassword) {
    if (!this.isAuthenticated()) {
      Utils.showToast('Please login first', 'error');
      return false;
    }
    
    // Validate new password
    const validation = Utils.validatePassword(newPassword, CONFIG.VALIDATION.password);
    if (!validation.isValid) {
      Utils.showToast(validation.errors[0], 'error');
      return false;
    }
    
    Utils.showLoading();
    
    try {
      // Simulate API call
      await this.delay(1000);
      
      // Verify current password
      const users = Storage.getItem('registered_users', []);
      const user = users.find(u => u.id === this.currentUser.id);
      
      if (!user || user.password !== currentPassword) {
        Utils.hideLoading();
        Utils.showToast('Current password is incorrect', 'error');
        return false;
      }
      
      // Update password
      const userIndex = users.findIndex(u => u.id === this.currentUser.id);
      users[userIndex].password = newPassword;
      Storage.setItem('registered_users', users);
      
      Utils.hideLoading();
      Utils.showToast(CONFIG.getSuccess('passwordChanged'), 'success');
      return true;
      
    } catch (error) {
      Utils.hideLoading();
      console.error('Password change error:', error);
      Utils.showToast(CONFIG.getError('networkError'), 'error');
      return false;
    }
  },
  
  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Initialize auth when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Auth.init());
} else {
  Auth.init();
}