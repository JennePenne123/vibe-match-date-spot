import React from 'react';
import { Compass, Search, Heart, Map, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface ModernBottomNavProps {
  activeId?: string;
  onChange?: (id: string) => void;
  className?: string;
}

const navItems: NavItem[] = [
  { id: 'discover', label: 'Discover', icon: <Compass className="w-6 h-6" /> },
  { id: 'search', label: 'Search', icon: <Search className="w-6 h-6" /> },
  { id: 'favorites', label: 'Favorites', icon: <Heart className="w-6 h-6" /> },
  { id: 'map', label: 'Map', icon: <Map className="w-6 h-6" /> },
  { id: 'profile', label: 'Profile', icon: <User className="w-6 h-6" /> },
];

export const ModernBottomNav: React.FC<ModernBottomNavProps> = ({
  activeId = 'discover',
  onChange,
  className,
}) => {
  return (
    <nav
      className={cn(
        // Base styles
        'flex items-center justify-around',
        // Glass effect
        'backdrop-blur-lg bg-slate-900/90 border-t border-white/10',
        // Safe area padding for mobile
        'pb-safe pt-2',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {navItems.map((item) => {
        const isActive = item.id === activeId;

        return (
          <button
            key={item.id}
            onClick={() => onChange?.(item.id)}
            className={cn(
              // Base styles
              'relative flex flex-col items-center justify-center gap-1',
              'min-w-[64px] min-h-[64px] py-2 px-3',
              // Transitions
              'transition-all duration-300',
              // States
              isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200',
              // Focus
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset rounded-xl'
            )}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Icon Container */}
            <div
              className={cn(
                'relative transition-transform duration-300',
                isActive && 'scale-110'
              )}
            >
              {item.icon}

              {/* Active Glow */}
              {isActive && (
                <div
                  className="absolute inset-0 blur-md opacity-50"
                  style={{ color: 'inherit' }}
                >
                  {item.icon}
                </div>
              )}
            </div>

            {/* Label */}
            <span
              className={cn(
                'text-xs font-medium transition-all duration-300',
                isActive ? 'opacity-100' : 'opacity-70'
              )}
            >
              {item.label}
            </span>

            {/* Active Indicator */}
            {isActive && (
              <div
                className={cn(
                  'absolute bottom-0 left-1/2 -translate-x-1/2',
                  'w-8 h-1 rounded-full',
                  'bg-gradient-to-r from-indigo-500 to-violet-500',
                  'shadow-lg shadow-indigo-500/50',
                  'animate-[scale-in_200ms_ease-out]'
                )}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default ModernBottomNav;
