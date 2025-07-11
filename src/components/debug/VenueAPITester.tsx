import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestResultsVisualization } from './TestResultsVisualization';
import { TestLoadingState } from './TestLoadingState';
import { TestActionButtons } from './TestActionButtons';
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
        <TestActionButtons 
          loading={loading}
          onTestGooglePlaces={testGooglePlacesAPI}
          onTestVenueScoring={testVenueScoring}
          onTestFullFlow={testFullRecommendationFlow}
        />

        {loading && <TestLoadingState />}

        {results && <TestResultsVisualization results={results} />}
      </CardContent>
    </Card>
  );
};