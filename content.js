/**
 * YouTube Downloader Pro - Content Script
 * Injects a download button on YouTube video pages
 */

// Wait for the YouTube page to fully load
document.addEventListener('yt-navigate-finish', function() {
  if (window.location.pathname.startsWith('/watch')) {
    robustInjectDownloadButton();
  }
});

// Also run on initial page load
if (window.location.pathname.startsWith('/watch')) {
  setTimeout(robustInjectDownloadButton, 1200);
}

// Robust injection with retries and fallback
function robustInjectDownloadButton() {
  let attempts = 0;
  const maxAttempts = 10;
  const interval = setInterval(() => {
    if (injectDownloadButton()) {
      clearInterval(interval);
    } else if (++attempts >= maxAttempts) {
      clearInterval(interval);
      // Fallback: always try to inject below the video
      injectDownloadButton(true);
    }
  }, 500);
}

/**
 * Injects the download button into the YouTube UI
 * @param {boolean} forceFallback - If true, always use fallback location
 * @returns {boolean} - True if injected, false otherwise
 */
function injectDownloadButton(forceFallback = false) {
  if (document.getElementById('yt-downloader-btn')) {
    return true;
  }
  const videoId = new URLSearchParams(window.location.search).get('v');
  if (!videoId) return false;

  const downloadBtn = document.createElement('button');
  downloadBtn.id = 'yt-downloader-btn';
  downloadBtn.className = 'yt-downloader-btn';
  downloadBtn.innerHTML = 'Download';
  downloadBtn.title = 'Download this video';

  downloadBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    const videoTitle = document.querySelector('h1.title')?.textContent?.trim() || 'YouTube Video';
    chrome.runtime.sendMessage({
      action: 'openSidePanel',
      videoId: videoId,
      videoTitle: videoTitle,
      videoUrl: window.location.href
    }, function(response) {
      console.log('Side panel open response:', response);
      if (!response || !response.success) {
        const errorMessage = (response && response.error) ? response.error : 'Please try again.';
        console.error('Failed to open side panel:', errorMessage);
        alert(`Could not open the download panel: ${errorMessage}`);
      }
    });
  });

  // Try to find the YouTube action buttons menu container
  if (!forceFallback) {
    // New primary selector: targets the menu bar containing like/dislike, share, etc.
    const targetContainer = document.querySelector('div#menu.ytd-watch-metadata');
    if (targetContainer) {
      const wrapper = document.createElement('div');
      wrapper.className = 'yt-downloader-btn-wrapper';
      // Prepending might be better to make it more prominent or avoid issues with YouTube adding new buttons at the end.
      // Or, append if that looks more natural. Let's try appending first.
      wrapper.appendChild(downloadBtn);
      targetContainer.appendChild(wrapper); // Appending to the menu container
      return true;
    }
    // Secondary attempt for primary target, using the old selector as a fallback before the main fallback
    const oldTargetContainer = document.querySelector('#top-level-buttons-computed');
    if (oldTargetContainer) {
      const wrapper = document.createElement('div');
      wrapper.className = 'yt-downloader-btn-wrapper';
      wrapper.appendChild(downloadBtn);
      oldTargetContainer.appendChild(wrapper);
      return true;
    }
  }
  // Fallback strategy:
  // 1. Try to insert before the comments section.
  // 2. If comments section not found, try to insert after the player.

  const commentsSection = document.querySelector('#comments');
  if (commentsSection) {
    const wrapper = document.createElement('div');
    wrapper.className = 'yt-downloader-btn-wrapper-fallback'; // Use fallback styling
    wrapper.appendChild(downloadBtn);
    commentsSection.parentNode.insertBefore(wrapper, commentsSection);
    return true;
  }

  // Original fallback: Insert below the video player if comments not found
  const playerContainer = document.querySelector('#player'); // Existing fallback selector
  if (playerContainer) {
    const wrapper = document.createElement('div');
    wrapper.className = 'yt-downloader-btn-wrapper-fallback';
    wrapper.appendChild(downloadBtn);
    // Insert outside the player, typically after it or its immediate container.
    playerContainer.parentNode.insertBefore(wrapper, playerContainer.nextSibling);
    return true;
  }

  return false;
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getVideoInfo') {
    // Get video information
    const videoId = new URLSearchParams(window.location.search).get('v');
    const videoTitle = document.querySelector('h1.title')?.textContent?.trim() || 'YouTube Video';
    
    sendResponse({
      videoId: videoId,
      videoTitle: videoTitle,
      videoUrl: window.location.href
    });
    return true;
  }
});
