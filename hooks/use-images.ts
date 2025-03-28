import { useState, useEffect } from 'react';
import { ImageItem } from '@/lib/ImageManager';

export function useImages(folderPath = 'images') {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});

  // Load images from the API
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/images?folder=${encodeURIComponent(folderPath)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Load saved descriptions
        let savedDescriptions = {};
        try {
          const saved = localStorage.getItem('imageDescriptions');
          if (saved) {
            savedDescriptions = JSON.parse(saved);
            setDescriptions(savedDescriptions);
          }
        } catch (e) {
          console.error('Error loading saved descriptions', e);
        }
        
        // Apply descriptions to images
        const imagesWithDescriptions = data.images.map((img: ImageItem) => ({
          ...img,
          description: (savedDescriptions as Record<string, string>)[img.name] || img.description || ''
        }));
        
        setImages(imagesWithDescriptions);
      } catch (err) {
        setError((err as Error).message);
        console.error('Error fetching images:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [folderPath]);

  // Filter images by name
  const filterByName = (nameFilter: string): ImageItem[] => {
    if (!nameFilter.trim()) {
      return images;
    }
    
    const lowercaseFilter = nameFilter.toLowerCase();
    return images.filter(image => 
      image.name.toLowerCase().includes(lowercaseFilter)
    );
  };

  // Update image description
  const updateDescription = (name: string, description: string): boolean => {
    const imageIndex = images.findIndex(img => img.name === name);
    
    if (imageIndex >= 0) {
      // Update the image
      const updatedImages = [...images];
      updatedImages[imageIndex] = {
        ...updatedImages[imageIndex],
        description
      };
      
      // Update descriptions store
      const updatedDescriptions = {
        ...descriptions,
        [name]: description
      };
      
      // Save to state and localStorage
      setImages(updatedImages);
      setDescriptions(updatedDescriptions);
      localStorage.setItem('imageDescriptions', JSON.stringify(updatedDescriptions));
      
      return true;
    }
    
    return false;
  };

  return {
    images,
    loading,
    error,
    filterByName,
    updateDescription,
    getByName: (name: string) => images.find(img => img.name === name)
  };
} 