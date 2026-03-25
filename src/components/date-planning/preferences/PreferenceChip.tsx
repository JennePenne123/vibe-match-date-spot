import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Preference } from './preferencesData';

interface ChipProps {
  item: Preference;
  selected: boolean;
  onPress: () => void;
}

export const Chip: React.FC<ChipProps> = ({ item, selected, onPress }) => (
  <button
    type="button" onClick={onPress}
    style={{ WebkitTapHighlightColor: 'transparent' }}
    className={cn(
      'inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-colors select-none active:scale-[0.97]',
      selected ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/30'
    )}
  >
    <span>{item.emoji}</span>
    <span className="font-medium">{item.name}</span>
    {selected && <Check className="w-3 h-3 ml-0.5 text-primary" />}
  </button>
);

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
  <div className="border border-border rounded-xl overflow-hidden bg-card">
    <button
      type="button" onClick={onToggle}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className="flex items-center gap-3 w-full p-3.5 text-left select-none active:scale-[0.98] transition-transform"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{summary}</p>
      </div>
      {count > 0 && <Badge variant="secondary" className="text-xs h-5 px-1.5 flex-shrink-0">{count}</Badge>}
      <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0', open && 'rotate-180')} />
    </button>
    <div className={cn('grid transition-all duration-200', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
      <div className="overflow-hidden">
        <div className="px-3.5 pb-3.5 pt-1">{children}</div>
      </div>
    </div>
  </div>
);
