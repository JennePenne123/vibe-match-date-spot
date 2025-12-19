
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonLoaderProps {
  variant: 'friend-card' | 'venue-card' | 'date-invite' | 'profile-header' | 'voucher-table' | 'home-dashboard';
  count?: number;
}

const SkeletonLoader = ({ variant, count = 1 }: SkeletonLoaderProps) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'friend-card':
        return (
          <div className="bg-white p-4 rounded-lg shadow-sm border">
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
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
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
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-l-pink-200">
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
          <div className="bg-white p-6 space-y-4">
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

      default:
        return <Skeleton className="h-20 w-full" />;
    }
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
