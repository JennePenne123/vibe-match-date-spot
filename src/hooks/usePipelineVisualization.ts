import { useState, useCallback } from 'react';
import { getCompatibilityScore } from '@/services/aiMatchingService';
import { getAIVenueRecommendations } from '@/services/aiVenueService';
import { getLocationFallback, LocationWithSource } from '@/utils/locationFallback';
import { supabase } from '@/integrations/supabase/client';

export type PipelineStatus = 'idle' | 'loading' | 'success' | 'error' | 'skipped';

export interface PipelineStage {
  id: string;
  name: string;
  status: PipelineStatus;
  duration?: number;
  data?: any;
  error?: string;
  startTime?: number;
}

export interface PipelineMetrics {
  totalDuration: number;
  apiCalls: number;
  cacheHits: number;
  estimatedCost: number;
}

const initialStages: PipelineStage[] = [
  { id: 'preferences', name: 'User Preferences', status: 'idle' },
  { id: 'location', name: 'Location Resolution', status: 'idle' },
  { id: 'compatibility', name: 'Compatibility Score', status: 'idle' },
  { id: 'venue_search', name: 'Venue Search', status: 'idle' },
  { id: 'ai_scoring', name: 'AI Scoring', status: 'idle' },
  { id: 'recommendations', name: 'Final Recommendations', status: 'idle' },
];

export const usePipelineVisualization = () => {
  const [stages, setStages] = useState<PipelineStage[]>(initialStages);
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<PipelineMetrics>({
    totalDuration: 0,
    apiCalls: 0,
    cacheHits: 0,
    estimatedCost: 0
  });

  const updateStage = useCallback((stageId: string, updates: Partial<PipelineStage>) => {
    setStages(prev => prev.map(stage => 
      stage.id === stageId ? { ...stage, ...updates } : stage
    ));
  }, []);

  const runPipeline = useCallback(async (
    userId: string, 
    partnerId?: string,
    userLocation?: { latitude: number; longitude: number; address?: string }
  ) => {
    if (isRunning) {
      console.warn('Pipeline already running');
      return null;
    }

    setIsRunning(true);
    setStages(initialStages);
    const pipelineStart = Date.now();
    let apiCalls = 0;
    let cacheHits = 0;
    let estimatedCost = 0;

    try {
      // Stage 1: Fetch User Preferences
      updateStage('preferences', { status: 'loading', startTime: Date.now() });
      const prefStart = Date.now();
      
      const { data: userPrefs, error: prefError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (prefError) {
        updateStage('preferences', { 
          status: 'error', 
          duration: Date.now() - prefStart,
          error: prefError.message 
        });
        throw new Error('Failed to fetch preferences');
      }

      apiCalls++;
      updateStage('preferences', { 
        status: 'success', 
        duration: Date.now() - prefStart,
        data: { 
          cuisines: userPrefs.preferred_cuisines?.length || 0,
          vibes: userPrefs.preferred_vibes?.length || 0,
          maxDistance: userPrefs.max_distance
        }
      });

      // Stage 2: Location Resolution
      updateStage('location', { status: 'loading', startTime: Date.now() });
      const locStart = Date.now();
      
      let resolvedLocation: LocationWithSource | { latitude: number; longitude: number; address?: string; source?: string };
      
      if (userLocation?.latitude && userLocation?.longitude) {
        resolvedLocation = { ...userLocation, source: 'browser_geolocation' as const };
      } else {
        resolvedLocation = await getLocationFallback(userId);
      }

      updateStage('location', { 
        status: 'success', 
        duration: Date.now() - locStart,
        data: { 
          source: resolvedLocation.source || 'provided',
          address: resolvedLocation.address || `${resolvedLocation.latitude.toFixed(4)}, ${resolvedLocation.longitude.toFixed(4)}`
        }
      });

      // Stage 3: Compatibility Score (if partner provided)
      const compStart = Date.now();
      if (partnerId) {
        updateStage('compatibility', { status: 'loading', startTime: Date.now() });
        
        const compatibility = await getCompatibilityScore(userId, partnerId);
        apiCalls++;
        estimatedCost += 0.01; // AI edge function cost

        if (compatibility) {
          updateStage('compatibility', { 
            status: 'success', 
            duration: Date.now() - compStart,
            data: { 
              overallScore: compatibility.overall_score,
              factors: compatibility.compatibility_factors
            }
          });
        } else {
          updateStage('compatibility', { 
            status: 'error', 
            duration: Date.now() - compStart,
            error: 'Could not calculate compatibility'
          });
        }
      } else {
        updateStage('compatibility', { 
          status: 'skipped', 
          data: { reason: 'No partner selected' }
        });
      }

      // Stage 4 & 5: Venue Search + AI Scoring (combined in getAIVenueRecommendations)
      updateStage('venue_search', { status: 'loading', startTime: Date.now() });
      const venueStart = Date.now();

      const recommendations = await getAIVenueRecommendations(
        userId, 
        partnerId, 
        10, 
        resolvedLocation
      );
      
      apiCalls += 2; // Google Places + possible Foursquare
      estimatedCost += 0.017; // Google Places cost

      const venueSearchDuration = Date.now() - venueStart;
      
      updateStage('venue_search', { 
        status: 'success', 
        duration: venueSearchDuration * 0.6, // Approximate split
        data: { 
          venuesFound: recommendations.length,
          sources: ['Google Places', 'Foursquare', 'Database']
        }
      });

      updateStage('ai_scoring', { 
        status: 'success', 
        duration: venueSearchDuration * 0.4,
        data: { 
          venuesScored: recommendations.length,
          avgScore: recommendations.length > 0 
            ? Math.round(recommendations.reduce((sum, r) => sum + r.ai_score, 0) / recommendations.length)
            : 0
        }
      });

      // Stage 6: Final Recommendations
      updateStage('recommendations', { status: 'loading', startTime: Date.now() });
      const recStart = Date.now();

      updateStage('recommendations', { 
        status: 'success', 
        duration: Date.now() - recStart,
        data: { 
          count: recommendations.length,
          topVenue: recommendations[0]?.venue_name || 'None',
          topScore: recommendations[0]?.ai_score || 0
        }
      });

      // Calculate final metrics
      const totalDuration = Date.now() - pipelineStart;
      setMetrics({
        totalDuration,
        apiCalls,
        cacheHits,
        estimatedCost
      });

      return {
        recommendations,
        metrics: { totalDuration, apiCalls, cacheHits, estimatedCost }
      };

    } catch (error) {
      console.error('Pipeline error:', error);
      
      // Mark remaining stages as error
      setStages(prev => prev.map(stage => 
        stage.status === 'loading' || stage.status === 'idle'
          ? { ...stage, status: 'error' as PipelineStatus, error: error instanceof Error ? error.message : 'Unknown error' }
          : stage
      ));

      return null;
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, updateStage]);

  const resetPipeline = useCallback(() => {
    setStages(initialStages);
    setMetrics({ totalDuration: 0, apiCalls: 0, cacheHits: 0, estimatedCost: 0 });
  }, []);

  return {
    stages,
    isRunning,
    metrics,
    runPipeline,
    resetPipeline
  };
};
