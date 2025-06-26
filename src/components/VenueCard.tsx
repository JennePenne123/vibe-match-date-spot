
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Star, MapPin, DollarSign, Sparkles } from 'lucide-react';
import { Venue } from '@/types';

interface VenueCardProps {
  venue: Venue;
  variant?: 'default' | 'compact' | 'detailed';
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

  if (variant === 'compact') {
    return (
      <div className="flex gap-4 p-4">
        <div className="relative">
          <img 
            src={venue.image} 
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
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {venue.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-yellow-600">
              <Star className="w-3 h-3" fill="currentColor" />
              {venue.rating}
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <MapPin className="w-3 h-3" />
            {venue.location} • {venue.cuisineType}
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-500">
              <DollarSign className="w-3 h-3" />
              {venue.priceRange}
            </div>
            {showMatchScore && (
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <img
          src={venue.image}
          alt={venue.name}
          className="w-full h-48 object-cover"
        />
        {showMatchScore && (
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
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${
                isLiked ? 'text-red-500 fill-current' : 'text-gray-600'
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
          <h3 className="font-bold text-lg text-gray-900">{venue.name}</h3>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{venue.rating}</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-3">{venue.description}</p>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {venue.location} • {venue.distance}
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {venue.priceRange}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {venue.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {showActions && (
          <Button
            onClick={() => navigate(`/venue/${venue.id}`)}
            className="w-full bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:opacity-90"
          >
            View Details
          </Button>
        )}
      </div>
    </div>
  );
};

export default VenueCard;
