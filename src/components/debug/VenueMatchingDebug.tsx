import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createEnhancedTestVenues } from '@/services/testData/enhancedVenueService';
import { createDiverseTestUsers, getTestUserInfo } from '@/services/testData/userPreferencesSetup';
import { getAIVenueRecommendations } from '@/services/aiVenueService';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, Database, Users, User, Heart, TestTube } from 'lucide-react';

export const VenueMatchingDebug: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [testMode, setTestMode] = useState<'solo' | 'collaborative'>('solo');
  const [testPartner, setTestPartner] = useState<string>('');
  const [setupComplete, setSetupComplete] = useState(false);
  const testUsers = getTestUserInfo();

  const handleSetupTestData = async () => {
    setLoading(true);
    setSetupComplete(false);
    try {
      console.log('🧪 Starting comprehensive test data setup...');
      
      // Create diverse test users
      console.log('📝 Creating test users with diverse preferences...');
      await createDiverseTestUsers();
      console.log('✅ Test users created successfully');
      
      // Create enhanced venue dataset  
      console.log('🏪 Creating enhanced venue dataset...');
      await createEnhancedTestVenues();
      console.log('✅ Test venues created successfully');
      
      setSetupComplete(true);
      console.log('🎉 Test data setup complete - ready for testing!');
    } catch (error) {
      console.error('❌ Setup failed:', error);
      setSetupComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTestMatching = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const partnerId = testMode === 'collaborative' ? testPartner : undefined;
      const recs = await getAIVenueRecommendations(user.id, partnerId, 10);
      setRecommendations(recs);
      console.log('✅ Venue matching test completed');
    } catch (error) {
      console.error('❌ Error testing matching:', error);
    } finally {
      setLoading(false);
    }
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
                <div key={rec.venue_id || index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{rec.venue_name}</h4>
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