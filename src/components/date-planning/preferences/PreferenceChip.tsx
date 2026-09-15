import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { Preference } from './preferencesData';

interface ChipProps {
  item: Preference;
  selected: boolean;
  onPress: () => void;
}

export const Chip: React.FC<ChipProps> = ({ item, selected, onPress }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button" onClick={onPress}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-all duration-200 select-none active:scale-[0.97]',
        selected
          ? 'border-primary/50 bg-primary/10 text-primary shadow-sm shadow-primary/15 font-semibold'
          : 'border-border/60 bg-card text-muted-foreground shadow-sm shadow-foreground/5 hover:border-primary/30'
      )}
    >
      <span>{item.emoji}</span>
      <span className="font-medium">{t(item.name)}</span>
      {selected && <Check className="w-3 h-3 ml-0.5 text-primary" strokeWidth={3} />}
    </button>
  );
};

interface ChipGridProps {
  items: Preference[];
  selected: string[];
  onToggle: (id: string) => void;
}

export const ChipGrid: React.FC<ChipGridProps> = ({ items, selected, onToggle }) => (
  <div className="flex flex-wrap gap-2">
    {items.map(item => (
      <Chip key={item.id} item={item} selected={selected.includes(item.id)} onPress={() => onToggle(item.id)} />
    ))}
  </div>
);

interface SectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  summary: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ id, icon, title, summary, count, open, onToggle, children }) => (
  <div className="rounded-2xl border border-border/70 bg-card shadow-sm shadow-foreground/5 overflow-hidden">
    <button
      type="button" onClick={onToggle}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className="flex items-center gap-3 w-full p-3.5 text-left select-none active:scale-[0.99] transition-transform"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center [&_svg]:w-[18px] [&_svg]:h-[18px]">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{summary}</p>
      </div>
      {count > 0 && <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full flex-shrink-0">{count}</span>}
      <div className={cn('w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 transition-transform duration-200', open && 'rotate-180')}>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
    <div className={cn('grid transition-all duration-200', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
      <div className="overflow-hidden">
        <div className="px-3.5 pb-3.5 pt-1">{children}</div>
      </div>
    </div>
  </div>
);
