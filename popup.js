/**
 * YouTube Downloader Pro - Popup Script
 */

// DOM elements
const notOnYoutubeEl = document.getElementById('not-on-youtube');
const onYoutubeEl = document.getElementById('on-youtube');
const openSidePanelBtn = document.getElementById('open-side-panel');
const loginSectionEl = document.getElementById('login-section');
const signupSectionEl = document.getElementById('signup-section');
const userInfoEl = document.getElementById('user-info');
const subscriptionSectionEl = document.getElementById('subscription-section');
const promoCodeSectionEl = document.getElementById('promo-code-section');

// Form elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const promoCodeForm = document.getElementById('promo-code-form');

// User info elements
const userEmailEl = document.getElementById('user-email');
const userPlanEl = document.getElementById('user-plan');
const downloadsRemainingEl = document.getElementById('downloads-remaining');
const downloadsRemainingContainerEl = document.getElementById('downloads-remaining-container');
const subscriptionContainerEl = document.getElementById('subscription-container');
const subscriptionInfoEl = document.getElementById('subscription-info');
const promoCodeContainerEl = document.getElementById('promo-code-container');
const promoCodeInfoEl = document.getElementById('promo-code-info');

// Action buttons
const manageSubscriptionBtn = document.getElementById('manage-subscription');
const redeemCodeBtn = document.getElementById('redeem-code');
const logoutBtn = document.getElementById('logout');
const showSignupBtn = document.getElementById('show-signup');
const showLoginBtn = document.getElementById('show-login');
const backToAccountBtn = document.getElementById('back-to-account');
const backFromPromoBtn = document.getElementById('back-from-promo');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Check if current tab is a YouTube video
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  
  if (currentTab.url && currentTab.url.includes('youtube.com/watch')) {
    notOnYoutubeEl.style.display = 'none';
    onYoutubeEl.style.display = 'block';
  } else {
    notOnYoutubeEl.style.display = 'block';
    onYoutubeEl.style.display = 'none';
  }
  
  // Load user data
  loadUserData();
  
  // Set up event listeners
  setupEventListeners();
});

/**
 * Loads user data from storage and updates the UI
 */
async function loadUserData() {
  try {
    // Get user data from background script
    const response = await chrome.runtime.sendMessage({ action: 'getUserData' });
    
    if (response.success && response.userData) {
      const userData = response.userData;
      
      if (userData.isLoggedIn) {
        // User is logged in, show user info
        showUserInfo(userData);
      } else {
        // User is not logged in, show login form
        showLoginForm();
      }
    } else {
      // No user data or error, show login form
      showLoginForm();
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    showLoginForm();
  }
}

/**
 * Sets up event listeners for buttons and forms
 */
function setupEventListeners() {
  // Open side panel button
  if (openSidePanelBtn) {
    openSidePanelBtn.addEventListener('click', async () => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getVideoInfo' }, (response) => {
        if (response) {
          chrome.runtime.sendMessage({
            action: 'openSidePanel',
            videoId: response.videoId,
            videoTitle: response.videoTitle,
            videoUrl: response.videoUrl
          });
        }
      });
    });
  }
  
  // Login form
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Signup form
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  
  // Promo code form
  if (promoCodeForm) {
    promoCodeForm.addEventListener('submit', handlePromoCode);
  }
  
  // Show signup form
  if (showSignupBtn) {
    showSignupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loginSectionEl.style.display = 'none';
      signupSectionEl.style.display = 'block';
    });
  }
  
  // Show login form
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      signupSectionEl.style.display = 'none';
      loginSectionEl.style.display = 'block';
    });
  }
  
  // Manage subscription button
  if (manageSubscriptionBtn) {
    manageSubscriptionBtn.addEventListener('click', () => {
      userInfoEl.style.display = 'none';
      subscriptionSectionEl.style.display = 'block';
    });
  }
  
  // Redeem code button
  if (redeemCodeBtn) {
    redeemCodeBtn.addEventListener('click', () => {
      userInfoEl.style.display = 'none';
      promoCodeSectionEl.style.display = 'block';
    });
  }
  
  // Back to account button
  if (backToAccountBtn) {
    backToAccountBtn.addEventListener('click', () => {
      subscriptionSectionEl.style.display = 'none';
      userInfoEl.style.display = 'block';
    });
  }
  
  // Back from promo button
  if (backFromPromoBtn) {
    backFromPromoBtn.addEventListener('click', () => {
      promoCodeSectionEl.style.display = 'none';
      userInfoEl.style.display = 'block';
    });
  }
  
  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Subscription buttons
  document.querySelectorAll('.subscription-card .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-plan');
      handleSubscription(plan);
    });
  });
}

/**
 * Shows the login form
 */
function showLoginForm() {
  userInfoEl.style.display = 'none';
  signupSectionEl.style.display = 'none';
  subscriptionSectionEl.style.display = 'none';
  promoCodeSectionEl.style.display = 'none';
  loginSectionEl.style.display = 'block';
}

/**
 * Shows the user info section with the provided user data
 */
function showUserInfo(userData) {
  loginSectionEl.style.display = 'none';
  signupSectionEl.style.display = 'none';
  subscriptionSectionEl.style.display = 'none';
  promoCodeSectionEl.style.display = 'none';
  userInfoEl.style.display = 'block';
  
  // Update user info
  userEmailEl.textContent = userData.email;
  
  // Update plan info
  if (userData.subscription) {
    userPlanEl.textContent = userData.subscription.plan === 'monthly' ? 'Monthly' : 'Yearly';
    downloadsRemainingContainerEl.style.display = 'none';
    
    // Show subscription info
    subscriptionContainerEl.style.display = 'block';
    const endDate = new Date(userData.subscription.endDate);
    subscriptionInfoEl.textContent = `Valid until ${endDate.toLocaleDateString()}`;
  } else {
    userPlanEl.textContent = 'Free';
    
    // Show downloads remaining
    downloadsRemainingContainerEl.style.display = 'block';
    downloadsRemainingEl.textContent = `${5 - userData.downloadCount} of 5`;
    
    // Hide subscription info
    subscriptionContainerEl.style.display = 'none';
  }
  
  // Show promo code info if applicable
  if (userData.promoCodeUsed && userData.promoCodeExpiry) {
    promoCodeContainerEl.style.display = 'block';
    const expiry = new Date(userData.promoCodeExpiry);
    promoCodeInfoEl.textContent = `${userData.promoCodeUsed} (expires ${expiry.toLocaleString()})`;
  } else {
    promoCodeContainerEl.style.display = 'none';
  }
}

/**
 * Handles login form submission
 */
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'login',
      email,
      password
    });
    
    if (response.success) {
      showUserInfo(response.userData);
    } else {
      alert(response.error || 'Login failed. Please try again.');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred during login. Please try again.');
  }
}

/**
 * Handles signup form submission
 */
async function handleSignup(e) {
  e.preventDefault();
  
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  // Validate passwords match
  if (password !== confirmPassword) {
    alert('Passwords do not match.');
    return;
  }
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'signup',
      email,
      password
    });
    
    if (response.success) {
      showUserInfo(response.userData);
    } else {
      alert(response.error || 'Signup failed. Please try again.');
    }
  } catch (error) {
    console.error('Signup error:', error);
    alert('An error occurred during signup. Please try again.');
  }
}

/**
 * Handles logout button click
 */
async function handleLogout() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'logout' });
    
    if (response.success) {
      showLoginForm();
    } else {
      alert(response.error || 'Logout failed. Please try again.');
    }
  } catch (error) {
    console.error('Logout error:', error);
    alert('An error occurred during logout. Please try again.');
  }
}

/**
 * Handles subscription purchase
 */
async function handleSubscription(plan) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'purchaseSubscription',
      plan
    });
    
    if (response.success) {
      // Reload user data to update UI
      loadUserData();
      alert(`Thank you for subscribing to the ${plan} plan!`);
    } else {
      alert(response.error || 'Subscription purchase failed. Please try again.');
    }
  } catch (error) {
    console.error('Subscription error:', error);
    alert('An error occurred during subscription purchase. Please try again.');
  }
}

/**
 * Handles promo code form submission
 */
async function handlePromoCode(e) {
  e.preventDefault();
  
  const code = document.getElementById('promo-code').value;
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'redeemPromoCode',
      code
    });
    
    if (response.success) {
      // Reload user data to update UI
      loadUserData();
      alert(response.message || 'Promo code applied successfully!');
    } else {
      alert(response.error || 'Invalid promo code. Please try again.');
    }
  } catch (error) {
    console.error('Promo code error:', error);
    alert('An error occurred while redeeming the promo code. Please try again.');
  }
}
