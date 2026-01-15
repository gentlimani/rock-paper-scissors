// Retro sound effects using Web Audio API
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Play a beep sound with customizable frequency and duration
const playTone = (frequency: number, duration: number, type: OscillatorType = 'square', volume: number = 0.3) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio not supported or blocked
  }
};

// Play a sequence of tones
const playSequence = (notes: { freq: number; dur: number }[], delay: number = 0) => {
  notes.forEach((note, i) => {
    setTimeout(() => playTone(note.freq, note.dur), delay + i * 100);
  });
};

// Sound effects
export const sounds = {
  // Button click / select
  click: () => {
    playTone(800, 0.05, 'square', 0.2);
  },
  
  // Move selected / locked in
  select: () => {
    playSequence([
      { freq: 400, dur: 0.08 },
      { freq: 600, dur: 0.08 },
    ]);
  },
  
  // Countdown beep
  countdown: () => {
    playTone(440, 0.1, 'square', 0.25);
  },
  
  // Reveal sound
  reveal: () => {
    playSequence([
      { freq: 300, dur: 0.05 },
      { freq: 400, dur: 0.05 },
      { freq: 500, dur: 0.05 },
      { freq: 600, dur: 0.1 },
    ]);
  },
  
  // Round win
  roundWin: () => {
    playSequence([
      { freq: 523, dur: 0.1 },
      { freq: 659, dur: 0.1 },
      { freq: 784, dur: 0.15 },
    ]);
  },
  
  // Round lose
  roundLose: () => {
    playSequence([
      { freq: 400, dur: 0.15 },
      { freq: 300, dur: 0.2 },
    ]);
  },
  
  // Tie
  tie: () => {
    playSequence([
      { freq: 440, dur: 0.1 },
      { freq: 440, dur: 0.1 },
    ]);
  },
  
  // Game win (best of 3)
  gameWin: () => {
    playSequence([
      { freq: 523, dur: 0.1 },
      { freq: 659, dur: 0.1 },
      { freq: 784, dur: 0.1 },
      { freq: 1047, dur: 0.3 },
    ]);
    setTimeout(() => {
      playSequence([
        { freq: 784, dur: 0.1 },
        { freq: 1047, dur: 0.3 },
      ]);
    }, 400);
  },
  
  // Game lose
  gameLose: () => {
    playSequence([
      { freq: 392, dur: 0.15 },
      { freq: 349, dur: 0.15 },
      { freq: 330, dur: 0.15 },
      { freq: 262, dur: 0.4 },
    ]);
  },
  
  // Match found
  matchFound: () => {
    playSequence([
      { freq: 600, dur: 0.08 },
      { freq: 800, dur: 0.08 },
      { freq: 1000, dur: 0.12 },
    ]);
  },
  
  // Opponent left
  opponentLeft: () => {
    playSequence([
      { freq: 500, dur: 0.1 },
      { freq: 350, dur: 0.2 },
    ]);
  },
  
  // Error / invalid
  error: () => {
    playTone(200, 0.15, 'sawtooth', 0.2);
  },
};

export default sounds;
