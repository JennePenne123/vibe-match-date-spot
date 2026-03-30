import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VetoFeedbackBannerProps {
  vetoedCount: number;
  vetoedCuisines?: string[];
  dietaryRestrictions?: string[];
  totalVenues?: number;
  className?: string;
}

const VetoFeedbackBanner: React.FC<VetoFeedbackBannerProps> = ({
  vetoedCount,
  vetoedCuisines = [],
  dietaryRestrictions = [],
  totalVenues,
  className,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (vetoedCount === 0 && vetoedCuisines.length === 0 && dietaryRestrictions.length === 0) {
    return null;
  }

  const hasDetails = vetoedCuisines.length > 0 || dietaryRestrictions.length > 0;

  return (
    <div className={cn(
      'rounded-xl border border-amber-500/30 bg-amber-500/10 p-3',
      className,
    )}>
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={cn(
          'w-full flex items-start gap-2.5 text-left',
          hasDetails && 'cursor-pointer'
        )}
      >
        <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
            {vetoedCount > 0
              ? `${vetoedCount} Venue${vetoedCount > 1 ? 's' : ''} ausgeschlossen`
              : 'Veto-Schutz aktiv'}
            {totalVenues ? ` (von ${totalVenues})` : ''}
          </p>
          <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
            Basierend auf Allergien & Präferenzen der Gruppe
          </p>
        </div>
        {hasDetails && (
          expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
            : <ChevronDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
        )}
      </button>

      {expanded && hasDetails && (
        <div className="mt-2 ml-9 space-y-1.5 text-[10px]">
          {dietaryRestrictions.length > 0 && (
            <div>
              <span className="font-medium text-amber-700 dark:text-amber-300">Diät-Einschränkungen: </span>
              <span className="text-amber-600/80 dark:text-amber-400/80">
                {dietaryRestrictions.join(', ')}
              </span>
            </div>
          )}
          {vetoedCuisines.length > 0 && (
            <div>
              <span className="font-medium text-amber-700 dark:text-amber-300">Ausgeschlossene Küchen: </span>
              <span className="text-amber-600/80 dark:text-amber-400/80">
                {vetoedCuisines.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VetoFeedbackBanner;
