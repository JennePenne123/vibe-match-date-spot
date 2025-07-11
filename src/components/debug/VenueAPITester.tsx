import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestResultsVisualization } from './TestResultsVisualization';
import { TestLoadingState } from './TestLoadingState';
import { useVenueTests } from './hooks/useVenueTests';

export const VenueAPITester = () => {
  const {
    results,
    loading,
    testGooglePlacesAPI,
    testVenueScoring,
    testFullRecommendationFlow
  } = useVenueTests();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Venue API & Scoring System Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={testGooglePlacesAPI} 
            disabled={loading}
            variant="outline"
          >
            Test Google Places API
          </Button>
          <Button 
            onClick={testVenueScoring} 
            disabled={loading}
            variant="outline"
          >
            Test Venue Scoring
          </Button>
          <Button 
            onClick={testFullRecommendationFlow} 
            disabled={loading}
            variant="default"
          >
            Test Full Flow
          </Button>
        </div>

        {loading && <TestLoadingState />}

        {results && <TestResultsVisualization results={results} />}
      </CardContent>
    </Card>
  );
};