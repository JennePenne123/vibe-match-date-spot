
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Star, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { AIVenueRecommendation } from '@/services/aiVenueService';
import CompatibilityScore from '@/components/CompatibilityScore';
import AIVenueCard from '@/components/AIVenueCard';

interface MatchReviewProps {
  compatibilityScore: number;
  partnerName: string;
  venueRecommendations: AIVenueRecommendation[];
  onVenueSelect: (venueId: string) => void;
  error?: string;
  onRetrySearch?: () => void;
}

const MatchReview: React.FC<MatchReviewProps> = ({
  compatibilityScore,
  partnerName,
  venueRecommendations,
  onVenueSelect,
  error,
  onRetrySearch
}) => {
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

  return (
    <div className="space-y-6">
      <CompatibilityScore 
        score={compatibilityScore} 
        partnerName={partnerName}
      />

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
                  venue={venue}
                  onSelect={() => handleVenueSelect(venue)}
                  showSelectButton={true}
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
