import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VenuePhoto {
  url: string;
  width: number;
  height: number;
  attribution?: string;
  isGooglePhoto: boolean;
}

interface VenuePhotoGalleryProps {
  photos: VenuePhoto[];
  venueName: string;
  className?: string;
  showThumbnails?: boolean;
  maxHeight?: string;
}

export const VenuePhotoGallery: React.FC<VenuePhotoGalleryProps> = ({
  photos,
  venueName,
  className = '',
  showThumbnails = false,
  maxHeight = 'h-48'
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  if (!photos || photos.length === 0) {
    return (
      <div className={`${maxHeight} bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-gray-500">No photos available</span>
      </div>
    );
  }

  const currentPhoto = photos[currentPhotoIndex];
  const hasMultiplePhotos = photos.length > 1;

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    setImageLoading(true);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setImageLoading(true);
  };

  const goToPhoto = (index: number) => {
    setCurrentPhotoIndex(index);
    setImageLoading(true);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Photo */}
      <div className={`relative ${maxHeight} rounded-lg overflow-hidden bg-gray-100`}>
        <img
          src={currentPhoto.url}
          alt={`${venueName} - Photo ${currentPhotoIndex + 1}`}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
        />
        
        {/* Loading state */}
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Navigation arrows */}
        {hasMultiplePhotos && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full w-8 h-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full w-8 h-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Photo counter */}
        {hasMultiplePhotos && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
            {currentPhotoIndex + 1} / {photos.length}
          </div>
        )}

        {/* Google Photos badge */}
        {currentPhoto.isGooglePhoto && (
          <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-xs flex items-center gap-1">
            <img 
              src="https://developers.google.com/static/maps/images/google_on_white.png" 
              alt="Google" 
              className="w-3 h-3"
            />
            <span className="text-gray-700">Photos</span>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {showThumbnails && hasMultiplePhotos && (
        <div className="flex gap-2 mt-2 overflow-x-auto">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => goToPhoto(index)}
              className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                index === currentPhotoIndex 
                  ? 'border-primary shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={photo.url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Attribution */}
      {currentPhoto.attribution && (
        <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          <span>{currentPhoto.attribution}</span>
        </div>
      )}
    </div>
  );
};

export default VenuePhotoGallery;