import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { type SituationalCategory } from '@/lib/situationalCategories';
import { cn } from '@/lib/utils';

interface Props {
  category: SituationalCategory;
  onClear: () => void;
}

/**
 * Compact banner shown at the top of the preferences/plan flow when the user
 * arrived via a Home situational quick-action. Indicates the active "today's
 * intent" filter and lets the user clear it.
 */
const SituationalActiveBanner: React.FC<Props> = ({ category, onClear }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-xl border border-primary/30 bg-gradient-to-br p-3 flex items-center gap-3',
        category.gradient
      )}
      role="status"
      aria-live="polite"
    >
      <div className="text-2xl shrink-0" aria-hidden>{category.emoji}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          {t('preferences.situationalBannerLabel')}
        </p>
        <p className="text-sm font-medium text-foreground truncate">
          {t(category.labelKey)}
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        aria-label={t('preferences.situationalBannerClear')}
        className="shrink-0 p-1.5 rounded-lg hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default SituationalActiveBanner;
