/**
 * Asset Generator
 * Generates valid standard PCM WAV sound files and PNG extension icons (16, 32, 48, 128)
 * using only Node.js standard libraries (fs, path, zlib).
 * Zero external dependencies.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure target directories exist
const soundsDir = path.join(__dirname, '..', 'assets', 'sounds');
const iconsDir = path.join(__dirname, '..', 'assets', 'icons');
fs.mkdirSync(soundsDir, { recursive: true });
fs.mkdirSync(iconsDir, { recursive: true });

// ==========================================
// 1. WAV AUDIO GENERATOR
// ==========================================

function createWavBuffer(sampleRate, durationSec, generateSampleFn) {
  const numChannels = 1; // Mono
  const bytesPerSample = 2; // 16-bit
  const totalSamples = Math.floor(sampleRate * durationSec);
  const dataByteLength = totalSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataByteLength);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataByteLength, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // audio format (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // block align
  buffer.writeUInt16LE(bytesPerSample * 8, 34); // bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataByteLength, 40);

  // Fill audio samples
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const sampleVal = Math.max(-1, Math.min(1, generateSampleFn(t, durationSec, i)));
    const intVal = Math.floor(sampleVal * 32767);
    buffer.writeInt16LE(intVal, 44 + i * 2);
  }

  return buffer;
}

// Generate sound effects
console.log('Generating sound files...');

// Start chime (Upbeat double chime 523Hz -> 659Hz)
const startWav = createWavBuffer(44100, 0.18, (t, dur) => {
  const env = Math.exp(-t * 15);
  const freq = t < 0.08 ? 523.25 : 659.25;
  return Math.sin(2 * Math.PI * freq * t) * env * 0.4;
});
fs.writeFileSync(path.join(soundsDir, 'start.wav'), startWav);

// Pause chime (Soft descending 587Hz -> 440Hz)
const pauseWav = createWavBuffer(44100, 0.16, (t, dur) => {
  const env = Math.exp(-t * 18);
  const freq = t < 0.07 ? 587.33 : 440.0;
  return Math.sin(2 * Math.PI * freq * t) * env * 0.35;
});
fs.writeFileSync(path.join(soundsDir, 'pause.wav'), pauseWav);

// Stop chime (3-note finish 440Hz -> 554Hz -> 659Hz)
const stopWav = createWavBuffer(44100, 0.28, (t, dur) => {
  let freq = 440.0;
  let localT = t;
  if (t >= 0.16) {
    freq = 659.25;
    localT = t - 0.16;
  } else if (t >= 0.08) {
    freq = 554.37;
    localT = t - 0.08;
  }
  const env = Math.exp(-localT * 12);
  return Math.sin(2 * Math.PI * freq * t) * env * 0.4;
});
fs.writeFileSync(path.join(soundsDir, 'stop.wav'), stopWav);

// Reset tone (Low quick sweep 350Hz -> 200Hz)
const resetWav = createWavBuffer(44100, 0.14, (t, dur) => {
  const env = Math.exp(-t * 22);
  const freq = 350 - (t / dur) * 150;
  return Math.sin(2 * Math.PI * freq * t) * env * 0.3;
});
fs.writeFileSync(path.join(soundsDir, 'reset.wav'), resetWav);

// Click tone (Micro mechanical click)
const clickWav = createWavBuffer(44100, 0.05, (t, dur) => {
  const env = Math.exp(-t * 60);
  return Math.sin(2 * Math.PI * 900 * t) * env * 0.3;
});
fs.writeFileSync(path.join(soundsDir, 'click.wav'), clickWav);

console.log('Audio files generated successfully.');

// ==========================================
// 2. SVG AND PNG ICON GENERATOR
// ==========================================

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="50%" stop-color="#06B6D4"/>
      <stop offset="100%" stop-color="#6366F1"/>
    </linearGradient>
    <linearGradient id="handGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#34D399"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Base squircle background -->
  <rect x="24" y="24" width="464" height="464" rx="100" fill="url(#bgGrad)" stroke="#334155" stroke-width="8"/>

  <!-- Top Crown button -->
  <rect x="232" y="58" width="48" height="40" rx="8" fill="#64748B"/>
  <rect x="216" y="44" width="80" height="20" rx="6" fill="#94A3B8"/>

  <!-- Top-right lap pusher button -->
  <rect x="360" y="85" width="40" height="18" rx="6" fill="#64748B" transform="rotate(38 360 85)"/>

  <!-- Outer Glowing Ring -->
  <circle cx="256" cy="276" r="150" stroke="url(#ringGrad)" stroke-width="20" stroke-linecap="round" stroke-dasharray="720 200" filter="url(#glow)"/>

  <!-- Inner Dark Dial Face -->
  <circle cx="256" cy="276" r="132" fill="#0B1120" stroke="#1E293B" stroke-width="4"/>

  <!-- Dial Tick Marks -->
  <line x1="256" y1="156" x2="256" y2="174" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
  <line x1="256" y1="378" x2="256" y2="396" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
  <line x1="136" y1="276" x2="154" y2="276" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
  <line x1="358" y1="276" x2="376" y2="276" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>

  <!-- Dynamic Active Stopwatch Hand (Pointing to ~2 o'clock, 55 degrees) -->
  <line x1="256" y1="276" x2="328" y2="174" stroke="url(#handGrad)" stroke-width="9" stroke-linecap="round"/>

  <!-- Center Pin with emerald core -->
  <circle cx="256" cy="276" r="16" fill="#10B981"/>
  <circle cx="256" cy="276" r="7" fill="#FFFFFF"/>

  <!-- Mini digital badge text at bottom -->
  <rect x="216" y="325" width="80" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="2"/>
  <text x="256" y="343" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#10B981" text-anchor="middle" letter-spacing="1">00:00</text>
</svg>
`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);

// Pure Node.js PNG encoder
function createPng(width, height, pixelFn) {
  // CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcBuf = Buffer.alloc(4 + len);
    buf.copy(crcBuf, 0, 4, 8 + len);
    buf.writeUInt32BE(crc32(crcBuf), 8 + len);
    return buf;
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image scanlines
  const rawScanlines = Buffer.alloc(height * (width * 4 + 1));
  let pos = 0;
  for (let y = 0; y < height; y++) {
    rawScanlines[pos++] = 0; // Filter byte: None
    for (let x = 0; x < width; x++) {
      const rgba = pixelFn(x / (width - 1), y / (height - 1), x, y, width, height);
      rawScanlines[pos++] = rgba[0];
      rawScanlines[pos++] = rgba[1];
      rawScanlines[pos++] = rgba[2];
      rawScanlines[pos++] = rgba[3];
    }
  }

  const compressedData = zlib.deflateSync(rawScanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Pixel shader for the stopwatch icon
function renderStopwatchPixel(u, v, x, y, size) {
  // Center is (0.5, 0.55) to account for top crown
  const cx = 0.5;
  const cy = 0.54;
  const dx = u - cx;
  const dy = v - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background rounded rectangle
  const pad = 0.04;
  const radius = 0.22;
  const qx = Math.abs(u - 0.5) - (0.5 - pad - radius);
  const qy = Math.abs(v - 0.5) - (0.5 - pad - radius);
  const boxDist = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;

  if (boxDist > 0.02) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  // Antialias factor for outer squircle edge
  const alphaOuter = Math.min(1, Math.max(0, 1 - boxDist * 30));

  // Top crown button
  const isCrown = Math.abs(u - 0.5) < 0.09 && v >= 0.08 && v <= 0.17;
  const isCrownHead = Math.abs(u - 0.5) < 0.13 && v >= 0.06 && v <= 0.10;
  if (isCrown || isCrownHead) {
    return [148, 163, 184, Math.floor(255 * alphaOuter)];
  }

  // Top-right pusher
  const px = u - 0.74;
  const py = v - 0.22;
  const pDist = Math.sqrt(px * px + py * py);
  if (pDist < 0.065) {
    return [100, 116, 139, Math.floor(255 * alphaOuter)];
  }

  // Outer ring (radius ~ 0.33)
  const ringInner = 0.28;
  const ringOuter = 0.34;
  if (dist >= ringInner && dist <= ringOuter) {
    // Gradient between emerald (#10B981) and cyan (#06B6D4)
    const angle = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI);
    const r = Math.floor(16 + angle * (6 - 16));
    const g = Math.floor(185 + angle * (182 - 185));
    const b = Math.floor(129 + angle * (212 - 129));
    return [r, g, b, Math.floor(255 * alphaOuter)];
  }

  // Dial face (dist < ringInner)
  if (dist < ringInner) {
    // Center point & needle
    // Needle angle ~ -40 deg (pointing towards top right ~ 2 o'clock)
    const angle = Math.atan2(dy, dx);
    const targetAngle = -0.7; // ~ -40 deg
    let angleDiff = Math.abs(angle - targetAngle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

    // Needle check
    if (dist > 0.03 && dist < 0.25 && angleDiff < 0.14) {
      return [16, 185, 129, Math.floor(255 * alphaOuter)]; // Emerald needle
    }

    // Center pin
    if (dist < 0.045) {
      if (dist < 0.02) {
        return [255, 255, 255, Math.floor(255 * alphaOuter)];
      }
      return [16, 185, 129, Math.floor(255 * alphaOuter)];
    }

    // Tick marks at cardinal directions
    const isTick =
      (Math.abs(dx) < 0.015 && (Math.abs(dy) > 0.21 && Math.abs(dy) < 0.26)) ||
      (Math.abs(dy) < 0.015 && (Math.abs(dx) > 0.21 && Math.abs(dx) < 0.26));
    if (isTick) {
      return [148, 163, 184, Math.floor(200 * alphaOuter)];
    }

    // Dial background
    return [11, 17, 32, Math.floor(255 * alphaOuter)];
  }

  // Outer container gradient (#0F172A to #1E293B)
  const bgR = Math.floor(15 + v * 15);
  const bgG = Math.floor(23 + v * 18);
  const bgB = Math.floor(42 + v * 17);
  return [bgR, bgG, bgB, Math.floor(255 * alphaOuter)];
}

const sizes = [16, 32, 48, 128];
console.log('Generating PNG icons...');
sizes.forEach((sz) => {
  const pngBuf = createPng(sz, sz, (u, v, x, y, w, h) => renderStopwatchPixel(u, v, x, y, sz));
  fs.writeFileSync(path.join(iconsDir, `icon${sz}.png`), pngBuf);
  console.log(`Generated icon${sz}.png (${sz}x${sz})`);
});

console.log('All icons and sounds successfully generated!');

