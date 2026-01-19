
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useFriends } from '@/hooks/useFriends';
import HomeHeader from '@/components/HomeHeader';
import AIVenueCard from '@/components/AIVenueCard';
import CompatibilityScore from '@/components/CompatibilityScore';
import LoadingSpinner from '@/components/LoadingSpinner';
import SafeComponent from '@/components/SafeComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, RefreshCw, Users, MapPin, LayoutGrid, Map } from 'lucide-react';
import { getUserName } from '@/utils/typeHelpers';
import { safeFirstWord } from '@/lib/utils';
import { getLocationFallback } from '@/utils/locationFallback';

// Lazy load VenueMapView to avoid SSR issues with Leaflet
const VenueMapView = lazy(() => import('@/components/VenueMapView'));

const AIRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthRedirect();
  const { friends } = useFriends();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
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

  const selectedPartner = friends.find(f => f.id === selectedPartnerId);

  // Memoize user display logic
  const userInfo = React.useMemo(() => {
    if (!user) return null;
    
    const displayName = getUserName(user);
    const firstName = safeFirstWord(displayName, 'User');
    
    return { displayName, firstName };
  }, [user]);

  const handleVenueSelect = (venueId: string) => {
    console.log('Selected venue:', venueId);
    navigate(`/venue/${venueId}`);
  };

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
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
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

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((recommendation) => (
                  <SafeComponent 
                    key={recommendation.venue_id}
                    componentName="AIVenueCard"
                  >
                    <AIVenueCard
                      recommendation={recommendation}
                      onSelect={handleVenueSelect}
                      showAIInsights={true}
                    />
                  </SafeComponent>
                ))}
              </div>
            ) : (
              <Suspense fallback={<Skeleton className="h-[500px] rounded-lg" />}>
                <VenueMapView
                  recommendations={recommendations}
                  onSelectVenue={handleVenueSelect}
                  userLocation={userLocation}
                  height="500px"
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
