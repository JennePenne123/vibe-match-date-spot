
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AIMatchSummary from '@/components/AIMatchSummary';
import AIVenueCard from '@/components/AIVenueCard';
import SafeComponent from '@/components/SafeComponent';
import { AIVenueRecommendation } from '@/services/aiVenueService';

interface MatchReviewProps {
  compatibilityScore: number;
  partnerName: string;
  venueRecommendations: AIVenueRecommendation[];
  onVenueSelect: (venueId: string) => void;
}

const MatchReview: React.FC<MatchReviewProps> = ({
  compatibilityScore,
  partnerName,
  venueRecommendations,
  onVenueSelect
}) => {
  return (
    <div className="space-y-6">
      <SafeComponent componentName="AIMatchSummary">
        <AIMatchSummary
          compatibilityScore={compatibilityScore}
          partnerName={partnerName}
          venueCount={venueRecommendations.length}
        />
      </SafeComponent>

      {venueRecommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venueRecommendations.map((recommendation) => (
            <SafeComponent key={recommendation.venue_id} componentName="AIVenueCard">
              <AIVenueCard
                recommendation={recommendation}
                onSelect={onVenueSelect}
                showAIInsights={true}
              />
            </SafeComponent>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Venues Found</h3>
            <p className="text-gray-600">
              No venues match your preferences. Try adjusting your preferences or check back later.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchReview;
