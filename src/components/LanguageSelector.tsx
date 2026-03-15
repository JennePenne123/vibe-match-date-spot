import React from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '@/i18n';
import { Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-foreground">
          <Globe className="w-4 h-4 text-primary" />
          {t('settings.language')}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('settings.languageDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {languages.map((lang) => {
            const isActive = i18n.language === lang.code || i18n.language?.startsWith(lang.code);
            return (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 text-left ${
                  isActive
                    ? 'border-primary/50 bg-primary/10 text-primary shadow-sm'
                    : 'border-border/50 text-foreground hover:bg-accent/50 hover:border-border'
                }`}
              >
                <span className="text-lg leading-none">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageSelector;
