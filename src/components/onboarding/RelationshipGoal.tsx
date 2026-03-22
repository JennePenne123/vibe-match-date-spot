import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Users, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

const goalConfigs = [
  {
    id: 'romantic',
    labelKey: 'onboarding.goalRomantic',
    descKey: 'onboarding.goalRomanticDesc',
    icon: Heart,
    color: 'text-pink-400',
    bgActive: 'bg-pink-500/15 border-pink-500/40',
    ring: 'ring-pink-400/30',
  },
  {
    id: 'friends',
    labelKey: 'onboarding.goalFriends',
    descKey: 'onboarding.goalFriendsDesc',
    icon: Users,
    color: 'text-sky-400',
    bgActive: 'bg-sky-500/15 border-sky-500/40',
    ring: 'ring-sky-400/30',
  },
  {
    id: 'networking',
    labelKey: 'onboarding.goalNetworking',
    descKey: 'onboarding.goalNetworkingDesc',
    icon: Briefcase,
    color: 'text-amber-400',
    bgActive: 'bg-amber-500/15 border-amber-500/40',
    ring: 'ring-amber-400/30',
  },
];

interface RelationshipGoalProps {
  selected: string;
  onChange: (goal: string) => void;
}

const RelationshipGoal: React.FC<RelationshipGoalProps> = ({ selected, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground mb-1.5">
          {t('onboarding.goalTitle')}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('onboarding.goalSubtitle')}
        </p>
      </div>

      <div className="space-y-3">
        {goalConfigs.map((goal) => {
          const Icon = goal.icon;
          const isActive = selected === goal.id;

          return (
            <button
              key={goal.id}
              onClick={() => onChange(goal.id)}
              className={cn(
                'w-full flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200 active:scale-[0.97]',
                isActive
                  ? `${goal.bgActive} ring-1 ${goal.ring}`
                  : 'bg-card/40 border-border/30 hover:bg-card/60'
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                isActive ? goal.bgActive : 'bg-muted/30'
              )}>
                <Icon className={cn('w-6 h-6', isActive ? goal.color : 'text-muted-foreground')} />
              </div>
              <div className="text-left">
                <p className={cn(
                  'font-semibold text-sm',
                  isActive ? 'text-foreground' : 'text-foreground/80'
                )}>
                  {t(goal.labelKey)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(goal.descKey)}
                </p>
              </div>
              {isActive && (
                <div className={cn('ml-auto w-5 h-5 rounded-full flex items-center justify-center', goal.bgActive)}>
                  <div className={cn('w-2.5 h-2.5 rounded-full', goal.color.replace('text-', 'bg-'))} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RelationshipGoal;
