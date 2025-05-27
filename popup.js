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

// Error message elements
const loginErrorEl = document.getElementById('login-error'); 
const signupErrorEl = document.getElementById('signup-error'); 

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

// All main screen containers
const allScreens = [loginSectionEl, signupSectionEl, userInfoEl, subscriptionSectionEl, promoCodeSectionEl];

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  
  if (currentTab && currentTab.url && currentTab.url.includes('youtube.com/watch')) {
    if (notOnYoutubeEl) notOnYoutubeEl.style.display = 'none';
    if (onYoutubeEl) onYoutubeEl.style.display = 'block';
  } else {
    if (notOnYoutubeEl) notOnYoutubeEl.style.display = 'block';
    if (onYoutubeEl) onYoutubeEl.style.display = 'none';
  }
  
  loadUserData();
  setupEventListeners();
});

/**
 * Clears all error messages
 */
function clearErrorMessages() {
  if (loginErrorEl) {
    loginErrorEl.textContent = '';
    loginErrorEl.style.display = 'none';
  }
  if (signupErrorEl) {
    signupErrorEl.textContent = '';
    signupErrorEl.style.display = 'none';
  }
  // Add clearing for other potential general error divs if created
}

/**
 * Hides all main screen elements and clears errors.
 */
function hideAllScreensAndClearErrors() {
  allScreens.forEach(screen => {
    if (screen) screen.style.display = 'none';
  });
  clearErrorMessages();
}

/**
 * Loads user data from storage and updates the UI
 */
async function loadUserData() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getUserData' });
    if (response && response.success && response.userData) {
      if (response.userData.isLoggedIn) {
        showUserInfo(response.userData);
      } else {
        showLoginForm();
      }
    } else {
      console.warn('Failed to load user data or no data available:', response ? response.error : 'No response');
      showLoginForm(); 
    }
  } catch (error) {
    console.error('Error loading user data:', error.message);
    showLoginForm(); 
  }
}

/**
 * Sets up event listeners for buttons and forms
 */
function setupEventListeners() {
  if (openSidePanelBtn) {
    openSidePanelBtn.addEventListener('click', async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getVideoInfo' }, (videoInfoResponse) => {
            if (chrome.runtime.lastError) {
              console.warn("Error getting video info from content script:", chrome.runtime.lastError.message, "Opening side panel without video info.");
              // Open side panel without specific video info
              chrome.runtime.sendMessage({ action: 'openSidePanel' }, (panelResponse) => {
                if (chrome.runtime.lastError) console.error("Error opening side panel (fallback):", chrome.runtime.lastError.message);
                else if (!panelResponse.success) console.error("Failed to open side panel (fallback):", panelResponse.error);
              });
            } else if (videoInfoResponse) {
              chrome.runtime.sendMessage({
                action: 'openSidePanel',
                videoId: videoInfoResponse.videoId,
                videoTitle: videoInfoResponse.videoTitle,
                videoUrl: videoInfoResponse.videoUrl
              }, (panelResponse) => {
                 if (chrome.runtime.lastError) console.error("Error opening side panel with video info:", chrome.runtime.lastError.message);
                 else if (!panelResponse.success) console.error("Failed to open side panel with video info:", panelResponse.error);
              });
            } else {
               console.warn("No response from content script for getVideoInfo. Opening side panel without video info.");
               chrome.runtime.sendMessage({ action: 'openSidePanel' }, (panelResponse) => {
                if (chrome.runtime.lastError) console.error("Error opening side panel (no content script response):", chrome.runtime.lastError.message);
                else if (!panelResponse.success) console.error("Failed to open side panel (no content script response):", panelResponse.error);
              });
            }
          });
        } else {
          console.error("Could not get active tab ID to open side panel.");
        }
      } catch (e) {
        console.error("Exception in openSidePanelBtn click listener:", e);
      }
    });
  }
  
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (signupForm) signupForm.addEventListener('submit', handleSignup);
  if (promoCodeForm) promoCodeForm.addEventListener('submit', handlePromoCode);
  
  if (showSignupBtn) {
    showSignupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      hideAllScreensAndClearErrors();
      if (signupSectionEl) signupSectionEl.style.display = 'block';
    });
  }
  
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      hideAllScreensAndClearErrors();
      if (loginSectionEl) loginSectionEl.style.display = 'block';
    });
  }
  
  if (manageSubscriptionBtn) {
    manageSubscriptionBtn.addEventListener('click', () => {
      hideAllScreensAndClearErrors();
      if (subscriptionSectionEl) subscriptionSectionEl.style.display = 'block';
    });
  }
  
  if (redeemCodeBtn) {
    redeemCodeBtn.addEventListener('click', () => {
      hideAllScreensAndClearErrors();
      if (promoCodeSectionEl) promoCodeSectionEl.style.display = 'block';
    });
  }
  
  if (backToAccountBtn) {
    backToAccountBtn.addEventListener('click', () => {
      hideAllScreensAndClearErrors();
      loadUserData(); 
    });
  }
  
  if (backFromPromoBtn) {
    backFromPromoBtn.addEventListener('click', () => {
      hideAllScreensAndClearErrors();
      loadUserData();
    });
  }
  
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  
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
  hideAllScreensAndClearErrors();
  if (loginSectionEl) loginSectionEl.style.display = 'block';
}

/**
 * Shows the user info section with the provided user data
 */
function showUserInfo(userData) {
  hideAllScreensAndClearErrors();
  if (userInfoEl) userInfoEl.style.display = 'block';
  
  if (userEmailEl) userEmailEl.textContent = userData.email || 'N/A';
  
  if (userData.subscription) {
    if (userPlanEl) userPlanEl.textContent = userData.subscription.plan === 'monthly' ? 'Monthly' : 'Yearly';
    if (downloadsRemainingContainerEl) downloadsRemainingContainerEl.style.display = 'none';
    if (subscriptionContainerEl) subscriptionContainerEl.style.display = 'block';
    const endDate = new Date(userData.subscription.endDate);
    if (subscriptionInfoEl) subscriptionInfoEl.textContent = `Valid until ${endDate.toLocaleDateString()}`;
  } else {
    if (userPlanEl) userPlanEl.textContent = 'Free';
    if (downloadsRemainingContainerEl) downloadsRemainingContainerEl.style.display = 'block';
    if (downloadsRemainingEl) downloadsRemainingEl.textContent = `${Math.max(0, 5 - (userData.downloadCount || 0))} of 5`;
    if (subscriptionContainerEl) subscriptionContainerEl.style.display = 'none';
  }
  
  if (userData.promoCodeUsed && userData.promoCodeExpiry) {
    if (promoCodeContainerEl) promoCodeContainerEl.style.display = 'block';
    const expiry = new Date(userData.promoCodeExpiry);
    if (promoCodeInfoEl) promoCodeInfoEl.textContent = `${userData.promoCodeUsed} (expires ${expiry.toLocaleString()})`;
  } else {
    if (promoCodeContainerEl) promoCodeContainerEl.style.display = 'none';
  }
}

/**
 * Handles login form submission
 */
async function handleLogin(e) {
  e.preventDefault();
  
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const email = emailInput ? emailInput.value : '';
  const password = passwordInput ? passwordInput.value : '';

  clearErrorMessages();
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'login', email, password });
    
    if (response && response.success && response.userData) {
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
      showUserInfo(response.userData);
    } else {
      const errorMessage = (response && response.error) || 'Login failed. Please try again.';
      if (loginErrorEl) {
        loginErrorEl.textContent = errorMessage;
        loginErrorEl.style.display = 'block';
      } else {
        alert(errorMessage); 
      }
    }
  } catch (error) {
    console.error('Login error:', error.message);
    const displayError = error.message || 'An unexpected error occurred during login. Please try again.';
    if (loginErrorEl) {
      loginErrorEl.textContent = displayError;
      loginErrorEl.style.display = 'block';
    } else {
      alert(displayError); 
    }
  }
}

/**
 * Handles signup form submission
 */
async function handleSignup(e) {
  e.preventDefault();

  const emailInput = document.getElementById('signup-email');
  const passwordInput = document.getElementById('signup-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  
  const email = emailInput ? emailInput.value : '';
  const password = passwordInput ? passwordInput.value : '';
  const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

  clearErrorMessages();
  
  if (password !== confirmPassword) {
    const errMsg = 'Passwords do not match.';
    if (signupErrorEl) {
      signupErrorEl.textContent = errMsg;
      signupErrorEl.style.display = 'block';
    } else {
      alert(errMsg); 
    }
    return;
  }
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'signup', email, password });
    
    if (response && response.success && response.userData) {
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
      if (confirmPasswordInput) confirmPasswordInput.value = '';
      showUserInfo(response.userData);
    } else {
      const errorMessage = (response && response.error) || 'Signup failed. Please try again.';
      if (signupErrorEl) {
        signupErrorEl.textContent = errorMessage;
        signupErrorEl.style.display = 'block';
      } else {
        alert(errorMessage); 
      }
    }
  } catch (error) {
    console.error('Signup error:', error.message);
    const displayError = error.message || 'An unexpected error occurred during signup. Please try again.';
    if (signupErrorEl) {
      signupErrorEl.textContent = displayError;
      signupErrorEl.style.display = 'block';
    } else {
      alert(displayError);
    }
  }
}

/**
 * Handles logout button click
 */
async function handleLogout() {
  clearErrorMessages(); 
  try {
    const response = await chrome.runtime.sendMessage({ action: 'logout' });
    if (response && response.success) {
      showLoginForm();
    } else {
      alert(`Logout failed: ${(response && response.error) || 'An unknown error occurred.'}`);
    }
  } catch (error) {
    console.error('Logout error:', error.message);
    alert(`An unexpected error occurred during logout: ${error.message || 'Please try again.'}`);
  }
}

/**
 * Handles subscription purchase
 */
async function handleSubscription(plan) {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'purchaseSubscription', plan });
    if (response && response.success) {
      alert(response.message || `Thank you for subscribing to the ${plan} plan! Your details are being updated.`);
      // UI will update once background script simulates purchase and updates userData
      // For immediate feedback, we could optimistically update or wait for loadUserData on next view.
      // The current 'backToAccount' calls loadUserData which is good.
      // We can also call loadUserData here after a short delay or directly.
      loadUserData(); 
    } else {
      alert(`Subscription failed: ${(response && response.error) || 'An unknown error occurred. Please try again.'}`);
    }
  } catch (error) {
    console.error('Subscription error:', error.message);
    alert(`An unexpected error occurred during subscription: ${error.message || 'Please try again.'}`);
  }
}

/**
 * Handles promo code form submission
 */
async function handlePromoCode(e) {
  e.preventDefault();
  const codeInput = document.getElementById('promo-code');
  const code = codeInput ? codeInput.value : '';
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'redeemPromoCode', code });
    if (response && response.success) {
      if (codeInput) codeInput.value = ''; 
      alert(response.message || 'Promo code applied successfully! Your details are being updated.');
      loadUserData(); 
    } else {
      alert(`Promo code redemption failed: ${(response && response.error) || 'Invalid promo code or an unknown error occurred.'}`);
    }
  } catch (error) {
    console.error('Promo code error:', error.message);
    alert(`An unexpected error occurred while redeeming promo code: ${error.message || 'Please try again.'}`);
  }
}

// Defensive checks for critical elements (optional, for debugging during development)
if (!loginErrorEl || !signupErrorEl) {
  console.warn('Error display elements (#login-error or #signup-error) are missing from popup.html. Error messages will use alerts.');
}
allScreens.forEach(screen => {
  if(!screen) console.warn("A main screen element (login, signup, user-info, etc.) is missing in popup.html. UI may not switch correctly.");
});
