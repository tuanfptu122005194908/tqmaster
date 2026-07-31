let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore audio errors
  }
};

export const playSound = {
  flip: () => {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      
      // Simulate a quick "whoosh" paper flip sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // Ignore
    }
  },
  click: () => {
    playTone(600, 'sine', 0.05, 0.02);
  },
  correct: () => {
    playTone(523.25, 'sine', 0.1, 0.05);
    setTimeout(() => playTone(659.25, 'sine', 0.2, 0.05), 100);
  },
  incorrect: () => {
    playTone(300, 'triangle', 0.1, 0.05);
    setTimeout(() => playTone(250, 'triangle', 0.2, 0.05), 100);
  },
  success: () => {
    playTone(523.25, 'sine', 0.1, 0.05);
    setTimeout(() => playTone(659.25, 'sine', 0.1, 0.05), 100);
    setTimeout(() => playTone(783.99, 'sine', 0.2, 0.05), 200);
    setTimeout(() => playTone(1046.50, 'sine', 0.4, 0.05), 300);
  }
};
