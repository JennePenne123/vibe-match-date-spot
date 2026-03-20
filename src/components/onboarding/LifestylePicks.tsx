import React from 'react';
import { Sun, Moon, PiggyBank, CreditCard, Crown, Car, Train, Bike, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LifestyleData {
  chronotype: string;
  budget_style: string;
  mobility: string;
}

interface LifestylePicksProps {
  data: LifestyleData;
  onChange: (data: LifestyleData) => void;
}

interface PickOption {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}

interface PickGroup {
  title: string;
  key: keyof LifestyleData;
  options: PickOption[];
}

const groups: PickGroup[] = [
  {
    title: '🕐 Wann bist du aktiv?',
    key: 'chronotype',
    options: [
      { id: 'morning', label: 'Frühaufsteher', icon: Sun, color: 'text-amber-400' },
      { id: 'evening', label: 'Nachteule', icon: Moon, color: 'text-indigo-400' },
    ],
  },
  {
    title: '💰 Budget-Einstellung',
    key: 'budget_style',
    options: [
      { id: 'saver', label: 'Sparfuchs', icon: PiggyBank, color: 'text-green-400' },
      { id: 'balanced', label: 'Ausgewogen', icon: CreditCard, color: 'text-blue-400' },
      { id: 'spender', label: 'Genießer', icon: Crown, color: 'text-amber-400' },
    ],
  },
  {
    title: '🚗 Wie bist du unterwegs?',
    key: 'mobility',
    options: [
      { id: 'car', label: 'Auto', icon: Car, color: 'text-sky-400' },
      { id: 'public_transport', label: 'ÖPNV', icon: Train, color: 'text-violet-400' },
      { id: 'bike', label: 'Fahrrad', icon: Bike, color: 'text-emerald-400' },
      { id: 'walking', label: 'Zu Fuß', icon: Footprints, color: 'text-orange-400' },
    ],
  },
];

const LifestylePicks: React.FC<LifestylePicksProps> = ({ data, onChange }) => {
  const handleSelect = (key: keyof LifestyleData, id: string) => {
    onChange({ ...data, [key]: data[key] === id ? '' : id });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground mb-1.5">
          Dein Lifestyle
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Hilft uns, passende Zeiten und Orte zu finden.
        </p>
      </div>

      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.key}>
            <p className="text-sm font-medium text-foreground/80 mb-2.5">{group.title}</p>
            <div className="flex gap-2 flex-wrap">
              {group.options.map((opt) => {
                const Icon = opt.icon;
                const isActive = data[group.key] === opt.id;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(group.key, opt.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.96]',
                      isActive
                        ? 'bg-primary/10 border-primary/40 text-foreground'
                        : 'bg-card/40 border-border/30 text-muted-foreground hover:bg-card/60'
                    )}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? opt.color : 'text-muted-foreground')} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LifestylePicks;
