import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Store, Star, Ticket, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VenuePerformance {
  venueId: string;
  venueName: string;
  redemptions: number;
  avgRating: number | null;
  activeVouchers: number;
}

export default function VenuePerformanceCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [venues, setVenues] = useState<VenuePerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get partner's venues
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

      // Fetch venue details, vouchers, and redemptions in parallel
      const [venuesRes, vouchersRes, invitationsRes] = await Promise.all([
        supabase.from('venues').select('id, name').in('id', venueIds),
        supabase.from('vouchers').select('id, venue_id, status, valid_until, current_redemptions').eq('partner_id', user.id).in('venue_id', venueIds),
        supabase.from('date_invitations').select('id, venue_id').in('venue_id', venueIds).eq('date_status', 'completed'),
      ]);

      const venueMap = new Map<string, VenuePerformance>();
      
      venuesRes.data?.forEach(v => {
        venueMap.set(v.id, {
          venueId: v.id,
          venueName: v.name,
          redemptions: 0,
          avgRating: null,
          activeVouchers: 0,
        });
      });

      // Count redemptions per venue from vouchers
      const now = new Date();
      vouchersRes.data?.forEach(v => {
        const venue = venueMap.get(v.venue_id);
        if (venue) {
          venue.redemptions += v.current_redemptions || 0;
          if (v.status === 'active' && new Date(v.valid_until) > now) {
            venue.activeVouchers++;
          }
        }
      });

      // Get feedback ratings for completed invitations at these venues
      const invitationIds = invitationsRes.data?.map(i => i.id) || [];
      if (invitationIds.length > 0) {
        const { data: feedback } = await supabase
          .from('date_feedback')
          .select('invitation_id, venue_rating')
          .in('invitation_id', invitationIds)
          .not('venue_rating', 'is', null);

        // Map invitation_id back to venue_id
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
          }
        });
      }

      // Sort by redemptions desc
      const sorted = Array.from(venueMap.values()).sort((a, b) => b.redemptions - a.redemptions);
      setVenues(sorted);
    } catch (error) {
      console.error('Error fetching venue performance:', error);
    } finally {
      setLoading(false);
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

  if (venues.length === 0) return null;

  const topVenue = venues[0];

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-4 h-4 text-primary" />
            {t('partner.performance.title', 'Venue-Performance')}
          </CardTitle>
          {venues.length > 1 && (
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/partner/venue-comparison')}>
              {t('partner.performance.compare', 'Vergleichen')}
              <ArrowRight className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {venues.map((venue, index) => {
          const isTop = index === 0 && venues.length > 1 && venue.redemptions > 0;
          return (
            <div
              key={venue.venueId}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isTop ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                isTop ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{venue.venueName}</p>
                  {isTop && (
                    <Badge className="text-[9px] px-1.5 bg-primary/20 text-primary border-0">
                      <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                      Top
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Ticket className="w-3 h-3" />
                    {venue.redemptions} Einlösungen
                  </span>
                  {venue.avgRating !== null && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {venue.avgRating} ★
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    {venue.activeVouchers} aktiv
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
