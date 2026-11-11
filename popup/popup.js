/**
 * Personalized Stopwatch - Popup Controller
 * Coordinates UI, timing engine, audio, and persistent storage.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Instantiate Core Modules
  const stopwatch = new StopwatchEngine();
  const sound = new SoundManager();

  // 2. DOM Elements Cache
  const htmlRoot = document.documentElement;
  const displayContainer = document.getElementById('display-container');
  const hoursBlock = document.getElementById('hours-block');
  const displayHours = document.getElementById('display-hours');
  const displayMinutes = document.getElementById('display-minutes');
  const displaySeconds = document.getElementById('display-seconds');
  const displayCentiseconds = document.getElementById('display-centiseconds');

  const statusPill = document.getElementById('status-pill');
  const statusLabel = document.getElementById('status-label');

  const sessionTagSelect = document.getElementById('session-tag');
  const sessionTitleInput = document.getElementById('session-title');

  const btnStart = document.getElementById('btn-start');
  const btnStartLabel = document.getElementById('btn-start-label');
  const btnPause = document.getElementById('btn-pause');
  const btnStop = document.getElementById('btn-stop');
  const btnLap = document.getElementById('btn-lap');
  const btnReset = document.getElementById('btn-reset');

  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const iconSoundOn = btnSoundToggle.querySelector('.icon-sound-on');
  const iconSoundOff = btnSoundToggle.querySelector('.icon-sound-off');

  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const iconMoon = btnThemeToggle.querySelector('.icon-moon');
  const iconSun = btnThemeToggle.querySelector('.icon-sun');

  const btnLapsToggle = document.getElementById('btn-laps-toggle');
  const lapsCounterBadge = document.getElementById('laps-counter-badge');
  const currentLapPreview = document.getElementById('current-lap-preview');
  const previewLapNum = document.getElementById('preview-lap-num');
  const previewLapTime = document.getElementById('preview-lap-time');

  const lapsPanel = document.getElementById('laps-panel');
  const btnCloseLaps = document.getElementById('btn-close-laps');
  const lapsList = document.getElementById('laps-list');

  const btnSettingsToggle = document.getElementById('btn-settings-toggle');
  const settingsPanel = document.getElementById('settings-panel');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const settingSound = document.getElementById('setting-sound');
  const settingTheme = document.getElementById('setting-theme');
  const historyList = document.getElementById('history-list');
  const btnClearHistory = document.getElementById('btn-clear-history');

  // Animation frame / timer handle
  let animationFrameId = null;

  // 3. Load Saved Settings & State
  const [settings, savedState] = await Promise.all([
    StorageManager.getSettings(),
    StorageManager.getStopwatchState()
  ]);

  // Apply Settings
  applyTheme(settings.theme || 'dark');
  applySoundPreference(Boolean(settings.soundEnabled));

  // Initialize Stopwatch State
  stopwatch.loadFromJSON(savedState);

  if (stopwatch.sessionTag) {
    sessionTagSelect.value = stopwatch.sessionTag;
  }
  if (stopwatch.sessionTitle) {
    sessionTitleInput.value = stopwatch.sessionTitle;
  }

  // Render initial time IMMEDIATELY to prevent any flicker
  renderTime();
  updateUIState();
  renderLapsList();

  // If already running when opened, start tick loop immediately
  if (stopwatch.status === 'running') {
    startVisualTick();
  }

  // 4. Visual Tick Loop (60 FPS via requestAnimationFrame with timestamp check)
  function startVisualTick() {
    stopVisualTick();
    document.body.classList.add('is-running');

    function tick() {
      if (stopwatch.status === 'running') {
        renderTime();
        animationFrameId = requestAnimationFrame(tick);
      }
    }
    animationFrameId = requestAnimationFrame(tick);
  }

  function stopVisualTick() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    document.body.classList.remove('is-running');
  }

  // 5. Time Rendering
  function renderTime() {
    const elapsed = stopwatch.getElapsedTime();
    const formatted = StopwatchEngine.formatTime(elapsed);

    // Beyond 60 minutes handling: show hours if hours > 0
    if (formatted.hasHours) {
      hoursBlock.classList.remove('hidden');
      displayHours.textContent = formatted.hStr;
    } else {
      hoursBlock.classList.add('hidden');
    }

    displayMinutes.textContent = formatted.mStr;
    displaySeconds.textContent = formatted.sStr;
    displayCentiseconds.textContent = formatted.csStr;

    // Update live lap preview if laps exist
    if (stopwatch.laps.length > 0) {
      const lastLap = stopwatch.laps[stopwatch.laps.length - 1];
      const currentLapSplit = Math.max(0, elapsed - lastLap.overallTime);
      const splitFormatted = StopwatchEngine.formatTime(currentLapSplit);

      currentLapPreview.classList.remove('hidden');
      previewLapNum.textContent = stopwatch.laps.length + 1;
      previewLapTime.textContent = `+${splitFormatted.formatted}`;
    } else {
      currentLapPreview.classList.add('hidden');
    }
  }

  // 6. UI Status & Button States
  function updateUIState() {
    const status = stopwatch.status;

    // Reset status pill classes
    statusPill.className = 'status-pill';
    statusPill.classList.add(`status-${status}`);

    switch (status) {
      case 'idle':
        statusLabel.textContent = 'READY';
        btnStart.disabled = false;
        btnStartLabel.textContent = 'Start';
        btnPause.disabled = true;
        btnStop.disabled = true;
        btnLap.disabled = true;
        btnReset.disabled = true;
        break;

      case 'running':
        statusLabel.textContent = 'RUNNING';
        btnStart.disabled = true;
        btnPause.disabled = false;
        btnStop.disabled = false;
        btnLap.disabled = false;
        btnReset.disabled = true;
        break;

      case 'paused':
        statusLabel.textContent = 'PAUSED';
        btnStart.disabled = false;
        btnStartLabel.textContent = 'Resume';
        btnPause.disabled = true;
        btnStop.disabled = false;
        btnLap.disabled = true;
        btnReset.disabled = false;
        break;

      case 'stopped':
        statusLabel.textContent = 'STOPPED';
        btnStart.disabled = true;
        btnPause.disabled = true;
        btnStop.disabled = true;
        btnLap.disabled = true;
        btnReset.disabled = false;
        break;
    }

    // Update laps badge
    if (stopwatch.laps.length > 0) {
      lapsCounterBadge.textContent = stopwatch.laps.length;
      lapsCounterBadge.classList.remove('hidden');
    } else {
      lapsCounterBadge.classList.add('hidden');
    }
  }

  // 7. Actions & Event Handlers

  // Start / Resume
  async function handleStart() {
    if (stopwatch.status === 'running') return;

    sound.playStart();
    stopwatch.start();
    await StorageManager.saveStopwatchState(stopwatch.toJSON());

    updateUIState();
    startVisualTick();
  }

  // Pause
  async function handlePause() {
    if (stopwatch.status !== 'running') return;

    sound.playPause();
    stopwatch.pause();
    stopVisualTick();
    renderTime(); // Freeze at exact paused time

    await StorageManager.saveStopwatchState(stopwatch.toJSON());
    updateUIState();
  }

  // Stop
  async function handleStop() {
    if (stopwatch.status === 'idle' || stopwatch.status === 'stopped') return;

    sound.playStop();
    const finalElapsed = stopwatch.getElapsedTime();
    stopwatch.stop();
    stopVisualTick();
    renderTime();

    // Save session to history
    const sessionRecord = {
      id: Date.now(),
      tag: stopwatch.sessionTag || 'DSA Problem',
      title: stopwatch.sessionTitle || 'Untitled Session',
      durationMs: finalElapsed,
      formattedDuration: StopwatchEngine.formatTime(finalElapsed).formatted,
      lapsCount: stopwatch.laps.length,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    await Promise.all([
      StorageManager.saveStopwatchState(stopwatch.toJSON()),
      StorageManager.addHistoryItem(sessionRecord)
    ]);

    updateUIState();
    if (!settingsPanel.classList.contains('hidden')) {
      renderHistoryList();
    }
  }

  // Reset
  async function handleReset() {
    sound.playReset();
    stopwatch.reset();
    stopVisualTick();
    renderTime();

    await StorageManager.saveStopwatchState(stopwatch.toJSON());
    updateUIState();
    renderLapsList();
  }

  // Record Lap
  async function handleLap() {
    if (stopwatch.status !== 'running') return;

    sound.playLap();
    stopwatch.recordLap();

    await StorageManager.saveStopwatchState(stopwatch.toJSON());
    updateUIState();
    renderLapsList();
  }

  // Button Listeners
  btnStart.addEventListener('click', handleStart);
  btnPause.addEventListener('click', handlePause);
  btnStop.addEventListener('click', handleStop);
  btnReset.addEventListener('click', handleReset);
  btnLap.addEventListener('click', handleLap);

  // Session Tag & Title Listeners
  sessionTagSelect.addEventListener('change', async () => {
    sound.playClick();
    stopwatch.setSessionMetadata(sessionTagSelect.value, sessionTitleInput.value.trim());
    await StorageManager.saveStopwatchState(stopwatch.toJSON());
  });

  sessionTitleInput.addEventListener('input', async () => {
    stopwatch.setSessionMetadata(sessionTagSelect.value, sessionTitleInput.value.trim());
    await StorageManager.saveStopwatchState(stopwatch.toJSON());
  });

  // Sound Toggle Listener
  function applySoundPreference(enabled) {
    sound.setEnabled(enabled);
    settingSound.checked = enabled;
    if (enabled) {
      iconSoundOn.classList.remove('hidden');
      iconSoundOff.classList.add('hidden');
    } else {
      iconSoundOn.classList.add('hidden');
      iconSoundOff.classList.remove('hidden');
    }
  }

  btnSoundToggle.addEventListener('click', async () => {
    const newState = !sound.enabled;
    applySoundPreference(newState);
    if (newState) sound.playClick();
    await StorageManager.saveSettings({ ...settings, soundEnabled: newState });
    settings.soundEnabled = newState;
  });

  settingSound.addEventListener('change', async () => {
    const newState = settingSound.checked;
    applySoundPreference(newState);
    if (newState) sound.playClick();
    await StorageManager.saveSettings({ ...settings, soundEnabled: newState });
    settings.soundEnabled = newState;
  });

  // Theme Toggle Listener
  function applyTheme(theme) {
    htmlRoot.setAttribute('data-theme', theme);
    settingTheme.checked = theme === 'dark';
    if (theme === 'dark') {
      iconMoon.classList.remove('hidden');
      iconSun.classList.add('hidden');
    } else {
      iconMoon.classList.add('hidden');
      iconSun.classList.remove('hidden');
    }
  }

  async function toggleTheme() {
    const currentTheme = htmlRoot.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    sound.playClick();
    await StorageManager.saveSettings({ ...settings, theme: nextTheme });
    settings.theme = nextTheme;
  }

  btnThemeToggle.addEventListener('click', toggleTheme);
  settingTheme.addEventListener('change', toggleTheme);

  // Laps Panel Drawer
  btnLapsToggle.addEventListener('click', () => {
    sound.playClick();
    renderLapsList();
    lapsPanel.classList.toggle('hidden');
    settingsPanel.classList.add('hidden');
  });

  btnCloseLaps.addEventListener('click', () => {
    sound.playClick();
    lapsPanel.classList.add('hidden');
  });

  function renderLapsList() {
    if (stopwatch.laps.length === 0) {
      lapsList.innerHTML = `<div class="empty-state">No laps recorded yet. Press "Lap" while running.</div>`;
      return;
    }

    // Determine fastest and slowest laps if 2+ laps exist
    let minLapTime = Infinity;
    let maxLapTime = -Infinity;
    if (stopwatch.laps.length >= 2) {
      stopwatch.laps.forEach((l) => {
        if (l.lapTime < minLapTime) minLapTime = l.lapTime;
        if (l.lapTime > maxLapTime) maxLapTime = l.lapTime;
      });
    }

    // Render in reverse chronological order (newest lap first)
    const itemsHtml = [...stopwatch.laps].reverse().map((lap) => {
      let badgeHtml = '';
      if (stopwatch.laps.length >= 2) {
        if (lap.lapTime === minLapTime) {
          badgeHtml = `<span class="lap-badge lap-badge-fastest">Fastest</span>`;
        } else if (lap.lapTime === maxLapTime) {
          badgeHtml = `<span class="lap-badge lap-badge-slowest">Slowest</span>`;
        }
      }

      return `
        <div class="lap-item">
          <span class="lap-item-num">Lap ${lap.lapNumber}</span>
          <span class="lap-item-split">+${lap.formattedLap}</span>
          <span class="lap-item-overall">${lap.formattedOverall}</span>
          ${badgeHtml}
        </div>
      `;
    }).join('');

    lapsList.innerHTML = itemsHtml;
  }

  // Settings Panel Drawer
  btnSettingsToggle.addEventListener('click', async () => {
    sound.playClick();
    await renderHistoryList();
    settingsPanel.classList.toggle('hidden');
    lapsPanel.classList.add('hidden');
  });

  btnCloseSettings.addEventListener('click', () => {
    sound.playClick();
    settingsPanel.classList.add('hidden');
  });

  async function renderHistoryList() {
    const history = await StorageManager.getHistory();
    if (!history || history.length === 0) {
      historyList.innerHTML = `<div class="empty-state">No saved sessions yet. Stop a session to save it.</div>`;
      return;
    }

    historyList.innerHTML = history.map((item) => `
      <div class="history-item">
        <div class="history-item-top">
          <span class="history-item-tag">${escapeHtml(item.tag)}</span>
          <span class="history-item-time">${escapeHtml(item.formattedDuration)}</span>
        </div>
        <div class="history-item-title">${escapeHtml(item.title || 'Untitled Session')}</div>
        <div class="history-item-date">${escapeHtml(item.dateStr || '')} • ${item.lapsCount || 0} laps</div>
      </div>
    `).join('');
  }

  btnClearHistory.addEventListener('click', async () => {
    if (confirm('Clear all session history?')) {
      sound.playClick();
      await StorageManager.clearHistory();
      await renderHistoryList();
    }
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 8. Keyboard Accessibility (Space, S, R, L, T)
  window.addEventListener('keydown', (e) => {
    // If typing in input, don't trigger hotkeys
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      return;
    }

    const key = e.key.toLowerCase();

    if (e.code === 'Space') {
      e.preventDefault();
      if (stopwatch.status === 'running') {
        handlePause();
      } else if (stopwatch.status === 'idle' || stopwatch.status === 'paused') {
        handleStart();
      }
    } else if (key === 's') {
      e.preventDefault();
      if (stopwatch.status === 'running' || stopwatch.status === 'paused') {
        handleStop();
      }
    } else if (key === 'r') {
      e.preventDefault();
      if (stopwatch.status === 'paused' || stopwatch.status === 'stopped') {
        handleReset();
      }
    } else if (key === 'l') {
      e.preventDefault();
      if (stopwatch.status === 'running') {
        handleLap();
      }
    } else if (key === 't') {
      e.preventDefault();
      toggleTheme();
    } else if (e.key === 'Escape') {
      lapsPanel.classList.add('hidden');
      settingsPanel.classList.add('hidden');
    }
  });
});

