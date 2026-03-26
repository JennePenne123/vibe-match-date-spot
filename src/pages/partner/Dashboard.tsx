import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { usePartnerDashboardStats } from '@/hooks/usePartnerDashboardStats';
import { usePartnerOnboardingState } from '@/hooks/usePartnerOnboardingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Users, Gift, LogIn, FileText, QrCode, Map, UserCog, Trophy, Star } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import LanguageSelector from '@/components/LanguageSelector';
import RedemptionChart from '@/components/partner/RedemptionChart';
import VoucherAlerts from '@/components/partner/VoucherAlerts';
import GuestFeedbackCard from '@/components/partner/GuestFeedbackCard';
import PartnerOnboardingBanner from '@/components/partner/PartnerOnboardingBanner';
import PartnerNotificationsCard from '@/components/partner/PartnerNotificationsCard';
import VenuePerformanceCard from '@/components/partner/VenuePerformanceCard';

export default function PartnerDashboard() {
  const { t } = useTranslation();
  const { role, loading: roleLoading } = useUserRole();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { stats, loading: statsLoading } = usePartnerDashboardStats(user?.id);
  const onboarding = usePartnerOnboardingState(user?.id);

  const isLoading = roleLoading || authLoading;

  useEffect(() => {
    if (!isLoading && user && role !== 'venue_partner' && role !== 'admin') {
      navigate('/home');
    }
  }, [role, isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
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
          <div className="mt-6">
            <LanguageSelector />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-romantic bg-clip-text text-transparent">
            {t('partner.dashboard')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('partner.dashboardDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/partner/profile')}>
            <UserCog className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{t('partner.profile.editButton', 'Profil bearbeiten')}</span>
            <span className="sm:hidden">{t('partner.profile.editButton', 'Profil')}</span>
          </Button>
          <Badge variant="default" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            {t('partner.venuePartner')}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card variant="glass" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('partner.activeVouchers')}</CardTitle>
            <Gift className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-0 md:pt-0">
            <div className="text-2xl md:text-3xl font-bold">{statsLoading ? '–' : stats.activeVouchers}</div>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-1">{t('partner.activeVouchersDesc')}</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('partner.totalRedemptions')}</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-0 md:pt-0">
            <div className="text-2xl md:text-3xl font-bold">{statsLoading ? '–' : stats.totalRedemptions}</div>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-1">{t('partner.totalRedemptionsDesc')}</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('partner.thisMonth')}</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-0 md:pt-0">
            <div className="text-2xl md:text-3xl font-bold">{statsLoading ? '–' : stats.thisMonthRedemptions}</div>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-1">{t('partner.thisMonthDesc')}</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="group hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stats.avgRating !== null ? t('partner.avgRating', 'Ø Bewertung') : t('partner.managedVenues')}</CardTitle>
            {stats.avgRating !== null ? <Star className="w-4 h-4 text-primary" /> : <Sparkles className="w-4 h-4 text-primary" />}
          </CardHeader>
          <CardContent className="pt-0 md:pt-0">
            <div className="text-2xl md:text-3xl font-bold">
              {statsLoading ? '–' : stats.avgRating !== null ? `${stats.avgRating} ★` : stats.managedVenues}
            </div>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-1">
              {stats.avgRating !== null ? t('partner.avgRatingDesc', 'Durchschnittliche Venue-Bewertung') : t('partner.managedVenuesDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Voucher Alerts */}
      <VoucherAlerts />

      {/* Guest Feedback */}
      <GuestFeedbackCard />

      {/* Analytics Chart */}
      <RedemptionChart />

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Card variant="glass" className="group hover:scale-[1.02] transition-all duration-300 cursor-pointer" onClick={() => navigate('/partner/reports')}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t('partner.reports.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('partner.reports.subtitle')}</p>
            </div>
            <Badge variant="outline">{t('partner.reports.taxReady')}</Badge>
          </CardContent>
        </Card>

        <Card variant="glass" className="group hover:scale-[1.02] transition-all duration-300 cursor-pointer" onClick={() => navigate('/partner/qr-code')}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t('partner.qr.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('partner.qr.subtitle')}</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="group hover:scale-[1.02] transition-all duration-300 cursor-pointer" onClick={() => navigate('/partner/network-map')}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Map className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t('partner.network.findPartners')}</h3>
              <p className="text-sm text-muted-foreground">{t('partner.network.findPartnersDesc')}</p>
            </div>
            <Badge variant="outline">{t('partner.network.mapBadge')}</Badge>
          </CardContent>
        </Card>

        <Card variant="glass" className="group hover:scale-[1.02] transition-all duration-300 cursor-pointer" onClick={() => navigate('/partner/city-rankings')}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t('partner.cityRankings.title', 'City Rankings')}</h3>
              <p className="text-sm text-muted-foreground">{t('partner.cityRankings.dashboardDesc', 'Sieh, wie dein Venue in deiner Stadt abschneidet')}</p>
            </div>
            <Badge variant="outline">{t('partner.cityRankings.rankingBadge', 'Ranking')}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Language Selector */}
      <LanguageSelector />

      <Card variant="elegant">
        <CardHeader>
          <CardTitle>{t('partner.gettingStarted')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { num: '1', title: t('partner.step1Title'), desc: t('partner.step1Desc') },
            { num: '2', title: t('partner.step2Title'), desc: t('partner.step2Desc') },
            { num: '3', title: t('partner.step3Title'), desc: t('partner.step3Desc') },
          ].map((step) => (
            <div key={step.num} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{step.num}</span>
              </div>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
