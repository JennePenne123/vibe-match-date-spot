import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createEnhancedTestVenues, createDiverseTestUsers, getTestUserInfo } from '@/services/testData';
import { getAIVenueRecommendations } from '@/services/aiVenueService';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Database, Users, User, Heart, TestTube, MapPin, ExternalLink } from 'lucide-react';
import { Venue } from '@/types';

export const VenueMatchingDebug: React.FC = () => {
  const { user } = useAuth();
  const { appState, requestLocation, updateVenues } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [testMode, setTestMode] = useState<'solo' | 'collaborative'>('solo');
  const [testPartner, setTestPartner] = useState<string>('');
  const [setupComplete, setSetupComplete] = useState(false);
  const testUsers = getTestUserInfo();

  // Hamburg test location fallback
  const hamburgLocation = {
    latitude: 53.5511,
    longitude: 9.9937,
    address: 'Hamburg, Germany'
  };

  const handleSetupTestData = async () => {
    setLoading(true);
    setSetupComplete(false);
    try {
      console.log('🚀 Setting up comprehensive test data...');
      
      // Create diverse test users with different preferences
      console.log('📝 Creating test users...');
      const users = await createDiverseTestUsers();
      console.log(`✅ Created ${users.length} test users`);
      
      // Create enhanced venue dataset
      console.log('🏪 Creating test venues...');
      await createEnhancedTestVenues();
      console.log('✅ Created comprehensive venue database');
      
      setSetupComplete(true);
      
      toast({
        title: "Test Environment Ready",
        description: `Created ${users.length} diverse users and 25+ test venues for comprehensive testing`,
      });
      
    } catch (error) {
      console.error('❌ Setup failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Setup Failed", 
        description: `Failed to setup test environment: ${errorMessage}`,
        variant: "destructive",
      });
      setSetupComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTestMatching = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to test venue matching",
        variant: "destructive",
      });
      return;
    }
    
    if (testMode === 'collaborative' && !testPartner) {
      toast({
        title: "Partner Required",
        description: "Please select a test partner for collaborative matching",
        variant: "destructive",
      });
      return;
    }
    
    // Use app location or fallback to Hamburg for testing
    const testLocation = appState.userLocation || hamburgLocation;
    
    setLoading(true);
    try {
      const partnerId = testMode === 'collaborative' ? testPartner : undefined;
      console.log(`🔍 Testing ${testMode} venue matching...`);
      
      const recs = await getAIVenueRecommendations(user.id, partnerId, 10, testLocation);
      setRecommendations(recs);
      
      // Convert recommendations to venues and store in app context
      const venues: Venue[] = recs.map(rec => ({
        id: rec.venue_id,
        name: rec.venue_name,
        address: rec.venue_address || '',
        image_url: rec.venue_image,
        tags: []
      }));
      
      updateVenues(venues);
      
      toast({
        title: "Matching Complete",
        description: `Found ${recs.length} venue recommendations for ${testMode} mode`,
      });
      
      console.log('✅ Venue matching test completed');
    } catch (error) {
      console.error('❌ Error testing matching:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Matching Failed",
        description: `Failed to generate recommendations: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVenueClick = (rec: any) => {
    navigate(`/venue/${rec.venue_id}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Venue Matching Debug Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Button 
              onClick={handleSetupTestData}
              disabled={loading}
              className="w-full flex items-center gap-2"
              variant={setupComplete ? "secondary" : "default"}
            >
              <TestTube className="h-4 w-4" />
              {loading ? 'Setting up...' : setupComplete ? 'Test Data Ready ✅' : 'Setup Test Environment'}
            </Button>

            {/* Location Status and Request */}
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">Location:</span>
                </div>
                <Badge variant={appState.userLocation ? "default" : "secondary"}>
                  {appState.userLocation ? "Available" : "Using Hamburg Test"}
                </Badge>
              </div>
              
              {appState.userLocation ? (
                <p className="text-xs text-muted-foreground">
                  {appState.userLocation.address || `${appState.userLocation.latitude}, ${appState.userLocation.longitude}`}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">Using Hamburg, Germany as test location</p>
                  <Button 
                    onClick={requestLocation} 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                  >
                    Request Real Location
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => setTestMode('solo')}
                  variant={testMode === 'solo' ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-1 flex-1"
                >
                  <User className="h-3 w-3" />
                  Solo
                </Button>
                <Button
                  onClick={() => setTestMode('collaborative')}
                  variant={testMode === 'collaborative' ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-1 flex-1"
                >
                  <Users className="h-3 w-3" />
                  Collaborative
                </Button>
              </div>

              {testMode === 'collaborative' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Test Partner:</label>
                  <Select value={testPartner} onValueChange={setTestPartner}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a test user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {testUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                onClick={handleTestMatching}
                disabled={loading || !user}
                className="w-full flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Test Venue Matching
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold">System Status:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Google Places API: Disabled</Badge>
              <Badge variant="default">Database Mode: Active</Badge>
              <Badge variant="secondary">Real AI Scoring: Enabled</Badge>
              {setupComplete && <Badge variant="default">Test Data Ready</Badge>}
              {testMode === 'collaborative' && (
                <Badge variant="destructive">Collaborative Mode</Badge>
              )}
            </div>
            
            {setupComplete && (
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                <p className="font-medium mb-2">✅ Test Environment Ready:</p>
                <p>• 25+ diverse venues across cuisines and price ranges</p>
                <p>• 6 test users with different preference profiles</p>
                <p>• Real AI preference matching and scoring</p>
                <p>• Collaborative filtering for user pairs</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Venue Recommendations ({recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.slice(0, 8).map((rec, index) => (
                <div 
                  key={rec.venue_id || index} 
                  className="border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200 group"
                  onClick={() => handleVenueClick(rec)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold group-hover:text-primary transition-colors">
                          {rec.venue_name}
                        </h4>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.venue_address}</p>
                    </div>
                    <Badge variant="default">{rec.ai_score}% Match</Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    {rec.cuisine_type && <Badge variant="outline">{rec.cuisine_type}</Badge>}
                    {rec.priceRange && <Badge variant="secondary">{rec.priceRange}</Badge>}
                    {rec.rating && <Badge variant="outline">★ {rec.rating}</Badge>}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {rec.ai_reasoning}
                  </p>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Distance: {rec.distance} | Confidence: {Math.round(rec.confidence_level * 100)}%</div>
                    {rec.match_factors && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rec.match_factors.cuisine_match && <Badge variant="outline" className="text-xs">Cuisine ✓</Badge>}
                        {rec.match_factors.price_match && <Badge variant="outline" className="text-xs">Price ✓</Badge>}
                        {rec.match_factors.vibe_matches?.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Vibes ({rec.match_factors.vibe_matches.length})
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="text-primary/60 text-xs font-medium mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to view details →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};