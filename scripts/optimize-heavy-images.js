const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(await getFiles(fullPath));
    } else if (/\.(png|jpe?g|webp)$/i.test(file) && stat.size > 500 * 1024) {
      results.push({ fullPath, size: stat.size });
    }
  }
  return results;
}

async function optimizeImage(filePath) {
  const isHeader = filePath.includes('/headers/') || filePath.includes('/encounters/');
  const maxDim = isHeader ? 1600 : 800;
  const ext = path.extname(filePath).toLowerCase();

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    let pipeline = sharp(filePath).resize(maxDim, maxDim, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: 82, effort: 4 });
    } else if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
    } else if (ext === '.png') {
      // If png has no alpha and is large, or keep png with compression
      pipeline = pipeline.png({ compressionLevel: 9, effort: 7 });
    }

    const tempPath = filePath + '.tmp';
    await pipeline.toFile(tempPath);
    const newStat = fs.statSync(tempPath);
    const origStat = fs.statSync(filePath);

    if (newStat.size < origStat.size) {
      fs.renameSync(tempPath, filePath);
      const saved = ((origStat.size - newStat.size) / (1024 * 1024)).toFixed(2);
      console.log(`✓ Optimized ${path.basename(filePath)}: ${(origStat.size / 1024).toFixed(0)}KB -> ${(newStat.size / 1024).toFixed(0)}KB (saved ${saved}MB)`);
      return origStat.size - newStat.size;
    } else {
      fs.unlinkSync(tempPath);
      return 0;
    }
  } catch (err) {
    console.error(`✗ Error optimizing ${filePath}:`, err.message);
    return 0;
  }
}

async function main() {
  console.log('Scanning public/images for files > 500KB...');
  const files = await getFiles(path.join(__dirname, '../public/images'));
  console.log(`Found ${files.length} heavy image files.`);
  
  let totalSaved = 0;
  for (const f of files) {
    const saved = await optimizeImage(f.fullPath);
    totalSaved += saved;
  }

  console.log(`\n🎉 Image optimization complete! Total storage saved: ${(totalSaved / (1024 * 1024)).toFixed(2)} MB`);
}

main().catch(console.error);
