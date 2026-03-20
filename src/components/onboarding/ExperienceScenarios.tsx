import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface Scenario {
  id: string;
  question: string;
  optionA: { label: string; emoji: string; tags: string[] };
  optionB: { label: string; emoji: string; tags: string[] };
}

const scenarios: Scenario[] = [
  {
    id: 'scene1',
    question: 'Freitagabend — was klingt besser?',
    optionA: { label: 'Cocktailbar', emoji: '🍸', tags: ['nightlife', 'cocktails'] },
    optionB: { label: 'Kochabend zuhause', emoji: '👨‍🍳', tags: ['casual', 'dining'] },
  },
  {
    id: 'scene2',
    question: 'Samstagmittag — wohin?',
    optionA: { label: 'Street-Food-Markt', emoji: '🌮', tags: ['outdoor', 'casual'] },
    optionB: { label: 'Brunch-Restaurant', emoji: '🥞', tags: ['dining', 'brunch'] },
  },
  {
    id: 'scene3',
    question: 'Perfektes Wochenende?',
    optionA: { label: 'Wanderung & Picknick', emoji: '🏔️', tags: ['outdoor', 'adventurous'] },
    optionB: { label: 'Museum & Café', emoji: '🎨', tags: ['cultural', 'casual'] },
  },
  {
    id: 'scene4',
    question: 'Abends ausgehen — lieber...',
    optionA: { label: 'Live-Musik & Bier', emoji: '🎸', tags: ['nightlife', 'live_music'] },
    optionB: { label: 'Rooftop-Dinner', emoji: '🌃', tags: ['romantic', 'upscale'] },
  },
];

export interface ScenarioAnswers {
  [scenarioId: string]: 'a' | 'b';
}

interface ExperienceScenariosProps {
  answers: ScenarioAnswers;
  onChange: (answers: ScenarioAnswers) => void;
}

const ExperienceScenarios: React.FC<ExperienceScenariosProps> = ({ answers, onChange }) => {
  const handleSelect = (scenarioId: string, choice: 'a' | 'b') => {
    onChange({ ...answers, [scenarioId]: answers[scenarioId] === choice ? undefined as any : choice });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground mb-1.5">
          Dies oder das?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Wähle, was dich mehr anspricht — oder überspring es.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => {
          const chosen = answers[scenario.id];

          return (
            <div key={scenario.id} className="space-y-2">
              <p className="text-sm font-medium text-foreground/80 text-center">
                {scenario.question}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {(['a', 'b'] as const).map((side) => {
                  const opt = side === 'a' ? scenario.optionA : scenario.optionB;
                  const isActive = chosen === side;

                  return (
                    <button
                      key={side}
                      onClick={() => handleSelect(scenario.id, side)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-2xl border p-4 transition-all duration-200 active:scale-[0.96]',
                        isActive
                          ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20'
                          : 'bg-card/40 border-border/30 hover:bg-card/60'
                      )}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <span className="text-3xl">{opt.emoji}</span>
                      <span className={cn(
                        'text-sm font-medium',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExperienceScenarios;
export { scenarios };
