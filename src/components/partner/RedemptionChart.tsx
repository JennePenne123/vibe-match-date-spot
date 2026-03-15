import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';

type TimeRange = '7' | '30' | '90';

interface ChartDataPoint {
  date: string;
  label: string;
  redemptions: number;
  guests: number;
}

export default function RedemptionChart() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRedemptionData();
  }, [timeRange]);

  const fetchRedemptionData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = subDays(new Date(), parseInt(timeRange));

      // Fetch voucher IDs belonging to this partner
      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('id')
        .eq('partner_id', user.id);

      const voucherIds = vouchers?.map(v => v.id) || [];

      let redemptions: any[] = [];
      if (voucherIds.length > 0) {
        const { data } = await supabase
          .from('voucher_redemptions')
          .select('redeemed_at, user_id')
          .in('voucher_id', voucherIds)
          .gte('redeemed_at', startDate.toISOString())
          .order('redeemed_at', { ascending: true });

        redemptions = data || [];
      }

      // Build daily data
      const days = eachDayOfInterval({ start: startDate, end: new Date() });
      const data: ChartDataPoint[] = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayRedemptions = redemptions.filter(r =>
          format(parseISO(r.redeemed_at), 'yyyy-MM-dd') === dayStr
        );
        const uniqueGuests = new Set(dayRedemptions.map(r => r.user_id)).size;

        return {
          date: dayStr,
          label: parseInt(timeRange) <= 7
            ? format(day, 'EEE')
            : parseInt(timeRange) <= 30
              ? format(day, 'dd. MMM')
              : format(day, 'dd.MM'),
          redemptions: dayRedemptions.length,
          guests: uniqueGuests,
        };
      });

      setChartData(data);
    } catch (error) {
      console.error('Error fetching redemption data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasData = chartData.some(d => d.redemptions > 0 || d.guests > 0);

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '7', label: t('partner.last7Days') },
    { value: '30', label: t('partner.last30Days') },
    { value: '90', label: t('partner.last90Days') },
  ];

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {t('partner.guestAnalytics')}
            </CardTitle>
            <CardDescription className="mt-1">
              {t('partner.guestAnalyticsDesc')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            {timeRangeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  timeRange === option.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasData ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">{t('partner.noDataYet')}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{t('partner.noDataDesc')}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval={parseInt(timeRange) > 30 ? 6 : parseInt(timeRange) > 7 ? 2 : 0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  fontSize: '13px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              />
              <Bar
                dataKey="redemptions"
                name={t('partner.redemptions')}
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="guests"
                name={t('partner.guests')}
                fill="hsl(var(--accent))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
