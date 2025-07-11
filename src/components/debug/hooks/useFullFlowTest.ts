import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAIVenueRecommendations } from '@/services/aiVenueService/recommendations';

export const useFullFlowTest = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFullRecommendationFlow = async () => {
    setLoading(true);
    setResults(null);
    console.log('🧪 Testing full recommendation flow...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setResults({ type: 'error', message: 'User not authenticated' });
        return;
      }

      console.log('🔄 Calling getAIVenueRecommendations...');
      const recommendations = await getAIVenueRecommendations(user.id, undefined, 10);
      
      console.log('📋 AI Venue Recommendations:', recommendations);

      setResults({
        type: 'full-flow',
        recommendations,
        count: recommendations.length,
        topRecommendation: recommendations[0]
      });
    } catch (err: any) {
      console.error('🔥 Full Flow Test Failed:', err);
      setResults({ 
        type: 'error', 
        message: `Full Flow Test Failed: ${err.message}`,
        details: err 
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    testFullRecommendationFlow
  };
};