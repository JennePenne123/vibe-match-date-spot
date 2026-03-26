import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Ticket, Star, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface NotificationItem {
  id: string;
  type: 'redemption' | 'feedback' | 'expiring' | 'milestone';
  title: string;
  description: string;
  time: string;
  icon: typeof Bell;
}

export default function PartnerNotificationsCard() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const items: NotificationItem[] = [];

      // Fetch recent redemptions (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const [redemptionsRes, vouchersRes, feedbackRes] = await Promise.all([
        supabase
          .from('voucher_redemptions')
          .select('id, redeemed_at, discount_applied, voucher_id, vouchers!inner(partner_id, title)')
          .eq('vouchers.partner_id', user.id)
          .gte('redeemed_at', sevenDaysAgo)
          .order('redeemed_at', { ascending: false })
          .limit(5),
        
        // Expiring vouchers (next 7 days)
        supabase
          .from('vouchers')
          .select('id, title, valid_until')
          .eq('partner_id', user.id)
          .eq('status', 'active')
          .gte('valid_until', new Date().toISOString())
          .lte('valid_until', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Recent feedback
        supabase
          .from('date_feedback')
          .select('id, venue_rating, created_at, invitation_id')
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // Process redemptions
      redemptionsRes.data?.forEach((r: any) => {
        items.push({
          id: `red-${r.id}`,
          type: 'redemption',
          title: t('partner.notifications.redemption', 'Gutschein eingelöst'),
          description: `"${r.vouchers?.title}" — ${r.discount_applied}€ Rabatt`,
          time: r.redeemed_at,
          icon: Ticket,
        });
      });

      // Process expiring vouchers
      vouchersRes.data?.forEach((v) => {
        const daysLeft = Math.ceil((new Date(v.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        items.push({
          id: `exp-${v.id}`,
          type: 'expiring',
          title: t('partner.notifications.expiring', 'Gutschein läuft ab'),
          description: `"${v.title}" — noch ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tage'}`,
          time: v.valid_until,
          icon: Clock,
        });
      });

      // Process feedback
      feedbackRes.data?.forEach((f) => {
        if (f.venue_rating) {
          items.push({
            id: `fb-${f.id}`,
            type: 'feedback',
            title: t('partner.notifications.feedback', 'Neue Bewertung'),
            description: `${f.venue_rating} ★ von einem Gast`,
            time: f.created_at,
            icon: Star,
          });
        }
      });

      // Sort by time, most recent first
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(items.slice(0, 8));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'redemption': return 'bg-primary/10 text-primary';
      case 'feedback': return 'bg-accent/10 text-accent';
      case 'expiring': return 'bg-destructive/10 text-destructive';
      case 'milestone': return 'bg-primary/10 text-primary';
    }
  };

  if (loading) {
    return (
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="h-[120px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="w-4 h-4 text-primary" />
          {t('partner.notifications.title', 'Neuigkeiten')}
          {notifications.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5">{notifications.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-6">
            <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {t('partner.notifications.empty', 'Keine neuen Benachrichtigungen')}
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getIconStyle(item.type)}`}>
                <item.icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(item.time), { addSuffix: true, locale: de })}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
