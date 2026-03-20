import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Zap, CalendarCheck, Mountain, Sofa, Users, User } from 'lucide-react';

export interface PersonalityTraits {
  spontaneity: number;
  adventure: number;
  social_energy: number;
}

interface PersonalitySlidersProps {
  traits: PersonalityTraits;
  onChange: (traits: PersonalityTraits) => void;
}

const sliderConfig = [
  {
    key: 'spontaneity' as const,
    leftLabel: 'Planer',
    rightLabel: 'Spontan',
    leftIcon: CalendarCheck,
    rightIcon: Zap,
    leftColor: 'text-blue-400',
    rightColor: 'text-amber-400',
    gradient: 'from-blue-500/20 to-amber-500/20',
  },
  {
    key: 'adventure' as const,
    leftLabel: 'Gemütlich',
    rightLabel: 'Abenteuerlich',
    leftIcon: Sofa,
    rightIcon: Mountain,
    leftColor: 'text-emerald-400',
    rightColor: 'text-rose-400',
    gradient: 'from-emerald-500/20 to-rose-500/20',
  },
  {
    key: 'social_energy' as const,
    leftLabel: 'Introvertiert',
    rightLabel: 'Gesellig',
    leftIcon: User,
    rightIcon: Users,
    leftColor: 'text-violet-400',
    rightColor: 'text-orange-400',
    gradient: 'from-violet-500/20 to-orange-500/20',
  },
];

const PersonalitySliders: React.FC<PersonalitySlidersProps> = ({ traits, onChange }) => {
  const handleChange = (key: keyof PersonalityTraits, value: number[]) => {
    onChange({ ...traits, [key]: value[0] });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground mb-1.5">
          Deine Date-Persönlichkeit
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Wo siehst du dich? Es gibt kein richtig oder falsch.
        </p>
      </div>

      <div className="space-y-6">
        {sliderConfig.map((config) => {
          const LeftIcon = config.leftIcon;
          const RightIcon = config.rightIcon;
          const value = traits[config.key];

          return (
            <div
              key={config.key}
              className={`rounded-2xl bg-gradient-to-r ${config.gradient} border border-border/20 p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <LeftIcon className={`w-4 h-4 ${config.leftColor}`} />
                  <span className={`text-xs font-medium ${config.leftColor}`}>
                    {config.leftLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${config.rightColor}`}>
                    {config.rightLabel}
                  </span>
                  <RightIcon className={`w-4 h-4 ${config.rightColor}`} />
                </div>
              </div>

              <Slider
                value={[value]}
                onValueChange={(v) => handleChange(config.key, v)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PersonalitySliders;
