import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const VenueSearchTester = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testDirectSearch = async () => {
    if (!user) return;
    
    setLoading(true);
    setResults(null);
    
    try {
      console.log('🧪 DIRECT TEST: Testing search-venues edge function directly');
      
      // Test with Hamburg coordinates and simple preferences
      const testPayload = {
        location: 'Hamburg, Germany',
        cuisines: ['italian'],
        vibes: ['romantic'],
        latitude: 53.5511,
        longitude: 9.9937,
        radius: 10000 // 10km
      };
      
      console.log('🧪 DIRECT TEST: Sending payload:', testPayload);
      
      const { data, error } = await supabase.functions.invoke('search-venues', {
        body: testPayload
      });
      
      console.log('🧪 DIRECT TEST: Response:', { data, error });
      
      setResults({
        success: !error,
        error: error?.message,
        venueCount: data?.venues?.length || 0,
        venues: data?.venues?.slice(0, 3) || [], // First 3 venues
        rawResponse: { data, error }
      });
      
    } catch (err: any) {
      console.error('🧪 DIRECT TEST: Error:', err);
      setResults({
        success: false,
        error: err.message,
        venueCount: 0,
        venues: []
      });
    } finally {
      setLoading(false);
    }
  };

  const testUserPreferences = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      console.log('🧪 PREFS TEST: Checking user preferences');
      
      const { data: prefs, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      console.log('🧪 PREFS TEST: User preferences:', { prefs, error });
      
      setResults({
        type: 'preferences',
        success: !error,
        preferences: prefs,
        error: error?.message,
        isEmpty: {
          cuisines: !prefs?.preferred_cuisines || prefs.preferred_cuisines.length === 0,
          vibes: !prefs?.preferred_vibes || prefs.preferred_vibes.length === 0,
          priceRange: !prefs?.preferred_price_range || prefs.preferred_price_range.length === 0
        }
      });
      
    } catch (err: any) {
      console.error('🧪 PREFS TEST: Error:', err);
      setResults({
        type: 'preferences',
        success: false,
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Venue Search Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testDirectSearch} 
            disabled={loading || !user}
            variant="outline"
          >
            Test Edge Function Direct
          </Button>
          <Button 
            onClick={testUserPreferences} 
            disabled={loading || !user}
            variant="outline"
          >
            Check User Preferences
          </Button>
        </div>

        {loading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800">🔄 Testing in progress... Check console for detailed logs</p>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            <div className={`p-4 border rounded ${results.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h3 className="font-semibold mb-2">
                {results.success ? '✅ Success' : '❌ Failed'}
              </h3>
              
              {results.type === 'preferences' ? (
                <div className="space-y-2">
                  <p><strong>Preferences found:</strong> {results.preferences ? 'Yes' : 'No'}</p>
                  {results.isEmpty && (
                    <div className="text-sm">
                      <p><strong>Empty fields:</strong></p>
                      <ul className="list-disc list-inside">
                        {results.isEmpty.cuisines && <li>Cuisines</li>}
                        {results.isEmpty.vibes && <li>Vibes</li>}
                        {results.isEmpty.priceRange && <li>Price Range</li>}
                      </ul>
                    </div>
                  )}
                  {results.preferences && (
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(results.preferences, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p><strong>Venues found:</strong> {results.venueCount}</p>
                  {results.venues.length > 0 && (
                    <div className="text-sm">
                      <p><strong>Sample venues:</strong></p>
                      <ul className="list-disc list-inside">
                        {results.venues.map((venue: any, i: number) => (
                          <li key={i}>{venue.name} - {venue.cuisineType} ({venue.matchScore}%)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {results.error && (
                <p className="text-red-600 mt-2"><strong>Error:</strong> {results.error}</p>
              )}
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer font-medium">Raw Response Data</summary>
              <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};