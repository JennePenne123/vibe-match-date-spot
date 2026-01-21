import React, { useState } from 'react';
import { Heart, MapPin, Star, Clock, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernVenueCardProps {
  id: string;
  name: string;
  image: string;
  category: 'restaurants' | 'bars' | 'clubs' | 'cafes' | 'liveMusic' | 'events';
  location: string;
  rating: number;
  reviewCount?: number;
  priceLevel: 1 | 2 | 3 | 4;
  distance: string;
  isOpen?: boolean;
  closingTime?: string;
  onFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
}

const categoryConfig = {
  restaurants: { label: 'Restaurant', bg: 'bg-orange-500', icon: '🍽️' },
  bars: { label: 'Bar', bg: 'bg-purple-500', icon: '🍸' },
  clubs: { label: 'Club', bg: 'bg-pink-500', icon: '🎉' },
  cafes: { label: 'Café', bg: 'bg-amber-500', icon: '☕' },
  liveMusic: { label: 'Live Music', bg: 'bg-indigo-500', icon: '🎵' },
  events: { label: 'Event', bg: 'bg-cyan-500', icon: '🎪' },
};

export const ModernVenueCard: React.FC<ModernVenueCardProps> = ({
  id,
  name,
  image,
  category,
  location,
  rating,
  reviewCount = 0,
  priceLevel,
  distance,
  isOpen = true,
  closingTime,
  onFavorite,
  onClick,
  className,
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHeartAnimating(true);
    setIsFavorited(!isFavorited);
    onFavorite?.(id);
    setTimeout(() => setIsHeartAnimating(false), 400);
  };

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => {
      setIsPressed(false);
      onClick?.(id);
    }, 150);
  };

  const categoryInfo = categoryConfig[category];

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-slate-600" />
        );
      }
    }
    return stars;
  };

  const renderPrice = () => {
    return Array.from({ length: 4 }, (_, i) => (
      <span
        key={i}
        className={cn(
          'font-semibold',
          i < priceLevel ? 'text-emerald-400' : 'text-slate-600'
        )}
      >
        €
      </span>
    ));
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        // Base styles
        'relative overflow-hidden rounded-2xl cursor-pointer',
        // Glass effect
        'backdrop-blur-md bg-white/10 border border-white/20',
        // Shadow
        'shadow-lg shadow-black/25',
        // Transitions
        'transition-all duration-300 ease-in-out',
        // Hover state
        'hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-black/40 hover:scale-[1.02]',
        // Press state
        isPressed && 'scale-[0.98]',
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${name}`}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Category Badge */}
        <div
          className={cn(
            'absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold text-white',
            'backdrop-blur-sm shadow-lg',
            categoryInfo.bg
          )}
        >
          <span className="mr-1">{categoryInfo.icon}</span>
          {categoryInfo.label}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className={cn(
            'absolute top-3 left-3 p-2.5 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center',
            'backdrop-blur-md bg-black/30 border border-white/20',
            'transition-all duration-300',
            'hover:bg-black/50 hover:scale-110',
            'focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-transparent'
          )}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-all duration-300',
              isFavorited ? 'fill-pink-500 text-pink-500' : 'text-white',
              isHeartAnimating && 'animate-[heartBounce_400ms_ease-in-out]'
            )}
          />
        </button>

        {/* Status Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              'backdrop-blur-md',
              isOpen 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            )}
          >
            <span 
              className={cn(
                'w-2 h-2 rounded-full',
                isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              )} 
            />
            {isOpen ? 'Open now' : 'Closed'}
          </div>
          {isOpen && closingTime && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs text-slate-300">
              <Clock className="w-3 h-3" />
              Until {closingTime}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name & Location */}
        <h3 className="text-xl font-bold text-slate-50 mb-1 line-clamp-1">{name}</h3>
        <div className="flex items-center gap-1 text-slate-300 text-sm mb-3">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="line-clamp-1">{location}</span>
        </div>

        {/* Rating, Price, Distance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <div className="flex">{renderStars()}</div>
              <span className="text-sm text-slate-300 ml-1">
                {rating.toFixed(1)}
                {reviewCount > 0 && (
                  <span className="text-slate-400"> ({reviewCount})</span>
                )}
              </span>
            </div>

            {/* Price */}
            <div className="flex">{renderPrice()}</div>
          </div>

          {/* Distance */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-700/50 text-sm text-slate-300">
            <Navigation className="w-3.5 h-3.5" />
            {distance}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernVenueCard;
