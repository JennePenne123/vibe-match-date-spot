import React from 'react';
import { cn } from '@/lib/utils';

interface ModernShimmerProps {
  className?: string;
  variant?: 'card' | 'text' | 'avatar' | 'button';
}

export const ModernShimmer: React.FC<ModernShimmerProps> = ({
  className,
  variant = 'card',
}) => {
  const shimmerBase = cn(
    'relative overflow-hidden',
    'bg-slate-700/50',
    'before:absolute before:inset-0',
    "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
    'before:animate-[shimmer_1.5s_ease-in-out_infinite]'
  );

  if (variant === 'card') {
    return (
      <div className={cn('rounded-2xl overflow-hidden', shimmerBase, className)}>
        {/* Image placeholder */}
        <div className="aspect-video bg-slate-700" />
        
        {/* Content placeholder */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div className="h-6 bg-slate-600 rounded-lg w-3/4" />
          
          {/* Location */}
          <div className="h-4 bg-slate-600 rounded-lg w-1/2" />
          
          {/* Rating & Price */}
          <div className="flex items-center justify-between pt-2">
            <div className="h-4 bg-slate-600 rounded-lg w-24" />
            <div className="h-6 bg-slate-600 rounded-full w-16" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'text') {
    return <div className={cn('h-4 rounded-lg', shimmerBase, className)} />;
  }

  if (variant === 'avatar') {
    return <div className={cn('w-12 h-12 rounded-full', shimmerBase, className)} />;
  }

  if (variant === 'button') {
    return <div className={cn('h-11 rounded-xl', shimmerBase, className)} />;
  }

  return <div className={cn(shimmerBase, className)} />;
};

// Card Skeleton for loading states
export const ModernCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <ModernShimmer variant="card" className={className} />
);

// Grid of skeleton cards
interface ModernSkeletonGridProps {
  count?: number;
  columns?: 1 | 2 | 3;
  className?: string;
}

export const ModernSkeletonGrid: React.FC<ModernSkeletonGridProps> = ({
  count = 6,
  columns = 1,
  className,
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ModernCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default ModernShimmer;
