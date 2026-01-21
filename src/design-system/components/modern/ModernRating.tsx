import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

const sizeConfig = {
  sm: { star: 'w-3.5 h-3.5', text: 'text-xs', gap: 'gap-0.5' },
  md: { star: 'w-4 h-4', text: 'text-sm', gap: 'gap-1' },
  lg: { star: 'w-5 h-5', text: 'text-base', gap: 'gap-1' },
};

export const ModernRating: React.FC<ModernRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = true,
  reviewCount,
  className,
}) => {
  const config = sizeConfig[size];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn('flex items-center', config.gap, className)}>
      {/* Stars */}
      <div className={cn('flex', config.gap)}>
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(config.star, 'fill-yellow-400 text-yellow-400')}
          />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={cn(config.star, 'text-slate-600')} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={cn(config.star, 'fill-yellow-400 text-yellow-400')} />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(config.star, 'text-slate-600')}
          />
        ))}
      </div>

      {/* Value & Review Count */}
      {showValue && (
        <span className={cn(config.text, 'text-slate-300 ml-1')}>
          {rating.toFixed(1)}
          {reviewCount !== undefined && (
            <span className="text-slate-400"> ({reviewCount.toLocaleString()})</span>
          )}
        </span>
      )}
    </div>
  );
};

// Price Level Component
interface ModernPriceLevelProps {
  level: 1 | 2 | 3 | 4;
  maxLevel?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const priceSizeConfig = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const ModernPriceLevel: React.FC<ModernPriceLevelProps> = ({
  level,
  maxLevel = 4,
  size = 'md',
  className,
}) => {
  return (
    <div className={cn('flex', priceSizeConfig[size], className)}>
      {Array.from({ length: maxLevel }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'font-semibold transition-colors duration-200',
            i < level ? 'text-emerald-400' : 'text-slate-600'
          )}
        >
          €
        </span>
      ))}
    </div>
  );
};

// Distance Badge Component
interface ModernDistanceBadgeProps {
  distance: string;
  icon?: 'walk' | 'drive' | 'none';
  className?: string;
}

export const ModernDistanceBadge: React.FC<ModernDistanceBadgeProps> = ({
  distance,
  icon = 'none',
  className,
}) => {
  const iconMap = {
    walk: '🚶',
    drive: '🚗',
    none: null,
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'bg-slate-700/50 text-slate-300 text-sm font-medium',
        'border border-slate-600/50',
        className
      )}
    >
      {iconMap[icon] && <span>{iconMap[icon]}</span>}
      {distance}
    </div>
  );
};

export default ModernRating;
