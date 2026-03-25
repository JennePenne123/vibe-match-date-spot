import React from 'react';
import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PremiumBadgeProps {
  premiumUntil?: string | null;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

/**
 * Displays a golden Premium badge if the user has an active premium subscription.
 * Automatically checks premium_until date.
 */
const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  premiumUntil,
  size = 'sm',
  showLabel = true,
  className = '',
}) => {
  if (!premiumUntil) return null;
  const isPremium = new Date(premiumUntil) > new Date();
  if (!isPremium) return null;

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-amber-400/30 shadow-sm shadow-amber-500/20 gap-1 px-2 py-0.5 text-[11px] font-bold ${className}`}
          >
            <Crown className={iconSize} />
            {showLabel && 'Premium'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Premium bis {new Date(premiumUntil).toLocaleDateString('de-DE')}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PremiumBadge;
