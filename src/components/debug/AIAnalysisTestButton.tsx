import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { supabase } from '@/integrations/supabase/client';

interface AIAnalysisTestButtonProps {
  sessionId?: string;
  userLocation?: { latitude: number; longitude: number; address?: string } | null;
}

export const AIAnalysisTestButton: React.FC<AIAnalysisTestButtonProps> = ({
  sessionId,
  userLocation
}) => {
  const { user } = useAuth();
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [testResults, setTestResults] = useState<string | null>(null);
  
  const { 
    analyzeCompatibilityAndVenues, 
    isAnalyzing, 
    compatibilityScore, 
    venueRecommendations, 
    analysisError,
    venueSearchError 
  } = useAIAnalysis();

  const testAIAnalysis = async () => {
    if (!user || !sessionId) {
      setTestResults('❌ Missing user or sessionId');
      return;
    }

    setIsTestingAI(true);
    setTestResults(null);

    try {
      console.log('🧪 AI TEST: Starting manual AI analysis test...');
      
      // First get session data to find partner
      const { data: session, error: sessionError } = await supabase
        .from('date_planning_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error(`Session not found: ${sessionError?.message || 'No session data'}`);
      }

      console.log('🧪 AI TEST: Session found:', {
        sessionId: session.id,
        initiator: session.initiator_id,
        partner: session.partner_id,
        bothComplete: session.both_preferences_complete
      });

      // Determine partner ID
      const partnerId = session.initiator_id === user.id 
        ? session.partner_id 
        : session.initiator_id;

      // Get user preferences
      const { data: userPrefs, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefsError || !userPrefs) {
        throw new Error(`User preferences not found: ${prefsError?.message || 'No preferences'}`);
      }

      console.log('🧪 AI TEST: User preferences found:', userPrefs);

      // Use provided location or fallback
      const locationForTest = userLocation || {
        latitude: 37.7749,
        longitude: -122.4194,
        address: 'San Francisco, CA (test fallback)'
      };

      console.log('🧪 AI TEST: Using location:', locationForTest);

      // Run AI analysis
      await analyzeCompatibilityAndVenues(
        sessionId,
        partnerId,
        userPrefs,
        locationForTest
      );

      setTestResults('✅ AI analysis completed! Check console for details.');
      
    } catch (error) {
      console.error('🧪 AI TEST: Test failed:', error);
      setTestResults(`❌ Test failed: ${error.message}`);
    } finally {
      setIsTestingAI(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
      <h3 className="font-semibold text-yellow-800 mb-2">🧪 AI Analysis Test</h3>
      
      <div className="space-y-2 text-sm">
        <div>Session ID: {sessionId || 'Not provided'}</div>
        <div>User Location: {userLocation ? `${userLocation.latitude}, ${userLocation.longitude}` : 'Not provided'}</div>
        <div>AI Analyzing: {isAnalyzing ? 'Yes' : 'No'}</div>
        <div>Compatibility Score: {
          compatibilityScore 
            ? (typeof compatibilityScore === 'object' 
                ? `${compatibilityScore.overall_score}%` 
                : `${compatibilityScore}%`)
            : 'None'
        }</div>
        <div>Venues Found: {venueRecommendations?.length || 0}</div>
        {analysisError && <div className="text-red-600">Analysis Error: {analysisError}</div>}
        {venueSearchError && <div className="text-red-600">Venue Error: {venueSearchError}</div>}
      </div>

      <Button
        onClick={testAIAnalysis}
        disabled={isTestingAI || isAnalyzing || !sessionId}
        size="sm"
        className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white"
      >
        {isTestingAI || isAnalyzing ? 'Testing...' : 'Test AI Analysis'}
      </Button>

      {testResults && (
        <div className="mt-2 p-2 bg-white rounded border text-sm">
          {testResults}
        </div>
      )}
    </div>
  );
};