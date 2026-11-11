# Personalized Stopwatch ⏱️

> A high-precision, persistent digital stopwatch built for Google Chrome and Brave. Designed specifically for students, software engineers, and competitive programmers timing DSA challenges, LeetCode drills, aptitude questions, and focus sessions.

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](#)
[![Chrome & Brave](https://img.shields.io/badge/Compatibility-Chrome%20%7C%20Brave-blue.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen.svg)](#)

---

## 📌 Problem Statement

Standard online stopwatches and phone timers often fail or disrupt a developer's workflow:
1. **Context Switching:** Switching tabs or picking up a phone breaks focus while solving data structure & algorithm problems.
2. **Tab Throttling & Popup Loss:** Typical browser extensions rely on an active `setInterval` in the popup window. The moment you close the popup or switch tabs, the browser pauses execution or resets the timer to zero.
3. **Lack of Problem Context:** Generic timers do not let you annotate what problem or topic you are working on, making it hard to track time-to-solution across attempts.

**Personalized Stopwatch** solves this by living right in your browser toolbar, calculating elapsed time strictly through **hardware timestamps** and persisting state across popup closures, tab switches, and browser restarts.

---

## ✨ Key Features

- **Accurate Persistent Timing:**
  - Uses absolute Unix epoch timestamps (`startTime` + `accumulatedTime`) stored in `chrome.storage.local`.
  - Timer continues counting seamlessly when the popup is closed or the browser is restarted.
  - Zero timer drift or popup freezing.

- **High-Precision Display:**
  - Clean `MM:SS.CS` (Minutes : Seconds . Centiseconds) chronometer readout.
  - **Dynamic Beyond-60-Minute Support:** Automatically expands to `HH:MM:SS.CS` for multi-hour contest simulations without layout jitter or digit clipping.
  - Monospaced tabular numerals prevent width jumping.

- **DSA & Problem Solving Personalization:**
  - Quick Category selector: *DSA Problem*, *LeetCode Drill*, *Aptitude Test*, *Coding Contest*, *System Design*, or *Study Focus*.
  - Inline problem title & note field (e.g. *#42 Trapping Rain Water*) that persists with your timer.

- **Lap Splits & Chronometer Milestones:**
  - Record intermediate test cases, sub-problems, or laps with split and cumulative times.
  - Automated detection of **Fastest** (emerald badge) and **Slowest** (amber badge) splits.

- **Audio Feedback & Micro-Interactions:**
  - Latency-free synthesized audio feedback using the Web Audio API (with graceful fallback).
  - Distinct tones for *Start/Resume*, *Pause*, *Stop*, *Lap*, and *Reset*.
  - Instant one-click sound mute toggle in header.

- **Live Browser Toolbar Badge:**
  - Background Service Worker updates the extension toolbar badge with live status icons (`▶` running, `⏸` paused, `■` stopped) so you can monitor state without opening the popup.

- **Themes & UI Polish:**
  - Modern, dark theme by default with emerald, cyan, and indigo glowing accents.
  - Instant Light Theme switcher with crisp contrast.
  - Compact ~340px responsive popup engineered to fit cleanly on all screen resolutions.

- **Keyboard Accessibility:**
  - `[Space]` — Start / Pause
  - `[S]` — Stop session
  - `[R]` — Reset timer
  - `[L]` — Record Lap
  - `[T]` — Toggle Dark / Light Theme
  - `[Esc]` — Dismiss drawer panels

---

## 🛠️ Technology Stack

- **HTML5:** Semantic, accessible layout with inline vector SVGs.
- **CSS3:** Custom properties (CSS variables), responsive flexbox/grid layout, smooth cubic-bezier transitions, and dark/light mode themes.
- **Vanilla JavaScript (ES6+):** Pure, modular JavaScript with zero external frameworks or runtime dependencies.
- **Chrome Extension Manifest V3:** Compliant with modern Chromium extension standards.
- **Chrome Storage API (`chrome.storage.local`):** Robust asynchronous storage with fallback.
- **Web Audio API:** Zero-asset synthesized acoustic feedback.

---

## 📁 Project Folder Structure

```
Personalized-Stopwatch/
├── manifest.json            # Extension configuration (Manifest V3)
├── popup/
│   ├── popup.html          # Popup layout and semantic markup
│   ├── popup.css           # Styling, themes, animations & tabular typography
│   └── popup.js            # Controller connecting UI, engine, and storage
├── scripts/
│   ├── stopwatch.js        # Core decoupled timing engine and mathematical formatting
│   ├── storage.js          # chrome.storage.local abstraction layer with fallbacks
│   ├── sound.js            # Web Audio API acoustic synthesizer
│   ├── background.js       # Manifest V3 service worker for toolbar badge updates
│   └── generate_assets.js  # Build utility for icons & audio files
├── assets/
│   ├── icons/
│   │   ├── icon.svg        # Scalable master vector icon
│   │   ├── icon16.png      # 16x16 toolbar icon
│   │   ├── icon32.png      # 32x32 high-DPI display icon
│   │   ├── icon48.png      # 48x48 extension management icon
│   │   └── icon128.png     # 128x128 store & installation icon
│   └── sounds/
│       ├── start.wav       # Start chime
│       ├── pause.wav       # Pause tone
│       ├── stop.wav        # Completion chime
│       ├── reset.wav       # Reset sweep
│       └── click.wav       # UI tick
├── LICENSE                 # MIT License
└── README.md               # Documentation
```

---

## 🚀 Installation Instructions

### Loading in Google Chrome

1. Open Google Chrome.
2. In the URL address bar, navigate to:
   ```
   chrome://extensions
   ```
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click the **Load unpacked** button in the top-left toolbar.
5. In the file picker dialog, select the project directory:
   ```
   C:\Users\aditi\Music\watch_yourself
   ```
6. The **Personalized Stopwatch** extension will appear in your extensions list.
7. Click the **Extensions puzzle piece icon** in the Chrome toolbar and pin **Personalized Stopwatch** for 1-click access.

---

### Loading in Brave Browser

1. Open Brave Browser.
2. In the URL address bar, navigate to:
   ```
   brave://extensions
   ```
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click the **Load unpacked** button.
5. Select the project directory (`C:\Users\aditi\Music\watch_yourself`).
6. Pin the extension to your Brave toolbar.

---

## 🎯 How to Use

1. **Start Timing:**
   - Click the extension icon in your browser toolbar to open the popup.
   - (Optional) Select a category (e.g., *DSA Problem*) and enter a problem title (e.g., *#15 3Sum*).
   - Click the green **Start** button or press `[Space]`.
2. **Work Without Distraction:**
   - Close the popup! The stopwatch will continue counting in the background.
   - The toolbar icon displays a live green `▶` badge indicating it is active.
3. **Record Laps / Sub-tasks:**
   - Click **Lap** (or press `[L]`) to mark milestones (e.g., approach planning, code drafting, testcase debugging).
4. **Pause / Stop:**
   - Click **Pause** (or `[Space]`) to take a break.
   - Click **Stop** (or `[S]`) when you submit your solution. The session is automatically archived into your Recent Sessions history.
5. **Review History & Settings:**
   - Click the gear icon to inspect previous sessions, clear history, or customize sound/theme settings.

---

## 🧪 Verification & Automated Testing

The codebase includes an automated test suite verifying all 10 project requirements:

```bash
# Run automated test suite
node scratch/run_tests.js
```

### Verified Test Cases:
- [x] **Test 1:** Initial idle state and zero-clock verification.
- [x] **Test 2:** Timestamp delta calculations across simulated runs.
- [x] **Test 3:** Pausing, accumulated time freezing, and resumption.
- [x] **Test 4:** Stop session and state locking.
- [x] **Test 5:** Reset clears counters and returns to 00:00.00.
- [x] **Test 6:** Popup closure simulation: timing continues accurately with popup closed.
- [x] **Test 7:** Pause persistence across popup closures.
- [x] **Test 8:** Browser restart simulation with complete process resurrection.
- [x] **Test 9:** `MM:SS.CS` formatting under 60 minutes and `HH:MM:SS.CS` beyond 60 minutes.
- [x] **Test 10:** Lap split calculations and fastest/slowest lap detection.
- [x] **Test 11:** Chrome Storage abstraction layer and error resilience.
- [x] **Test 12:** Manifest V3 schema validity and asset integrity.

---

## 🔮 Future Improvements

- [ ] Export session history to CSV / Markdown for problem-solving logs.
- [ ] LeetCode / Codeforces active tab title auto-detection.
- [ ] Daily time analytics chart showing total DSA practice hours.
- [ ] Customizable countdown timer mode (Pomodoro drill).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

