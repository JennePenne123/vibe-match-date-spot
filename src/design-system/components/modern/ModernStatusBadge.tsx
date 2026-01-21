import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusType = 'open' | 'closed' | 'closingSoon';

interface ModernStatusBadgeProps {
  status: StatusType;
  closingTime?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  open: {
    label: 'Open now',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    icon: CheckCircle,
    pulse: true,
  },
  closed: {
    label: 'Closed',
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    dot: 'bg-red-400',
    icon: XCircle,
    pulse: false,
  },
  closingSoon: {
    label: 'Closing soon',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    icon: AlertCircle,
    pulse: true,
  },
};

const sizeConfig = {
  sm: { padding: 'px-2 py-1', text: 'text-xs', dot: 'w-1.5 h-1.5', icon: 'w-3 h-3' },
  md: { padding: 'px-2.5 py-1.5', text: 'text-sm', dot: 'w-2 h-2', icon: 'w-4 h-4' },
  lg: { padding: 'px-3 py-2', text: 'text-base', dot: 'w-2.5 h-2.5', icon: 'w-5 h-5' },
};

export const ModernStatusBadge: React.FC<ModernStatusBadgeProps> = ({
  status,
  closingTime,
  size = 'md',
  showIcon = false,
  className,
}) => {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {/* Main Badge */}
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium',
          'backdrop-blur-md',
          config.bg,
          config.border,
          config.text,
          sizeStyles.padding,
          sizeStyles.text,
          'border'
        )}
      >
        {showIcon ? (
          <Icon className={sizeStyles.icon} />
        ) : (
          <span
            className={cn(
              'rounded-full',
              config.dot,
              sizeStyles.dot,
              config.pulse && 'animate-pulse'
            )}
          />
        )}
        {config.label}
      </div>

      {/* Closing Time */}
      {status !== 'closed' && closingTime && (
        <div
          className={cn(
            'inline-flex items-center gap-1 rounded-full',
            'bg-white/10 text-slate-300 backdrop-blur-md',
            sizeStyles.padding,
            sizeStyles.text
          )}
        >
          <Clock className={sizeStyles.icon} />
          Until {closingTime}
        </div>
      )}
    </div>
  );
};

// Category Badge Component
interface ModernCategoryBadgeProps {
  category: 'restaurants' | 'bars' | 'clubs' | 'cafes' | 'liveMusic' | 'events';
  size?: 'sm' | 'md' | 'lg';
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

export const ModernCategoryBadge: React.FC<ModernCategoryBadgeProps> = ({
  category,
  size = 'md',
  className,
}) => {
  const config = categoryConfig[category];
  const sizeStyles = sizeConfig[size];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full text-white font-semibold',
        'backdrop-blur-sm shadow-lg',
        config.bg,
        sizeStyles.padding,
        sizeStyles.text,
        className
      )}
    >
      <span>{config.icon}</span>
      {config.label}
    </div>
  );
};

export default ModernStatusBadge;
