import React from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal } from 'lucide-react';
import { getCategoryPriorityProfile } from '@/lib/categoryWizardConfig';
import type { SituationalCategoryId } from '@/lib/situationalCategories';
import { getCategoryIcon } from '@/components/category/CategoryIcon';
import { cn } from '@/lib/utils';

interface Props {
  categoryId: SituationalCategoryId | null | undefined;
  className?: string;
}

/**
 * One-line explanation of what the active category optimizes for.
 * Keeps the weighting transparent instead of hiding it in the scoring.
 */
const CategoryPriorityHint: React.FC<Props> = ({ categoryId, className }) => {
  const { t } = useTranslation();
  if (!categoryId) return null;

  const profile = getCategoryPriorityProfile(categoryId);
  const Icon = getCategoryIcon(categoryId) ?? SlidersHorizontal;

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5',
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t(profile.summaryKey)}
      </p>
    </div>
  );
};

export default CategoryPriorityHint;
