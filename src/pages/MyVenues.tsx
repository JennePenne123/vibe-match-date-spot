import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Search, Heart, MapPin, Star, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { formatVenueAddress } from '@/utils/addressHelpers';

interface FavoriteVenue {
  id: string;
  name: string;
  address: string;
  cuisine_type: string | null;
  price_range: string | null;
  rating: number | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

type SortKey = 'recent' | 'rating' | 'name';

const MyVenues = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { likedVenues, toggleLike, loading: favoritesLoading } = useFavorites();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [venues, setVenues] = useState<FavoriteVenue[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/?auth=required', { replace: true });
  }, [authLoading, user, navigate]);

  const loadVenues = useCallback(async () => {
    if (favoritesLoading) return;
    if (likedVenues.length === 0) {
      setVenues([]);
      setLoadingVenues(false);
      return;
    }
    setLoadingVenues(true);
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, address, cuisine_type, price_range, rating, image_url, latitude, longitude')
        .in('id', likedVenues);
      if (error) throw error;
      setVenues((data || []) as FavoriteVenue[]);
    } catch (err) {
      console.error('Error loading favorite venues:', err);
      setVenues([]);
    } finally {
      setLoadingVenues(false);
    }
  }, [likedVenues, favoritesLoading]);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const visibleVenues = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = venues.filter(venue =>
      query === '' ||
      venue.name.toLowerCase().includes(query) ||
      (venue.cuisine_type || '').toLowerCase().includes(query) ||
      (venue.address || '').toLowerCase().includes(query)
    );

    const sorted = [...filtered];
    if (sortKey === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey === 'rating') {
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else {
      // recent = order of the favorites list (newest last in DB load order)
      sorted.sort((a, b) => likedVenues.indexOf(b.id) - likedVenues.indexOf(a.id));
    }
    return sorted;
  }, [venues, searchQuery, sortKey, likedVenues]);

  const isLoading = authLoading || favoritesLoading || loadingVenues;

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'recent', label: t('myVenues.sortRecent', 'Zuletzt gespeichert') },
    { key: 'rating', label: t('myVenues.sortRating', 'Bewertung') },
    { key: 'name', label: t('myVenues.sortName', 'Name') },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-card p-4 pt-12 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Button onClick={() => navigate(-1)} variant="ghost" size="icon" className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                {t('myVenues.title', 'Meine Favoriten')}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t('myVenues.subtitle', 'Deine gespeicherten Date-Spots')}
              </p>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder={t('myVenues.searchPlaceholder', 'Favoriten durchsuchen...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border h-10"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {sortOptions.map(option => (
              <Badge
                key={option.key}
                variant={sortKey === option.key ? 'default' : 'secondary'}
                className={cn(
                  'cursor-pointer whitespace-nowrap transition-colors',
                  sortKey === option.key
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
                onClick={() => setSortKey(option.key)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : visibleVenues.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Heart className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {likedVenues.length === 0 ? t('myVenues.noFavorites') : t('myVenues.noMatching')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {likedVenues.length === 0 ? t('myVenues.noFavoritesDesc') : t('myVenues.noMatchingDesc')}
                </p>
                <Button onClick={() => navigate('/venues')} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('myVenues.discover', 'Date-Spots entdecken')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                {t('myVenues.count', { count: visibleVenues.length })}
              </p>
              <div className="space-y-3">
                {visibleVenues.map(venue => (
                  <Card
                    key={venue.id}
                    className="overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                    onClick={() => navigate(`/venue/${venue.id}`)}
                  >
                    <CardContent className="p-0">
                      <div className="flex gap-3 p-3">
                        <div className="w-20 h-20 rounded-xl bg-muted shrink-0 overflow-hidden">
                          {venue.image_url ? (
                            <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <MapPin className="w-6 h-6 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm text-foreground truncate">{venue.name}</h3>
                            <button
                              type="button"
                              aria-label={t('myVenues.remove', 'Aus Favoriten entfernen')}
                              onClick={(e) => { e.stopPropagation(); toggleLike(venue.id); }}
                              className="shrink-0 p-1 -m-1"
                            >
                              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                            </button>
                          </div>

                          <p className="text-xs text-muted-foreground truncate mt-0.5">{formatVenueAddress(venue)}</p>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {venue.cuisine_type && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {venue.cuisine_type}
                              </span>
                            )}
                            {venue.price_range && (
                              <span className="text-[10px] text-muted-foreground">{venue.price_range}</span>
                            )}
                            {venue.rating != null && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {venue.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyVenues;
