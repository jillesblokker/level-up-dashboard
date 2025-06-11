import { readdir } from 'fs/promises';
import path from 'path';

export interface ImageItem {
  name: string;
  url: string;
  description?: string;
}

export class ImageManager {
  private images: ImageItem[] = [];
  private imageFolderPath: string;
  private descriptions: Record<string, string> = {};

  constructor(imageFolderPath: string = '/public/images') {
    this.imageFolderPath = imageFolderPath;
  }

  /**
   * Loads all images from the specified directory
   */
  async loadImages(): Promise<ImageItem[]> {
    try {
      // Get absolute path to the images directory
      const dirPath = path.resolve(process.cwd(), this.imageFolderPath.replace(/^\/public/, 'public'));
      
      // Read directory contents
      const files = await readdir(dirPath);
      
      // Filter image files (common image extensions)
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      });
      
      // Map files to ImageItem objects
      this.images = imageFiles.map(file => {
        const name = path.basename(file, path.extname(file));
        const publicPath = this.imageFolderPath.replace(/^\/public/, '');
        const url = `${publicPath}/${file}`;
        
        return {
          name,
          url,
          description: this.descriptions[name] || ''
        };
      });
      
      return this.images;
    } catch (error) {
      console.error('Error loading images:', error);
      return [];
    }
  }

  /**
   * Gets all images, with optional filtering by name
   */
  getImages(nameFilter?: string): ImageItem[] {
    if (!nameFilter) {
      return this.images;
    }
    
    const lowercaseFilter = nameFilter.toLowerCase();
    return this.images.filter(image => 
      image.name.toLowerCase().includes(lowercaseFilter)
    );
  }

  /**
   * Gets a single image by its exact name
   */
  getImageByName(name: string): ImageItem | undefined {
    return this.images.find(image => image.name === name);
  }

  /**
   * Updates the description for an image
   */
  updateDescription(name: string, description: string): boolean {
    const image = this.images.find(img => img.name === name);
    
    if (image) {
      image.description = description;
      this.descriptions[name] = description;
      return true;
    }
    
    return false;
  }

  /**
   * Saves all descriptions to local storage for persistence
   */
  saveDescriptions(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('imageDescriptions', JSON.stringify(this.descriptions));
    }
  }

  /**
   * Loads descriptions from local storage
   */
  loadDescriptions(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('imageDescriptions');
      if (saved) {
        try {
          this.descriptions = JSON.parse(saved);
          
          // Update any loaded images with saved descriptions
          this.images.forEach(image => {
            if (this.descriptions[image.name]) {
              image.description = this.descriptions[image.name] || '';
            }
          });
        } catch (e) {
          console.error('Error parsing saved image descriptions', e);
        }
      }
    }
  }
} 