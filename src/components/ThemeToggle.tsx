import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const themeConfig = {
  system: { icon: Monitor, label: 'System theme', next: 'light' },
  light: { icon: Sun, label: 'Light mode', next: 'dark' },
  dark: { icon: Moon, label: 'Dark mode', next: 'system' },
} as const;

type ThemeKey = keyof typeof themeConfig;

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
        <Sun className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }

  const currentTheme = (theme as ThemeKey) || 'system';
  const config = themeConfig[currentTheme] || themeConfig.system;
  const Icon = config.icon;

  const cycleTheme = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setTheme(config.next);
      setTimeout(() => setIsAnimating(false), 400);
    }, 200);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          className="h-9 w-9 hover:bg-accent"
          aria-label={`Current: ${config.label}. Click to switch.`}
        >
          <div className="relative h-4 w-4">
            <Icon
              className={cn(
                'absolute inset-0 h-4 w-4 text-foreground',
                isAnimating ? 'animate-spin-out' : 'animate-spin-in'
              )}
            />
          </div>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{config.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default ThemeToggle;
