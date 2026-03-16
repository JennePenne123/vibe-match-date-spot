import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface FeedbackSummary {
  avgVenueRating: number;
  avgOverallRating: number;
  totalReviews: number;
  wouldRecommend: number;
  recentFeedback: Array<{
    id: string;
    venue_rating: number | null;
    rating: number | null;
    feedback_text: string | null;
    created_at: string;
    would_recommend_venue: boolean | null;
  }>;
  trend: 'up' | 'down' | 'stable';
}

export default function GuestFeedbackCard() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get partner's venue IDs
      const { data: partnerships } = await supabase
        .from('venue_partnerships')
        .select('venue_id')
        .eq('partner_id', user.id)
        .eq('status', 'approved');

      const venueIds = partnerships?.map(p => p.venue_id) || [];
      if (venueIds.length === 0) {
        setSummary(null);
        setLoading(false);
        return;
      }

      // Get invitations for these venues
      const { data: invitations } = await supabase
        .from('date_invitations')
        .select('id')
        .in('venue_id', venueIds)
        .eq('date_status', 'completed');

      const invitationIds = invitations?.map(i => i.id) || [];
      if (invitationIds.length === 0) {
        setSummary({
          avgVenueRating: 0,
          avgOverallRating: 0,
          totalReviews: 0,
          wouldRecommend: 0,
          recentFeedback: [],
          trend: 'stable',
        });
        setLoading(false);
        return;
      }

      // Fetch feedback - need service role or adjusted RLS for partner access
      // For now we use a workaround: partner can see feedback via venue_id on invitations
      const { data: feedback } = await supabase
        .from('date_feedback')
        .select('id, venue_rating, rating, feedback_text, created_at, would_recommend_venue')
        .in('invitation_id', invitationIds)
        .order('created_at', { ascending: false });

      const allFeedback = feedback || [];
      const withVenueRating = allFeedback.filter(f => f.venue_rating != null);
      const withRating = allFeedback.filter(f => f.rating != null);
      const recommenders = allFeedback.filter(f => f.would_recommend_venue === true);

      // Calculate trend (last 30 days vs previous 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recent = withVenueRating.filter(f => new Date(f.created_at) >= thirtyDaysAgo);
      const previous = withVenueRating.filter(f => {
        const d = new Date(f.created_at);
        return d >= sixtyDaysAgo && d < thirtyDaysAgo;
      });

      const recentAvg = recent.length > 0 ? recent.reduce((s, f) => s + (f.venue_rating || 0), 0) / recent.length : 0;
      const prevAvg = previous.length > 0 ? previous.reduce((s, f) => s + (f.venue_rating || 0), 0) / previous.length : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recent.length > 0 && previous.length > 0) {
        if (recentAvg > prevAvg + 0.2) trend = 'up';
        else if (recentAvg < prevAvg - 0.2) trend = 'down';
      }

      setSummary({
        avgVenueRating: withVenueRating.length > 0
          ? withVenueRating.reduce((s, f) => s + (f.venue_rating || 0), 0) / withVenueRating.length
          : 0,
        avgOverallRating: withRating.length > 0
          ? withRating.reduce((s, f) => s + (f.rating || 0), 0) / withRating.length
          : 0,
        totalReviews: allFeedback.length,
        wouldRecommend: allFeedback.length > 0
          ? Math.round((recommenders.length / allFeedback.length) * 100)
          : 0,
        recentFeedback: allFeedback.slice(0, 5),
        trend,
      });
    } catch (error) {
      console.error('Error fetching guest feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              'w-3.5 h-3.5',
              i < Math.round(rating)
                ? 'fill-accent text-accent'
                : 'text-muted-foreground/30'
            )}
          />
        ))}
      </div>
    );
  };

  const TrendIcon = summary?.trend === 'up' ? TrendingUp : summary?.trend === 'down' ? TrendingDown : Minus;
  const trendColor = summary?.trend === 'up' ? 'text-emerald-500' : summary?.trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  if (loading) {
    return (
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="h-[200px] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          {t('partner.feedback.title')}
        </CardTitle>
        <CardDescription>{t('partner.feedback.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-2xl font-bold">
                {summary && summary.avgVenueRating > 0 ? summary.avgVenueRating.toFixed(1) : '–'}
              </span>
              <Star className="w-4 h-4 fill-accent text-accent" />
            </div>
            <p className="text-xs text-muted-foreground">{t('partner.feedback.venueRating')}</p>
          </div>

          <div className="text-center p-3 rounded-xl bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-2xl font-bold">
                {summary && summary.avgOverallRating > 0 ? summary.avgOverallRating.toFixed(1) : '–'}
              </span>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">{t('partner.feedback.dateRating')}</p>
          </div>

          <div className="text-center p-3 rounded-xl bg-muted/50">
            <span className="text-2xl font-bold">{summary?.totalReviews ?? 0}</span>
            <p className="text-xs text-muted-foreground">{t('partner.feedback.totalReviews')}</p>
          </div>

          <div className="text-center p-3 rounded-xl bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-2xl font-bold">
                {summary && summary.wouldRecommend > 0 ? `${summary.wouldRecommend}%` : '–'}
              </span>
              <TrendIcon className={cn('w-4 h-4', trendColor)} />
            </div>
            <p className="text-xs text-muted-foreground">{t('partner.feedback.recommend')}</p>
          </div>
        </div>

        {/* Recent Feedback */}
        {summary && summary.recentFeedback.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t('partner.feedback.recentReviews')}</h4>
            {summary.recentFeedback.map(fb => (
              <div key={fb.id} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  {fb.venue_rating != null && renderStars(fb.venue_rating)}
                  <span className="text-xs text-muted-foreground">
                    {new Date(fb.created_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
                {fb.feedback_text && (
                  <p className="text-sm text-muted-foreground italic">"{fb.feedback_text}"</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t('partner.feedback.noFeedback')}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{t('partner.feedback.noFeedbackDesc')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
