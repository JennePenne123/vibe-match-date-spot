import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Users, TrendingUp, MapPin, Trophy, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';

interface VenueRanking {
  venue_id: string;
  venue_name: string;
  venue_address: string;
  cuisine_type: string | null;
  price_range: string | null;
  visit_count: number;
  avg_rating: number;
  review_count: number;
}

export default function CityRankings() {
  const { t } = useTranslation();
  const { role, loading: roleLoading } = useUserRole();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<VenueRanking[]>([]);
  const [city, setCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownVenueIds, setOwnVenueIds] = useState<string[]>([]);

  const isLoading = roleLoading || authLoading;

  useEffect(() => {
    if (!isLoading && user && role !== 'venue_partner' && role !== 'admin') {
      navigate('/home');
    }
  }, [role, isLoading, user, navigate]);

  useEffect(() => {
    if (!user || isLoading) return;
    fetchRankings();
  }, [user, isLoading]);

  const fetchRankings = async () => {
    try {
      // Get partner's city
      const { data: profile } = await supabase
        .from('partner_profiles')
        .select('city')
        .eq('user_id', user!.id)
        .single();

      const partnerCity = profile?.city?.trim();
      if (!partnerCity) {
        setCity(null);
        setLoading(false);
        return;
      }
      setCity(partnerCity);

      // Get own venue IDs for highlighting
      const { data: partnerships } = await supabase
        .from('venue_partnerships')
        .select('venue_id')
        .eq('partner_id', user!.id)
        .eq('status', 'approved');

      setOwnVenueIds(partnerships?.map(p => p.venue_id) || []);

      // Fetch rankings via security definer function
      const { data, error } = await supabase
        .rpc('get_city_venue_rankings', { _city: partnerCity });

      if (error) throw error;
      setRankings((data as VenueRanking[]) || []);
    } catch (err) {
      console.error('Error fetching city rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'w-3.5 h-3.5',
            i <= Math.round(rating) ? 'fill-accent text-accent' : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/partner/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {t('partner.cityRankings.title', 'City Rankings')}
          </h1>
          {city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {city}
            </p>
          )}
        </div>
        <Badge variant="secondary" className="gap-1">
          <Trophy className="w-3 h-3" />
          {rankings.length} Venues
        </Badge>
      </div>

      {/* No city set */}
      {!city && (
        <Card variant="glass">
          <CardContent className="p-8 text-center">
            <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">{t('partner.cityRankings.noCity', 'Keine Stadt hinterlegt')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('partner.cityRankings.noCityDesc', 'Bitte hinterlege deine Stadt im Partnerprofil, um das Ranking zu sehen.')}
            </p>
            <Button onClick={() => navigate('/partner/profile')}>
              {t('partner.profile.editButton', 'Profil bearbeiten')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {city && rankings.length === 0 && (
        <Card variant="glass">
          <CardContent className="p-8 text-center">
            <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">{t('partner.cityRankings.noData', 'Noch keine Daten')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('partner.cityRankings.noDataDesc', 'Sobald Dates in {{city}} stattfinden, erscheint hier das Ranking.', { city })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rankings list */}
      {rankings.length > 0 && (
        <div className="space-y-3">
          {rankings.map((venue, index) => {
            const isOwn = ownVenueIds.includes(venue.venue_id);
            const rank = index + 1;

            return (
              <Card
                key={venue.venue_id}
                variant="glass"
                className={cn(
                  'transition-all',
                  isOwn && 'ring-2 ring-primary/30 bg-primary/5',
                  rank <= 3 && 'shadow-md'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Rank */}
                    <div className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm',
                      rank === 1 && 'bg-accent/20 text-accent',
                      rank === 2 && 'bg-muted text-muted-foreground',
                      rank === 3 && 'bg-primary/20 text-primary',
                      rank > 3 && 'bg-muted text-muted-foreground'
                    )}>
                      {rank <= 3 ? <Trophy className="w-4 h-4" /> : `#${rank}`}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{venue.venue_name}</h3>
                        {isOwn && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {t('partner.cityRankings.yourVenue', 'Dein Venue')}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {venue.cuisine_type && `${venue.cuisine_type} · `}
                        {venue.price_range || ''}
                      </p>

                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-medium">
                            {venue.visit_count} {t('partner.cityRankings.visits', 'Besuche')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {venue.avg_rating > 0 ? (
                            <>
                              {renderStars(venue.avg_rating)}
                              <span className="text-xs font-medium">{venue.avg_rating}</span>
                              <span className="text-xs text-muted-foreground">
                                ({venue.review_count})
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {t('partner.cityRankings.noRatings', 'Keine Bewertungen')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
