import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Utensils, 
  Wine, 
  Coffee, 
  Music, 
  Sparkles, 
  Heart,
  Sun,
  Moon,
  Users,
  Flame,
  type LucideIcon 
} from 'lucide-react';

export type TagCategory = 
  | 'cuisine' 
  | 'vibe' 
  | 'feature' 
  | 'time' 
  | 'default';

export interface VenueTagProps {
  label: string;
  category?: TagCategory;
  variant?: 'default' | 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const categoryStyles: Record<TagCategory, { bg: string; text: string; border: string; icon?: LucideIcon }> = {
  cuisine: {
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: Utensils,
  },
  vibe: {
    bg: 'bg-purple-100 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    icon: Sparkles,
  },
  feature: {
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Heart,
  },
  time: {
    bg: 'bg-sage-100 dark:bg-sage-950/40',
    text: 'text-sage-700 dark:text-sage-300',
    border: 'border-sage-200 dark:border-sage-800',
    icon: Sun,
  },
  default: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
};

const sizeStyles = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
  md: 'text-xs px-2 py-1 gap-1',
  lg: 'text-sm px-3 py-1.5 gap-1.5',
};

const iconSizes = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export const VenueTag: React.FC<VenueTagProps> = ({
  label,
  category = 'default',
  variant = 'default',
  size = 'md',
  icon: CustomIcon,
  selected = false,
  onClick,
  className,
}) => {
  const styles = categoryStyles[category];
  const IconComponent = CustomIcon || styles.icon;

  const baseStyles = cn(
    'inline-flex items-center font-medium rounded-full transition-all duration-200',
    sizeStyles[size],
    onClick && 'cursor-pointer hover:scale-105 active:scale-95',
  );

  const variantStyles = {
    default: cn(styles.bg, styles.text),
    outline: cn('bg-transparent border', styles.border, styles.text),
    filled: cn('bg-primary text-primary-foreground'),
  };

  const selectedStyles = selected ? cn(
    'ring-2 ring-primary ring-offset-2 ring-offset-background',
    variant === 'default' && 'bg-primary/20'
  ) : '';

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        selectedStyles,
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {IconComponent && (
        <IconComponent className={cn(iconSizes[size], styles.text)} />
      )}
      {label}
    </span>
  );
};

// Preset tag components for common use cases
export const CuisineTag: React.FC<Omit<VenueTagProps, 'category'>> = (props) => (
  <VenueTag {...props} category="cuisine" />
);

export const VibeTag: React.FC<Omit<VenueTagProps, 'category'>> = (props) => (
  <VenueTag {...props} category="vibe" />
);

export const FeatureTag: React.FC<Omit<VenueTagProps, 'category'>> = (props) => (
  <VenueTag {...props} category="feature" />
);

export const TimeTag: React.FC<Omit<VenueTagProps, 'category'>> = (props) => (
  <VenueTag {...props} category="time" />
);

export default VenueTag;
