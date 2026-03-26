import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, Ticket, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

interface MonthlyTrend {
  month: string;
  label: string;
  redemptions: number;
  revenue: number;
}

export default function ConversionRateCard() {
  const { user } = useAuth();
  const [trend, setTrend] = useState<MonthlyTrend[]>([]);
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      // Get partner vouchers
      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('id, max_redemptions, current_redemptions')
        .eq('partner_id', user.id);

      if (!vouchers?.length) { setLoading(false); return; }

      const voucherIds = vouchers.map(v => v.id);
      const totalMax = vouchers.reduce((s, v) => s + (v.max_redemptions || 100), 0);
      const totalUsed = vouchers.reduce((s, v) => s + v.current_redemptions, 0);
      setConversionRate(totalMax > 0 ? Math.round((totalUsed / totalMax) * 100) : 0);

      // Last 6 months trend
      const months: MonthlyTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const start = startOfMonth(d);
        const end = endOfMonth(d);

        const { data: redemptions } = await supabase
          .from('voucher_redemptions')
          .select('discount_applied, booking_value')
          .in('voucher_id', voucherIds)
          .gte('redeemed_at', start.toISOString())
          .lte('redeemed_at', end.toISOString());

        months.push({
          month: format(d, 'yyyy-MM'),
          label: format(d, 'MMM', { locale: de }),
          redemptions: redemptions?.length || 0,
          revenue: redemptions?.reduce((s, r) => s + (Number(r.booking_value) || 0), 0) || 0,
        });
      }
      setTrend(months);
    } catch (e) {
      console.error('Error fetching conversion data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-4 h-4 text-primary" />
            Conversion & Trends
          </CardTitle>
          {conversionRate !== null && (
            <Badge variant={conversionRate > 50 ? 'default' : 'secondary'} className="text-xs">
              {conversionRate}% Conversion
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Conversion bar */}
        {conversionRate !== null && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Einlösungsquote</span>
              <span>{conversionRate}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(conversionRate, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* 6-month trend chart */}
        {trend.length > 0 && (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number, name: string) => [
                    name === 'redemptions' ? `${value} Einlösungen` : `€${value.toFixed(2)}`,
                    name === 'redemptions' ? 'Einlösungen' : 'Umsatz'
                  ]}
                />
                <Bar dataKey="redemptions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
