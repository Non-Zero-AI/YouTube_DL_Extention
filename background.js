/**
 * YouTube Downloader Pro - Background Script
 * Handles side panel opening, authentication, and download functionality
 */

// Store user data
let userData = {
  isLoggedIn: false,
  email: null,
  subscription: null,
  downloadCount: 0,
  isAdmin: false,
  promoCodeUsed: null,
  promoCodeExpiry: null
};

// Constants
const FREE_DOWNLOAD_LIMIT = 5;
const API_BASE_URL = 'https://api.ytdownloaderpro.com'; // This would be your actual API endpoint
const WEBHOOK_SIGNUP = 'https://nonzeroai.app.n8n.cloud/webhook-test/fdfcd990-6772-4556-8d9e-10d41311737d';
const WEBHOOK_STRIPE_PAYMENT = 'https://nonzeroai.app.n8n.cloud/webhook-test/b5579850-7159-4ec9-8119-76aee0b0edb3';

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('YouTube Downloader Pro installed');
  
  // Load user data from storage
  const storedData = await chrome.storage.local.get('userData');
  if (storedData.userData) {
    userData = storedData.userData;
    
    // Check if promo code has expired
    if (userData.promoCodeUsed && userData.promoCodeExpiry) {
      const now = new Date();
      if (now > new Date(userData.promoCodeExpiry)) {
        userData.promoCodeUsed = null;
        userData.promoCodeExpiry = null;
        await chrome.storage.local.set({ userData });
      }
    }
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle opening the side panel
  if (request.action === 'openSidePanel') {
    handleOpenSidePanel(request, sender);
    sendResponse({ success: true });
    return true;
  }
  
  // Handle login request
  if (request.action === 'login') {
    handleLogin(request.email, request.password)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // Handle signup request
  if (request.action === 'signup') {
    handleSignup(request.email, request.password)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // Handle logout request
  if (request.action === 'logout') {
    handleLogout()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // Handle subscription purchase
  if (request.action === 'purchaseSubscription') {
    handlePurchaseSubscription(request.plan)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // Handle promo code redemption
  if (request.action === 'redeemPromoCode') {
    handleRedeemPromoCode(request.code)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // Handle download request
  if (request.action === 'downloadVideo') {
    handleDownload(request)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // Handle user data request
  if (request.action === 'getUserData') {
    sendResponse({ success: true, userData });
    return true;
  }
});

/**
 * Opens the side panel and passes video information
 */
async function handleOpenSidePanel(request, sender) {
  try {
    // Store video info in session storage for the side panel to access
    await chrome.storage.session.set({
      currentVideo: {
        id: request.videoId,
        title: request.videoTitle,
        url: request.videoUrl
      }
    });
    
    // Check if chrome.sidePanel API is available
    if (chrome.sidePanel) {
      // Set the side panel options first
      await chrome.sidePanel.setOptions({
        tabId: sender.tab.id,
        path: 'sidepanel.html',
        enabled: true
      });
      
      // Then open the side panel
      await chrome.sidePanel.open({ tabId: sender.tab.id });
      
      console.log('Side panel opened successfully');
    } else {
      // Fallback for browsers that don't support the sidePanel API
      console.log('Side panel API not available, opening in a new tab');
      
      // Open in a new tab as fallback
      chrome.tabs.create({
        url: chrome.runtime.getURL('sidepanel.html'),
        active: true
      });
    }
  } catch (error) {
    console.error('Error opening side panel:', error);
    
    // Fallback to opening in a new tab if there's an error
    try {
      chrome.tabs.create({
        url: chrome.runtime.getURL('sidepanel.html'),
        active: true
      });
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
    }
  }
}

/**
 * Handles user login
 */
async function handleLogin(email, password) {
  try {
    // In a real extension, you would make an API call to your backend
    // For this demo, we'll simulate a successful login
    
    // Simulate API call
    // const response = await fetch(`${API_BASE_URL}/auth/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password })
    // });
    // const data = await response.json();
    
    // Simulate successful login
    const data = {
      success: true,
      user: {
        email: email,
        subscription: null, // No subscription by default
        downloadCount: 0,
        isAdmin: email === 'admin@example.com' // Simple admin check
      }
    };
    
    if (data.success) {
      userData = {
        isLoggedIn: true,
        email: data.user.email,
        subscription: data.user.subscription,
        downloadCount: data.user.downloadCount || 0,
        isAdmin: data.user.isAdmin || false,
        promoCodeUsed: userData.promoCodeUsed,
        promoCodeExpiry: userData.promoCodeExpiry
      };
      
      // Save to storage
      await chrome.storage.local.set({ userData });
      
      return { success: true, userData };
    } else {
      return { success: false, error: data.error || 'Login failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    throw new Error('Login failed. Please try again.');
  }
}

/**
 * Handles user signup
 */
async function handleSignup(email, password) {
  try {
    // Create user data
    const newUser = {
      email: email,
      subscription: null,
      downloadCount: 0,
      isAdmin: email === 'admin@example.com', // Simple admin check
      createdAt: new Date().toISOString()
    };
    
    // Send customer details to webhook
    try {
      const webhookResponse = await fetch(WEBHOOK_SIGNUP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password, // In production, this should be hashed
          isAdmin: newUser.isAdmin,
          createdAt: newUser.createdAt
        })
      });
      
      if (!webhookResponse.ok) {
        console.error('Webhook failed:', webhookResponse.status);
      }
    } catch (webhookError) {
      console.error('Webhook error:', webhookError);
      // Continue with signup even if webhook fails
    }
    
    // Update local user data
    userData = {
      isLoggedIn: true,
      email: newUser.email,
      subscription: newUser.subscription,
      downloadCount: newUser.downloadCount,
      isAdmin: newUser.isAdmin,
      promoCodeUsed: null,
      promoCodeExpiry: null
    };
    
    // Save to storage
    await chrome.storage.local.set({ userData });
    
    return { success: true, userData };
  } catch (error) {
    console.error('Signup error:', error);
    throw new Error('Signup failed. Please try again.');
  }
}

/**
 * Handles user logout
 */
async function handleLogout() {
  try {
    // Reset user data
    userData = {
      isLoggedIn: false,
      email: null,
      subscription: null,
      downloadCount: 0,
      isAdmin: false,
      promoCodeUsed: null,
      promoCodeExpiry: null
    };
    
    // Save to storage
    await chrome.storage.local.set({ userData });
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Logout failed. Please try again.');
  }
}

/**
 * Handles subscription purchase with Stripe integration
 */
async function handlePurchaseSubscription(plan) {
  try {
    // Define plan details
    const planDetails = {
      monthly: {
        price: 500, // $5.00 in cents
        name: 'Monthly Subscription',
        interval: 'month'
      },
      yearly: {
        price: 2000, // $20.00 in cents
        name: 'Yearly Subscription',
        interval: 'year'
      }
    };
    
    // Trigger Stripe payment webhook
    try {
      const webhookResponse = await fetch(WEBHOOK_STRIPE_PAYMENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          plan: plan,
          price: planDetails[plan].price,
          name: planDetails[plan].name,
          interval: planDetails[plan].interval,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!webhookResponse.ok) {
        console.error('Stripe webhook failed:', webhookResponse.status);
      }
    } catch (webhookError) {
      console.error('Stripe webhook error:', webhookError);
      // Continue with the checkout process even if webhook fails
    }
    
    // Open Stripe checkout in a new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('stripe-checkout.html') + `?plan=${plan}&email=${encodeURIComponent(userData.email)}`
    });
    
    // For demonstration purposes, we'll simulate a successful purchase
    // In a real implementation, this would happen after the webhook confirms payment
    setTimeout(async () => {
      const subscriptionData = {
        plan: plan,
        startDate: new Date().toISOString(),
        endDate: plan === 'monthly' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 365 days
      };
      
      // Update user data with subscription info
      userData.subscription = subscriptionData;
      
      // Save to storage
      await chrome.storage.local.set({ userData });
    }, 5000); // Simulate payment processing delay
    
    return { success: true, message: 'Redirecting to Stripe checkout...' };
  } catch (error) {
    console.error('Purchase error:', error);
    throw new Error('Purchase failed. Please try again.');
  }
}

/**
 * Handles promo code redemption
 */
async function handleRedeemPromoCode(code) {
  try {
    // In a real extension, you would validate the promo code with your backend
    // For this demo, we'll accept any code for the admin and "FREEDAY" for regular users
    
    // Simulate API call
    // const response = await fetch(`${API_BASE_URL}/promo/redeem`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email: userData.email, code })
    // });
    // const data = await response.json();
    
    // Simulate promo code validation
    let isValid = userData.isAdmin || code === 'FREEDAY';
    
    if (isValid) {
      // Set promo code expiry to 24 hours from now
      const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      userData.promoCodeUsed = code;
      userData.promoCodeExpiry = expiryDate.toISOString();
      
      // Save to storage
      await chrome.storage.local.set({ userData });
      
      return { 
        success: true, 
        message: 'Promo code applied successfully! You have free access for 24 hours.',
        expiry: expiryDate.toISOString()
      };
    } else {
      return { success: false, error: 'Invalid promo code' };
    }
  } catch (error) {
    console.error('Promo code error:', error);
    throw new Error('Failed to redeem promo code. Please try again.');
  }
}

/**
 * Handles video download requests
 */
async function handleDownload(request) {
  try {
    const { videoId, videoTitle, format } = request;
    
    // Check if user can download
    const canDownload = await checkDownloadEligibility();
    if (!canDownload.eligible) {
      return { success: false, error: canDownload.reason };
    }
    
    // In a real extension, you would make an API call to your backend service
    // that handles the actual downloading using yt-dlp or similar
    
    // For this demo, we'll simulate the download process
    // In a real implementation, you would:
    // 1. Call your backend API to process the download
    // 2. Get a download URL for the processed file
    // 3. Use chrome.downloads.download to save the file
    
    // Simulate download URL based on format
    let downloadUrl;
    let filename;
    
    if (format === 'mp4') {
      downloadUrl = `https://example.com/download?id=${videoId}&format=mp4`;
      filename = `${videoTitle}.mp4`;
    } else if (format === 'mp3') {
      downloadUrl = `https://example.com/download?id=${videoId}&format=mp3`;
      filename = `${videoTitle}.mp3`;
    } else if (format === 'txt') {
      downloadUrl = `https://example.com/download?id=${videoId}&format=txt`;
      filename = `${videoTitle}.txt`;
    } else {
      return { success: false, error: 'Invalid format specified' };
    }
    
    // In a real extension, you would download the file using:
    // const downloadId = await chrome.downloads.download({
    //   url: downloadUrl,
    //   filename: filename,
    //   saveAs: false
    // });
    
    // Increment download count for free users
    if (!userData.subscription && !userData.promoCodeUsed) {
      userData.downloadCount++;
      await chrome.storage.local.set({ userData });
    }
    
    return { 
      success: true, 
      message: `Download started for ${filename}`,
      // downloadId: downloadId
    };
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Download failed. Please try again.');
  }
}

/**
 * Checks if the user is eligible to download
 */
async function checkDownloadEligibility() {
  // Admin can always download
  if (userData.isAdmin) {
    return { eligible: true };
  }
  
  // Check if user is logged in
  if (!userData.isLoggedIn) {
    return { eligible: false, reason: 'Please log in to download videos' };
  }
  
  // Check if user has an active subscription
  if (userData.subscription) {
    // Check if subscription is still valid
    const now = new Date();
    const endDate = new Date(userData.subscription.endDate);
    
    if (now > endDate) {
      // Subscription expired
      userData.subscription = null;
      await chrome.storage.local.set({ userData });
      
      return { eligible: false, reason: 'Your subscription has expired. Please renew to continue downloading.' };
    }
    
    // User has valid subscription
    return { eligible: true };
  }
  
  // Check if user has used a promo code
  if (userData.promoCodeUsed && userData.promoCodeExpiry) {
    const now = new Date();
    const expiry = new Date(userData.promoCodeExpiry);
    
    if (now < expiry) {
      // Promo code is still valid
      return { eligible: true };
    } else {
      // Promo code expired
      userData.promoCodeUsed = null;
      userData.promoCodeExpiry = null;
      await chrome.storage.local.set({ userData });
    }
  }
  
  // Check download limit for free users
  if (userData.downloadCount >= FREE_DOWNLOAD_LIMIT) {
    return { 
      eligible: false, 
      reason: `You have reached your free download limit (${FREE_DOWNLOAD_LIMIT} downloads per month). Please subscribe to continue downloading.`
    };
  }
  
  // Free user with downloads remaining
  return { eligible: true };
}
