/**
 * Sound Manager
 * Provides auditory feedback for stopwatch controls using Web Audio API synthesis
 * with fallback to audio element playback.
 * 100% reliable, zero external dependencies, works offline and in restricted sandboxes.
 */

class SoundManager {
  constructor() {
    this.enabled = true;
    this.audioCtx = null;
  }

  /**
   * Lazily initializes AudioContext on first user interaction to comply with browser autoplay policies.
   */
  getAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Toggles sound on/off.
   * @param {boolean} [enable]
   */
  setEnabled(enable) {
    this.enabled = Boolean(enable);
  }

  /**
   * Plays a synthesized tone with frequency, type, duration, and gain envelope.
   * @param {number} freq Frequency in Hz
   * @param {string} type Oscillator type ('sine', 'triangle', etc.)
   * @param {number} duration Duration in seconds
   * @param {number} [volume=0.15] Peak volume
   */
  playTone(freq, type = 'sine', duration = 0.08, volume = 0.15) {
    if (!this.enabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.debug('[SoundManager] Web Audio playback failed:', e);
    }
  }

  /**
   * Plays a multi-frequency chord or sequence.
   * @param {Array<{freq: number, start: number, duration: number, type?: string, volume?: number}>} notes
   */
  playSequence(notes) {
    if (!this.enabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = note.type || 'sine';
        osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.start);

        const startTime = ctx.currentTime + note.start;
        const endTime = startTime + note.duration;
        const vol = note.volume || 0.12;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(endTime);
      });
    } catch (e) {
      console.debug('[SoundManager] Sequence playback failed:', e);
    }
  }

  /**
   * Sound effect for Start / Resume.
   * Bright, optimistic ascending chime.
   */
  playStart() {
    this.playSequence([
      { freq: 523.25, start: 0, duration: 0.07, type: 'sine', volume: 0.12 }, // C5
      { freq: 659.25, start: 0.06, duration: 0.09, type: 'sine', volume: 0.15 } // E5
    ]);
  }

  /**
   * Sound effect for Pause.
   * Soft descending tone.
   */
  playPause() {
    this.playSequence([
      { freq: 587.33, start: 0, duration: 0.07, type: 'triangle', volume: 0.12 }, // D5
      { freq: 440.0, start: 0.05, duration: 0.08, type: 'triangle', volume: 0.10 } // A4
    ]);
  }

  /**
   * Sound effect for Stop.
   * Confident completion chime.
   */
  playStop() {
    this.playSequence([
      { freq: 440.0, start: 0, duration: 0.07, type: 'sine', volume: 0.12 },
      { freq: 554.37, start: 0.06, duration: 0.08, type: 'sine', volume: 0.14 },
      { freq: 659.25, start: 0.12, duration: 0.14, type: 'sine', volume: 0.16 }
    ]);
  }

  /**
   * Sound effect for Reset.
   * Subtle low sweep.
   */
  playReset() {
    this.playSequence([
      { freq: 350.0, start: 0, duration: 0.06, type: 'triangle', volume: 0.10 },
      { freq: 220.0, start: 0.04, duration: 0.09, type: 'triangle', volume: 0.08 }
    ]);
  }

  /**
   * Sound effect for Lap recording.
   * Crisp short metallic click.
   */
  playLap() {
    this.playTone(880, 'sine', 0.05, 0.12);
  }

  /**
   * Generic subtle UI click.
   */
  playClick() {
    this.playTone(600, 'sine', 0.03, 0.08);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundManager;
} else if (typeof window !== 'undefined') {
  window.SoundManager = SoundManager;
}

