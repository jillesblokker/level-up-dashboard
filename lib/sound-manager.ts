import { useState, useCallback } from 'react';

// Sound Manager for Medieval Habit Tracker
class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private isEnabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    this.initializeAudioContext();
    this.loadSounds();
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private async loadSounds() {
    if (!this.audioContext) return;

    // Generate procedural sounds instead of loading files
    this.generateSounds();
  }

  private generateSounds() {
    if (!this.audioContext) return;

    // Quest completion sound (coin drop)
    this.sounds.set('questComplete', this.generateCoinSound());
    
    // Level up sound (fanfare)
    this.sounds.set('levelUp', this.generateFanfareSound());
    
    // Button click sound (sword clang)
    this.sounds.set('buttonClick', this.generateSwordSound());
    
    // Achievement unlock sound (magic chime)
    this.sounds.set('achievement', this.generateMagicSound());
    
    // Error sound (dull thud)
    this.sounds.set('error', this.generateErrorSound());
    
    // Success sound (bell chime)
    this.sounds.set('success', this.generateBellSound());
    
    // Hover sound (subtle whoosh)
    this.sounds.set('hover', this.generateWhooshSound());
    
    // Streak sound (fire crackle)
    this.sounds.set('streak', this.generateFireSound());
  }

  private generateCoinSound(): AudioBuffer {
    if (!this.audioContext) return null as any;
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Generate a coin drop sound with multiple frequencies
      const freq1 = 800 * Math.exp(-t * 3);
      const freq2 = 1200 * Math.exp(-t * 4);
      const envelope = Math.exp(-t * 8);
      data[i] = (Math.sin(2 * Math.PI * freq1 * t) + Math.sin(2 * Math.PI * freq2 * t)) * envelope * 0.3;
    }
    
    return buffer;
  }

  private generateFanfareSound(): AudioBuffer {
    if (!this.audioContext) return null as any;
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.0;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Generate a triumphant fanfare
      const freq1 = 523.25; // C5
      const freq2 = 659.25; // E5
      const freq3 = 783.99; // G5
      const envelope = Math.exp(-t * 2) * (1 - Math.exp(-t * 10));
      data[i] = (Math.sin(2 * Math.PI * freq1 * t) + 
                Math.sin(2 * Math.PI * freq2 * t) + 
                Math.sin(2 * Math.PI * freq3 * t)) * envelope * 0.2;
    }
    
    return buffer;
  }

  private generateSwordSound(): AudioBuffer {
    if (!this.audioContext) return null as any;
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.2;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Generate a metallic clang
      const freq = 2000 * Math.exp(-t * 5);
      const envelope = Math.exp(-t * 15);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4;
    }
    
    return buffer;
  }

  private generateMagicSound(): AudioBuffer {
    if (!this.audioContext) return null as any;
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.8;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Generate a magical chime
      const freq1 = 1046.5; // C6
      const freq2 = 1318.5; // E6
      const freq3 = 1568.0; // G6
      const envelope = Math.exp(-t * 1.5) * Math.sin(2 * Math.PI * 2 * t);
      data[i] = (Math.sin(2 * Math.PI * freq1 * t) + 
                Math.sin(2 * Math.PI * freq2 * t) + 
                Math.sin(2 * Math.PI * freq3 * t)) * envelope * 0.25;
    }
    
    return buffer;
  }

  private generateErrorSound(): AudioBuffer {
    if (!this.audioContext) return null as any;
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.4;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Generate a dull error sound
      const freq = 200 * Math.exp(-t * 2);
      const envelope = Math.exp(-t * 8);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
    }
    
    return buffer;
  }

  private generateBellSound(): AudioBuffer {
    if (!this.audioContext) return null as any;
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.6;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Generate a bell chime
      const freq = 880; // A5
      const envelope = Math.exp(-t * 3) * (1 - Math.exp(-t * 20));
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
    }
    
    return buffer;
  }

  private generateWhooshSound(): AudioBuffer {
    if (!this.audioContext) return null as any;
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.1;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Generate a subtle whoosh
      const freq = 1000 * Math.exp(-t * 10);
      const envelope = Math.exp(-t * 20);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.1;
    }
    
    return buffer;
  }

  private generateFireSound(): AudioBuffer {
    if (!this.audioContext) return null as any;
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Generate a fire crackle
      const freq = 300 + Math.random() * 200;
      const envelope = Math.exp(-t * 4);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.2;
    }
    
    return buffer;
  }

  // Play a sound
  async play(soundName: string): Promise<void> {
    if (!this.isEnabled || !this.audioContext || !this.sounds.has(soundName)) {
      return;
    }

    try {
      const buffer = this.sounds.get(soundName);
      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = this.volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  // Enable/disable sounds
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('medieval-sounds-enabled', enabled.toString());
  }

  // Get enabled state
  getEnabled(): boolean {
    return this.isEnabled;
  }

  // Set volume
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('medieval-sounds-volume', this.volume.toString());
  }

  // Get volume
  getVolume(): number {
    return this.volume;
  }

  // Load settings from localStorage
  loadSettings(): void {
    const enabled = localStorage.getItem('medieval-sounds-enabled');
    if (enabled !== null) {
      this.isEnabled = enabled === 'true';
    }

    const volume = localStorage.getItem('medieval-sounds-volume');
    if (volume !== null) {
      this.volume = parseFloat(volume);
    }
  }

  // Save settings to localStorage
  saveSettings(): void {
    localStorage.setItem('medieval-sounds-enabled', this.isEnabled.toString());
    localStorage.setItem('medieval-sounds-volume', this.volume.toString());
  }
}

// Create singleton instance
export const soundManager = new SoundManager();

// Initialize settings
soundManager.loadSettings();

// React hook for sound management
export function useSound() {
  const [isEnabled, setIsEnabled] = useState(soundManager.getEnabled());
  const [volume, setVolume] = useState(soundManager.getVolume());

  const playSound = useCallback(async (soundName: string) => {
    await soundManager.play(soundName);
  }, []);

  const toggleSounds = useCallback(() => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    soundManager.setEnabled(newEnabled);
    soundManager.saveSettings();
  }, [isEnabled]);

  const updateVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    soundManager.setVolume(newVolume);
    soundManager.saveSettings();
  }, []);

  return {
    isEnabled,
    volume,
    playSound,
    toggleSounds,
    updateVolume,
  };
}

// Sound effect constants
export const SOUNDS = {
  QUEST_COMPLETE: 'questComplete',
  LEVEL_UP: 'levelUp',
  BUTTON_CLICK: 'buttonClick',
  ACHIEVEMENT: 'achievement',
  ERROR: 'error',
  SUCCESS: 'success',
  HOVER: 'hover',
  STREAK: 'streak',
} as const;
