import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Handshake, Ban } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { GroupCompromiseInfo, CompromiseGroup } from '@/services/aiVenueService/groupCompromise';

interface GroupCompromiseCardProps {
  info: GroupCompromiseInfo;
  className?: string;
}

const humanize = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const GroupCompromiseCard: React.FC<GroupCompromiseCardProps> = ({ info, className }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const groups = info.groups.filter(g => g.applied.length > 0);
  if (!groups.length && !info.vetoed.length) return null;

  const kindLabel = (kind: CompromiseGroup['kind']) =>
    kind === 'cuisines' ? t('results.compromise.kindCuisines') : t('results.compromise.kindVenueTypes');

  const strategyLabel = (g: CompromiseGroup) => {
    if (g.strategy === 'shared') return t('results.compromise.strategyShared');
    if (g.strategy === 'union') return t('results.compromise.strategyUnion');
    return t('results.compromise.strategySingle');
  };

  const strategyDesc = (g: CompromiseGroup) => {
    if (g.strategy === 'shared') return t('results.compromise.strategySharedDesc');
    if (g.strategy === 'union') return t('results.compromise.strategyUnionDesc');
    return t('results.compromise.strategySingleDesc');
  };

  const summary = groups.length
    ? groups.map(g => `${kindLabel(g.kind)}: ${strategyLabel(g)}`).join(' · ')
    : t('results.compromise.vetoOnly');

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden', className)}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Handshake className="w-4 h-4 text-primary" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {info.collaborative
                ? t('results.compromise.title')
                : t('results.compromise.titleSolo')}
            </p>
            <p className="text-xs text-muted-foreground truncate">{summary}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-2 space-y-3 border-t border-border/30">
          {groups.map((g, i) => (
            <div key={i} className="space-y-1">
              <p className="text-xs font-semibold text-foreground">
                {kindLabel(g.kind)} — {strategyLabel(g)}
              </p>
              <p className="text-[11px] text-muted-foreground">{strategyDesc(g)}</p>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {g.applied.map(v => (
                  <span
                    key={v}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                  >
                    {humanize(v)}
                  </span>
                ))}
              </div>
              {info.collaborative && (
                <p className="text-[10px] text-muted-foreground pt-0.5">
                  {t('results.compromise.picks', {
                    you: g.userPicks.map(humanize).join(', ') || t('results.compromise.noPick'),
                    partner: g.partnerPicks.map(humanize).join(', ') || t('results.compromise.noPick'),
                  })}
                </p>
              )}
            </div>
          ))}

          {info.vetoed.length > 0 && (
            <div className="space-y-1 border-t border-border/30 pt-2">
              <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                <Ban className="w-3.5 h-3.5" aria-hidden />
                {t('results.compromise.vetoTitle')}
              </p>
              <p className="text-[11px] text-muted-foreground">{t('results.compromise.vetoDesc')}</p>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {info.vetoed.map(v => (
                  <span
                    key={v}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium line-through"
                  >
                    {humanize(v)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default GroupCompromiseCard;
