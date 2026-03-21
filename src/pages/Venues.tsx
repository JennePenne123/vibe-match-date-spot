import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Search, SlidersHorizontal, MapPin, Star, Sparkles, Heart, Navigation, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLocationFallback } from '@/utils/locationFallback';

interface DBVenue {
  id: string;
  name: string;
  address: string;
  cuisine_type: string | null;
  price_range: string | null;
  rating: number | null;
  tags: string[] | null;
  description: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface VenueWithScore extends DBVenue {
  ai_score?: number;
  distance_km?: number;
}

const FILTERS = ['Italian', 'Japanese', 'Mexican', 'American', 'Romantic', 'Casual', 'Nightlife'];
const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

const Venues = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [likedVenues, setLikedVenues] = useState<string[]>([]);
  const [venues, setVenues] = useState<VenueWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchingCity, setSearchingCity] = useState(false);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/?auth=required', { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const saved = localStorage.getItem('likedVenues');
    if (saved) setLikedVenues(JSON.parse(saved));
  }, []);

  // Get user's home location on mount
  useEffect(() => {
    const initLocation = async () => {
      if (!user) return;
      const loc = await getLocationFallback(user.id);
      setSearchCenter({ lat: loc.latitude, lng: loc.longitude });
      setActiveCity(loc.address || t('venues.nearYou', 'In deiner Nähe'));
    };
    initLocation();
  }, [user, t]);

  // Load venues from DB
  const loadVenues = useCallback(async (center?: { lat: number; lng: number }) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('id, name, address, cuisine_type, price_range, rating, tags, description, image_url, latitude, longitude')
        .eq('is_active', true)
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(100);

      if (venueError) throw venueError;

      const { data: scoreData } = await supabase
        .from('ai_venue_scores')
        .select('venue_id, ai_score')
        .eq('user_id', user.id);

      const scoreMap = new Map<string, number>();
      scoreData?.forEach(s => scoreMap.set(s.venue_id, s.ai_score));

      let venuesWithScores: VenueWithScore[] = (venueData || []).map(v => {
        let distance_km: number | undefined;
        if (center && v.latitude && v.longitude) {
          distance_km = haversine(center.lat, center.lng, v.latitude, v.longitude);
        }
        return { ...v, ai_score: scoreMap.get(v.id), distance_km };
      });

      // If we have a center, filter by 50km radius and sort by distance
      if (center) {
        venuesWithScores = venuesWithScores
          .filter(v => v.distance_km !== undefined && v.distance_km <= 50);
      }

      // Sort: AI score first, then distance
      venuesWithScores.sort((a, b) => {
        if (a.ai_score && b.ai_score) return b.ai_score - a.ai_score;
        if (a.ai_score) return -1;
        if (b.ai_score) return 1;
        if (a.distance_km !== undefined && b.distance_km !== undefined) return a.distance_km - b.distance_km;
        return (b.rating || 0) - (a.rating || 0);
      });

      setVenues(venuesWithScores);
    } catch (err) {
      console.error('Failed to load venues:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (searchCenter) loadVenues(searchCenter);
  }, [searchCenter, loadVenues]);

  // Geocode a city name via BigDataCloud (free, no key needed)
  const searchCity = async () => {
    if (!cityQuery.trim()) return;
    setSearchingCity(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery.trim())}&format=json&limit=1&addressdetails=1`,
        { headers: { 'Accept-Language': 'de' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newCenter = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setSearchCenter(newCenter);
        const cityName = display_name.split(',')[0];
        setActiveCity(cityName);
        setCityQuery('');

        // Also trigger a Radar search for that location
        await triggerVenueSearch(newCenter);
      }
    } catch (err) {
      console.error('City geocoding failed:', err);
    } finally {
      setSearchingCity(false);
    }
  };

  const triggerVenueSearch = async (center: { lat: number; lng: number }) => {
    if (!user) return;
    try {
      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('preferred_cuisines, preferred_activities, preferred_venue_types')
        .eq('user_id', user.id)
        .single();

      await supabase.functions.invoke('search-venues-radar', {
        body: {
          latitude: center.lat,
          longitude: center.lng,
          cuisines: userPrefs?.preferred_cuisines || [],
          radius: 25000,
          limit: 40,
          venueTypes: (userPrefs as any)?.preferred_venue_types || [],
          activities: (userPrefs as any)?.preferred_activities || [],
        }
      });

      // Reload venues after search completes
      await loadVenues(center);
    } catch (err) {
      console.error('Venue search failed:', err);
    }
  };

  const resetToHome = async () => {
    if (!user) return;
    const loc = await getLocationFallback(user.id);
    setSearchCenter({ lat: loc.latitude, lng: loc.longitude });
    setActiveCity(loc.address || t('venues.nearYou', 'In deiner Nähe'));
  };

  const toggleFilter = (filter: string) =>
    setSelectedFilters(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);

  const toggleLike = (venueId: string) => {
    const updated = likedVenues.includes(venueId)
      ? likedVenues.filter(id => id !== venueId)
      : [...likedVenues, venueId];
    setLikedVenues(updated);
    localStorage.setItem('likedVenues', JSON.stringify(updated));
  };

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = !searchQuery ||
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.cuisine_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilters = selectedFilters.length === 0 ||
      selectedFilters.some(f =>
        venue.cuisine_type?.toLowerCase().includes(f.toLowerCase()) ||
        venue.tags?.some(tag => tag.toLowerCase().includes(f.toLowerCase()))
      );
    return matchesSearch && matchesFilters;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-500/15';
    if (score >= 60) return 'text-blue-600 bg-blue-500/15';
    if (score >= 40) return 'text-amber-600 bg-amber-500/15';
    return 'text-muted-foreground bg-muted';
  };

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">{t('common.loading')}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-card p-4 pt-12 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <Button onClick={() => navigate(-1)} variant="ghost" size="icon" className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{t('venues.discover')}</h1>
              {activeCity && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {activeCity}
                </p>
              )}
            </div>
          </div>

          {/* City Search */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder={t('venues.cityPlaceholder', 'Stadt oder Ort eingeben...')}
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCity()}
                className="pl-10 bg-muted border-border h-10"
              />
            </div>
            <Button
              onClick={searchCity}
              disabled={!cityQuery.trim() || searchingCity}
              size="sm"
              className="h-10 px-4"
            >
              {searchingCity ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.search')}
            </Button>
          </div>

          {/* Back to home location button */}
          {activeCity && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToHome}
              className="text-xs text-muted-foreground h-7 px-2 mb-2"
            >
              <MapPin className="w-3 h-3 mr-1" />
              {t('venues.backToHome', 'Zurück zu meinem Standort')}
            </Button>
          )}

          {/* Venue Name Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder={t('venues.searchVenues')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border h-10"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
            {FILTERS.map((filter) => (
              <Badge
                key={filter}
                variant={selectedFilters.includes(filter) ? 'default' : 'secondary'}
                className={cn(
                  'cursor-pointer transition-colors whitespace-nowrap',
                  selectedFilters.includes(filter)
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
                onClick={() => toggleFilter(filter)}
              >
                {filter}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">
              {loading ? t('common.loading') : t('venues.venuesFound', { count: filteredVenues.length })}
            </p>
            <Button
              onClick={() => navigate('/my-venues')}
              variant="ghost"
              size="sm"
              className="text-primary text-xs h-7 px-2"
            >
              <Heart className="w-3.5 h-3.5 mr-1" />
              {t('venues.myVenues')} ({likedVenues.length})
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredVenues.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('venues.noResults', 'Keine Venues gefunden')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('venues.tryOtherCity', 'Versuche eine andere Stadt oder erweitere die Filter')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredVenues.map((venue) => (
                <Card
                  key={venue.id}
                  className="overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                  onClick={() => navigate(`/venue/${venue.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="flex gap-3 p-3">
                      {/* Image */}
                      <div className="w-20 h-20 rounded-xl bg-muted shrink-0 overflow-hidden">
                        {venue.image_url ? (
                          <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm text-foreground truncate">{venue.name}</h3>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLike(venue.id); }}
                            className="shrink-0"
                          >
                            <Heart className={cn(
                              'w-4 h-4 transition-colors',
                              likedVenues.includes(venue.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                            )} />
                          </button>
                        </div>

                        <p className="text-xs text-muted-foreground truncate mt-0.5">{venue.address}</p>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {venue.cuisine_type && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {venue.cuisine_type}
                            </span>
                          )}
                          {venue.price_range && (
                            <span className="text-[10px] text-muted-foreground">{venue.price_range}</span>
                          )}
                          {venue.rating && (
                            <span className="text-[10px] flex items-center gap-0.5 text-amber-600">
                              <Star className="w-3 h-3 fill-amber-500" /> {venue.rating.toFixed(1)}
                            </span>
                          )}
                          {venue.distance_km !== undefined && (
                            <span className="text-[10px] text-muted-foreground">
                              {venue.distance_km < 1
                                ? `${Math.round(venue.distance_km * 1000)}m`
                                : `${venue.distance_km.toFixed(1)}km`}
                            </span>
                          )}
                        </div>

                        {/* AI Score */}
                        {venue.ai_score !== undefined && (
                          <div className="mt-1.5">
                            <span className={cn(
                              'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                              getScoreColor(venue.ai_score)
                            )}>
                              <Sparkles className="w-3 h-3" />
                              {venue.ai_score}% Match
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** Haversine distance in km */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default Venues;
