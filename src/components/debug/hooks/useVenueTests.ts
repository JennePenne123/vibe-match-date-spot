import { useGooglePlacesTest } from './useGooglePlacesTest';
import { useVenueScoringTest } from './useVenueScoringTest';
import { useFullFlowTest } from './useFullFlowTest';

export const useVenueTests = () => {
  const { 
    results: googleResults, 
    loading: googleLoading, 
    testGooglePlacesAPI 
  } = useGooglePlacesTest();
  
  const { 
    results: scoringResults, 
    loading: scoringLoading, 
    testVenueScoring 
  } = useVenueScoringTest();
  
  const { 
    results: fullFlowResults, 
    loading: fullFlowLoading, 
    testFullRecommendationFlow 
  } = useFullFlowTest();

  // Combine results, giving priority to the most recent test
  const results = googleResults || scoringResults || fullFlowResults;
  const loading = googleLoading || scoringLoading || fullFlowLoading;

  return {
    results,
    loading,
    testGooglePlacesAPI,
    testVenueScoring,
    testFullRecommendationFlow
  };
};