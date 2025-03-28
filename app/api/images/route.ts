import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  try {
    // Get the images folder path (default to public/images)
    const url = new URL(request.url);
    const folderPath = url.searchParams.get('folder') || 'images';
    
    // Get absolute path to the images directory
    const dirPath = path.resolve(process.cwd(), 'public', folderPath);
    
    // Read directory contents
    const files = await readdir(dirPath);
    
    // Filter image files (common image extensions)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    // Map files to ImageItem objects
    const images = imageFiles.map(file => {
      const name = path.basename(file, path.extname(file));
      const url = `/${folderPath}/${file}`;
      
      return {
        name,
        url,
        description: ''
      };
    });
    
    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error loading images:', error);
    return NextResponse.json(
      { error: 'Failed to load images', details: (error as Error).message },
      { status: 500 }
    );
  }
} 