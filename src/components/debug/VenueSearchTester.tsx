import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getAIVenueRecommendations } from '@/services/aiVenueService';

export const VenueSearchTester = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testDirectEdgeFunction = async () => {
    setLoading(true);
    setResults(null);
    console.log('🧪 TESTER: Testing direct edge function call...');
    
    try {
      const { data, error } = await supabase.functions.invoke('search-venues', {
        body: {
          location: 'Hamburg, Germany',
          cuisines: ['italian'],
          vibes: ['romantic'],
          latitude: 53.5511,
          longitude: 9.9937,
          radius: 16093.4
        }
      });

      console.log('🧪 TESTER: Edge function response:', { data, error });
      setResults({ type: 'edge-function', data, error });
    } catch (err: any) {
      console.error('🧪 TESTER: Edge function test failed:', err);
      setResults({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const testFullRecommendationFlow = async () => {
    if (!user) return;
    
    setLoading(true);
    setResults(null);
    console.log('🧪 TESTER: Testing full recommendation flow...');
    
    try {
      const recommendations = await getAIVenueRecommendations(
        user.id, 
        undefined, 
        10, 
        { latitude: 53.5511, longitude: 9.9937, address: 'Hamburg, Germany' }
      );

      console.log('🧪 TESTER: Recommendations:', recommendations);
      setResults({ type: 'recommendations', data: recommendations });
    } catch (err: any) {
      console.error('🧪 TESTER: Recommendation flow test failed:', err);
      setResults({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const testUserPreferences = async () => {
    if (!user) return;
    
    setLoading(true);
    setResults(null);
    console.log('🧪 TESTER: Testing user preferences...');
    
    try {
      const { data: prefs, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('🧪 TESTER: User preferences:', { prefs, error });
      setResults({ type: 'preferences', data: prefs, error });
    } catch (err: any) {
      console.error('🧪 TESTER: Preferences test failed:', err);
      setResults({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔍 Venue Search Debugging</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={testUserPreferences}
            disabled={loading || !user}
            variant="outline"
          >
            Test User Preferences
          </Button>
          <Button 
            onClick={testDirectEdgeFunction}
            disabled={loading}
            variant="outline"
          >
            Test Edge Function Direct
          </Button>
          <Button 
            onClick={testFullRecommendationFlow}
            disabled={loading || !user}
            variant="default"
          >
            Test Full Flow
          </Button>
        </div>

        {loading && <div className="text-muted-foreground">Testing...</div>}

        {results && (
          <div className="space-y-2">
            <h3 className="font-semibold">Results ({results.type}):</h3>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};