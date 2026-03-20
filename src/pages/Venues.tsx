import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Search, SlidersHorizontal, MapPin, Star, Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

const FILTERS = ['Italian', 'Japanese', 'Mexican', 'American', 'Romantic', 'Casual', 'Nightlife'];

const Venues = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [likedVenues, setLikedVenues] = useState<string[]>([]);
  const [venues, setVenues] = useState<VenueWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/?auth=required', { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const saved = localStorage.getItem('likedVenues');
    if (saved) setLikedVenues(JSON.parse(saved));
  }, []);

  // Load venues from DB
  useEffect(() => {
    const loadVenues = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch venues
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .select('id, name, address, cuisine_type, price_range, rating, tags, description, image_url, latitude, longitude')
          .eq('is_active', true)
          .order('rating', { ascending: false, nullsFirst: false })
          .limit(50);

        if (venueError) throw venueError;

        // Fetch AI scores for this user
        const { data: scoreData } = await supabase
          .from('ai_venue_scores')
          .select('venue_id, ai_score')
          .eq('user_id', user.id);

        const scoreMap = new Map<string, number>();
        scoreData?.forEach(s => scoreMap.set(s.venue_id, s.ai_score));

        const venuesWithScores: VenueWithScore[] = (venueData || []).map(v => ({
          ...v,
          ai_score: scoreMap.get(v.id),
        }));

        // Sort: venues with AI scores first (by score desc), then by rating
        venuesWithScores.sort((a, b) => {
          if (a.ai_score && b.ai_score) return b.ai_score - a.ai_score;
          if (a.ai_score) return -1;
          if (b.ai_score) return 1;
          return (b.rating || 0) - (a.rating || 0);
        });

        setVenues(venuesWithScores);
      } catch (err) {
        console.error('Failed to load venues:', err);
      } finally {
        setLoading(false);
      }
    };
    loadVenues();
  }, [user]);

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
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-card p-4 pt-12 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <Button onClick={() => navigate(-1)} variant="ghost" size="icon" className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{t('venues.discover')}</h1>
              <p className="text-xs text-muted-foreground">{t('venues.findPerfect')}</p>
            </div>
          </div>

          {/* Search */}
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

export default Venues;
