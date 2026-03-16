import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Star, Users, Calendar, MessageCircle, Award, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'date_sent' | 'date_received' | 'feedback' | 'badge' | 'friend';
  title: string;
  subtitle: string;
  timestamp: string;
  icon: React.ReactNode;
  accentColor: string;
}

const ActivityFeed: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const locale = i18n.language === 'de' ? de : enUS;

  useEffect(() => {
    if (!user?.id) return;

    const fetchActivities = async () => {
      try {
        const [invitationsRes, feedbackRes, friendsRes] = await Promise.all([
          supabase
            .from('date_invitations')
            .select('id, title, created_at, sender_id, recipient_id, status')
            .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('date_feedback')
            .select('id, rating, venue_rating, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('friendships')
            .select('id, created_at, status, user_id, friend_id')
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .eq('status', 'accepted')
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        const items: ActivityItem[] = [];

        // Date invitations
        invitationsRes.data?.forEach((inv) => {
          const isSender = inv.sender_id === user.id;
          items.push({
            id: `inv-${inv.id}`,
            type: isSender ? 'date_sent' : 'date_received',
            title: inv.title || (isSender ? t('profile.activity.dateSent') : t('profile.activity.dateReceived')),
            subtitle: isSender
              ? t('profile.activity.youInvited')
              : t('profile.activity.youWereInvited'),
            timestamp: inv.created_at,
            icon: <Calendar className="w-4 h-4" />,
            accentColor: isSender ? 'from-primary/20 to-violet-500/20 border-primary/30' : 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
          });
        });

        // Feedback
        feedbackRes.data?.forEach((fb) => {
          items.push({
            id: `fb-${fb.id}`,
            type: 'feedback',
            title: t('profile.activity.ratedDate'),
            subtitle: `${fb.rating ? `${fb.rating}/5 ⭐` : ''} ${fb.venue_rating ? `Venue: ${fb.venue_rating}/5` : ''}`.trim(),
            timestamp: fb.created_at,
            icon: <Star className="w-4 h-4" />,
            accentColor: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
          });
        });

        // Friendships
        friendsRes.data?.forEach((f) => {
          items.push({
            id: `fr-${f.id}`,
            type: 'friend',
            title: t('profile.activity.newFriend'),
            subtitle: t('profile.activity.connectionMade'),
            timestamp: f.created_at,
            icon: <Users className="w-4 h-4" />,
            accentColor: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
          });
        });

        // Sort by timestamp
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(items.slice(0, 8));
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user?.id, t, i18n.language]);

  if (loading) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">{t('profile.activity.noActivity')}</p>
          <p className="text-xs text-muted-foreground">{t('profile.activity.startExploring')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="w-4 h-4 text-accent" />
          {t('profile.activity.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r ${activity.accentColor} border hover:scale-[1.01] transition-all duration-300 animate-fade-in`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="w-9 h-9 rounded-lg bg-card/80 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-sm">
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
              <p className="text-xs text-muted-foreground truncate">{activity.subtitle}</p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
