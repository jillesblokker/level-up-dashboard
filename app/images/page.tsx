import { ImageGallery } from '@/components/image-gallery';

export default function ImagesPage() {
  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Image Manager</h1>
        <p className="text-muted-foreground">
          Drag and drop image files to the <code className="bg-muted px-1 py-0.5 rounded">/public/images</code> folder to see them here.
        </p>
      </div>
      
      <ImageGallery />
    </div>
  );
} 