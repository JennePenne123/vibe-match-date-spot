import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';

interface VoucherAlert {
  id: string;
  title: string;
  code: string;
  type: 'expiring' | 'expired_active' | 'near_limit';
  daysLeft?: number;
  redemptionPercent?: number;
}

export default function VoucherAlerts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<VoucherAlert[]>([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vouchers, error } = await supabase
        .from('vouchers')
        .select('id, title, code, status, valid_until, current_redemptions, max_redemptions')
        .eq('partner_id', user.id);

      if (error || !vouchers) return;

      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const newAlerts: VoucherAlert[] = [];

      vouchers.forEach((v) => {
        const expiryDate = new Date(v.valid_until);
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Expired but still marked active
        if (v.status === 'active' && expiryDate < now) {
          newAlerts.push({ id: v.id, title: v.title, code: v.code, type: 'expired_active' });
        }
        // Expiring within 3 days
        else if (v.status === 'active' && expiryDate <= threeDaysFromNow && expiryDate >= now) {
          newAlerts.push({ id: v.id, title: v.title, code: v.code, type: 'expiring', daysLeft });
        }

        // Near redemption limit (≥90%)
        if (v.max_redemptions && v.max_redemptions > 0 && v.status === 'active') {
          const percent = (v.current_redemptions / v.max_redemptions) * 100;
          if (percent >= 90) {
            newAlerts.push({ id: v.id, title: v.title, code: v.code, type: 'near_limit', redemptionPercent: Math.round(percent) });
          }
        }
      });

      setAlerts(newAlerts);
    } catch (err) {
      console.error('Error fetching voucher alerts:', err);
    }
  };

  if (alerts.length === 0) return null;

  const getAlertConfig = (alert: VoucherAlert) => {
    switch (alert.type) {
      case 'expired_active':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          variant: 'destructive' as const,
          title: t('partner.alerts.expiredActive'),
          description: t('partner.alerts.expiredActiveDesc', { title: alert.title, code: alert.code }),
        };
      case 'expiring':
        return {
          icon: <Clock className="h-4 w-4" />,
          variant: 'default' as const,
          title: t('partner.alerts.expiringSoon'),
          description: t('partner.alerts.expiringSoonDesc', { title: alert.title, days: alert.daysLeft }),
          className: 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        };
      case 'near_limit':
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          variant: 'default' as const,
          title: t('partner.alerts.nearLimit'),
          description: t('partner.alerts.nearLimitDesc', { title: alert.title, percent: alert.redemptionPercent }),
          className: 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400',
        };
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const config = getAlertConfig(alert);
        return (
          <Alert
            key={`${alert.id}-${alert.type}`}
            variant={config.variant}
            className={config.className}
          >
            {config.icon}
            <AlertTitle className="text-sm font-semibold">{config.title}</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-2">
              <span className="text-sm">{config.description}</span>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-xs"
                onClick={() => navigate('/partner/vouchers')}
              >
                {t('partner.alerts.manage')}
              </Button>
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
