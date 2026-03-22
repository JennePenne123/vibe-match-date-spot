
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserPreferences {
  preferred_cuisines: string[];
  preferred_price_range: string[];
  preferred_times: string[];
  preferred_vibes: string[];
  max_distance: number;
  dietary_restrictions: string[];
}

interface CompatibilitySummaryProps {
  myPreferences: UserPreferences;
  partnerPreferences: UserPreferences;
}

const CompatibilitySummary: React.FC<CompatibilitySummaryProps> = ({
  myPreferences,
  partnerPreferences
}) => {
  const { t } = useTranslation();

  const getMatchingItems = (myItems: string[], partnerItems: string[]) => {
    return myItems.filter(item => partnerItems.includes(item));
  };

  const hasMyPreferences = 
    (myPreferences.preferred_cuisines?.length > 0) ||
    (myPreferences.preferred_vibes?.length > 0) ||
    (myPreferences.preferred_times?.length > 0) ||
    (myPreferences.preferred_price_range?.length > 0);

  const hasPartnerPreferences = 
    (partnerPreferences.preferred_cuisines?.length > 0) ||
    (partnerPreferences.preferred_vibes?.length > 0) ||
    (partnerPreferences.preferred_times?.length > 0) ||
    (partnerPreferences.preferred_price_range?.length > 0);

  if (!hasMyPreferences && !hasPartnerPreferences) {
    return (
      <Card className="bg-muted/30 border-border">
        <CardHeader>
          <CardTitle className="text-muted-foreground">{t('compatibility.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            {t('compatibility.noPreferences')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!hasMyPreferences || !hasPartnerPreferences) {
    return (
      <Card className="bg-accent/30 border-accent">
        <CardHeader>
          <CardTitle className="text-accent-foreground">{t('compatibility.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-accent-foreground">
            {!hasMyPreferences ? t('compatibility.youMissing') : t('compatibility.partnerMissing')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="text-primary">{t('compatibility.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-primary">
              {getMatchingItems(myPreferences.preferred_cuisines, partnerPreferences.preferred_cuisines).length}
            </div>
            <div className="text-xs text-muted-foreground">{t('compatibility.cuisineMatches')}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">
              {getMatchingItems(myPreferences.preferred_vibes, partnerPreferences.preferred_vibes).length}
            </div>
            <div className="text-xs text-muted-foreground">{t('compatibility.vibeMatches')}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">
              {getMatchingItems(myPreferences.preferred_times, partnerPreferences.preferred_times).length}
            </div>
            <div className="text-xs text-muted-foreground">{t('compatibility.timeMatches')}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">
              {getMatchingItems(myPreferences.preferred_price_range, partnerPreferences.preferred_price_range).length}
            </div>
            <div className="text-xs text-muted-foreground">{t('compatibility.priceMatches')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompatibilitySummary;
