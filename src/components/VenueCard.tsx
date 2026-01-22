
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Star, MapPin, DollarSign, Sparkles, Navigation, Clock } from 'lucide-react';
import { Venue } from '@/types';
import VenuePhotoGallery from '@/components/VenuePhotoGallery';
import { formatVenueAddress, extractNeighborhood } from '@/utils/addressHelpers';
import { useBreakpoint } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface VenueCardProps {
  venue: Venue;
  variant?: 'default' | 'compact' | 'detailed' | 'horizontal';
  showMatchScore?: boolean;
  showActions?: boolean;
  isLiked?: boolean;
  onToggleLike?: (venueId: string) => void;
}

const VenueCard = ({ 
  venue, 
  variant = 'default',
  showMatchScore = true,
  showActions = true,
  isLiked = false,
  onToggleLike 
}: VenueCardProps) => {
  const navigate = useNavigate();
  const { isDesktop } = useBreakpoint();

  // Use actual database fields or fallback to computed values
  const venueImage = venue.image_url || venue.image;
  const venueLocation = formatVenueAddress(venue);
  const venuePriceRange = venue.price_range || venue.priceRange;
  const venueNeighborhood = extractNeighborhood(venue.address);
  
  // Process venue photos for gallery
  const venuePhotos = venue.photos && venue.photos.length > 0 
    ? venue.photos 
    : [{
        url: venueImage || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        width: 400,
        height: 300,
        attribution: venue.photos?.length ? 'Google Photos' : 'Stock Photo',
        isGooglePhoto: venue.photos?.length > 0
      }];

  // Auto-detect variant based on screen size if not explicitly set
  const effectiveVariant = variant === 'default' && isDesktop ? 'horizontal' : variant;

  if (effectiveVariant === 'horizontal') {
    return (
      <div 
        className={cn(
          "group cursor-pointer rounded-xl border border-border bg-card text-card-foreground",
          "hover:shadow-md transition-all duration-300 overflow-hidden",
          "flex gap-4 p-4 h-48"
        )}
        onClick={() => navigate(`/venue/${venue.id}`)}
      >
        {/* Image Section */}
        <div className="relative w-64 flex-shrink-0 rounded-lg overflow-hidden">
          <VenuePhotoGallery 
            photos={venuePhotos}
            venueName={venue.name}
            maxHeight="h-full"
            showThumbnails={false}
          />
          
          {/* Overlay elements */}
          <div className="absolute top-2 left-2 z-10">
            {showMatchScore && venue.matchScore && (
              <Badge 
                variant="secondary" 
                className="bg-background/90 text-foreground backdrop-blur-sm"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {venue.matchScore}% Match
              </Badge>
            )}
          </div>

          {showActions && (
            <div className="absolute top-2 right-2 z-10">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike?.(venue.id);
                }}
              >
                <Heart 
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"
                  )}
                />
              </Button>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-between py-2">
          <div className="space-y-2">
            {/* Title and Rating */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg text-foreground leading-tight line-clamp-2">
                {venue.name}
              </h3>
              {venue.rating && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{venue.rating}</span>
                </div>
              )}
            </div>

            {/* Tags/Categories */}
            {venue.tags && venue.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {venue.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                    {tag}
                  </Badge>
                ))}
                {venue.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    +{venue.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Location */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="line-clamp-1">{venueNeighborhood || venueLocation}</span>
            </div>
          </div>

          {/* Bottom info */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {venuePriceRange && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>{venuePriceRange}</span>
                </div>
              )}
              
              {venue.distance && (
                <div className="flex items-center gap-1">
                  <Navigation className="w-4 h-4" />
                  <span>{venue.distance}</span>
                </div>
              )}
              
              {venue.isOpen !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className={venue.isOpen ? "text-green-600" : "text-red-600"}>
                    {venue.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex gap-4 p-4">
        <div className="relative">
          <img 
            src={venueImage} 
            alt={venue.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
          {venue.discount && (
            <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-1">
              <span className="text-xs text-white font-bold">%</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-foreground text-sm truncate">
              {venue.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-yellow-600">
              <Star className="w-3 h-3" fill="currentColor" />
              {venue.rating}
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{venueLocation}</span>
            {venue.cuisine_type && <span> • {venue.cuisine_type}</span>}
          </div>
          
          {/* Distance and Status */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            {venue.distance && (
              <div className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                <span>{venue.distance}</span>
              </div>
            )}
            {venueNeighborhood && (
              <span>• {venueNeighborhood}</span>
            )}
            {venue.isOpen !== undefined && (
              <span className={`flex items-center gap-1 ${venue.isOpen ? 'text-green-500' : 'text-red-500'}`}>
                • <Clock className="w-3 h-3" />
                {venue.isOpen ? 'Open' : 'Closed'}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="w-3 h-3" />
              {venuePriceRange}
            </div>
            {showMatchScore && venue.matchScore && (
              <Badge className="bg-green-500 text-white text-xs">
                {venue.matchScore}% match
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="venue-card overflow-hidden">
      <div className="relative">
        <VenuePhotoGallery 
          photos={venuePhotos}
          venueName={venue.name}
          maxHeight="h-48"
          showThumbnails={false}
        />
        {showMatchScore && venue.matchScore && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-green-500 text-white font-semibold">
              <Sparkles className="w-3 h-3 mr-1" />
              {venue.matchScore}% match
            </Badge>
          </div>
        )}
        {onToggleLike && (
          <button
            onClick={() => onToggleLike(venue.id)}
            className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-full p-2 hover:bg-background transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${
                isLiked ? 'text-red-500 fill-current' : 'text-muted-foreground'
              }`}
            />
          </button>
        )}
        {venue.discount && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-orange-500 text-white">
              {venue.discount}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg text-foreground">{venue.name}</h3>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{venue.rating}</span>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-3">{venue.description}</p>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{venueLocation}</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {venue.distance && (
              <div className="flex items-center gap-1">
                <Navigation className="w-4 h-4" />
                <span>{venue.distance}</span>
              </div>
            )}
            {venuePriceRange && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>{venuePriceRange}</span>
              </div>
            )}
            {venueNeighborhood && (
              <span>{venueNeighborhood}</span>
            )}
          </div>
          
          {venue.isOpen !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${venue.isOpen ? 'text-green-600' : 'text-red-600'}`}>
              <Clock className="w-4 h-4" />
              <span>{venue.isOpen ? 'Open now' : 'Currently closed'}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {venue.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {showActions && (
          <Button
            onClick={() => navigate(`/venue/${venue.id}`)}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:opacity-90 shadow-glow-primary/30 hover:shadow-glow-primary/50 transition-all duration-300"
          >
            View Details
          </Button>
        )}
      </div>
    </div>
  );
};

export default VenueCard;
