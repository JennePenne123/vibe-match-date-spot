import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, X, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DISMISSED_KEY = 'feedback_impact_dismissed_at';

const FeedbackImpactBanner: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [recentCount, setRecentCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const checkRecentFeedback = async () => {
      const dismissedAt = localStorage.getItem(DISMISSED_KEY);
      const since = dismissedAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('date_feedback')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gt('created_at', since);

      if (!error && data && data.length > 0) {
        setRecentCount(data.length);
        setVisible(true);
      }
    };

    checkRecentFeedback();
  }, [user]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
  };

  if (!visible) return null;

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/5">
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-8 translate-x-8" />
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/15 shrink-0">
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {t('home.feedbackImpactTitle', 'Empfehlungen verbessert!')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('home.feedbackImpactDesc', {
              count: recentCount,
              defaultValue: 'Dein Feedback ({{count}}x) hat die KI-Gewichtungen angepasst — deine nächsten Vorschläge sind präziser.',
            })}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackImpactBanner;
