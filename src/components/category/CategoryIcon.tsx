import React from 'react';
import { Dumbbell, Flower2, TreePine, type LucideIcon } from 'lucide-react';
import type { SituationalCategoryId } from '@/lib/situationalCategories';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS: Partial<Record<SituationalCategoryId, LucideIcon>> = {
  wellness: Flower2,
  outdoor: TreePine,
  sport_action: Dumbbell,
};

interface CategoryIconProps {
  categoryId: SituationalCategoryId;
  className?: string;
  iconClassName?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoryId,
  className,
  iconClassName,
}) => {
  const Icon = CATEGORY_ICONS[categoryId];
  if (!Icon) return null;

  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary',
        className,
      )}
      aria-hidden
    >
      <Icon className={cn('h-4.5 w-4.5', iconClassName)} />
    </span>
  );
};

export function getCategoryIcon(categoryId: SituationalCategoryId): LucideIcon | null {
  return CATEGORY_ICONS[categoryId] ?? null;
}

export default CategoryIcon;