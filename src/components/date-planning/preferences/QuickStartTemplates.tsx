import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { QuickStartTemplate } from './preferencesData';

interface LearnedTemplate {
  id: string;
  title: string;
  emoji: string;
  cuisines: string[];
  vibes: string[];
  priceRange: string[];
  timePreferences: string[];
}

interface Props {
  templates: QuickStartTemplate[];
  learnedTemplate: LearnedTemplate | null;
  isTemplateActive: (t: { id: string; cuisines: string[]; vibes: string[]; priceRange: string[]; timePreferences: string[] }) => boolean;
  onApplyTemplate: (t: QuickStartTemplate) => void;
  onApplyLearnedTemplate: (t: LearnedTemplate) => void;
}

const QuickStartTemplates: React.FC<Props> = ({ templates, learnedTemplate, isTemplateActive, onApplyTemplate, onApplyLearnedTemplate }) => {
  const { t } = useTranslation();
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('preferences.quickStart')}</p>
      <div className="flex flex-wrap gap-2">
        {learnedTemplate && (
          <button
            type="button" onClick={() => onApplyLearnedTemplate(learnedTemplate)}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm select-none transition-all duration-200 active:scale-[0.97]',
              isTemplateActive(learnedTemplate)
                ? 'border-primary/50 bg-primary/5 text-primary font-medium shadow-md shadow-primary/15'
                : 'border-border/60 bg-card text-foreground shadow-sm shadow-foreground/5 hover:border-primary/25'
            )}
          >
            <span>{learnedTemplate.emoji}</span>
            <span className="font-medium">{learnedTemplate.title}</span>
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">KI</Badge>
            {isTemplateActive(learnedTemplate) && (
              <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
              </span>
            )}
          </button>
        )}
        {templates.map(tmpl => (
          <button
            key={tmpl.id} type="button" onClick={() => onApplyTemplate(tmpl)}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm select-none transition-all duration-200 active:scale-[0.97]',
              isTemplateActive(tmpl)
                ? 'border-primary/50 bg-primary/5 text-primary font-medium shadow-md shadow-primary/15'
                : 'border-border/60 bg-card text-foreground shadow-sm shadow-foreground/5 hover:border-primary/25'
            )}
          >
            <span>{tmpl.emoji}</span>
            <span className="font-medium">{t(tmpl.title)}</span>
            {isTemplateActive(tmpl) && (
              <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickStartTemplates;
