
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useFriends } from '@/hooks/useFriends';
import { useBatchRouteInfo } from '@/hooks/useBatchRouteInfo';
import HomeHeader from '@/components/HomeHeader';
import AIVenueCard from '@/components/AIVenueCard';
import CompatibilityScore from '@/components/CompatibilityScore';
import LoadingSpinner from '@/components/LoadingSpinner';
import SafeComponent from '@/components/SafeComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, RefreshCw, Users, MapPin, LayoutGrid, Map, Car, PersonStanding, ArrowUpDown } from 'lucide-react';
import { getUserName } from '@/utils/typeHelpers';
import { safeFirstWord } from '@/lib/utils';
import { getLocationFallback } from '@/utils/locationFallback';

// Lazy load VenueMapView to avoid SSR issues with Leaflet
const VenueMapView = lazy(() => import('@/components/VenueMapView'));

type SortOption = 'ai_score' | 'driving_time' | 'walking_time' | 'distance';

const AIRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthRedirect();
  const { friends } = useFriends();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('ai_score');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const { 
    recommendations, 
    compatibilityScore, 
    loading, 
    error, 
    refreshRecommendations 
  } = useAIRecommendations(selectedPartnerId || undefined);

  // Fetch user's saved home location for directions
  useEffect(() => {
    const loadUserLocation = async () => {
      if (user) {
        const location = await getLocationFallback(user.id);
        if (location.source === 'user_preferences') {
          setUserLocation({ latitude: location.latitude, longitude: location.longitude });
        }
      }
    };
    loadUserLocation();
  }, [user]);

  // Batch fetch route info for all venues
  const venueLocations = useMemo(() => 
    recommendations.map(r => ({
      venue_id: r.venue_id,
      latitude: r.latitude,
      longitude: r.longitude
    })), 
    [recommendations]
  );

  const { routeData, loading: routeLoading, progress: routeProgress } = useBatchRouteInfo({
    venues: venueLocations,
    userLocation,
    enabled: !!userLocation && recommendations.length > 0
  });

  const selectedPartner = friends.find(f => f.id === selectedPartnerId);

  // Memoize user display logic
  const userInfo = React.useMemo(() => {
    if (!user) return null;
    
    const displayName = getUserName(user);
    const firstName = safeFirstWord(displayName, 'User');
    
    return { displayName, firstName };
  }, [user]);

  // Sort recommendations based on selected option
  const sortedRecommendations = useMemo(() => {
    if (!recommendations.length) return [];
    
    const sorted = [...recommendations];
    
    switch (sortBy) {
      case 'ai_score':
        return sorted.sort((a, b) => b.ai_score - a.ai_score);
        
      case 'driving_time':
        return sorted.sort((a, b) => {
          const aTime = routeData.get(a.venue_id)?.driving?.duration ?? Infinity;
          const bTime = routeData.get(b.venue_id)?.driving?.duration ?? Infinity;
          return aTime - bTime;
        });
        
      case 'walking_time':
        return sorted.sort((a, b) => {
          const aTime = routeData.get(a.venue_id)?.walking?.duration ?? Infinity;
          const bTime = routeData.get(b.venue_id)?.walking?.duration ?? Infinity;
          return aTime - bTime;
        });
        
      case 'distance':
        return sorted.sort((a, b) => {
          const aDist = routeData.get(a.venue_id)?.driving?.distance ?? Infinity;
          const bDist = routeData.get(b.venue_id)?.driving?.distance ?? Infinity;
          return aDist - bDist;
        });
        
      default:
        return sorted;
    }
  }, [recommendations, sortBy, routeData]);

  const handleVenueSelect = (venueId: string) => {
    console.log('Selected venue:', venueId);
    navigate(`/venue/${venueId}`);
  };

  const hasHomeLocation = !!userLocation;

  if (!user || !userInfo) return <LoadingSpinner />;

  const { displayName, firstName } = userInfo;

  return (
    <div className="min-h-screen bg-background">
      <HomeHeader 
        user={user}
        displayName={displayName}
        firstName={firstName}
      />
      
      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">AI Date Recommendations</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get personalized venue recommendations powered by AI that matches your preferences 
            and compatibility with your date partner.
          </p>
        </div>

        {/* Partner Selection */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Select Date Partner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a friend for compatibility analysis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Solo recommendations</SelectItem>
                {friends.map((friend) => (
                  <SelectItem key={friend.id} value={friend.id}>
                    {friend.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={refreshRecommendations}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Recommendations
            </Button>
          </CardContent>
        </Card>

        {/* Compatibility Score */}
        {compatibilityScore && selectedPartner && (
          <SafeComponent componentName="CompatibilityScore">
            <div className="max-w-2xl mx-auto">
              <CompatibilityScore 
                score={compatibilityScore}
                partnerName={selectedPartner.name}
              />
            </div>
          </SafeComponent>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="max-w-md mx-auto border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6 text-center">
              <p className="text-destructive">{error}</p>
              <Button 
                onClick={refreshRecommendations}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* AI Venue Recommendations */}
        {!loading && recommendations.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-semibold text-foreground mb-1">
                  Recommended Venues
                </h2>
                <p className="text-muted-foreground">
                  {recommendations.length} venues ranked by AI compatibility
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai_score">
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-3 w-3" />
                          AI Score
                        </span>
                      </SelectItem>
                      <SelectItem value="driving_time" disabled={!hasHomeLocation}>
                        <span className="flex items-center gap-2">
                          <Car className="h-3 w-3" />
                          Drive Time
                        </span>
                      </SelectItem>
                      <SelectItem value="walking_time" disabled={!hasHomeLocation}>
                        <span className="flex items-center gap-2">
                          <PersonStanding className="h-3 w-3" />
                          Walk Time
                        </span>
                      </SelectItem>
                      <SelectItem value="distance" disabled={!hasHomeLocation}>
                        <span className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          Distance
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Route loading indicator */}
                {routeLoading && sortBy !== 'ai_score' && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    {routeProgress}%
                  </span>
                )}

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="gap-1.5"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className="gap-1.5"
                  >
                    <Map className="h-4 w-4" />
                    Map
                  </Button>
                </div>
              </div>
            </div>

            {/* No home location warning */}
            {!hasHomeLocation && sortBy !== 'ai_score' && (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 text-center">
                Set your home location in Preferences to sort by travel time
              </div>
            )}

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedRecommendations.map((recommendation) => {
                  const venueRoute = routeData.get(recommendation.venue_id);
                  return (
                    <SafeComponent 
                      key={recommendation.venue_id}
                      componentName="AIVenueCard"
                    >
                      <AIVenueCard
                        recommendation={recommendation}
                        onSelect={handleVenueSelect}
                        showAIInsights={true}
                        travelInfo={venueRoute}
                      />
                    </SafeComponent>
                  );
                })}
              </div>
            ) : (
              <Suspense fallback={<Skeleton className="h-[500px] rounded-lg" />}>
                <VenueMapView
                  recommendations={sortedRecommendations}
                  onSelectVenue={handleVenueSelect}
                  userLocation={userLocation}
                  height="500px"
                  routeData={routeData}
                />
              </Suspense>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && recommendations.length === 0 && !error && (
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-6">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Recommendations Yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Complete your preferences to get personalized AI recommendations.
              </p>
              <Button onClick={refreshRecommendations}>
                Get Recommendations
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AIRecommendations;

