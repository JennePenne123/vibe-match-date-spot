import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const EdgeFunctionTester = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testDirectEdgeFunction = async () => {
    setLoading(true);
    setResults(null);
    
    console.log('🧪 EDGE FUNCTION TEST: Starting direct test...');
    
    try {
      const testPayload = {
        location: 'Hamburg, Germany',
        cuisines: ['italian'],
        vibes: ['romantic'],
        latitude: 53.5745,
        longitude: 9.9602,
        radius: 5000
      };
      
      console.log('🧪 EDGE FUNCTION TEST: Calling with payload:', testPayload);
      
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('search-venues', {
        body: testPayload
      });
      const endTime = Date.now();
      
      console.log('🧪 EDGE FUNCTION TEST: Response received in:', endTime - startTime, 'ms');
      console.log('🧪 EDGE FUNCTION TEST: Response:', { data, error });
      
      setResults({
        success: !error,
        data,
        error,
        responseTime: endTime - startTime,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      console.error('🧪 EDGE FUNCTION TEST: Caught error:', err);
      setResults({
        success: false,
        error: err,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Direct Edge Function Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testDirectEdgeFunction}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing Edge Function...' : 'Test search-venues Edge Function'}
        </Button>

        {loading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-700">🔄 Testing edge function directly...</p>
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
                {results.success ? '✅ Edge Function Test Success' : '❌ Edge Function Test Failed'}
              </h3>
              
              {results.responseTime && (
                <p className="text-sm text-gray-600">Response time: {results.responseTime}ms</p>
              )}
              
              {results.data && (
                <div className="mt-2">
                  <p className="font-medium">Venues found: {results.data.venues?.length || 0}</p>
                  {results.data.venues?.slice(0, 3).map((venue: any, i: number) => (
                    <div key={i} className="ml-4 text-sm">
                      • {venue.name} ({venue.distance})
                    </div>
                  ))}
                </div>
              )}
              
              {results.error && (
                <div className="mt-2">
                  <p className="font-medium text-red-700">Error: {results.error.message}</p>
                  <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(results.error, null, 2)}
                  </pre>
                </div>
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