const fs = require('fs');
const path = require('path');

// Create audio directory if it doesn't exist
const audioDir = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Function to generate a simple WAV file with a tone
function generateToneWAV(filename, frequency = 440, duration = 1.0, sampleRate = 44100) {
  const samples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + samples * 2); // 44 bytes header + 16-bit samples
  
  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples * 2, 4); // File size - 8
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
  buffer.writeUInt16LE(1, 22); // NumChannels
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40); // Subchunk2Size
  
  // Generate sine wave
  for (let i = 0; i < samples; i++) {
    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate);
    const amplitude = Math.floor(sample * 32767);
    buffer.writeInt16LE(amplitude, 44 + i * 2);
  }
  
  fs.writeFileSync(path.join(audioDir, filename), buffer);
  console.log(`Created ${filename} with ${frequency}Hz tone`);
}

// Generate different audio files with different tones
const audioFiles = [
  // Music tracks - longer duration, lower frequencies
  { name: 'medieval-ambient.wav', freq: 220, duration: 2.0 },
  { name: 'medieval-battle.wav', freq: 330, duration: 2.0 },
  { name: 'medieval-village.wav', freq: 440, duration: 2.0 },
  { name: 'medieval-castle.wav', freq: 550, duration: 2.0 },
  { name: 'medieval-forest.wav', freq: 660, duration: 2.0 },
  { name: 'medieval-tavern.wav', freq: 220, duration: 2.0 },
  { name: 'medieval-mystical.wav', freq: 880, duration: 2.0 },
  { name: 'medieval-epic.wav', freq: 110, duration: 2.0 },
  { name: 'medieval-calm.wav', freq: 165, duration: 2.0 },
  { name: 'medieval-adventure.wav', freq: 330, duration: 2.0 },
  
  // Sound effects - shorter duration, higher frequencies
  { name: 'quest-complete.wav', freq: 880, duration: 0.5 },
  { name: 'level-up.wav', freq: 1320, duration: 0.8 },
  { name: 'gold-earned.wav', freq: 660, duration: 0.3 },
  { name: 'xp-earned.wav', freq: 990, duration: 0.3 },
  { name: 'button-click.wav', freq: 2200, duration: 0.1 },
  { name: 'sword-clash.wav', freq: 440, duration: 0.4 },
  { name: 'magic-spell.wav', freq: 1760, duration: 0.6 },
  { name: 'door-open.wav', freq: 110, duration: 0.8 },
  { name: 'chest-open.wav', freq: 330, duration: 0.5 },
  { name: 'achievement-unlock.wav', freq: 1320, duration: 1.0 }
];

console.log('Creating real audio files with tones...');

audioFiles.forEach(file => {
  generateToneWAV(file.name, file.freq, file.duration);
});

console.log('Audio file generation complete!');
