const fs = require('fs');
const path = require('path');

// Create audio directory if it doesn't exist
const audioDir = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Function to generate more musical WAV files
function generateMusicalWAV(filename, config) {
  const { 
    melody = [440], 
    duration = 1.0, 
    sampleRate = 44100,
    volume = 0.5,
    tempo = 120,
    style = 'ambient'
  } = config;
  
  const samples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + samples * 2);
  
  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40);
  
  // Generate musical audio
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    
    // Calculate which note to play based on melody and tempo
    const beatTime = t * (tempo / 60);
    const noteIndex = Math.floor(beatTime * 4) % melody.length;
    const noteFreq = melody[noteIndex];
    
    if (noteFreq > 0) {
      // Generate more musical waveform
      let wave = 0;
      
      if (style === 'ambient') {
        // Soft, ambient sound
        wave = Math.sin(2 * Math.PI * noteFreq * t) * 0.7;
        wave += Math.sin(2 * Math.PI * noteFreq * 1.5 * t) * 0.3;
        wave += Math.sin(2 * Math.PI * noteFreq * 2 * t) * 0.1;
      } else if (style === 'battle') {
        // Sharp, aggressive sound
        wave = Math.sin(2 * Math.PI * noteFreq * t);
        wave += Math.sin(2 * Math.PI * noteFreq * 2 * t) * 0.5;
        wave += Math.sin(2 * Math.PI * noteFreq * 3 * t) * 0.2;
      } else if (style === 'mystical') {
        // Ethereal, magical sound
        wave = Math.sin(2 * Math.PI * noteFreq * t) * 0.8;
        wave += Math.sin(2 * Math.PI * noteFreq * 1.25 * t) * 0.4;
        wave += Math.sin(2 * Math.PI * noteFreq * 1.75 * t) * 0.2;
      } else if (style === 'epic') {
        // Grand, cinematic sound
        wave = Math.sin(2 * Math.PI * noteFreq * t) * 0.6;
        wave += Math.sin(2 * Math.PI * noteFreq * 2 * t) * 0.4;
        wave += Math.sin(2 * Math.PI * noteFreq * 3 * t) * 0.3;
        wave += Math.sin(2 * Math.PI * noteFreq * 4 * t) * 0.1;
      } else if (style === 'sfx') {
        // Simple, clean sound effect
        wave = Math.sin(2 * Math.PI * noteFreq * t);
      }
      
      // Apply envelope (fade in/out)
      let envelope = 1.0;
      const fadeTime = 0.1;
      if (t < fadeTime) {
        envelope = t / fadeTime;
      } else if (t > duration - fadeTime) {
        envelope = (duration - t) / fadeTime;
      }
      
      // Apply volume and envelope
      sample = wave * envelope * volume;
    }
    
    // Clamp sample
    sample = Math.max(-1, Math.min(1, sample));
    
    const amplitude = Math.floor(sample * 32767);
    buffer.writeInt16LE(amplitude, 44 + i * 2);
  }
  
  fs.writeFileSync(path.join(audioDir, filename), buffer);
  console.log(`Created ${filename} with ${melody.length} notes in ${style} style`);
}

// Define musical scales and melodies
const scales = {
  major: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25], // C major
  minor: [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25], // C minor
  pentatonic: [261.63, 293.66, 329.63, 392.00, 440.00], // C pentatonic
  dorian: [261.63, 293.66, 311.13, 349.23, 392.00, 440.00, 466.16, 523.25], // C dorian
  phrygian: [261.63, 277.18, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25] // C phrygian
};

// Generate medieval-themed audio files
const audioConfigs = [
  // Music tracks - longer, more musical
  {
    name: 'medieval-ambient.wav',
    config: {
      melody: [scales.dorian[0], scales.dorian[2], scales.dorian[4], scales.dorian[6], scales.dorian[4], scales.dorian[2]],
      duration: 4.0,
      volume: 0.3,
      tempo: 60,
      style: 'ambient'
    }
  },
  {
    name: 'medieval-battle.wav',
    config: {
      melody: [scales.phrygian[0], scales.phrygian[1], scales.phrygian[2], scales.phrygian[3], scales.phrygian[2], scales.phrygian[1]],
      duration: 3.0,
      volume: 0.5,
      tempo: 140,
      style: 'battle'
    }
  },
  {
    name: 'medieval-village.wav',
    config: {
      melody: [scales.major[0], scales.major[2], scales.major[4], scales.major[5], scales.major[4], scales.major[2]],
      duration: 3.5,
      volume: 0.3,
      tempo: 80,
      style: 'ambient'
    }
  },
  {
    name: 'medieval-castle.wav',
    config: {
      melody: [scales.dorian[0], scales.dorian[2], scales.dorian[4], scales.dorian[6], scales.dorian[7], scales.dorian[6], scales.dorian[4]],
      duration: 4.5,
      volume: 0.4,
      tempo: 70,
      style: 'epic'
    }
  },
  {
    name: 'medieval-forest.wav',
    config: {
      melody: [scales.pentatonic[0], scales.pentatonic[1], scales.pentatonic[2], scales.pentatonic[3], scales.pentatonic[4], scales.pentatonic[3], scales.pentatonic[2]],
      duration: 3.2,
      volume: 0.25,
      tempo: 90,
      style: 'ambient'
    }
  },
  {
    name: 'medieval-tavern.wav',
    config: {
      melody: [scales.major[0], scales.major[1], scales.major[2], scales.major[3], scales.major[2], scales.major[1]],
      duration: 2.8,
      volume: 0.35,
      tempo: 100,
      style: 'ambient'
    }
  },
  {
    name: 'medieval-mystical.wav',
    config: {
      melody: [scales.dorian[0], scales.dorian[2], scales.dorian[4], scales.dorian[6], scales.dorian[4], scales.dorian[2], scales.dorian[0]],
      duration: 4.0,
      volume: 0.3,
      tempo: 50,
      style: 'mystical'
    }
  },
  {
    name: 'medieval-epic.wav',
    config: {
      melody: [scales.major[0], scales.major[2], scales.major[4], scales.major[6], scales.major[7], scales.major[6], scales.major[4], scales.major[2]],
      duration: 5.0,
      volume: 0.5,
      tempo: 120,
      style: 'epic'
    }
  },
  {
    name: 'medieval-calm.wav',
    config: {
      melody: [scales.pentatonic[0], scales.pentatonic[2], scales.pentatonic[4], scales.pentatonic[2]],
      duration: 2.5,
      volume: 0.2,
      tempo: 60,
      style: 'ambient'
    }
  },
  {
    name: 'medieval-adventure.wav',
    config: {
      melody: [scales.dorian[0], scales.dorian[1], scales.dorian[2], scales.dorian[3], scales.dorian[4], scales.dorian[3], scales.dorian[2], scales.dorian[1]],
      duration: 3.8,
      volume: 0.4,
      tempo: 110,
      style: 'epic'
    }
  },
  
  // Sound effects - shorter, more musical
  {
    name: 'quest-complete.wav',
    config: {
      melody: [scales.major[0], scales.major[2], scales.major[4], scales.major[6]],
      duration: 1.0,
      volume: 0.6,
      tempo: 200,
      style: 'sfx'
    }
  },
  {
    name: 'level-up.wav',
    config: {
      melody: [scales.major[0], scales.major[2], scales.major[4], scales.major[6], scales.major[7]],
      duration: 1.5,
      volume: 0.7,
      tempo: 180,
      style: 'epic'
    }
  },
  {
    name: 'gold-earned.wav',
    config: {
      melody: [scales.major[2], scales.major[4], scales.major[6]],
      duration: 0.5,
      volume: 0.5,
      tempo: 240,
      style: 'sfx'
    }
  },
  {
    name: 'xp-earned.wav',
    config: {
      melody: [scales.major[4], scales.major[6], scales.major[7]],
      duration: 0.4,
      volume: 0.5,
      tempo: 300,
      style: 'sfx'
    }
  },
  {
    name: 'button-click.wav',
    config: {
      melody: [scales.major[6]],
      duration: 0.1,
      volume: 0.3,
      tempo: 400,
      style: 'sfx'
    }
  },
  {
    name: 'sword-clash.wav',
    config: {
      melody: [scales.phrygian[0], scales.phrygian[2], scales.phrygian[0]],
      duration: 0.8,
      volume: 0.7,
      tempo: 150,
      style: 'battle'
    }
  },
  {
    name: 'magic-spell.wav',
    config: {
      melody: [scales.dorian[0], scales.dorian[2], scales.dorian[4], scales.dorian[6], scales.dorian[4], scales.dorian[2]],
      duration: 1.2,
      volume: 0.6,
      tempo: 120,
      style: 'mystical'
    }
  },
  {
    name: 'door-open.wav',
    config: {
      melody: [scales.major[0], scales.major[1], scales.major[2]],
      duration: 1.0,
      volume: 0.4,
      tempo: 100,
      style: 'sfx'
    }
  },
  {
    name: 'chest-open.wav',
    config: {
      melody: [scales.major[2], scales.major[4], scales.major[6]],
      duration: 0.7,
      volume: 0.5,
      tempo: 150,
      style: 'sfx'
    }
  },
  {
    name: 'achievement-unlock.wav',
    config: {
      melody: [scales.major[0], scales.major[2], scales.major[4], scales.major[6], scales.major[7], scales.major[6], scales.major[4]],
      duration: 2.0,
      volume: 0.8,
      tempo: 160,
      style: 'epic'
    }
  }
];

console.log('Creating musical medieval audio files...');

audioConfigs.forEach(file => {
  generateMusicalWAV(file.name, file.config);
});

console.log('Musical audio generation complete!');
console.log('🎵 Music tracks: Melodic sequences with medieval scales');
console.log('🔊 Sound effects: Musical tones instead of harsh beeps');
