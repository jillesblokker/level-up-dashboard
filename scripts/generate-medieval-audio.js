const fs = require('fs');
const path = require('path');

// Create audio directory if it doesn't exist
const audioDir = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Function to generate a more complex WAV file with multiple tones and effects
function generateMedievalWAV(filename, config) {
  const { 
    frequencies = [440], 
    duration = 1.0, 
    sampleRate = 44100,
    volume = 0.5,
    fadeIn = 0.1,
    fadeOut = 0.1,
    vibrato = 0,
    reverb = 0
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
  
  // Generate complex audio
  for (let i = 0; i < samples; i++) {
    let sample = 0;
    const t = i / sampleRate;
    
    // Add multiple frequencies for richer sound
    frequencies.forEach((freq, index) => {
      let frequency = freq;
      
      // Add vibrato effect
      if (vibrato > 0) {
        frequency += Math.sin(t * vibrato * 2 * Math.PI) * freq * 0.1;
      }
      
      // Generate wave with harmonics
      let wave = Math.sin(2 * Math.PI * frequency * t);
      
      // Add harmonics for richer sound
      if (index === 0) {
        wave += 0.3 * Math.sin(2 * Math.PI * frequency * 2 * t); // Octave
        wave += 0.1 * Math.sin(2 * Math.PI * frequency * 3 * t); // Fifth
      }
      
      // Apply envelope (fade in/out)
      let envelope = 1.0;
      if (t < fadeIn) {
        envelope = t / fadeIn;
      } else if (t > duration - fadeOut) {
        envelope = (duration - t) / fadeOut;
      }
      
      sample += wave * envelope * (volume / frequencies.length);
    });
    
    // Add reverb effect (simple echo)
    if (reverb > 0 && i > sampleRate * 0.1) {
      const echoIndex = i - Math.floor(sampleRate * 0.1);
      if (echoIndex >= 0 && echoIndex < samples) {
        const echoSample = buffer.readInt16LE(44 + echoIndex * 2);
        sample += echoSample * reverb * 0.3;
      }
    }
    
    // Clamp sample to prevent distortion
    sample = Math.max(-1, Math.min(1, sample));
    
    const amplitude = Math.floor(sample * 32767);
    buffer.writeInt16LE(amplitude, 44 + i * 2);
  }
  
  fs.writeFileSync(path.join(audioDir, filename), buffer);
  console.log(`Created ${filename} with ${frequencies.length} frequencies`);
}

// Generate medieval-themed audio files
const audioConfigs = [
  // Music tracks - longer, more complex
  {
    name: 'medieval-ambient.wav',
    config: {
      frequencies: [220, 330, 440],
      duration: 3.0,
      volume: 0.4,
      fadeIn: 0.5,
      fadeOut: 0.5,
      vibrato: 2,
      reverb: 0.3
    }
  },
  {
    name: 'medieval-battle.wav',
    config: {
      frequencies: [110, 220, 440, 880],
      duration: 2.5,
      volume: 0.6,
      fadeIn: 0.2,
      fadeOut: 0.3,
      vibrato: 5,
      reverb: 0.2
    }
  },
  {
    name: 'medieval-village.wav',
    config: {
      frequencies: [330, 440, 550],
      duration: 2.8,
      volume: 0.3,
      fadeIn: 0.3,
      fadeOut: 0.4,
      vibrato: 1,
      reverb: 0.4
    }
  },
  {
    name: 'medieval-castle.wav',
    config: {
      frequencies: [165, 220, 330, 440],
      duration: 3.2,
      volume: 0.5,
      fadeIn: 0.6,
      fadeOut: 0.6,
      vibrato: 0.5,
      reverb: 0.5
    }
  },
  {
    name: 'medieval-forest.wav',
    config: {
      frequencies: [220, 330],
      duration: 2.6,
      volume: 0.3,
      fadeIn: 0.4,
      fadeOut: 0.4,
      vibrato: 3,
      reverb: 0.6
    }
  },
  {
    name: 'medieval-tavern.wav',
    config: {
      frequencies: [330, 440, 660],
      duration: 2.4,
      volume: 0.4,
      fadeIn: 0.2,
      fadeOut: 0.3,
      vibrato: 4,
      reverb: 0.3
    }
  },
  {
    name: 'medieval-mystical.wav',
    config: {
      frequencies: [440, 660, 880, 1320],
      duration: 3.5,
      volume: 0.4,
      fadeIn: 0.8,
      fadeOut: 0.8,
      vibrato: 1.5,
      reverb: 0.7
    }
  },
  {
    name: 'medieval-epic.wav',
    config: {
      frequencies: [110, 165, 220, 330, 440],
      duration: 4.0,
      volume: 0.6,
      fadeIn: 1.0,
      fadeOut: 1.0,
      vibrato: 0.8,
      reverb: 0.4
    }
  },
  {
    name: 'medieval-calm.wav',
    config: {
      frequencies: [220, 330],
      duration: 2.0,
      volume: 0.2,
      fadeIn: 0.5,
      fadeOut: 0.5,
      vibrato: 0.5,
      reverb: 0.8
    }
  },
  {
    name: 'medieval-adventure.wav',
    config: {
      frequencies: [330, 440, 550, 660],
      duration: 2.8,
      volume: 0.5,
      fadeIn: 0.3,
      fadeOut: 0.4,
      vibrato: 2.5,
      reverb: 0.3
    }
  },
  
  // Sound effects - shorter, more distinctive
  {
    name: 'quest-complete.wav',
    config: {
      frequencies: [440, 660, 880, 1320],
      duration: 0.8,
      volume: 0.7,
      fadeIn: 0.05,
      fadeOut: 0.2,
      vibrato: 0,
      reverb: 0.2
    }
  },
  {
    name: 'level-up.wav',
    config: {
      frequencies: [220, 330, 440, 660, 880, 1320],
      duration: 1.2,
      volume: 0.8,
      fadeIn: 0.1,
      fadeOut: 0.3,
      vibrato: 0,
      reverb: 0.3
    }
  },
  {
    name: 'gold-earned.wav',
    config: {
      frequencies: [660, 880, 1320],
      duration: 0.4,
      volume: 0.6,
      fadeIn: 0.02,
      fadeOut: 0.1,
      vibrato: 0,
      reverb: 0.1
    }
  },
  {
    name: 'xp-earned.wav',
    config: {
      frequencies: [880, 1320, 1760],
      duration: 0.3,
      volume: 0.6,
      fadeIn: 0.02,
      fadeOut: 0.08,
      vibrato: 0,
      reverb: 0.1
    }
  },
  {
    name: 'button-click.wav',
    config: {
      frequencies: [2200, 3300],
      duration: 0.1,
      volume: 0.4,
      fadeIn: 0.01,
      fadeOut: 0.02,
      vibrato: 0,
      reverb: 0
    }
  },
  {
    name: 'sword-clash.wav',
    config: {
      frequencies: [220, 330, 440, 660],
      duration: 0.6,
      volume: 0.8,
      fadeIn: 0.05,
      fadeOut: 0.2,
      vibrato: 0,
      reverb: 0.4
    }
  },
  {
    name: 'magic-spell.wav',
    config: {
      frequencies: [660, 880, 1320, 1760, 2640],
      duration: 1.0,
      volume: 0.7,
      fadeIn: 0.1,
      fadeOut: 0.3,
      vibrato: 3,
      reverb: 0.5
    }
  },
  {
    name: 'door-open.wav',
    config: {
      frequencies: [110, 165, 220],
      duration: 1.0,
      volume: 0.5,
      fadeIn: 0.1,
      fadeOut: 0.3,
      vibrato: 0,
      reverb: 0.3
    }
  },
  {
    name: 'chest-open.wav',
    config: {
      frequencies: [330, 440, 660],
      duration: 0.7,
      volume: 0.6,
      fadeIn: 0.05,
      fadeOut: 0.2,
      vibrato: 0,
      reverb: 0.2
    }
  },
  {
    name: 'achievement-unlock.wav',
    config: {
      frequencies: [440, 660, 880, 1320, 1760, 2640],
      duration: 1.5,
      volume: 0.8,
      fadeIn: 0.1,
      fadeOut: 0.4,
      vibrato: 2,
      reverb: 0.4
    }
  }
];

console.log('Creating enhanced medieval audio files...');

audioConfigs.forEach(file => {
  generateMedievalWAV(file.name, file.config);
});

console.log('Enhanced medieval audio generation complete!');
console.log('🎵 Music tracks: Rich, layered tones with vibrato and reverb');
console.log('🔊 Sound effects: Distinctive, crisp audio for game actions');
