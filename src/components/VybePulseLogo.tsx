import React from 'react';
import { cn } from '@/lib/utils';

interface VybePulseLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

const VybePulseLogo = ({ size = 'md', className, animated = false }: VybePulseLogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-lg'
  };

  return (
    <div className={cn(
      "flex items-center justify-center rounded-full bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold shadow-lg",
      sizeClasses[size],
      animated && "animate-pulse",
      className
    )}>
      <span>VP</span>
    </div>
  );
};

export default VybePulseLogo;