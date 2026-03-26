import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, Star, Ticket, TrendingUp, Store, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';

interface VenueStats {
  venueId: string;
  venueName: string;
  totalRedemptions: number;
  monthlyRedemptions: number;
  avgRating: number | null;
  reviewCount: number;
  activeVouchers: number;
  totalVouchers: number;
}

export default function VenueComparison() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [venues, setVenues] = useState<VenueStats[]>([]);
  const [loading, setLoading] = useState(true);

  const isLoading = authLoading || roleLoading;

  useEffect(() => {
    if (!isLoading && user && role !== 'venue_partner' && role !== 'admin') {
      navigate('/home');
    }
  }, [role, isLoading, user, navigate]);

  useEffect(() => {
    if (user) fetchVenueComparison();
  }, [user]);

  const fetchVenueComparison = async () => {
    if (!user) return;
    try {
      const { data: partnerships } = await supabase
        .from('venue_partnerships')
        .select('venue_id')
        .eq('partner_id', user.id)
        .eq('status', 'approved');

      if (!partnerships || partnerships.length === 0) {
        setLoading(false);
        return;
      }

      const venueIds = partnerships.map(p => p.venue_id);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [venuesRes, vouchersRes, invitationsRes] = await Promise.all([
        supabase.from('venues').select('id, name, rating').in('id', venueIds),
        supabase.from('vouchers').select('id, venue_id, status, valid_until, current_redemptions, created_at').eq('partner_id', user.id).in('venue_id', venueIds),
        supabase.from('date_invitations').select('id, venue_id, created_at').in('venue_id', venueIds).eq('date_status', 'completed'),
      ]);

      const venueMap = new Map<string, VenueStats>();

      venuesRes.data?.forEach(v => {
        venueMap.set(v.id, {
          venueId: v.id,
          venueName: v.name,
          totalRedemptions: 0,
          monthlyRedemptions: 0,
          avgRating: null,
          reviewCount: 0,
          activeVouchers: 0,
          totalVouchers: 0,
        });
      });

      const now = new Date();
      vouchersRes.data?.forEach(v => {
        const venue = venueMap.get(v.venue_id);
        if (venue) {
          venue.totalRedemptions += v.current_redemptions || 0;
          venue.totalVouchers++;
          if (v.status === 'active' && new Date(v.valid_until) > now) {
            venue.activeVouchers++;
          }
          // Approximate monthly by checking voucher creation
          if (new Date(v.created_at) > new Date(thirtyDaysAgo)) {
            venue.monthlyRedemptions += v.current_redemptions || 0;
          }
        }
      });

      // Fetch feedback
      const invitationIds = invitationsRes.data?.map(i => i.id) || [];
      if (invitationIds.length > 0) {
        const { data: feedback } = await supabase
          .from('date_feedback')
          .select('invitation_id, venue_rating')
          .in('invitation_id', invitationIds)
          .not('venue_rating', 'is', null);

        const invToVenue = new Map<string, string>();
        invitationsRes.data?.forEach(i => invToVenue.set(i.id, i.venue_id || ''));

        const venueRatings = new Map<string, number[]>();
        feedback?.forEach(f => {
          const venueId = invToVenue.get(f.invitation_id);
          if (venueId && f.venue_rating) {
            const existing = venueRatings.get(venueId) || [];
            existing.push(f.venue_rating);
            venueRatings.set(venueId, existing);
          }
        });

        venueRatings.forEach((ratings, venueId) => {
          const venue = venueMap.get(venueId);
          if (venue) {
            venue.avgRating = Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10;
            venue.reviewCount = ratings.length;
          }
        });
      }

      const sorted = Array.from(venueMap.values()).sort((a, b) => b.totalRedemptions - a.totalRedemptions);
      setVenues(sorted);
    } catch (error) {
      console.error('Error fetching venue comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const maxRedemptions = Math.max(...venues.map(v => v.totalRedemptions), 1);
  const bestRated = venues.reduce((best, v) => (v.avgRating ?? 0) > (best?.avgRating ?? 0) ? v : best, venues[0]);
  const mostActive = venues.reduce((best, v) => v.activeVouchers > (best?.activeVouchers ?? 0) ? v : best, venues[0]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/partner')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            {t('partner.comparison.title', 'Venue-Vergleich')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('partner.comparison.subtitle', 'Performance deiner Venues im Überblick')}
          </p>
        </div>
      </div>

      {venues.length === 0 ? (
        <Card variant="glass">
          <CardContent className="p-8 text-center">
            <Store className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {t('partner.comparison.noVenues', 'Noch keine Venues registriert. Füge dein erstes Venue hinzu!')}
            </p>
            <Button className="mt-4" onClick={() => navigate('/partner/venues')}>
              {t('partner.comparison.addVenue', 'Venue hinzufügen')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Highlights */}
          {venues.length > 1 && (
            <div className="grid grid-cols-2 gap-3">
              <Card variant="glass" className="border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('partner.comparison.topPerformer', 'Top Performer')}
                    </span>
                  </div>
                  <p className="text-sm font-bold truncate">{venues[0]?.venueName}</p>
                  <p className="text-[11px] text-muted-foreground">{venues[0]?.totalRedemptions} Einlösungen</p>
                </CardContent>
              </Card>
              <Card variant="glass" className="border-amber-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('partner.comparison.bestRated', 'Beste Bewertung')}
                    </span>
                  </div>
                  <p className="text-sm font-bold truncate">{bestRated?.venueName}</p>
                  <p className="text-[11px] text-muted-foreground">{bestRated?.avgRating ?? '–'} ★ ({bestRated?.reviewCount} Reviews)</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Venue comparison bars */}
          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4 text-primary" />
                {t('partner.comparison.redemptions', 'Einlösungen pro Venue')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {venues.map((venue, index) => (
                <motion.div
                  key={venue.venueId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-muted-foreground w-5 shrink-0">{index + 1}.</span>
                      <span className="text-sm font-medium truncate">{venue.venueName}</span>
                      {index === 0 && venues.length > 1 && venue.totalRedemptions > 0 && (
                        <Badge className="text-[9px] px-1.5 bg-primary/20 text-primary border-0 shrink-0">
                          <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                          #1
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-bold shrink-0">{venue.totalRedemptions}</span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max((venue.totalRedemptions / maxRedemptions) * 100, 2)}%` }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Detailed comparison table */}
          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t('partner.comparison.details', 'Detail-Vergleich')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {venues.map((venue, index) => (
                  <motion.div
                    key={venue.venueId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 rounded-xl bg-muted/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold truncate">{venue.venueName}</h3>
                      {venue.avgRating !== null && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Star className="w-2.5 h-2.5 text-amber-500" />
                          {venue.avgRating}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="text-center p-2 rounded-lg bg-background/50">
                        <Ticket className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                        <p className="text-lg font-bold">{venue.totalRedemptions}</p>
                        <p className="text-[10px] text-muted-foreground">Gesamt</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-background/50">
                        <TrendingUp className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                        <p className="text-lg font-bold">{venue.monthlyRedemptions}</p>
                        <p className="text-[10px] text-muted-foreground">Diesen Monat</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-background/50">
                        <Star className="w-3.5 h-3.5 text-amber-500 mx-auto mb-1" />
                        <p className="text-lg font-bold">{venue.reviewCount}</p>
                        <p className="text-[10px] text-muted-foreground">Reviews</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-background/50">
                        <Store className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                        <p className="text-lg font-bold">{venue.activeVouchers}/{venue.totalVouchers}</p>
                        <p className="text-[10px] text-muted-foreground">Aktive Gutscheine</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
