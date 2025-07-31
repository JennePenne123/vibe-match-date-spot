
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Star, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { AIVenueRecommendation } from '@/services/aiVenueService';
import { CompatibilityScore as CompatibilityScoreType } from '@/services/aiMatchingService';
import CompatibilityScore from '@/components/CompatibilityScore';
import AIMatchSummary from '@/components/AIMatchSummary';
import AIVenueCard from '@/components/AIVenueCard';
import CompatibilityDebug from '@/components/debug/CompatibilityDebug';
import CollaborativeWaitingState from '@/components/date-planning/CollaborativeWaitingState';
import { useAuth } from '@/contexts/AuthContext';

interface MatchReviewProps {
  compatibilityScore: number | CompatibilityScoreType;
  partnerName: string;
  partnerId?: string;
  venueRecommendations: AIVenueRecommendation[];
  onVenueSelect: (venueId: string) => void;
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
  venueRecommendations,
  onVenueSelect,
  error,
  onRetrySearch,
  sessionId,
  isCollaborative = false,
  hasPartnerSetPreferences = true,
  isWaitingForPartner = false
}) => {
  const { user } = useAuth();
  const handleVenueSelect = (venue: AIVenueRecommendation) => {
    console.log('🎯 MATCH REVIEW - Venue selected:', {
      venueName: venue.venue_name,
      venueId: venue.venue_id,
      hasVenueId: !!venue.venue_id
    });
    
    // Ensure we have a valid venue ID before proceeding
    if (!venue.venue_id) {
      console.error('🎯 MATCH REVIEW - ERROR: Venue missing ID, using fallback');
      // Create a fallback ID if missing
      const fallbackId = `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      venue.venue_id = fallbackId;
      console.log('🎯 MATCH REVIEW - Generated fallback ID:', fallbackId);
    }
    
    onVenueSelect(venue.venue_id);
  };

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
          venueCount={venueRecommendations.length}
        />
      ) : (
        <Card>
          <CardContent className="text-center py-6">
            <p className="text-gray-600">Calculating compatibility...</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            AI-Matched Venues
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {venueRecommendations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No venue recommendations found.</p>
              {onRetrySearch && (
                <Button onClick={onRetrySearch} variant="outline">
                  Search Again
                </Button>
              )}
            </div>
          ) : (
            venueRecommendations.map((venue, index) => (
              <div key={venue.venue_id || `venue-${index}`} className="border rounded-lg p-4">
                <AIVenueCard
                  recommendation={venue}
                  onSelect={() => handleVenueSelect(venue)}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchReview;
