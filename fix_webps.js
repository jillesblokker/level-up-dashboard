const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = 'public/images/kingdom-tiles/';
const files = fs.readdirSync(dir);

async function processFiles() {
  for (const file of files) {
    if (file.endsWith('.png')) {
      const name = path.basename(file, '.png');
      const pngPath = path.join(dir, file);
      const webpPath = path.join(dir, name + '.webp');
      try {
        await sharp(pngPath).webp({ quality: 80 }).toFile(webpPath);
        console.log(`Converted ${file} to ${name}.webp`);
      } catch (e) {
        console.error(`Error converting ${file}:`, e);
      }
    }
  }
}

processFiles();
