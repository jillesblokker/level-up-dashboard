const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createIcon = (size) => {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <rect x="${size * 0.1}" y="${size * 0.1}" width="${size * 0.8}" height="${size * 0.8}" fill="#f59e0b" rx="${size * 0.1}"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="#000000">L</text>
</svg>`;

  return svg;
};

// Generate all required icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const svg = createIcon(size);
  const filename = `public/icons/icon-${size}x${size}.png`;
  
  // For now, create SVG files instead of PNG
  const svgFilename = `public/icons/icon-${size}x${size}.svg`;
  fs.writeFileSync(svgFilename, svg);
  console.log(`Created ${svgFilename}`);
});

// Create a simple favicon
const faviconSvg = createIcon(32);
fs.writeFileSync('public/icons/favicon.svg', faviconSvg);
console.log('Created favicon.svg');

console.log('Icon generation complete!');
