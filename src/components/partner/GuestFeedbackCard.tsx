import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, MessageSquare, TrendingUp, TrendingDown, Minus, Bell, BarChart3, PieChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface FeedbackEntry {
  id: string;
  venue_rating: number | null;
  rating: number | null;
  ai_accuracy_rating: number | null;
  feedback_text: string | null;
  created_at: string;
  would_recommend_venue: boolean | null;
  venue_id?: string;
  venue_name?: string;
}

interface VenueAggregate {
  venue_id: string;
  venue_name: string;
  avgVenueRating: number;
  avgOverallRating: number;
  reviewCount: number;
  recommendRate: number;
}

interface TrendPoint {
  month: string;
  venueRating: number;
  overallRating: number;
  count: number;
}

interface CategoryBreakdown {
  name: string;
  avg: number;
  count: number;
  color: string;
}

export default function GuestFeedbackCard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [allFeedback, setAllFeedback] = useState<FeedbackEntry[]>([]);
  const [venueMap, setVenueMap] = useState<Record<string, string>>({});
  const [invitationVenueMap, setInvitationVenueMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);

  const handleNewFeedback = useCallback(() => {
    setNewCount(prev => prev + 1);
    fetchFeedback();
    toast({
      title: t('partner.feedback.newReviewTitle', 'Neue Bewertung! ⭐'),
      description: t('partner.feedback.newReviewDesc', 'Ein Gast hat eine neue Bewertung für Ihr Venue abgegeben.'),
      duration: 6000,
    });
  }, [t, toast]);

  useEffect(() => {
    fetchFeedback();
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: partnerships } = await supabase
        .from('venue_partnerships')
        .select('venue_id')
        .eq('partner_id', user.id)
        .eq('status', 'approved');

      if (!partnerships?.length) return;

      const channelName = `partner-feedback-notifications-${user.id}-${Date.now()}`;

      channel = supabase
        .channel(channelName)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'date_feedback' }, async (payload) => {
          const { data: invitation } = await supabase
            .from('date_invitations')
            .select('venue_id')
            .eq('id', payload.new.invitation_id)
            .single();

          const venueIds = partnerships.map(p => p.venue_id);
          if (invitation && venueIds.includes(invitation.venue_id || '')) {
            handleNewFeedback();
          }
        })
        .subscribe();
    };

    setupRealtime();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [handleNewFeedback]);

  const fetchFeedback = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: partnerships } = await supabase
        .from('venue_partnerships')
        .select('venue_id')
        .eq('partner_id', user.id)
        .eq('status', 'approved');

      const venueIds = partnerships?.map(p => p.venue_id) || [];
      if (venueIds.length === 0) { setLoading(false); return; }

      // Fetch venue names
      const { data: venues } = await supabase
        .from('venues')
        .select('id, name')
        .in('id', venueIds);

      const vMap: Record<string, string> = {};
      venues?.forEach(v => { vMap[v.id] = v.name; });
      setVenueMap(vMap);

      // Get completed invitations for these venues
      const { data: invitations } = await supabase
        .from('date_invitations')
        .select('id, venue_id')
        .in('venue_id', venueIds)
        .eq('date_status', 'completed');

      const invIds = invitations?.map(i => i.id) || [];
      if (invIds.length === 0) {
        setAllFeedback([]);
        setLoading(false);
        return;
      }

      // Map invitation_id → venue_id
      const ivMap: Record<string, string> = {};
      invitations?.forEach(i => { if (i.venue_id) ivMap[i.id] = i.venue_id; });
      setInvitationVenueMap(ivMap);

      const { data: feedback } = await supabase
        .from('date_feedback')
        .select('id, venue_rating, rating, ai_accuracy_rating, feedback_text, created_at, would_recommend_venue, invitation_id')
        .in('invitation_id', invIds)
        .order('created_at', { ascending: false });

      const enriched: FeedbackEntry[] = (feedback || []).map(f => {
        const venueId = ivMap[(f as any).invitation_id] || '';
        return { ...f, venue_id: venueId, venue_name: vMap[venueId] || 'Venue' };
      });

      setAllFeedback(enriched);
    } catch (error) {
      console.error('Error fetching guest feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  // === Aggregated Stats ===
  const stats = useMemo(() => {
    const withVenueRating = allFeedback.filter(f => f.venue_rating != null);
    const withRating = allFeedback.filter(f => f.rating != null);
    const withAiRating = allFeedback.filter(f => f.ai_accuracy_rating != null);
    const recommenders = allFeedback.filter(f => f.would_recommend_venue === true);

    return {
      avgVenueRating: withVenueRating.length > 0
        ? withVenueRating.reduce((s, f) => s + (f.venue_rating || 0), 0) / withVenueRating.length : 0,
      avgOverallRating: withRating.length > 0
        ? withRating.reduce((s, f) => s + (f.rating || 0), 0) / withRating.length : 0,
      avgAiAccuracy: withAiRating.length > 0
        ? withAiRating.reduce((s, f) => s + (f.ai_accuracy_rating || 0), 0) / withAiRating.length : 0,
      totalReviews: allFeedback.length,
      recommendRate: allFeedback.length > 0
        ? Math.round((recommenders.length / allFeedback.length) * 100) : 0,
    };
  }, [allFeedback]);

  // === Per-Venue Aggregates ===
  const venueAggregates = useMemo((): VenueAggregate[] => {
    const groups: Record<string, FeedbackEntry[]> = {};
    allFeedback.forEach(f => {
      const vid = f.venue_id || 'unknown';
      if (!groups[vid]) groups[vid] = [];
      groups[vid].push(f);
    });

    return Object.entries(groups).map(([vid, entries]) => {
      const vr = entries.filter(e => e.venue_rating != null);
      const or_ = entries.filter(e => e.rating != null);
      const rec = entries.filter(e => e.would_recommend_venue === true);
      return {
        venue_id: vid,
        venue_name: venueMap[vid] || 'Venue',
        avgVenueRating: vr.length > 0 ? vr.reduce((s, e) => s + (e.venue_rating || 0), 0) / vr.length : 0,
        avgOverallRating: or_.length > 0 ? or_.reduce((s, e) => s + (e.rating || 0), 0) / or_.length : 0,
        reviewCount: entries.length,
        recommendRate: entries.length > 0 ? Math.round((rec.length / entries.length) * 100) : 0,
      };
    }).sort((a, b) => b.reviewCount - a.reviewCount);
  }, [allFeedback, venueMap]);

  // === Trend Data (monthly) ===
  const trendData = useMemo((): TrendPoint[] => {
    const months: Record<string, { venueSum: number; venueCount: number; overallSum: number; overallCount: number }> = {};

    allFeedback.forEach(f => {
      const d = new Date(f.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { venueSum: 0, venueCount: 0, overallSum: 0, overallCount: 0 };
      if (f.venue_rating != null) { months[key].venueSum += f.venue_rating; months[key].venueCount++; }
      if (f.rating != null) { months[key].overallSum += f.rating; months[key].overallCount++; }
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, val]) => ({
        month: new Date(key + '-01').toLocaleDateString('de-DE', { month: 'short' }),
        venueRating: val.venueCount > 0 ? Math.round((val.venueSum / val.venueCount) * 10) / 10 : 0,
        overallRating: val.overallCount > 0 ? Math.round((val.overallSum / val.overallCount) * 10) / 10 : 0,
        count: val.venueCount + val.overallCount,
      }));
  }, [allFeedback]);

  // === Trend Direction ===
  const trendDirection = useMemo(() => {
    if (trendData.length < 2) return 'stable';
    const last = trendData[trendData.length - 1];
    const prev = trendData[trendData.length - 2];
    if (last.venueRating > prev.venueRating + 0.2) return 'up';
    if (last.venueRating < prev.venueRating - 0.2) return 'down';
    return 'stable';
  }, [trendData]);

  // === Category Breakdown ===
  const categories = useMemo((): CategoryBreakdown[] => {
    const vr = allFeedback.filter(f => f.venue_rating != null);
    const or_ = allFeedback.filter(f => f.rating != null);
    const ai = allFeedback.filter(f => f.ai_accuracy_rating != null);

    return [
      {
        name: 'Venue-Qualität',
        avg: vr.length > 0 ? Math.round((vr.reduce((s, f) => s + (f.venue_rating || 0), 0) / vr.length) * 10) / 10 : 0,
        count: vr.length,
        color: 'hsl(var(--primary))',
      },
      {
        name: 'Gesamterlebnis',
        avg: or_.length > 0 ? Math.round((or_.reduce((s, f) => s + (f.rating || 0), 0) / or_.length) * 10) / 10 : 0,
        count: or_.length,
        color: 'hsl(var(--accent))',
      },
      {
        name: 'AI-Genauigkeit',
        avg: ai.length > 0 ? Math.round((ai.reduce((s, f) => s + (f.ai_accuracy_rating || 0), 0) / ai.length) * 10) / 10 : 0,
        count: ai.length,
        color: 'hsl(var(--secondary))',
      },
    ];
  }, [allFeedback]);

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('w-3.5 h-3.5', i < Math.round(rating) ? 'fill-accent text-accent' : 'text-muted-foreground/30')} />
      ))}
    </div>
  );

  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;
  const trendColor = trendDirection === 'up' ? 'text-primary' : trendDirection === 'down' ? 'text-destructive' : 'text-muted-foreground';

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
          {newCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              <Bell className="w-3 h-3" />
              +{newCount}
            </span>
          )}
        </CardTitle>
        <CardDescription>{t('partner.feedback.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-2xl font-bold">{stats.avgVenueRating > 0 ? stats.avgVenueRating.toFixed(1) : '–'}</span>
              <Star className="w-4 h-4 fill-accent text-accent" />
            </div>
            <p className="text-xs text-muted-foreground">Venue-Rating</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-2xl font-bold">{stats.avgOverallRating > 0 ? stats.avgOverallRating.toFixed(1) : '–'}</span>
              <Star className="w-4 h-4 fill-accent text-accent" />
            </div>
            <p className="text-xs text-muted-foreground">Gesamterlebnis</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <span className="text-2xl font-bold">{stats.totalReviews}</span>
            <p className="text-xs text-muted-foreground">Bewertungen</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-2xl font-bold">{stats.recommendRate > 0 ? `${stats.recommendRate}%` : '–'}</span>
              <TrendIcon className={cn('w-4 h-4', trendColor)} />
            </div>
            <p className="text-xs text-muted-foreground">Empfehlungsrate</p>
          </div>
        </div>

        {allFeedback.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t('partner.feedback.noFeedback')}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{t('partner.feedback.noFeedbackDesc')}</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="overview" className="text-xs">Übersicht</TabsTrigger>
              <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
              <TabsTrigger value="categories" className="text-xs">Kategorien</TabsTrigger>
            </TabsList>

            {/* === Tab 1: Per-Venue Overview === */}
            <TabsContent value="overview" className="space-y-3 mt-3">
              {venueAggregates.map(va => (
                <div key={va.venue_id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm truncate flex-1">{va.venue_name}</h4>
                    <span className="text-xs text-muted-foreground ml-2">{va.reviewCount} Bewertungen</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="text-lg font-bold">{va.avgVenueRating > 0 ? va.avgVenueRating.toFixed(1) : '–'}</span>
                        <Star className="w-3 h-3 fill-accent text-accent" />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Venue</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="text-lg font-bold">{va.avgOverallRating > 0 ? va.avgOverallRating.toFixed(1) : '–'}</span>
                        <Star className="w-3 h-3 fill-accent text-accent" />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Gesamt</p>
                    </div>
                    <div>
                      <span className="text-lg font-bold">{va.recommendRate > 0 ? `${va.recommendRate}%` : '–'}</span>
                      <p className="text-[10px] text-muted-foreground">Empfehlung</p>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* === Tab 2: Trend Chart === */}
            <TabsContent value="trends" className="mt-3">
              {trendData.length >= 2 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendIcon className={cn('w-4 h-4', trendColor)} />
                    <span className={cn('font-medium', trendColor)}>
                      {trendDirection === 'up' && 'Bewertungen steigen'}
                      {trendDirection === 'down' && 'Bewertungen sinken'}
                      {trendDirection === 'stable' && 'Bewertungen stabil'}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData}>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Line type="monotone" dataKey="venueRating" name="Venue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="overallRating" name="Gesamt" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 bg-primary rounded-full inline-block" /> Venue-Rating
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 bg-accent rounded-full inline-block" /> Gesamterlebnis
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Noch nicht genügend Daten für Trends</p>
                  <p className="text-xs text-muted-foreground/70">Mindestens 2 Monate mit Bewertungen erforderlich</p>
                </div>
              )}
            </TabsContent>

            {/* === Tab 3: Category Breakdown === */}
            <TabsContent value="categories" className="mt-3">
              <div className="space-y-4">
                {categories.map(cat => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-muted-foreground">
                        {cat.avg > 0 ? `${cat.avg}/5` : '–'} ({cat.count} Bewertungen)
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: cat.avg > 0 ? `${(cat.avg / 5) * 100}%` : '0%',
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground text-center pt-2">
                  Alle Bewertungen sind anonym und können nicht einzelnen Gästen zugeordnet werden.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
