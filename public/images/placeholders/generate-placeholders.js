const fs = require('fs');
const { createCanvas } = require('canvas');

// Sizes of placeholders to generate
const sizes = [
  { width: 400, height: 300, name: 'location-placeholder.png' },  // For location cards
  { width: 800, height: 600, name: 'location-header.png' },       // For location headers
  { width: 300, height: 200, name: 'item-placeholder.png' },      // For item cards
  { width: 1920, height: 1080, name: 'kingdom-header.png' }       // For kingdom banner
];

// Generate a velvet-like texture pattern
function generateNoisePattern(ctx, width, height, alpha) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Add subtle noise
    const noise = Math.random() * alpha;
    data[i] = Math.min(255, data[i] + noise);     // R
    data[i + 1] = Math.min(255, data[i + 1] + noise); // G
    data[i + 2] = Math.min(255, data[i + 2] + noise); // B
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// Generate gradient placeholder
function generatePlaceholder(width, height, filename) {
  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Create gradient - dark green to black
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, height
  );
  
  // Dark green velvet colors
  gradient.addColorStop(0, '#0e3a2e');   // Darker green center
  gradient.addColorStop(0.4, '#0a2e22'); // Mid dark green
  gradient.addColorStop(0.7, '#071b15'); // Very dark green
  gradient.addColorStop(1, '#030a07');   // Almost black edge
  
  // Fill with gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add subtle texture for velvet-like appearance
  generateNoisePattern(ctx, width, height, 5);
  
  // Add a subtle vignette effect
  const vignetteGradient = ctx.createRadialGradient(
    width / 2, height / 2, height * 0.4,
    width / 2, height / 2, height
  );
  vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Generated: ${filename} (${width}x${height})`);
}

// Create placeholder images in different sizes
sizes.forEach(size => {
  generatePlaceholder(size.width, size.height, size.name);
});

console.log('All placeholder images generated successfully!'); 