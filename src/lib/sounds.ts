// Lightweight synthesized sound effects using Web Audio API

const getAudioContext = (() => {
  let ctx: AudioContext | null = null;
  return () => {
    if (!ctx) ctx = new AudioContext();
    return ctx;
  };
})();

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playFlipSound() {
  playTone(600, 0.15, 'sine', 0.25);
  setTimeout(() => playTone(900, 0.1, 'sine', 0.2), 80);
}

export function playAwardSound() {
  playTone(523, 0.12, 'triangle', 0.3);
  setTimeout(() => playTone(659, 0.12, 'triangle', 0.3), 100);
  setTimeout(() => playTone(784, 0.2, 'triangle', 0.3), 200);
}

export function playDiscardSound() {
  playTone(400, 0.2, 'sawtooth', 0.15);
  setTimeout(() => playTone(300, 0.25, 'sawtooth', 0.1), 100);
}

export function playGameOverSound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'triangle', 0.25), i * 150);
  });
}
