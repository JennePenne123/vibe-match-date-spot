import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const HamburgVenueTest = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { user } = useAuth();

  const setItalianPreferencesForAll = async () => {
    setLoading(true);
    setResults(null);
    
    console.log('🍝 HAMBURG TEST: Setting all users to Italian preferences...');
    
    try {
      // Update all user preferences to Italian only
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          preferred_cuisines: ['italian'],
          preferred_vibes: ['casual'],
          preferred_times: ['lunch'],
          preferred_price_range: ['$$'],
          max_distance: 15
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all real users
      
      if (error) {
        console.error('❌ HAMBURG TEST: Error updating preferences:', error);
        setResults({ success: false, error: error.message });
        return;
      }
      
      console.log('✅ HAMBURG TEST: Updated preferences for all users');
      setResults({ success: true, message: 'All users now have Italian preferences' });
      
    } catch (err) {
      console.error('❌ HAMBURG TEST: Exception:', err);
      setResults({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const testHamburgVenues = async () => {
    setLoading(true);
    setResults(null);
    
    console.log('🏙️ HAMBURG TEST: Testing Hamburg venue search...');
    
    try {
      const hamburgCoords = {
        latitude: 53.5746,
        longitude: 9.9603,
        address: 'Hamburg, Germany'
      };
      
      // Test direct edge function call
      const testPayload = {
        location: 'Hamburg, Germany',
        cuisines: ['italian'],
        vibes: ['casual'],
        latitude: hamburgCoords.latitude,
        longitude: hamburgCoords.longitude,
        radius: 15000 // 15km in meters
      };
      
      console.log('🧪 HAMBURG TEST: Calling edge function with payload:', testPayload);
      
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('search-venues', {
        body: testPayload
      });
      const endTime = Date.now();
      
      console.log('🧪 HAMBURG TEST: Response received in:', endTime - startTime, 'ms');
      console.log('🧪 HAMBURG TEST: Response:', { data, error });
      
      if (error) {
        setResults({
          success: false,
          error: error.message,
          responseTime: endTime - startTime,
          location: hamburgCoords
        });
        return;
      }
      
      const venues = data?.venues || [];
      console.log('📍 HAMBURG TEST: Found venues:', venues.length);
      
      setResults({
        success: true,
        venueCount: venues.length,
        venues: venues.slice(0, 5), // Show first 5 venues
        responseTime: endTime - startTime,
        location: hamburgCoords,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      console.error('❌ HAMBURG TEST: Exception:', err);
      setResults({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🏙️ Hamburg Italian Venue Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={setItalianPreferencesForAll}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Setting...' : '🍝 Set All Users to Italian'}
          </Button>
          
          <Button 
            onClick={testHamburgVenues}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Testing...' : '🏙️ Test Hamburg Italian Search'}
          </Button>
        </div>

        {loading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-700">🔄 Running Hamburg venue test...</p>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            <div className={`p-4 border rounded ${
              results.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <h3 className={`font-semibold ${
                results.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {results.success ? '✅ Hamburg Test Success' : '❌ Hamburg Test Failed'}
              </h3>
              
              {results.responseTime && (
                <p className="text-sm text-gray-600">Response time: {results.responseTime}ms</p>
              )}
              
              {results.venueCount !== undefined && (
                <p className="font-medium">Found {results.venueCount} Italian venues in Hamburg</p>
              )}
              
              {results.venues && results.venues.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Sample venues:</p>
                  {results.venues.map((venue: any, i: number) => (
                    <div key={i} className="ml-4 text-sm">
                      • {venue.name} - {venue.cuisineType} ({venue.distance})
                    </div>
                  ))}
                </div>
              )}
              
              {results.error && (
                <div className="mt-2">
                  <p className="font-medium text-red-700">Error: {results.error}</p>
                </div>
              )}
              
              {results.message && (
                <p className="text-sm text-green-700">{results.message}</p>
              )}
            </div>
            
            <details className="border rounded p-2">
              <summary className="cursor-pointer font-medium">Full Response Details</summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-64">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};