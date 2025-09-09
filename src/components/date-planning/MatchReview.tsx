
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
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

  // Enhanced validation: Show waiting state for collaborative planning when partner hasn't genuinely set preferences
  if (isCollaborative && (!hasPartnerSetPreferences || isWaitingForPartner)) {
    console.log('🔍 MATCH REVIEW - Showing collaborative waiting state because:', {
      hasPartnerSetPreferences,
      isWaitingForPartner,
      reason: !hasPartnerSetPreferences ? 'Partner has not set preferences' : 'Still waiting for partner'
    });
    
    return (
      <div className="space-y-6">
        <CollaborativeWaitingState
          partnerName={partnerName}
          sessionId={sessionId || ''}
          hasPartnerSetPreferences={hasPartnerSetPreferences}
          isWaitingForPartner={isWaitingForPartner}
          hasCurrentUserSetPreferences={true} // Match review only shows if current user completed preferences
          currentUserName={user?.name || 'You'}
        />
      </div>
    );
  }

  // Additional check: If this is collaborative but we're getting 100% compatibility, it might be preference duplication
  // However, only block if we have clear signs this is test data pollution, not legitimate similar preferences
  if (isCollaborative && typeof compatibilityScore === 'number' && compatibilityScore >= 1.0) {
    console.warn('⚠️ MATCH REVIEW - Perfect 100% compatibility detected in collaborative mode');
    console.log('🔍 MATCH REVIEW - Checking if this should be blocked or allowed to proceed');
    
    // Allow the flow to continue - perfect compatibility can be legitimate
    // The session validation will catch true duplications during the preference setting phase
    console.log('✅ MATCH REVIEW - Allowing perfect compatibility to proceed');
  }

  return (
    <div className="space-y-6">
      <CompatibilityDebug 
        compatibilityScore={compatibilityScore}
        partnerId={partnerId}
        userId={user?.id}
      />
      
      {/* Single consolidated analysis card */}
      {(typeof compatibilityScore === 'object' && compatibilityScore !== null) || typeof compatibilityScore === 'number' ? (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-5 w-5" />
              AI Compatibility Analysis Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AI Match Summary Content */}
            <AIMatchSummary 
              compatibilityScore={compatibilityScore}
              partnerName={partnerName}
              venueCount={venueCount}
            />
            
            {/* Continue Action */}
            <div className="text-center pt-4 border-t border-primary/20">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Ready to Plan Together! 🎉</h3>
                  <p className="text-muted-foreground">
                    Found {venueCount} perfect venues based on your compatibility. Let's choose the perfect spot!
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    console.log('🎯 MATCH REVIEW - "Continue to Plan Together" button clicked');
                    console.log('🎯 MATCH REVIEW - Current state before transition:', {
                      venueCount,
                      compatibilityScore: typeof compatibilityScore === 'object' ? compatibilityScore.overall_score : compatibilityScore,
                      partnerName
                    });
                    onContinueToPlanning();
                    console.log('🎯 MATCH REVIEW - onContinueToPlanning() called successfully');
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2"
                >
                  Continue to Plan Together
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-6">
            <p className="text-muted-foreground">Calculating compatibility...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchReview;
