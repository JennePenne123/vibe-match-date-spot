import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface FilterChip {
  id: string;
  label: string;
  icon?: string;
}

interface ModernFilterChipsProps {
  chips?: FilterChip[];
  selectedIds?: string[];
  onChange?: (selectedIds: string[]) => void;
  multiSelect?: boolean;
  className?: string;
}

const defaultChips: FilterChip[] = [
  { id: 'restaurants', label: 'Restaurants', icon: '🍽️' },
  { id: 'bars', label: 'Bars', icon: '🍸' },
  { id: 'clubs', label: 'Clubs', icon: '🎉' },
  { id: 'cafes', label: 'Cafés', icon: '☕' },
  { id: 'liveMusic', label: 'Live Music', icon: '🎵' },
  { id: 'events', label: 'Events', icon: '🎪' },
];

export const ModernFilterChips: React.FC<ModernFilterChipsProps> = ({
  chips = defaultChips,
  selectedIds = [],
  onChange,
  multiSelect = true,
  className,
}) => {
  const [ripples, setRipples] = useState<{ id: string; x: number; y: number }[]>([]);

  const handleClick = (chipId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    // Create ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const rippleId = `${chipId}-${Date.now()}`;
    setRipples((prev) => [...prev, { id: rippleId, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 600);

    // Update selection
    let newSelected: string[];
    if (multiSelect) {
      newSelected = selectedIds.includes(chipId)
        ? selectedIds.filter((id) => id !== chipId)
        : [...selectedIds, chipId];
    } else {
      newSelected = selectedIds.includes(chipId) ? [] : [chipId];
    }
    onChange?.(newSelected);
  };

  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mb-2',
        className
      )}
      role="group"
      aria-label="Filter categories"
    >
      {chips.map((chip) => {
        const isSelected = selectedIds.includes(chip.id);
        const chipRipples = ripples.filter((r) => r.id.startsWith(chip.id));

        return (
          <button
            key={chip.id}
            onClick={(e) => handleClick(chip.id, e)}
            className={cn(
              // Base styles
              'relative overflow-hidden flex-shrink-0',
              'flex items-center gap-2 px-4 py-2.5 rounded-full',
              'text-sm font-medium whitespace-nowrap',
              'min-h-[44px]',
              // Transitions
              'transition-all duration-300 ease-out',
              // States
              isSelected
                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]'
                : 'bg-white/10 text-slate-300 border border-white/20 hover:bg-white/15 hover:text-slate-100',
              // Focus
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900'
            )}
            aria-pressed={isSelected}
          >
            {/* Ripple Effect */}
            {chipRipples.map((ripple) => (
              <span
                key={ripple.id}
                className="absolute pointer-events-none rounded-full bg-white/30 animate-[ripple_600ms_ease-out_forwards]"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  width: 10,
                  height: 10,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}

            {chip.icon && <span className="text-base">{chip.icon}</span>}
            {chip.label}

            {/* Selection indicator */}
            {isSelected && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ModernFilterChips;
