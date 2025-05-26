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
        console.error('Failed to open side panel');
        alert('Could not open the download panel. Please try again.');
      }
    });
  });

  // Try to find the like/dislike button container
  if (!forceFallback) {
    const targetContainer = document.querySelector('#top-level-buttons-computed');
    if (targetContainer) {
      const wrapper = document.createElement('div');
      wrapper.className = 'yt-downloader-btn-wrapper';
      wrapper.appendChild(downloadBtn);
      targetContainer.appendChild(wrapper);
      return true;
    }
  }
  // Fallback: Insert below the video player
  const player = document.querySelector('#player');
  if (player) {
    const wrapper = document.createElement('div');
    wrapper.className = 'yt-downloader-btn-wrapper-fallback';
    wrapper.appendChild(downloadBtn);
    player.parentNode.insertBefore(wrapper, player.nextSibling);
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
