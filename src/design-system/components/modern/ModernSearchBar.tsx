import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernSearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
  className?: string;
  filterCount?: number;
}

export const ModernSearchBar: React.FC<ModernSearchBarProps> = ({
  value = '',
  onChange,
  onFilterClick,
  placeholder = 'Search venues, bars, restaurants...',
  className,
  filterCount = 0,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange?.('');
  };

  return (
    <div
      className={cn(
        // Base styles
        'relative flex items-center gap-3 px-5 py-3 rounded-full',
        // Glass effect
        'backdrop-blur-md bg-white/10 border border-white/20',
        // Shadow
        'shadow-lg shadow-black/20',
        // Transition
        'transition-all duration-300',
        // Focus state
        isFocused && 'bg-white/15 border-white/30 shadow-xl ring-2 ring-indigo-500/50',
        className
      )}
    >
      {/* Search Icon */}
      <Search
        className={cn(
          'w-5 h-5 transition-colors duration-300 flex-shrink-0',
          isFocused ? 'text-indigo-400' : 'text-slate-400'
        )}
      />

      {/* Input */}
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          'flex-1 bg-transparent border-none outline-none',
          'text-slate-50 placeholder:text-slate-400',
          'text-base'
        )}
        aria-label="Search venues"
      />

      {/* Clear Button */}
      {localValue && (
        <button
          onClick={handleClear}
          className={cn(
            'p-1.5 rounded-full min-h-[36px] min-w-[36px] flex items-center justify-center',
            'text-slate-400 hover:text-slate-200',
            'hover:bg-white/10 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500'
          )}
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Filter Button */}
      <button
        onClick={onFilterClick}
        className={cn(
          'relative p-2.5 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center',
          'bg-gradient-to-r from-indigo-500 to-violet-500',
          'hover:from-indigo-600 hover:to-violet-600',
          'shadow-md shadow-indigo-500/30',
          'transition-all duration-300',
          'hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/40',
          'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900'
        )}
        aria-label={`Open filters${filterCount > 0 ? `, ${filterCount} active` : ''}`}
      >
        <SlidersHorizontal className="w-5 h-5 text-white" />
        
        {/* Filter Count Badge */}
        {filterCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 w-5 h-5 rounded-full',
              'bg-pink-500 text-white text-xs font-bold',
              'flex items-center justify-center',
              'shadow-md shadow-pink-500/50',
              'animate-[scale-in_200ms_ease-out]'
            )}
          >
            {filterCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default ModernSearchBar;
