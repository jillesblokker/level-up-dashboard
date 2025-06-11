'use client';

import { useState } from 'react';
import { useImages } from '@/hooks/use-images';
import { ImageItem } from '@/lib/ImageManager';
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader } from 'lucide-react';
import Image from 'next/image';

interface ImageGalleryProps {
  folderPath?: string;
}

export function ImageGallery({ folderPath = 'images' }: ImageGalleryProps) {
  const { images, loading, error, filterByName, updateDescription } = useImages(folderPath);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [newDescription, setNewDescription] = useState('');

  const filteredImages = searchTerm ? filterByName(searchTerm) : images;

  const handleStartEditing = (image: ImageItem) => {
    setEditingImage(image.name);
    setNewDescription(image.description || '');
  };

  const handleSaveDescription = (imageName: string) => {
    updateDescription(imageName, newDescription);
    setEditingImage(null);
  };

  const handleCancelEdit = () => {
    setEditingImage(null);
    setNewDescription('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading images...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/20 p-4 rounded-md text-destructive">
        <p>Error loading images: {error}</p>
        <p className="text-sm mt-2">
          Make sure the folder <code className="bg-muted px-1 py-0.5 rounded">{folderPath}</code> exists
          in your public directory.
        </p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-muted p-8 rounded-md text-center">
        <p className="mb-4">No images found in {folderPath}</p>
        <p className="text-sm text-muted-foreground">
          Drag and drop image files into your <code className="bg-muted-foreground/20 px-1 py-0.5 rounded">/public/{folderPath}</code> folder to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Input
          type="text"
          placeholder="Search images..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          {filteredImages.length} {filteredImages.length === 1 ? 'image' : 'images'} found
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredImages.map((image) => (
          <Card key={image.name} className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="aspect-square w-full relative overflow-hidden bg-muted">
                <Image
                  src={typeof image.url === 'string' ? image.url : ''}
                  alt={typeof image.description === 'string' ? image.description : image.name}
                  className="object-cover w-full h-full"
                  width={400}
                  height={300}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-base truncate mb-2" title={image.name}>
                {image.name}
              </CardTitle>

              {editingImage === image.name ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Enter a description"
                    value={newDescription}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDescription(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleSaveDescription(image.name)}
                    >
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {image.description || 'No description'}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => handleStartEditing(image)}
                  >
                    Edit Description
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
              {image.url}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 