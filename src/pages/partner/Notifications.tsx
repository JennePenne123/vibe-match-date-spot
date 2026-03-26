import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Ticket, Star, Clock, TrendingUp, CheckCheck, ArrowLeft, Filter, Inbox } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { formatDistanceToNow, format } from 'date-fns';
import { de } from 'date-fns/locale';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationItem {
  id: string;
  type: 'redemption' | 'feedback' | 'expiring' | 'milestone';
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: typeof Bell;
  meta?: string;
}

type FilterType = 'all' | 'redemption' | 'feedback' | 'expiring';

export default function PartnerNotifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const isLoading = authLoading || roleLoading;

  useEffect(() => {
    if (!isLoading && user && role !== 'venue_partner' && role !== 'admin') {
      navigate('/home');
    }
  }, [role, isLoading, user, navigate]);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const items: NotificationItem[] = [];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [redemptionsRes, vouchersRes, feedbackRes] = await Promise.all([
        supabase
          .from('voucher_redemptions')
          .select('id, redeemed_at, discount_applied, voucher_id, vouchers!inner(partner_id, title)')
          .eq('vouchers.partner_id', user.id)
          .gte('redeemed_at', thirtyDaysAgo)
          .order('redeemed_at', { ascending: false })
          .limit(20),
        supabase
          .from('vouchers')
          .select('id, title, valid_until, current_redemptions, max_redemptions')
          .eq('partner_id', user.id)
          .eq('status', 'active')
          .gte('valid_until', new Date().toISOString())
          .lte('valid_until', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('date_feedback')
          .select('id, venue_rating, created_at, feedback_text, invitation_id')
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      redemptionsRes.data?.forEach((r: any) => {
        items.push({
          id: `red-${r.id}`,
          type: 'redemption',
          title: t('partner.notifications.redemption', 'Gutschein eingelöst'),
          description: `"${r.vouchers?.title}" — ${r.discount_applied}€ Rabatt`,
          time: r.redeemed_at,
          read: false,
          icon: Ticket,
          meta: format(new Date(r.redeemed_at), 'dd.MM.yyyy HH:mm', { locale: de }),
        });
      });

      vouchersRes.data?.forEach((v) => {
        const daysLeft = Math.ceil((new Date(v.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const usageInfo = v.max_redemptions ? ` (${v.current_redemptions}/${v.max_redemptions} genutzt)` : '';
        items.push({
          id: `exp-${v.id}`,
          type: 'expiring',
          title: t('partner.notifications.expiring', 'Gutschein läuft ab'),
          description: `"${v.title}" — noch ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tage'}${usageInfo}`,
          time: v.valid_until,
          read: false,
          icon: Clock,
        });
      });

      feedbackRes.data?.forEach((f) => {
        if (f.venue_rating) {
          items.push({
            id: `fb-${f.id}`,
            type: 'feedback',
            title: t('partner.notifications.feedback', 'Neue Bewertung'),
            description: `${f.venue_rating} ★ von einem Gast${f.feedback_text ? ` — "${f.feedback_text.slice(0, 60)}${f.feedback_text.length > 60 ? '…' : ''}"` : ''}`,
            time: f.created_at,
            read: false,
            icon: Star,
            meta: format(new Date(f.created_at), 'dd.MM.yyyy HH:mm', { locale: de }),
          });
        }
      });

      // Milestone: check total redemptions
      const { count } = await supabase
        .from('voucher_redemptions')
        .select('id', { count: 'exact', head: true })
        .in('voucher_id', (await supabase.from('vouchers').select('id').eq('partner_id', user.id)).data?.map(v => v.id) || []);

      if (count && count > 0) {
        const milestones = [10, 25, 50, 100, 250, 500, 1000];
        const reached = milestones.filter(m => count >= m);
        if (reached.length > 0) {
          const latest = reached[reached.length - 1];
          items.push({
            id: `milestone-${latest}`,
            type: 'milestone',
            title: t('partner.notifications.milestone', 'Meilenstein erreicht! 🎉'),
            description: `${latest}+ Gutschein-Einlösungen insgesamt`,
            time: new Date().toISOString(),
            read: false,
            icon: TrendingUp,
          });
        }
      }

      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(items);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const getIconStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'redemption': return 'bg-primary/10 text-primary';
      case 'feedback': return 'bg-amber-500/10 text-amber-500';
      case 'expiring': return 'bg-destructive/10 text-destructive';
      case 'milestone': return 'bg-primary/10 text-primary';
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/partner')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">
            {t('partner.notifications.pageTitle', 'Benachrichtigungen')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('partner.notifications.pageDesc', 'Alle Aktivitäten der letzten 30 Tage')}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('partner.notifications.markAllRead', 'Alle gelesen')}</span>
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all" className="text-xs">
            {t('partner.notifications.filterAll', 'Alle')}
            {notifications.length > 0 && <Badge variant="secondary" className="ml-1 text-[9px] px-1">{notifications.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="redemption" className="text-xs">
            <Ticket className="w-3 h-3 mr-1" />
            {t('partner.notifications.filterRedemptions', 'Einlösungen')}
          </TabsTrigger>
          <TabsTrigger value="feedback" className="text-xs">
            <Star className="w-3 h-3 mr-1" />
            {t('partner.notifications.filterFeedback', 'Bewertungen')}
          </TabsTrigger>
          <TabsTrigger value="expiring" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {t('partner.notifications.filterExpiring', 'Ablaufend')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notification list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Inbox className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {t('partner.notifications.noResults', 'Keine Benachrichtigungen in dieser Kategorie')}
              </p>
            </motion.div>
          ) : (
            filteredNotifications.map((item, index) => {
              const isRead = readIds.has(item.id);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    variant="glass"
                    className={`transition-all ${isRead ? 'opacity-60' : 'border-primary/10'}`}
                    onClick={() => setReadIds(prev => new Set([...prev, item.id]))}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${getIconStyle(item.type)}`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{item.title}</p>
                            {!isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {formatDistanceToNow(new Date(item.time), { addSuffix: true, locale: de })}
                            {item.meta && ` · ${item.meta}`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
