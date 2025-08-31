import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { useToast } from '@/hooks/use-toast';

interface AIAnalysisDebugPanelProps {
  sessionId?: string;
  partnerId?: string;
  currentStep?: string;
  sessionData?: any;
  userLocation?: any;
  onAnalysisComplete?: () => void;
}

export const AIAnalysisDebugPanel: React.FC<AIAnalysisDebugPanelProps> = ({
  sessionId,
  partnerId,
  currentStep,
  sessionData,
  userLocation,
  onAnalysisComplete
}) => {
  const { toast } = useToast();
  const { 
    compatibilityScore,
    venueRecommendations,
    isAnalyzing,
    analyzeCompatibilityAndVenues
  } = useAIAnalysis();

  const handleManualAnalysis = async () => {
    if (!sessionId || !partnerId) {
      toast({
        title: "Cannot Run Analysis",
        description: "Missing session ID or partner ID",
        variant: "destructive"
      });
      return;
    }

    if (!userLocation?.latitude || !userLocation?.longitude) {
      toast({
        title: "Location Required",
        description: "Please enable location sharing to run AI analysis",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🔄 Manual AI analysis triggered:', { sessionId, partnerId, location: userLocation });
      
      await analyzeCompatibilityAndVenues(
        sessionId,
        partnerId,
        {
          preferred_cuisines: [],
          preferred_vibes: [],
          preferred_times: [],
          preferred_price_range: ['$$'],
          max_distance: 15,
          dietary_restrictions: []
        },
        userLocation
      );

      if (onAnalysisComplete) {
        onAnalysisComplete();
      }

      toast({
        title: "Analysis Complete",
        description: "AI analysis has been completed successfully",
      });
    } catch (error: any) {
      console.error('Manual analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to run AI analysis",
        variant: "destructive"
      });
    }
  };

  const getSessionStatus = () => {
    if (!sessionData) return { status: 'unknown', color: 'secondary' };
    
    const { both_preferences_complete, ai_compatibility_score } = sessionData;
    
    if (both_preferences_complete && ai_compatibility_score !== null) {
      return { status: 'complete', color: 'default' };
    } else if (both_preferences_complete) {
      return { status: 'ready-for-analysis', color: 'secondary' };
    } else {
      return { status: 'waiting-for-preferences', color: 'outline' };
    }
  };

  const sessionStatus = getSessionStatus();
  
  // Get compatibility score as number
  const scoreValue = typeof compatibilityScore === 'number' ? compatibilityScore : 
                    (compatibilityScore as any)?.overall_score || null;

  return (
    <Card className="border-dashed border-muted-foreground/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          AI Analysis Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Session:</span>
            <Badge variant={sessionStatus.color as any} className="ml-1 text-xs">
              {sessionStatus.status.replace('-', ' ')}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Step:</span>
            <Badge variant="outline" className="ml-1 text-xs">
              {currentStep || 'unknown'}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Location:</span>
            <Badge variant={userLocation ? "default" : "destructive"} className="ml-1 text-xs">
              {userLocation ? 'Available' : 'Missing'}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Analysis:</span>
            <Badge variant={isAnalyzing ? "secondary" : scoreValue !== null ? "default" : "outline"} className="ml-1 text-xs">
              {isAnalyzing ? 'Running' : scoreValue !== null ? 'Complete' : 'Pending'}
            </Badge>
          </div>
        </div>

        {scoreValue !== null && (
          <div className="p-2 bg-green-50 rounded text-xs">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="font-medium text-green-800">Analysis Results</span>
            </div>
            <div className="text-green-700">
              Compatibility: {Math.round(scoreValue)}% | 
              Venues: {venueRecommendations?.length || 0}
            </div>
          </div>
        )}

        <Button
          onClick={handleManualAnalysis}
          disabled={isAnalyzing || !sessionId || !partnerId}
          size="sm"
          variant="outline"
          className="w-full text-xs"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Manual AI Analysis
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};