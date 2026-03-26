import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/config/queryConfig';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Star, AlertTriangle, CheckCircle2, MapPin, ThumbsUp, ThumbsDown, Shield, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import PartnerVerificationReview from '@/components/admin/PartnerVerificationReview';

const AdminModeration: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content-Moderation</h1>
        <p className="text-muted-foreground text-sm mt-1">Feedback, Venues und Inhalte überprüfen</p>
      </div>

      <Tabs defaultValue="feedback" className="w-full">
        <TabsList className="bg-muted/50 w-full flex">
          <TabsTrigger value="feedback" className="gap-1.5 flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">
            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Date-Feedback</span>
          </TabsTrigger>
          <TabsTrigger value="venues" className="gap-1.5 flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Verifizierung</span>
          </TabsTrigger>
          <TabsTrigger value="venue-feedback" className="gap-1.5 flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">
            <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Venue-Feedback</span>
          </TabsTrigger>
          <TabsTrigger value="partner-review" className="gap-1.5 flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Partner</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="mt-4">
          <DateFeedbackList />
        </TabsContent>
        <TabsContent value="venues" className="mt-4">
          <VenueVerificationList />
        </TabsContent>
        <TabsContent value="venue-feedback" className="mt-4">
          <VenueFeedbackList />
        </TabsContent>
        <TabsContent value="partner-review" className="mt-4">
          <PartnerVerificationReview />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* ─── Date Feedback ─── */
const DateFeedbackList: React.FC = () => {
  const { data: feedback, isLoading } = useQuery({
    queryKey: ['admin-date-feedback'],
    queryFn: async () => {
      const { data } = await supabase
        .from('date_feedback')
        .select('id, rating, venue_rating, ai_accuracy_rating, feedback_text, would_recommend_venue, would_use_ai_again, created_at, user_id, invitation_id')
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  // Stats
  const avgRating = feedback && feedback.length > 0
    ? (feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.filter(f => f.rating).length).toFixed(1)
    : '-';
  const negativeCount = feedback?.filter(f => f.would_recommend_venue === false).length || 0;

  if (isLoading) return <LoadingSkeleton count={5} height="h-24" />;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex gap-4 flex-wrap">
        <Badge variant="outline" className="gap-1 px-3 py-1.5 text-sm">
          <Star className="w-3.5 h-3.5 text-amber-400" />
          ⌀ {avgRating}
        </Badge>
        <Badge variant="outline" className="gap-1 px-3 py-1.5 text-sm">
          {feedback?.length || 0} Bewertungen
        </Badge>
        {negativeCount > 0 && (
          <Badge variant="destructive" className="gap-1 px-3 py-1.5 text-sm">
            <AlertTriangle className="w-3.5 h-3.5" />
            {negativeCount} nicht empfohlen
          </Badge>
        )}
      </div>

      {!feedback || feedback.length === 0 ? (
        <EmptyState icon={MessageCircle} text="Noch kein Feedback vorhanden" />
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {feedback.map(fb => (
              <Card key={fb.id} className="bg-card/80 border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {fb.rating && (
                          <Badge variant="outline" className="gap-1">
                            <Star className="w-3 h-3 text-amber-400" />
                            {fb.rating}/5
                          </Badge>
                        )}
                        {fb.venue_rating && (
                          <Badge variant="outline" className="gap-1 text-xs">Venue: {fb.venue_rating}/5</Badge>
                        )}
                        {fb.ai_accuracy_rating && (
                          <Badge variant="outline" className="gap-1 text-xs">AI: {fb.ai_accuracy_rating}/5</Badge>
                        )}
                        {fb.would_recommend_venue === false && (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <ThumbsDown className="w-3 h-3" /> Nicht empfohlen
                          </Badge>
                        )}
                        {fb.would_use_ai_again === true && (
                          <Badge className="gap-1 text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <ThumbsUp className="w-3 h-3" /> Würde AI nutzen
                          </Badge>
                        )}
                      </div>
                      {fb.feedback_text && (
                        <p className="text-sm text-foreground/80 leading-relaxed">{fb.feedback_text}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(fb.created_at).toLocaleDateString('de-DE', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

/* ─── Venue Verification ─── */
const VenueVerificationList: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: venues, isLoading } = useQuery({
    queryKey: ['admin-unverified-venues'],
    queryFn: async () => {
      const { data } = await supabase
        .from('venues')
        .select('id, name, address, cuisine_type, price_range, rating, source, verified, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  const unverified = venues?.filter(v => !v.verified) || [];
  const verified = venues?.filter(v => v.verified) || [];

  if (isLoading) return <LoadingSkeleton count={5} height="h-20" />;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Badge variant="outline" className="px-3 py-1.5 text-sm">
          {venues?.length || 0} Venues gesamt
        </Badge>
        <Badge className="px-3 py-1.5 text-sm bg-amber-500/20 text-amber-400 border-amber-500/30">
          {unverified.length} ungeprüft
        </Badge>
        <Badge className="px-3 py-1.5 text-sm bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          {verified.length} verifiziert
        </Badge>
      </div>

      {unverified.length === 0 ? (
        <EmptyState icon={Shield} text="Alle Venues sind verifiziert ✓" />
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {unverified.map(venue => (
              <Card key={venue.id} className="bg-card/80 border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{venue.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{venue.address}</p>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        {venue.cuisine_type && <Badge variant="outline" className="text-xs">{venue.cuisine_type}</Badge>}
                        {venue.price_range && <Badge variant="outline" className="text-xs">{venue.price_range}</Badge>}
                        {venue.source && <Badge variant="secondary" className="text-xs">{venue.source}</Badge>}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(venue.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

/* ─── Venue Feedback ─── */
const VenueFeedbackList: React.FC = () => {
  const { data: feedback, isLoading } = useQuery({
    queryKey: ['admin-venue-feedback'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_venue_feedback')
        .select('id, venue_id, feedback_type, context, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  const likes = feedback?.filter(f => f.feedback_type === 'like').length || 0;
  const dislikes = feedback?.filter(f => f.feedback_type === 'dislike').length || 0;

  if (isLoading) return <LoadingSkeleton count={5} height="h-16" />;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Badge className="px-3 py-1.5 text-sm bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
          <ThumbsUp className="w-3.5 h-3.5" /> {likes}
        </Badge>
        <Badge className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 border-red-500/30 gap-1">
          <ThumbsDown className="w-3.5 h-3.5" /> {dislikes}
        </Badge>
      </div>

      {!feedback || feedback.length === 0 ? (
        <EmptyState icon={MessageCircle} text="Noch kein Venue-Feedback vorhanden" />
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {feedback.map(fb => (
              <Card key={fb.id} className="bg-card/80 border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={fb.feedback_type === 'like' ? 'default' : 'destructive'} className="text-xs gap-1">
                          {fb.feedback_type === 'like' ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                          {fb.feedback_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">{fb.venue_id.slice(0, 8)}…</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(fb.created_at).toLocaleDateString('de-DE', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

/* ─── Shared helpers ─── */
const EmptyState: React.FC<{ icon: React.ElementType; text: string }> = ({ icon: Icon, text }) => (
  <Card className="bg-card/80 border-border/40">
    <CardContent className="py-12 text-center">
      <Icon className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
      <p className="text-muted-foreground">{text}</p>
    </CardContent>
  </Card>
);

const LoadingSkeleton: React.FC<{ count: number; height: string }> = ({ count, height }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => <Skeleton key={i} className={`${height} w-full`} />)}
  </div>
);

export default AdminModeration;
