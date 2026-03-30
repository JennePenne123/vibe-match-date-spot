import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import FairnessBadge, { type FairnessLevel } from './FairnessBadge';

interface MemberScore {
  name: string;
  avatarUrl?: string | null;
  score: number; // 0-1
}

interface ConsensusScoreDetailProps {
  memberScores: MemberScore[];
  qualityLabel: FairnessLevel;
  finalScore: number; // 0-1
  harmonyBonus: number;
  className?: string;
}

const ConsensusScoreDetail: React.FC<ConsensusScoreDetailProps> = ({
  memberScores,
  qualityLabel,
  finalScore,
  harmonyBonus,
  className,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn('rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden', className)}>
      {/* Summary row – always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Gruppen-Score: {Math.round(finalScore * 100)}%
            </p>
            <FairnessBadge qualityLabel={qualityLabel} size="sm" />
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-2">
          {memberScores.map((member, i) => {
            const pct = Math.round(member.score * 100);
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 truncate">
                  {member.name}
                </span>
                <Progress value={pct} className="h-1.5 flex-1" />
                <span className={cn(
                  'text-xs font-medium w-10 text-right',
                  pct >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                  pct >= 50 ? 'text-amber-600 dark:text-amber-400' :
                  'text-destructive'
                )}>
                  {pct}%
                </span>
              </div>
            );
          })}
          {harmonyBonus > 0 && (
            <p className="text-[10px] text-primary mt-1">
              +{Math.round(harmonyBonus * 100)}% Harmonie-Bonus (alle ähnlich zufrieden)
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsensusScoreDetail;
