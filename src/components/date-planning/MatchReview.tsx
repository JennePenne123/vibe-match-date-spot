
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { CompatibilityScore as CompatibilityScoreType } from '@/services/aiMatchingService';
import AIMatchSummary from '@/components/AIMatchSummary';
import CompatibilityDebug from '@/components/debug/CompatibilityDebug';
import CollaborativeWaitingState from '@/components/date-planning/CollaborativeWaitingState';
import { useAuth } from '@/contexts/AuthContext';

interface MatchReviewProps {
  compatibilityScore: number | CompatibilityScoreType;
  partnerName: string;
  partnerId?: string;
  venueCount: number;
  onContinueToPlanning: () => void;
  error?: string;
  onRetrySearch?: () => void;
  sessionId?: string;
  isCollaborative?: boolean;
  hasPartnerSetPreferences?: boolean;
  isWaitingForPartner?: boolean;
}

const MatchReview: React.FC<MatchReviewProps> = ({
  compatibilityScore,
  partnerName,
  partnerId,
  venueCount,
  onContinueToPlanning,
  error,
  onRetrySearch,
  sessionId,
  isCollaborative = false,
  hasPartnerSetPreferences = true,
  isWaitingForPartner = false
}) => {
  const { user } = useAuth();

  console.log('🔍 MATCH REVIEW: Rendering compatibility analysis:', {
    compatibilityScore,
    venueCount,
    partnerName
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Search Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-600">{error}</p>
          {onRetrySearch && (
            <Button onClick={onRetrySearch} variant="outline">
              Retry Search
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Debug collaborative session state
  console.log('🔍 MATCH REVIEW - Collaborative state check:', {
    isCollaborative,
    hasPartnerSetPreferences,
    isWaitingForPartner,
    sessionId,
    shouldShowWaiting: isCollaborative && (!hasPartnerSetPreferences || isWaitingForPartner)
  });

  // Show waiting state for collaborative planning when partner hasn't set preferences
  if (isCollaborative && (!hasPartnerSetPreferences || isWaitingForPartner)) {
    return (
      <div className="space-y-6">
        <CollaborativeWaitingState
          partnerName={partnerName}
          sessionId={sessionId || ''}
          hasPartnerSetPreferences={hasPartnerSetPreferences}
          isWaitingForPartner={isWaitingForPartner}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CompatibilityDebug 
        compatibilityScore={compatibilityScore}
        partnerId={partnerId}
        userId={user?.id}
      />
      
      {(typeof compatibilityScore === 'object' && compatibilityScore !== null) || typeof compatibilityScore === 'number' ? (
        <AIMatchSummary 
          compatibilityScore={compatibilityScore}
          partnerName={partnerName}
          venueCount={venueCount}
        />
      ) : (
        <Card>
          <CardContent className="text-center py-6">
            <p className="text-muted-foreground">Calculating compatibility...</p>
          </CardContent>
        </Card>
      )}

      {/* Continue to Planning Button */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="text-center py-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Analysis Complete! 🎉</h3>
              <p className="text-muted-foreground">
                Found {venueCount} perfect venues for your date. Ready to plan together?
              </p>
            </div>
            <Button 
              onClick={onContinueToPlanning}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2"
            >
              Continue to Plan Together
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchReview;
