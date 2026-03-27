import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FirstUseNudgeProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  className?: string;
  /** Position relative to the anchor — defaults to bottom */
  position?: 'top' | 'bottom';
}

export const FirstUseNudge: React.FC<FirstUseNudgeProps> = ({
  visible,
  onDismiss,
  children,
  className,
  position = 'bottom',
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: position === 'bottom' ? -8 : 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'bottom' ? -8 : 8, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className={cn(
            'relative z-50 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/10 backdrop-blur-md px-3.5 py-3 shadow-lg',
            position === 'top' ? 'mb-2' : 'mt-2',
            className,
          )}
        >
          <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-snug flex-1">{children}</p>
          <button
            onClick={onDismiss}
            className="shrink-0 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
            aria-label="Tipp schließen"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
