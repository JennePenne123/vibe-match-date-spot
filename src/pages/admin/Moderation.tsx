import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Star, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const AdminModeration: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.moderationTitle', 'Content-Moderation')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('admin.moderationSubtitle', 'Feedback und Inhalte überprüfen')}
        </p>
      </div>

      <Tabs defaultValue="feedback" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="feedback">{t('admin.feedbackTab', 'Date-Feedback')}</TabsTrigger>
          <TabsTrigger value="venues">{t('admin.venuesTab', 'Venue-Feedback')}</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="mt-4">
          <DateFeedbackList />
        </TabsContent>

        <TabsContent value="venues" className="mt-4">
          <VenueFeedbackList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const DateFeedbackList: React.FC = () => {
  const { t } = useTranslation();

  const { data: feedback, isLoading } = useQuery({
    queryKey: ['admin-date-feedback'],
    queryFn: async () => {
      const { data } = await supabase
        .from('date_feedback')
        .select('id, rating, venue_rating, ai_accuracy_rating, feedback_text, would_recommend_venue, created_at, user_id, invitation_id')
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  if (!feedback || feedback.length === 0) {
    return (
      <Card className="bg-card/80 border-border/40">
        <CardContent className="py-12 text-center">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{t('admin.noFeedback', 'Noch kein Feedback vorhanden')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-3">
        {feedback.map((fb) => (
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
                      <Badge variant="outline" className="gap-1 text-xs">
                        Venue: {fb.venue_rating}/5
                      </Badge>
                    )}
                    {fb.ai_accuracy_rating && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        AI: {fb.ai_accuracy_rating}/5
                      </Badge>
                    )}
                    {fb.would_recommend_venue === false && (
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        {t('admin.wouldNotRecommend', 'Nicht empfohlen')}
                      </Badge>
                    )}
                  </div>
                  {fb.feedback_text && (
                    <p className="text-sm text-foreground/80">{fb.feedback_text}</p>
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
  );
};

const VenueFeedbackList: React.FC = () => {
  const { t } = useTranslation();

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
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (!feedback || feedback.length === 0) {
    return (
      <Card className="bg-card/80 border-border/40">
        <CardContent className="py-12 text-center">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{t('admin.noVenueFeedback', 'Noch kein Venue-Feedback vorhanden')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-3">
        {feedback.map((fb) => (
          <Card key={fb.id} className="bg-card/80 border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={fb.feedback_type === 'like' ? 'default' : 'destructive'} className="text-xs">
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
  );
};

export default AdminModeration;
