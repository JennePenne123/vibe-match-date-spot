import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkles, FileText, Download, FileSpreadsheet, TrendingUp, TrendingDown, Euro, BarChart3, Calendar, LogIn } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { toast } from '@/components/ui/sonner';

interface MonthlyReport {
  month: string;
  monthLabel: string;
  totalRedemptions: number;
  uniqueGuests: number;
  totalDiscountGiven: number;
  totalBookingValue: number;
  voucherBreakdown: {
    voucherTitle: string;
    code: string;
    redemptions: number;
    discountGiven: number;
    bookingValue: number;
  }[];
}

interface VenuePerformance {
  venueId: string;
  venueName: string;
  totalRedemptions: number;
  avgRating: number | null;
  totalRevenue: number;
  growthPercent: number | null;
}

export default function PartnerReports() {
  const { t, i18n } = useTranslation();
  const { role, loading: roleLoading } = useUserRole();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [venuePerformance, setVenuePerformance] = useState<VenuePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const isLoading = roleLoading || authLoading;
  const dateLocale = i18n.language === 'de' ? de : enUS;

  // Generate last 12 months as options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return {
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy', { locale: dateLocale }),
    };
  });

  useEffect(() => {
    if (!isLoading && user && role !== 'venue_partner' && role !== 'admin') {
      navigate('/home');
    }
  }, [role, isLoading, user, navigate]);

  useEffect(() => {
    if (user && !isLoading) {
      fetchReportData();
    }
  }, [selectedMonth, user, isLoading]);

  const fetchReportData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(new Date(year, month - 1));

      // 1. Fetch partner's vouchers
      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('id, title, code, venue_id, discount_type, discount_value')
        .eq('partner_id', user.id);

      const voucherMap = new Map(vouchers?.map(v => [v.id, v]) || []);
      const voucherIds = vouchers?.map(v => v.id) || [];

      // 2. Fetch redemptions for this month
      let redemptions: any[] = [];
      if (voucherIds.length > 0) {
        const { data } = await supabase
          .from('voucher_redemptions')
          .select('*')
          .in('voucher_id', voucherIds)
          .gte('redeemed_at', monthStart.toISOString())
          .lte('redeemed_at', monthEnd.toISOString());
        redemptions = data || [];
      }

      // 3. Build monthly report
      const uniqueGuests = new Set(redemptions.map(r => r.user_id)).size;
      const totalDiscountGiven = redemptions.reduce((sum, r) => sum + (Number(r.discount_applied) || 0), 0);
      const totalBookingValue = redemptions.reduce((sum, r) => sum + (Number(r.booking_value) || 0), 0);

      // Breakdown by voucher
      const breakdownMap = new Map<string, { redemptions: number; discountGiven: number; bookingValue: number }>();
      redemptions.forEach(r => {
        const existing = breakdownMap.get(r.voucher_id) || { redemptions: 0, discountGiven: 0, bookingValue: 0 };
        existing.redemptions += 1;
        existing.discountGiven += Number(r.discount_applied) || 0;
        existing.bookingValue += Number(r.booking_value) || 0;
        breakdownMap.set(r.voucher_id, existing);
      });

      const voucherBreakdown = Array.from(breakdownMap.entries()).map(([vid, stats]) => {
        const voucher = voucherMap.get(vid);
        return {
          voucherTitle: voucher?.title || 'Unknown',
          code: voucher?.code || '',
          ...stats,
        };
      });

      setMonthlyReport({
        month: selectedMonth,
        monthLabel: format(monthStart, 'MMMM yyyy', { locale: dateLocale }),
        totalRedemptions: redemptions.length,
        uniqueGuests,
        totalDiscountGiven,
        totalBookingValue,
        voucherBreakdown,
      });

      // 4. Venue performance
      const venueIds = [...new Set(vouchers?.map(v => v.venue_id) || [])];
      if (venueIds.length > 0) {
        const { data: venues } = await supabase
          .from('venues')
          .select('id, name, rating')
          .in('id', venueIds);

        // Previous month for comparison
        const prevMonthStart = startOfMonth(subMonths(monthStart, 1));
        const prevMonthEnd = endOfMonth(subMonths(monthStart, 1));
        let prevRedemptions: any[] = [];
        if (voucherIds.length > 0) {
          const { data } = await supabase
            .from('voucher_redemptions')
            .select('voucher_id, discount_applied, booking_value')
            .in('voucher_id', voucherIds)
            .gte('redeemed_at', prevMonthStart.toISOString())
            .lte('redeemed_at', prevMonthEnd.toISOString());
          prevRedemptions = data || [];
        }

        const perfData: VenuePerformance[] = (venues || []).map(venue => {
          const venueVoucherIds = vouchers?.filter(v => v.venue_id === venue.id).map(v => v.id) || [];
          const venueRedemptions = redemptions.filter(r => venueVoucherIds.includes(r.voucher_id));
          const prevVenueRedemptions = prevRedemptions.filter(r => venueVoucherIds.includes(r.voucher_id));
          const currentCount = venueRedemptions.length;
          const prevCount = prevVenueRedemptions.length;
          const growth = prevCount > 0 ? ((currentCount - prevCount) / prevCount) * 100 : null;

          return {
            venueId: venue.id,
            venueName: venue.name,
            totalRedemptions: currentCount,
            avgRating: venue.rating ? Number(venue.rating) : null,
            totalRevenue: venueRedemptions.reduce((s, r) => s + (Number(r.booking_value) || 0), 0),
            growthPercent: growth,
          };
        });
        setVenuePerformance(perfData);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!monthlyReport) return;
    setExporting(true);
    try {
      const headers = [t('partner.reports.voucherName'), t('partner.reports.code'), t('partner.reports.redemptionsCol'), t('partner.reports.discountGiven'), t('partner.reports.bookingValue')];
      const rows = monthlyReport.voucherBreakdown.map(v => [
        `"${v.voucherTitle}"`, v.code, v.redemptions, v.discountGiven.toFixed(2), v.bookingValue.toFixed(2),
      ]);

      // Summary row
      rows.push([]);
      rows.push([t('partner.reports.summary')]);
      rows.push([t('partner.reports.totalRedemptions'), '', monthlyReport.totalRedemptions, '', '']);
      rows.push([t('partner.reports.uniqueGuests'), '', monthlyReport.uniqueGuests, '', '']);
      rows.push([t('partner.reports.totalDiscount'), '', '', monthlyReport.totalDiscountGiven.toFixed(2), '']);
      rows.push([t('partner.reports.totalRevenue'), '', '', '', monthlyReport.totalBookingValue.toFixed(2)]);

      // Venue performance
      if (venuePerformance.length > 0) {
        rows.push([]);
        rows.push([t('partner.reports.venuePerformance')]);
        rows.push([t('partner.reports.venue'), t('partner.reports.redemptionsCol'), t('partner.rating'), t('partner.reports.revenue'), t('partner.reports.growth')]);
        venuePerformance.forEach(v => {
          rows.push([`"${v.venueName}"`, v.totalRedemptions, v.avgRating?.toFixed(1) || '-', v.totalRevenue.toFixed(2), v.growthPercent !== null ? `${v.growthPercent.toFixed(1)}%` : '-']);
        });
      }

      const csvContent = [headers.join(','), ...rows.map(r => Array.isArray(r) ? r.join(',') : r)].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${monthlyReport.month}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('partner.reports.exportSuccess'));
    } finally {
      setExporting(false);
    }
  };

  const exportPDF = async () => {
    if (!monthlyReport) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VybePulse', 14, y);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(t('partner.reports.partnerReport'), 14, y + 7);
      y += 20;

      // Month
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(monthlyReport.monthLabel, 14, y);
      y += 10;

      // Summary cards
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const summaryItems = [
        [t('partner.reports.totalRedemptions'), String(monthlyReport.totalRedemptions)],
        [t('partner.reports.uniqueGuests'), String(monthlyReport.uniqueGuests)],
        [t('partner.reports.totalDiscount'), `€${monthlyReport.totalDiscountGiven.toFixed(2)}`],
        [t('partner.reports.totalRevenue'), `€${monthlyReport.totalBookingValue.toFixed(2)}`],
      ];
      summaryItems.forEach(([label, value]) => {
        pdf.text(`${label}: ${value}`, 14, y);
        y += 6;
      });
      y += 5;

      // Voucher breakdown table
      if (monthlyReport.voucherBreakdown.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t('partner.reports.voucherBreakdown'), 14, y);
        y += 8;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        const colX = [14, 70, 100, 135, 170];
        const headers = [t('partner.reports.voucherName'), t('partner.reports.code'), t('partner.reports.redemptionsCol'), t('partner.reports.discountGiven'), t('partner.reports.bookingValue')];
        headers.forEach((h, i) => pdf.text(h, colX[i], y));
        y += 2;
        pdf.setDrawColor(200);
        pdf.line(14, y, pageWidth - 14, y);
        y += 5;

        pdf.setFont('helvetica', 'normal');
        monthlyReport.voucherBreakdown.forEach(v => {
          if (y > 270) { pdf.addPage(); y = 20; }
          pdf.text(v.voucherTitle.substring(0, 25), colX[0], y);
          pdf.text(v.code, colX[1], y);
          pdf.text(String(v.redemptions), colX[2], y);
          pdf.text(`€${v.discountGiven.toFixed(2)}`, colX[3], y);
          pdf.text(`€${v.bookingValue.toFixed(2)}`, colX[4], y);
          y += 6;
        });
        y += 5;
      }

      // Venue performance
      if (venuePerformance.length > 0) {
        if (y > 240) { pdf.addPage(); y = 20; }
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t('partner.reports.venuePerformance'), 14, y);
        y += 8;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        const colX = [14, 80, 110, 140, 170];
        const headers = [t('partner.reports.venue'), t('partner.reports.redemptionsCol'), t('partner.rating'), t('partner.reports.revenue'), t('partner.reports.growth')];
        headers.forEach((h, i) => pdf.text(h, colX[i], y));
        y += 2;
        pdf.line(14, y, pageWidth - 14, y);
        y += 5;

        pdf.setFont('helvetica', 'normal');
        venuePerformance.forEach(v => {
          if (y > 270) { pdf.addPage(); y = 20; }
          pdf.text(v.venueName.substring(0, 30), colX[0], y);
          pdf.text(String(v.totalRedemptions), colX[1], y);
          pdf.text(v.avgRating?.toFixed(1) || '-', colX[2], y);
          pdf.text(`€${v.totalRevenue.toFixed(2)}`, colX[3], y);
          pdf.text(v.growthPercent !== null ? `${v.growthPercent.toFixed(1)}%` : '-', colX[4], y);
          y += 6;
        });
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(`${t('partner.reports.generatedOn')} ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, 285);
      pdf.text('VybePulse Partner Report', pageWidth - 60, 285);

      pdf.save(`report-${monthlyReport.month}.pdf`);
      toast.success(t('partner.reports.exportSuccess'));
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(t('common.error'));
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Card variant="glass" className="max-w-md w-full text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('partner.portalTitle')}</h1>
          <p className="text-muted-foreground mb-6">{t('partner.portalSignIn')}</p>
          <Button onClick={() => navigate('/?auth=partner')} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            <LogIn className="w-4 h-4 mr-2" />
            {t('partner.signInAsPartner')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-romantic bg-clip-text text-transparent">
            {t('partner.reports.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('partner.reports.subtitle')}</p>
        </div>
        <Badge variant="default" className="text-sm">
          <FileText className="w-3 h-3 mr-1" />
          {t('partner.reports.taxReady')}
        </Badge>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={exporting || !monthlyReport}>
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={exporting || !monthlyReport}>
            <Download className="w-4 h-4 mr-1.5" />
            PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t('partner.reports.totalRedemptions'), value: monthlyReport?.totalRedemptions ?? 0, icon: BarChart3 },
              { label: t('partner.reports.uniqueGuests'), value: monthlyReport?.uniqueGuests ?? 0, icon: Sparkles },
              { label: t('partner.reports.totalDiscount'), value: `€${(monthlyReport?.totalDiscountGiven ?? 0).toFixed(2)}`, icon: Euro },
              { label: t('partner.reports.totalRevenue'), value: `€${(monthlyReport?.totalBookingValue ?? 0).toFixed(2)}`, icon: TrendingUp },
            ].map((card, i) => (
              <Card key={i} variant="glass" className="group hover:scale-[1.02] transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                    <card.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Voucher Breakdown */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg">{t('partner.reports.voucherBreakdown')}</CardTitle>
              <CardDescription>{t('partner.reports.voucherBreakdownDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyReport && monthlyReport.voucherBreakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('partner.reports.voucherName')}</TableHead>
                        <TableHead>{t('partner.reports.code')}</TableHead>
                        <TableHead className="text-right">{t('partner.reports.redemptionsCol')}</TableHead>
                        <TableHead className="text-right">{t('partner.reports.discountGiven')}</TableHead>
                        <TableHead className="text-right">{t('partner.reports.bookingValue')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyReport.voucherBreakdown.map((v, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{v.voucherTitle}</TableCell>
                          <TableCell><Badge variant="outline" className="font-mono text-xs">{v.code}</Badge></TableCell>
                          <TableCell className="text-right">{v.redemptions}</TableCell>
                          <TableCell className="text-right">€{v.discountGiven.toFixed(2)}</TableCell>
                          <TableCell className="text-right">€{v.bookingValue.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t('partner.reports.noRedemptions')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Venue Performance */}
          {venuePerformance.length > 0 && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">{t('partner.reports.venuePerformance')}</CardTitle>
                <CardDescription>{t('partner.reports.venuePerformanceDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('partner.reports.venue')}</TableHead>
                        <TableHead className="text-right">{t('partner.reports.redemptionsCol')}</TableHead>
                        <TableHead className="text-right">{t('partner.rating')}</TableHead>
                        <TableHead className="text-right">{t('partner.reports.revenue')}</TableHead>
                        <TableHead className="text-right">{t('partner.reports.growth')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {venuePerformance.map((v, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{v.venueName}</TableCell>
                          <TableCell className="text-right">{v.totalRedemptions}</TableCell>
                          <TableCell className="text-right">{v.avgRating?.toFixed(1) ?? '-'}</TableCell>
                          <TableCell className="text-right">€{v.totalRevenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            {v.growthPercent !== null ? (
                              <span className={`inline-flex items-center gap-1 ${v.growthPercent >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                {v.growthPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {Math.abs(v.growthPercent).toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tax hint */}
          <Card variant="elegant" className="border-dashed">
            <CardContent className="p-4 flex items-start gap-3">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{t('partner.reports.taxHintTitle')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('partner.reports.taxHintDesc')}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      
    </div>
  );
}
