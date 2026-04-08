function getCtx() {
  return new (window.AudioContext || window.webkitAudioContext)();
}

function playNote(ctx, freq, startOffset, duration, volume = 0.55) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);

  gain.gain.setValueAtTime(0, ctx.currentTime + startOffset);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startOffset + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);

  osc.start(ctx.currentTime + startOffset);
  osc.stop(ctx.currentTime + startOffset + duration + 0.05);
}

// Satisfying 4-note ascending fanfare — C5 E5 G5 C6
export function playAlarm() {
  try {
    const ctx = getCtx();
    const notes = [
      { freq: 523.25, offset: 0.0,  dur: 0.55 },  // C5
      { freq: 659.25, offset: 0.35, dur: 0.55 },  // E5
      { freq: 783.99, offset: 0.70, dur: 0.55 },  // G5
      { freq: 1046.5, offset: 1.05, dur: 1.1  },  // C6 — held longer
    ];
    notes.forEach(({ freq, offset, dur }) => playNote(ctx, freq, offset, dur, 0.5));
  } catch {
    // Web Audio not supported — fail silently
  }
}

// Gentle two-note chime for 5-minute warning — A4 then E5
export function playFiveMinuteWarning() {
  try {
    const ctx = getCtx();
    playNote(ctx, 440.0,  0.0,  0.9, 0.3); // A4 — soft
    playNote(ctx, 659.25, 0.55, 0.9, 0.3); // E5 — soft
  } catch {
    // Web Audio not supported — fail silently
  }
}
