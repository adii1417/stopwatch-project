/**
 * Background Service Worker (Manifest V3)
 * Manages extension badge, handles background updates, and keeps toolbar state synced.
 */

const BADGE_CONFIG = {
  running: { text: '▶', color: '#10B981' },
  paused: { text: '⏸', color: '#F59E0B' },
  stopped: { text: '■', color: '#EF4444' },
  idle: { text: '', color: '#000000' }
};

/**
 * Updates the extension badge text and background color.
 * @param {string} status 'idle' | 'running' | 'paused' | 'stopped'
 */
function updateBadge(status) {
  if (typeof chrome === 'undefined' || !chrome.action) return;

  const config = BADGE_CONFIG[status] || BADGE_CONFIG.idle;

  try {
    chrome.action.setBadgeText({ text: config.text });
    if (config.color) {
      chrome.action.setBadgeBackgroundColor({ color: config.color });
    }
  } catch (err) {
    console.debug('[Background] Error setting badge:', err);
  }
}

// On install or startup, sync badge with stored state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['personalized_stopwatch_state'], (result) => {
    const state = result?.personalized_stopwatch_state;
    if (state && state.status) {
      updateBadge(state.status);
    } else {
      updateBadge('idle');
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['personalized_stopwatch_state'], (result) => {
    const state = result?.personalized_stopwatch_state;
    if (state && state.status) {
      updateBadge(state.status);
    }
  });
});

// Listen for storage changes from popup
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.personalized_stopwatch_state) {
    const newState = changes.personalized_stopwatch_state.newValue;
    if (newState && newState.status) {
      updateBadge(newState.status);
    } else {
      updateBadge('idle');
    }
  }
});

