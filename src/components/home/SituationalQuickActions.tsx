import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { SITUATIONAL_CATEGORIES, type SituationalCategoryId } from '@/lib/situationalCategories';
import { cn } from '@/lib/utils';

/**
 * Home Quick-Action grid for situational planning.
 * Tapping a card navigates to the preferences flow with the category
 * pre-selected as an ephemeral session filter (NOT persisted to user prefs).
 */
const SituationalQuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCategoryClick = (categoryId: SituationalCategoryId) => {
    navigate(`/preferences?category=${categoryId}`);
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
