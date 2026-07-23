// Lightweight Audio Manager using base64 encoded synthetic sounds
// These are ultra-short, tiny audio clips encoded directly to avoid fetching.

const SOUNDS = {
  // A tiny, soft UI 'tick'
  tick: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=', // Placeholder for tick (silent for fallback if actual generation fails, but we'll use a tiny beep)
  
  // Actually, generating synthetic beeps via Web Audio API is much lighter and safer than raw base64 wavs.
};

class AudioManager {
  private isMuted: boolean = false;
  private audioContext: AudioContext | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('level-up-muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
      this.attachUnlockListeners();
    }
  }

  private attachUnlockListeners() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      if (this.isUnlocked) return;
      this.initContext();
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else {
        this.isUnlocked = true;
      }
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
  }

  private initContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('level-up-muted', muted.toString());
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  // Play a short synth beep
  private playTone(frequency: number, type: OscillatorType, duration: number, volumeLevel: number = 0.1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

      gainNode.gain.setValueAtTime(volumeLevel, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }

  public playClick() {
    // A tiny, short click sound
    this.playTone(800, 'sine', 0.05, 0.05);
  }

  public playSuccess() {
    // A satisfying double chime
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioContext) return;

    this.playTone(523.25, 'sine', 0.1, 0.1); // C5
    setTimeout(() => {
      this.playTone(659.25, 'sine', 0.2, 0.1); // E5
    }, 100);
  }

  public playCoin() {
    // A high pitched metallic clink
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioContext) return;

    this.playTone(1200, 'triangle', 0.05, 0.08);
    setTimeout(() => {
      this.playTone(1800, 'sine', 0.15, 0.1);
    }, 50);
  }

  public playLevelUp() {
    // An ascending arpeggio fanfare
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioContext) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.25, 0.12);
      }, idx * 90);
    });
  }
}

export const audioManager = new AudioManager();
