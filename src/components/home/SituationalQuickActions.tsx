import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, User, Users, UsersRound } from 'lucide-react';
import { SITUATIONAL_CATEGORIES, type SituationalCategoryId } from '@/lib/situationalCategories';
import { cn } from '@/lib/utils';

type PlanMode = 'solo' | 'single' | 'group';

const MODES: { id: PlanMode; icon: React.ElementType; labelKey: string }[] = [
  { id: 'solo', icon: User, labelKey: 'home.situational.modeSolo' },
  { id: 'single', icon: Users, labelKey: 'home.situational.modeDuo' },
  { id: 'group', icon: UsersRound, labelKey: 'home.situational.modeGroup' },
];

/**
 * Home Quick-Action grid for situational planning.
 * A mode switch (Solo / Duo / Group) decides where the category leads:
 * solo goes straight to the preferences flow, duo/group open the planner
 * with the matching step pre-selected. The category stays an ephemeral
 * session filter (NOT persisted to user prefs).
 */
const SituationalQuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState<PlanMode>('solo');

  const handleCategoryClick = (categoryId: SituationalCategoryId) => {
    if (mode === 'solo') {
      navigate(`/preferences?category=${categoryId}`);
      return;
    }
    try {
      window.sessionStorage.setItem('hioutz-situational-category', categoryId);
    } catch {}
    navigate(`/plan-date?mode=${mode}`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      aria-labelledby="situational-heading"
      className="space-y-3"
    >
      <div className="px-1">
        <h2
          id="situational-heading"
          className="text-base font-semibold text-foreground leading-tight"
        >
          {t('home.situational.sectionTitle')}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('home.situational.sectionSubtitle')}
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label={t('home.situational.modeLabel')}
        className="flex gap-2 p-1 rounded-2xl bg-muted/40 border border-border/50"
      >
        {MODES.map(({ id, icon: Icon, labelKey }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={mode === id}
            onClick={() => setMode(id)}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              mode === id
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'text-muted-foreground border border-transparent hover:text-foreground'
            )}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden />
            <span className="truncate">{t(labelKey)}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SITUATIONAL_CATEGORIES.map((cat, i) => (
          <motion.button
            key={cat.id}
            type="button"
            onClick={() => handleCategoryClick(cat.id)}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.2 + i * 0.05 }}
            whileTap={{ scale: 0.97 }}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
            aria-label={t(cat.labelKey)}
          >
            <Card
              className={cn(
                'relative overflow-hidden border-border/50 hover:border-primary/40 transition-all duration-300 h-full bg-gradient-to-br',
                cat.gradient
              )}
            >
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
              <CardContent className="relative p-4 flex flex-col h-full min-h-[110px]">
                <div className="text-2xl mb-1.5" aria-hidden>{cat.emoji}</div>
                <h3 className="text-sm font-semibold text-foreground leading-tight">
                  {t(cat.labelKey)}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                  {t(cat.descKey)}
                </p>
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-auto self-end opacity-70" />
              </CardContent>
            </Card>
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
};

export default SituationalQuickActions;
