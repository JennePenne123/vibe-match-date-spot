import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import {
  SITUATIONAL_CATEGORIES,
  type SituationalCategory,
  type SituationalCategoryId,
} from '@/lib/situationalCategories';
import { cn } from '@/lib/utils';
import CategoryIcon from '@/components/category/CategoryIcon';

interface Props {
  /** The primary category (already selected on Home) — excluded from the picker */
  primary: SituationalCategory;
  /** Currently selected secondary category id, or null */
  secondaryId: SituationalCategoryId | null;
  onChange: (id: SituationalCategoryId | null) => void;
}

/**
 * "Danach noch …?" — optional second situational category that combines with
 * the primary one (selected via the Home quick-actions). Shown inside the
 * Preferences wizard, below the active situational banner.
 */
const SecondaryCategoryPicker: React.FC<Props> = ({ primary, secondaryId, onChange }) => {
  const { t } = useTranslation();
  const options = SITUATIONAL_CATEGORIES.filter(c => c.id !== primary.id);

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm shadow-foreground/5 p-3.5 space-y-2.5">
      <div className="flex items-center gap-2">
        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {t('preferences.secondaryCategoryTitle')}
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {t('preferences.secondaryCategorySubtitle')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const active = secondaryId === opt.id;
          return (
            <motion.button
              key={opt.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange(active ? null : opt.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                active
                  ? 'border-primary/50 bg-primary/5 text-primary shadow-md shadow-primary/15'
                  : 'border-border/60 bg-card text-muted-foreground shadow-sm shadow-foreground/5 hover:text-foreground hover:border-primary/25',
              )}
              aria-pressed={active}
            >
              {['wellness', 'outdoor', 'sport_action'].includes(opt.id) ? (
                <CategoryIcon categoryId={opt.id} className="h-5 w-5 rounded-full border-0 bg-transparent" iconClassName="h-3.5 w-3.5" />
              ) : (
                <span aria-hidden>{opt.emoji}</span>
              )}
              <span>{t(opt.labelKey)}</span>
              <AnimatePresence>
                {active && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="inline-flex items-center overflow-hidden"
                    aria-label={t('preferences.secondaryCategoryClear')}
                  >
                    <X className="w-3 h-3 ml-0.5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SecondaryCategoryPicker;