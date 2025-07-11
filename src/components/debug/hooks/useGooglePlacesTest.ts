import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGooglePlacesTest = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGooglePlacesAPI = async () => {
    setLoading(true);
    setResults(null);
    console.log('🧪 Testing Google Places API directly...');
    
    try {
      // Test direct API call to search-venues function
      const { data: searchResult, error } = await supabase.functions.invoke('search-venues', {
        body: {
          location: 'San Francisco, CA',
          cuisines: ['italian'],
          vibes: ['romantic'],
          latitude: 37.7749,
          longitude: -122.4194,
          radius: 16093.4 // 10 miles in meters
        }
      });

      console.log('🏢 Google Places API Response:', { searchResult, error });
      
      if (error) {
        setResults({ 
          type: 'error', 
          message: `Google Places API Error: ${error.message}`,
          details: error 
        });
        return;
      }

      setResults({
        type: 'google-places',
        data: searchResult,
        venueCount: searchResult?.venues?.length || 0
      });
    } catch (err: any) {
      console.error('🔥 Google Places API Test Failed:', err);
      setResults({ 
        type: 'error', 
        message: `API Test Failed: ${err.message}`,
        details: err 
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    testGooglePlacesAPI
  };
};