/**
 * Stopwatch Engine
 * Core timing and state calculation logic.
 * Decoupled from UI and storage for testability and accuracy.
 */

class StopwatchEngine {
  constructor(initialState = {}) {
    this.status = initialState.status || 'idle'; // 'idle' | 'running' | 'paused' | 'stopped'
    this.startTime = initialState.startTime || null; // timestamp (ms) when current run segment started
    this.accumulatedTime = initialState.accumulatedTime || 0; // accumulated ms from previous run segments
    this.laps = Array.isArray(initialState.laps) ? [...initialState.laps] : [];
    this.sessionStartTime = initialState.sessionStartTime || null;
    this.sessionEndTime = initialState.sessionEndTime || null;
    this.sessionTag = initialState.sessionTag || 'DSA Problem';
    this.sessionTitle = initialState.sessionTitle || '';
  }

  /**
   * Calculates the exact elapsed time in milliseconds.
   * Uses timestamps rather than interval counters for 100% accuracy across popup closures.
   * @param {number} [now=Date.now()] Optional timestamp override (useful for testing)
   * @returns {number} Elapsed milliseconds
   */
  getElapsedTime(now = Date.now()) {
    if (this.status === 'running' && this.startTime) {
      return this.accumulatedTime + Math.max(0, now - this.startTime);
    }
    return this.accumulatedTime;
  }

  /**
   * Starts or resumes the stopwatch.
   * @param {number} [now=Date.now()]
   * @returns {boolean} Whether state changed
   */
  start(now = Date.now()) {
    if (this.status === 'running') {
      return false;
    }

    if (this.status === 'idle' || this.status === 'stopped') {
      this.accumulatedTime = 0;
      this.laps = [];
      this.sessionStartTime = now;
      this.sessionEndTime = null;
    }

    this.startTime = now;
    this.status = 'running';
    return true;
  }

  /**
   * Pauses the stopwatch, preserving accumulated time.
   * @param {number} [now=Date.now()]
   * @returns {boolean} Whether state changed
   */
  pause(now = Date.now()) {
    if (this.status !== 'running') {
      return false;
    }

    if (this.startTime) {
      this.accumulatedTime += Math.max(0, now - this.startTime);
    }
    this.startTime = null;
    this.status = 'paused';
    return true;
  }

  /**
   * Stops the stopwatch and records end timestamp.
   * @param {number} [now=Date.now()]
   * @returns {boolean} Whether state changed
   */
  stop(now = Date.now()) {
    if (this.status === 'idle' || this.status === 'stopped') {
      return false;
    }

    if (this.status === 'running' && this.startTime) {
      this.accumulatedTime += Math.max(0, now - this.startTime);
    }

    this.startTime = null;
    this.status = 'stopped';
    this.sessionEndTime = now;
    return true;
  }

  /**
   * Clears the stopwatch back to 00:00.00 idle state.
   */
  reset() {
    this.status = 'idle';
    this.startTime = null;
    this.accumulatedTime = 0;
    this.laps = [];
    this.sessionStartTime = null;
    this.sessionEndTime = null;
  }

  /**
   * Records a lap split.
   * @param {number} [now=Date.now()]
   * @returns {Object|null} The recorded lap object or null if not running/paused
   */
  recordLap(now = Date.now()) {
    if (this.status !== 'running' && this.status !== 'paused') {
      return null;
    }

    const overallTime = this.getElapsedTime(now);
    const lastLapOverall = this.laps.length > 0 ? this.laps[this.laps.length - 1].overallTime : 0;
    const lapTime = Math.max(0, overallTime - lastLapOverall);

    const lap = {
      lapNumber: this.laps.length + 1,
      lapTime,
      overallTime,
      timestamp: now,
      formattedLap: StopwatchEngine.formatTime(lapTime).formatted,
      formattedOverall: StopwatchEngine.formatTime(overallTime).formatted
    };

    this.laps.push(lap);
    return lap;
  }

  /**
   * Sets session metadata (e.g. "DSA Problem", "LeetCode #15")
   * @param {string} tag
   * @param {string} title
   */
  setSessionMetadata(tag, title) {
    if (tag) this.sessionTag = tag;
    if (title !== undefined) this.sessionTitle = title;
  }

  /**
   * Exports the complete state as a plain serializable object for chrome.storage.local.
   * @returns {Object}
   */
  toJSON() {
    return {
      status: this.status,
      startTime: this.startTime,
      accumulatedTime: this.accumulatedTime,
      laps: this.laps,
      sessionStartTime: this.sessionStartTime,
      sessionEndTime: this.sessionEndTime,
      sessionTag: this.sessionTag,
      sessionTitle: this.sessionTitle
    };
  }

  /**
   * Loads state from a stored object.
   * @param {Object} data
   */
  loadFromJSON(data) {
    if (!data) return;
    this.status = data.status || 'idle';
    this.startTime = data.startTime || null;
    this.accumulatedTime = typeof data.accumulatedTime === 'number' ? data.accumulatedTime : 0;
    this.laps = Array.isArray(data.laps) ? [...data.laps] : [];
    this.sessionStartTime = data.sessionStartTime || null;
    this.sessionEndTime = data.sessionEndTime || null;
    this.sessionTag = data.sessionTag || 'DSA Problem';
    this.sessionTitle = data.sessionTitle || '';
  }

  /**
   * Formats milliseconds into high-precision stopwatch components.
   * Format: MM:SS.CS (or HH:MM:SS.CS when >= 60 minutes)
   * Where:
   * - MM = Minutes
   * - SS = Seconds
   * - CS = Centiseconds (hundredths of a second, 00-99)
   *
   * @param {number} ms Total milliseconds
   * @returns {Object} Formatted strings and numeric breakdown
   */
  static formatTime(ms) {
    const safeMs = Math.max(0, Math.floor(ms || 0));

    // Centiseconds: 1 centisecond = 10ms (100 centiseconds per second)
    const centiseconds = Math.floor((safeMs % 1000) / 10);
    const totalSeconds = Math.floor(safeMs / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    const pad = (num, digits = 2) => String(num).padStart(digits, '0');

    const csStr = pad(centiseconds, 2);
    const sStr = pad(seconds, 2);
    const mStr = pad(minutes, 2);
    const hStr = pad(hours, 2);
    const totalMStr = pad(totalMinutes, 2);

    const hasHours = hours > 0;

    // Default requested format: MM:SS.CS
    // When >= 60 minutes: HH:MM:SS.CS seamlessly supports extended durations
    const standardFormat = hasHours
      ? `${hStr}:${mStr}:${sStr}.${csStr}`
      : `${mStr}:${sStr}.${csStr}`;

    // Total minutes format (e.g. 75:23.45)
    const totalMinutesFormat = `${totalMStr}:${sStr}.${csStr}`;

    return {
      hours,
      minutes,
      seconds,
      centiseconds,
      totalMinutes,
      hStr,
      mStr,
      sStr,
      csStr,
      totalMStr,
      hasHours,
      formatted: standardFormat,
      totalMinutesFormatted: totalMinutesFormat
    };
  }
}

// Export for Node testing or browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StopwatchEngine;
} else if (typeof window !== 'undefined') {
  window.StopwatchEngine = StopwatchEngine;
}

