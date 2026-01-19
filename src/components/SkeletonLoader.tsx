
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonLoaderProps {
  variant: 
    | 'friend-card' 
    | 'venue-card' 
    | 'date-invite' 
    | 'profile-header' 
    | 'voucher-table' 
    | 'home-dashboard'
    | 'ai-venue-card'
    | 'compatibility-score'
    | 'planning-steps'
    | 'message-thread'
    | 'preference-form'
    | 'stats-grid';
  count?: number;
}

const SkeletonLoader = ({ variant, count = 1 }: SkeletonLoaderProps) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'friend-card':
        return (
          <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <div className="flex gap-2 mt-3">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'venue-card':
        return (
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <Skeleton className="w-full h-48" />
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-14" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        );

      case 'date-invite':
        return (
          <div className="bg-card p-4 rounded-lg shadow-sm border-l-4 border-l-primary/30">
            <div className="flex items-start gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'profile-header':
        return (
          <div className="bg-card p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        );

      case 'voucher-table':
        return (
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-muted/50 border-b border-border">
              <div className="flex items-center px-4 py-3 gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
            </div>
            {/* Table Row */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-2 w-20 rounded-full" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md ml-auto" />
              </div>
            </div>
          </div>
        );

      case 'home-dashboard':
        return (
          <div className="space-y-5 p-4">
            {/* Header skeleton */}
            <div className="flex justify-between items-center pt-8 pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
            
            {/* Pending ratings card skeleton */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            </div>
            
            {/* Date proposals card skeleton */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Upcoming dates card skeleton */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
            
            {/* Planning mode card skeleton */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="text-center space-y-2">
                <Skeleton className="h-6 w-40 mx-auto" />
                <Skeleton className="h-4 w-56 mx-auto" />
              </div>
              <div className="flex justify-center">
                <Skeleton className="w-12 h-12 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        );

      case 'ai-venue-card':
        return (
          <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
            {/* Photo gallery skeleton */}
            <div className="relative">
              <Skeleton className="w-full h-56" />
              <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                <Skeleton className="h-1 flex-1 rounded-full" />
                <Skeleton className="h-1 flex-1 rounded-full opacity-50" />
                <Skeleton className="h-1 flex-1 rounded-full opacity-50" />
              </div>
            </div>
            <div className="p-5 space-y-4">
              {/* Header with score */}
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-14 w-14 rounded-full" />
              </div>
              {/* Match factors */}
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              {/* AI reasoning */}
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
              {/* Action buttons */}
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </div>
        );

      case 'compatibility-score':
        return (
          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            {/* Circular score */}
            <div className="flex justify-center">
              <Skeleton className="h-24 w-24 rounded-full" />
            </div>
            {/* Score breakdown */}
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-2 flex-1 rounded-full" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        );

      case 'planning-steps':
        return (
          <div className="space-y-4">
            {/* Step indicators */}
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step, idx) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-2">
                    <Skeleton className={`h-10 w-10 rounded-full ${idx === 0 ? '' : 'opacity-50'}`} />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  {idx < 3 && <Skeleton className="h-0.5 flex-1 mx-2" />}
                </React.Fragment>
              ))}
            </div>
            {/* Current step content */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="pt-4">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        );

      case 'message-thread':
        return (
          <div className="space-y-4 p-4">
            {/* Received message */}
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="space-y-1 max-w-[70%]">
                <Skeleton className="h-16 w-48 rounded-2xl rounded-tl-sm" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            {/* Sent message */}
            <div className="flex gap-3 justify-end">
              <div className="space-y-1 max-w-[70%] items-end flex flex-col">
                <Skeleton className="h-12 w-56 rounded-2xl rounded-tr-sm" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            {/* Received message */}
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="space-y-1 max-w-[70%]">
                <Skeleton className="h-20 w-64 rounded-2xl rounded-tl-sm" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        );

      case 'preference-form':
        return (
          <div className="space-y-6 p-4">
            {/* Section 1 */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-8 w-20 rounded-full" />
                ))}
              </div>
            </div>
            {/* Section 2 - Slider */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            {/* Section 3 - Toggle options */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-36" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'stats-grid':
        return (
          <div className="grid grid-cols-2 gap-4 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        );

      default:
        return <Skeleton className="h-20 w-full" />;
    }
  };

  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="animate-in fade-in duration-300"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
