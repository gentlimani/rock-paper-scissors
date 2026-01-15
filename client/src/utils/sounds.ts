// Retro sound effects using Web Audio API
let audioContext: AudioContext | null = null;
let musicPlaying = false;
let musicNodes: { oscillators: OscillatorNode[]; gains: GainNode[]; intervalId: number | null } = {
  oscillators: [],
  gains: [],
  intervalId: null
};

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

// Retro background music generator
const retroMelody = [
  // Catchy 8-bit game loop (frequencies in Hz)
  { note: 330, dur: 0.15 },  // E4
  { note: 330, dur: 0.15 },  // E4
  { note: 0, dur: 0.15 },    // rest
  { note: 330, dur: 0.15 },  // E4
  { note: 0, dur: 0.15 },    // rest
  { note: 262, dur: 0.15 },  // C4
  { note: 330, dur: 0.3 },   // E4
  { note: 392, dur: 0.3 },   // G4
  { note: 0, dur: 0.3 },     // rest
  { note: 196, dur: 0.3 },   // G3
  { note: 0, dur: 0.3 },     // rest
  { note: 262, dur: 0.3 },   // C4
  { note: 0, dur: 0.15 },    // rest
  { note: 196, dur: 0.3 },   // G3
  { note: 0, dur: 0.15 },    // rest
  { note: 165, dur: 0.3 },   // E3
  { note: 0, dur: 0.15 },    // rest
  { note: 220, dur: 0.3 },   // A3
  { note: 247, dur: 0.3 },   // B3
  { note: 233, dur: 0.15 },  // Bb3
  { note: 220, dur: 0.3 },   // A3
  { note: 196, dur: 0.2 },   // G3
  { note: 330, dur: 0.2 },   // E4
  { note: 392, dur: 0.2 },   // G4
  { note: 440, dur: 0.3 },   // A4
  { note: 349, dur: 0.15 },  // F4
  { note: 392, dur: 0.15 },  // G4
  { note: 0, dur: 0.15 },    // rest
  { note: 330, dur: 0.3 },   // E4
  { note: 262, dur: 0.15 },  // C4
  { note: 294, dur: 0.15 },  // D4
  { note: 247, dur: 0.3 },   // B3
];

const bassLine = [
  { note: 131, dur: 0.3 },   // C3
  { note: 131, dur: 0.3 },   // C3
  { note: 165, dur: 0.3 },   // E3
  { note: 165, dur: 0.3 },   // E3
  { note: 147, dur: 0.3 },   // D3
  { note: 147, dur: 0.3 },   // D3
  { note: 196, dur: 0.3 },   // G3
  { note: 196, dur: 0.3 },   // G3
];

let melodyIndex = 0;
let bassIndex = 0;

const playMusicNote = (frequency: number, duration: number, type: OscillatorType, volume: number) => {
  if (!musicPlaying || frequency === 0) return;
  
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    // Softer attack for background music
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio not supported or blocked
  }
};

const startMusicLoop = () => {
  if (musicNodes.intervalId) return;
  
  const bpm = 140;
  const beatInterval = (60 / bpm) * 1000 * 0.5; // 16th notes
  
  let beatCount = 0;
  
  musicNodes.intervalId = window.setInterval(() => {
    if (!musicPlaying) return;
    
    // Play melody note
    const melodyNote = retroMelody[melodyIndex];
    if (melodyNote.note > 0) {
      playMusicNote(melodyNote.note, melodyNote.dur, 'square', 0.08);
    }
    melodyIndex = (melodyIndex + 1) % retroMelody.length;
    
    // Play bass every 4 beats
    if (beatCount % 4 === 0) {
      const bassNote = bassLine[bassIndex];
      playMusicNote(bassNote.note, bassNote.dur, 'triangle', 0.06);
      bassIndex = (bassIndex + 1) % bassLine.length;
    }
    
    // Add subtle percussion every 2 beats
    if (beatCount % 2 === 0) {
      playMusicNote(80, 0.05, 'square', 0.03);
    }
    
    beatCount++;
  }, beatInterval);
};

// Music controls
export const music = {
  start: () => {
    if (musicPlaying) return;
    
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      musicPlaying = true;
      melodyIndex = 0;
      bassIndex = 0;
      startMusicLoop();
    } catch (e) {
      // Audio not supported
    }
  },
  
  stop: () => {
    musicPlaying = false;
    
    if (musicNodes.intervalId) {
      clearInterval(musicNodes.intervalId);
      musicNodes.intervalId = null;
    }
    
    melodyIndex = 0;
    bassIndex = 0;
  },
  
  isPlaying: () => musicPlaying,
  
  toggle: () => {
    if (musicPlaying) {
      music.stop();
    } else {
      music.start();
    }
    return musicPlaying;
  }
};

export default sounds;
