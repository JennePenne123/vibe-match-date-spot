import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'illustrated';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  variant = 'default',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center text-center py-10 px-6',
        className
      )}
    >
      {/* Animated icon with ring */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        className={cn(
          'relative mb-5',
          variant === 'illustrated' && 'mb-6'
        )}
      >
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl scale-150" />
        <div className={cn(
          'relative flex items-center justify-center rounded-full',
          variant === 'minimal' 
            ? 'w-14 h-14 bg-muted/50' 
            : 'w-16 h-16 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/20'
        )}>
          <Icon className={cn(
            'text-primary',
            variant === 'minimal' ? 'w-6 h-6' : 'w-7 h-7'
          )} />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-base font-semibold text-foreground mb-1.5"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-5"
      >
        {description}
      </motion.p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-2"
        >
          {actionLabel && onAction && (
            <Button onClick={onAction} size="sm" className="gap-1.5">
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button onClick={onSecondaryAction} variant="ghost" size="sm">
              {secondaryActionLabel}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;
