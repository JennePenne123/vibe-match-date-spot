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
              'inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm select-none active:scale-[0.97] transition-transform',
              isTemplateActive(learnedTemplate) ? 'border-primary bg-primary/10' : 'border-border bg-card'
            )}
          >
            <span>{learnedTemplate.emoji}</span>
            <span className="font-medium">{learnedTemplate.title}</span>
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">KI</Badge>
            {isTemplateActive(learnedTemplate) && <Check className="w-3 h-3" />}
          </button>
        )}
        {templates.map(tmpl => (
          <button
            key={tmpl.id} type="button" onClick={() => onApplyTemplate(tmpl)}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm select-none active:scale-[0.97] transition-transform',
              isTemplateActive(tmpl) ? 'border-primary bg-primary/10' : 'border-border bg-card'
            )}
          >
            <span>{tmpl.emoji}</span>
            <span className="font-medium">{t(tmpl.title)}</span>
            {isTemplateActive(tmpl) && <Check className="w-3 h-3" />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickStartTemplates;
