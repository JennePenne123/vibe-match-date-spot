import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '@/components/LoadingSpinner';

interface VoucherAnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voucherId: string | null;
  voucherTitle: string;
}

interface AnalyticsData {
  totalRedemptions: number;
  avgBookingValue: number;
  totalDiscount: number;
  timelineData: { date: string; count: number }[];
  peakDays: string[];
  peakTimes: string[];
}

export default function VoucherAnalyticsModal({
  open,
  onOpenChange,
  voucherId,
  voucherTitle,
}: VoucherAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && voucherId) {
      fetchAnalytics();
    }
  }, [open, voucherId]);

  const fetchAnalytics = async () => {
    if (!voucherId) return;

    setLoading(true);
    try {
      // Fetch redemption data
      const { data: redemptions, error } = await supabase
        .from('voucher_redemptions')
        .select('*')
        .eq('voucher_id', voucherId)
        .order('redeemed_at', { ascending: true });

      if (error) throw error;

      if (!redemptions || redemptions.length === 0) {
        setAnalytics({
          totalRedemptions: 0,
          avgBookingValue: 0,
          totalDiscount: 0,
          timelineData: [],
          peakDays: [],
          peakTimes: [],
        });
        return;
      }

      // Calculate metrics
      const totalRedemptions = redemptions.length;
      const avgBookingValue = redemptions.reduce((sum, r) => sum + (r.booking_value || 0), 0) / totalRedemptions;
      const totalDiscount = redemptions.reduce((sum, r) => sum + r.discount_applied, 0);

      // Group by date for timeline
      const dateGroups: { [key: string]: number } = {};
      redemptions.forEach(r => {
        const date = new Date(r.redeemed_at).toLocaleDateString();
        dateGroups[date] = (dateGroups[date] || 0) + 1;
      });

      const timelineData = Object.entries(dateGroups).map(([date, count]) => ({
        date,
        count,
      }));

      // Calculate peak days (from metadata if available)
      const dayCount: { [key: string]: number } = {};
      redemptions.forEach(r => {
        if (r.metadata && typeof r.metadata === 'object') {
          const meta = r.metadata as any;
          if (meta.day_of_week) {
            dayCount[meta.day_of_week] = (dayCount[meta.day_of_week] || 0) + 1;
          }
        }
      });
      const peakDays = Object.entries(dayCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([day]) => day);

      const peakTimes = ['lunch', 'dinner']; // Placeholder - would need time data in metadata

      setAnalytics({
        totalRedemptions,
        avgBookingValue,
        totalDiscount,
        timelineData,
        peakDays,
        peakTimes,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Voucher Analytics</DialogTitle>
          <DialogDescription>{voucherTitle}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card variant="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Total Redemptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.totalRedemptions}</div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Avg Booking Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ${analytics.avgBookingValue.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Total Discount Given
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ${analytics.totalDiscount.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline Chart */}
            {analytics.timelineData.length > 0 ? (
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Redemption Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analytics.timelineData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs fill-muted-foreground"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        className="text-xs fill-muted-foreground"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : null}

            {/* Peak Usage */}
            {analytics.peakDays.length > 0 && (
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Peak Usage Patterns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.peakDays.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Most Popular Days:</p>
                      <div className="flex gap-2 flex-wrap">
                        {analytics.peakDays.map(day => (
                          <Badge key={day} variant="secondary" className="capitalize">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {analytics.peakTimes.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Popular Times:</p>
                      <div className="flex gap-2 flex-wrap">
                        {analytics.peakTimes.map(time => (
                          <Badge key={time} variant="secondary" className="capitalize">
                            {time.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {analytics.totalRedemptions === 0 && (
              <Card variant="glass" className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">
                    No redemptions yet. Share this voucher to start seeing analytics!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
