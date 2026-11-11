/**
 * Storage Abstraction Layer
 * Encapsulates chrome.storage.local operations with fallback to localStorage.
 * Ensures consistent persistence, error handling, and cross-tab/background synchronization.
 */

const STORAGE_KEYS = {
  STOPWATCH_STATE: 'personalized_stopwatch_state',
  SETTINGS: 'personalized_stopwatch_settings',
  HISTORY: 'personalized_stopwatch_history'
};

const DEFAULT_SETTINGS = {
  theme: 'dark', // 'dark' | 'light'
  soundEnabled: true,
  defaultSessionTag: 'DSA Problem',
  showMilliseconds: true,
  autoSaveSession: true
};

const DEFAULT_STATE = {
  status: 'idle', // 'idle' | 'running' | 'paused' | 'stopped'
  startTime: null,
  accumulatedTime: 0,
  laps: [],
  sessionStartTime: null,
  sessionEndTime: null,
  sessionTag: 'DSA Problem',
  sessionTitle: ''
};

class StorageManager {
  /**
   * Detects if chrome.storage.local is available in current context.
   */
  static isChromeStorageAvailable() {
    return (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local &&
      typeof chrome.storage.local.get === 'function'
    );
  }

  /**
   * Retrieves an item from chrome.storage.local or localStorage fallback.
   * @param {string} key
   * @param {*} defaultValue
   * @returns {Promise<*>}
   */
  static async get(key, defaultValue = null) {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        try {
          chrome.storage.local.get([key], (result) => {
            if (chrome.runtime && chrome.runtime.lastError) {
              console.warn(`[StorageManager] chrome.storage error:`, chrome.runtime.lastError);
              resolve(defaultValue);
            } else if (result && result[key] !== undefined) {
              resolve(result[key]);
            } else {
              resolve(defaultValue);
            }
          });
        } catch (err) {
          console.warn(`[StorageManager] Exception reading chrome.storage:`, err);
          resolve(defaultValue);
        }
      });
    }

    // LocalStorage Fallback (e.g. testing in browser or Node mock)
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : defaultValue;
      }
    } catch (e) {
      console.warn(`[StorageManager] localStorage fallback read error:`, e);
    }
    return defaultValue;
  }

  /**
   * Stores an item to chrome.storage.local or localStorage fallback.
   * @param {string} key
   * @param {*} value
   * @returns {Promise<boolean>}
   */
  static async set(key, value) {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        try {
          chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime && chrome.runtime.lastError) {
              console.warn(`[StorageManager] chrome.storage set error:`, chrome.runtime.lastError);
              resolve(false);
            } else {
              resolve(true);
            }
          });
        } catch (err) {
          console.warn(`[StorageManager] Exception writing chrome.storage:`, err);
          resolve(false);
        }
      });
    }

    // LocalStorage Fallback
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      }
    } catch (e) {
      console.warn(`[StorageManager] localStorage fallback write error:`, e);
    }
    return false;
  }

  /**
   * Loads the current stopwatch state.
   * @returns {Promise<Object>}
   */
  static async getStopwatchState() {
    const state = await this.get(STORAGE_KEYS.STOPWATCH_STATE, DEFAULT_STATE);
    return { ...DEFAULT_STATE, ...(state || {}) };
  }

  /**
   * Saves the stopwatch state.
   * @param {Object} state
   * @returns {Promise<boolean>}
   */
  static async saveStopwatchState(state) {
    return this.set(STORAGE_KEYS.STOPWATCH_STATE, state);
  }

  /**
   * Loads user settings.
   * @returns {Promise<Object>}
   */
  static async getSettings() {
    const settings = await this.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...(settings || {}) };
  }

  /**
   * Saves user settings.
   * @param {Object} settings
   * @returns {Promise<boolean>}
   */
  static async saveSettings(settings) {
    return this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  /**
   * Loads completed session history (limited to latest 50 for performance).
   * @returns {Promise<Array>}
   */
  static async getHistory() {
    const history = await this.get(STORAGE_KEYS.HISTORY, []);
    return Array.isArray(history) ? history : [];
  }

  /**
   * Adds a completed session to history.
   * @param {Object} session
   * @returns {Promise<boolean>}
   */
  static async addHistoryItem(session) {
    try {
      const history = await this.getHistory();
      // Add to front, keep max 50 entries
      const updated = [session, ...history].slice(0, 50);
      return await this.set(STORAGE_KEYS.HISTORY, updated);
    } catch (e) {
      console.warn('[StorageManager] Failed to add history item:', e);
      return false;
    }
  }

  /**
   * Clears session history.
   * @returns {Promise<boolean>}
   */
  static async clearHistory() {
    return this.set(STORAGE_KEYS.HISTORY, []);
  }

  /**
   * Registers a listener for storage changes.
   * @param {Function} callback
   */
  static onStorageChange(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
          callback(changes);
        }
      });
    }
  }
}

// Export for Node testing or browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    StorageManager,
    STORAGE_KEYS,
    DEFAULT_SETTINGS,
    DEFAULT_STATE
  };
} else if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
  window.STORAGE_KEYS = STORAGE_KEYS;
  window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  window.DEFAULT_STATE = DEFAULT_STATE;
}

