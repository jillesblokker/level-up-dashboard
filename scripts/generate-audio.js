const fs = require('fs');
const path = require('path');

// Create a simple silent audio file (1 second of silence)
const createSilentAudio = (filename) => {
  // This creates a minimal WAV file with 1 second of silence
  const sampleRate = 44100;
  const duration = 1; // 1 second
  const numSamples = sampleRate * duration;
  const bytesPerSample = 2; // 16-bit
  const numChannels = 2; // stereo
  
  const dataSize = numSamples * numChannels * bytesPerSample;
  const fileSize = 44 + dataSize; // WAV header + data
  
  const buffer = Buffer.alloc(fileSize);
  
  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // audio format (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  
  // Silent data (all zeros)
  buffer.fill(0, 44);
  
  return buffer;
};

// Audio tracks to create
const audioTracks = [
  // Music tracks
  'medieval-ambient',
  'medieval-battle',
  'medieval-village',
  'medieval-castle',
  'medieval-forest',
  'medieval-tavern',
  'medieval-mystical',
  'medieval-epic',
  'medieval-calm',
  'medieval-adventure',
  
  // Sound effects
  'quest-complete',
  'level-up',
  'gold-earned',
  'xp-earned',
  'button-click',
  'sword-clash',
  'magic-spell',
  'door-open',
  'chest-open',
  'achievement-unlock'
];

console.log('Creating placeholder audio files...');

audioTracks.forEach(track => {
  const filename = `public/audio/${track}.wav`;
  const audioData = createSilentAudio(filename);
  fs.writeFileSync(filename, audioData);
  console.log(`Created ${filename}`);
});

console.log('Audio file generation complete!');
