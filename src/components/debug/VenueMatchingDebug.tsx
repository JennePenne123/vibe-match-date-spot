import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createEnhancedTestVenues } from '@/services/testData/enhancedVenueService';
import { getAIVenueRecommendations } from '@/services/aiVenueService';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, Database, Users, User, Heart } from 'lucide-react';

export const VenueMatchingDebug: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [testMode, setTestMode] = useState<'solo' | 'collaborative'>('solo');
  const [testPartner, setTestPartner] = useState<string>('');

  const handleCreateVenues = async () => {
    setLoading(true);
    try {
      await createEnhancedTestVenues();
      console.log('✅ Enhanced venues created successfully');
    } catch (error) {
      console.error('❌ Error creating venues:', error);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleCreateVenues}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create 50+ Test Venues'}
            </Button>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => setTestMode('solo')}
                  variant={testMode === 'solo' ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <User className="h-3 w-3" />
                  Solo
                </Button>
                <Button
                  onClick={() => setTestMode('collaborative')}
                  variant={testMode === 'collaborative' ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Users className="h-3 w-3" />
                  Collaborative
                </Button>
              </div>

              {testMode === 'collaborative' && (
                <input
                  type="text"
                  placeholder="Partner User ID"
                  value={testPartner}
                  onChange={(e) => setTestPartner(e.target.value)}
                  className="w-full px-3 py-1 border rounded text-sm"
                />
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

          <div className="space-y-2">
            <h4 className="font-semibold">System Status:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Google Places API: Disabled</Badge>
              <Badge variant="default">Database Mode: Active</Badge>
              <Badge variant="secondary">Real AI Scoring: Enabled</Badge>
              {testMode === 'collaborative' && (
                <Badge variant="destructive">Collaborative Mode</Badge>
              )}
            </div>
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
                  
                  <div className="text-xs text-muted-foreground">
                    Distance: {rec.distance} | 
                    Confidence: {Math.round(rec.confidence_level * 100)}%
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