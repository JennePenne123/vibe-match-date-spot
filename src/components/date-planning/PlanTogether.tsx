import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { AIVenueRecommendation } from '@/services/aiVenueService';
import AIVenueCard from '@/components/AIVenueCard';
import { useAuth } from '@/contexts/AuthContext';
import CompatibilitySummaryBanner from './CompatibilitySummaryBanner';
import { useVenueVouchers } from '@/hooks/useVenueVouchers';

interface CompatibilityScore {
  overall_score?: number;
  category_scores?: Record<string, number>;
  reasoning?: string;
}

interface PlanTogetherProps {
  partnerName: string;
  partnerId?: string;
  venueRecommendations: AIVenueRecommendation[];
  onVenueSelect: (venueId: string) => void;
  error?: string;
  onRetrySearch?: () => void;
  sessionId?: string;
  isCollaborative?: boolean;
  compatibilityScore?: number | CompatibilityScore;
}

const getVenueId = (venue: AIVenueRecommendation): string | null => {
  console.log('🔍 VENUE ID EXTRACTION: Processing venue:', {
    venue_name: venue.venue_name,
    venue_id: venue.venue_id,
    venue_id_type: typeof venue.venue_id,
    hasVenueId: !!venue.venue_id,
    fallbackId: (venue as any).id,
    placeId: (venue as any).place_id
  });

  if (typeof venue.venue_id === 'string' && venue.venue_id.trim() && venue.venue_id !== 'undefined') {
    console.log('✅ Using primary venue_id:', venue.venue_id);
    return venue.venue_id.trim();
  }

  if (venue.venue_id && typeof venue.venue_id === 'object') {
    if ('value' in (venue.venue_id as any)) {
      const extractedValue = (venue.venue_id as any).value;
      if (typeof extractedValue === 'string' && extractedValue.trim() && extractedValue !== 'undefined') {
        console.log('✅ Using extracted venue_id.value:', extractedValue);
        return extractedValue.trim();
      }
    }
    console.warn('⚠️ VENUE ID EXTRACTION: Invalid object venue_id for', venue.venue_name, venue.venue_id);
  }

  const fallbackId = (venue as any).id || (venue as any).place_id || (venue as any).google_place_id;
  if (fallbackId && typeof fallbackId === 'string' && fallbackId.trim()) {
    console.log('✅ Using fallback ID:', fallbackId);
    return fallbackId.trim();
  }

  console.error('❌ VENUE ID EXTRACTION: No valid ID found for venue:', {
    venue_name: venue.venue_name,
    venue_id: venue.venue_id,
    allKeys: Object.keys(venue),
    venue
  });
  return null;
};

const PlanTogether: React.FC<PlanTogetherProps> = ({
  partnerName,
  partnerId,
  venueRecommendations,
  onVenueSelect,
  error,
  onRetrySearch,
  sessionId,
  isCollaborative = true,
  compatibilityScore
}) => {
  const { user } = useAuth();

  const venueIds = useMemo(
    () => venueRecommendations.map(getVenueId).filter((id): id is string => id !== null),
    [venueRecommendations]
  );

  const { vouchers } = useVenueVouchers(venueIds);

  console.log('🤝 PLAN TOGETHER: Rendering collaborative venue selection:', {
    count: venueRecommendations?.length || 0,
    partnerName,
    sessionId,
    venuesSample: venueRecommendations?.slice(0, 2)
  });


  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <MapPin className="h-5 w-5" />
            Venue Search Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-destructive">{error}</p>
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
      {/* Compact Compatibility Banner */}
      {compatibilityScore !== undefined && (
        <CompatibilitySummaryBanner
          compatibilityScore={compatibilityScore}
          partnerName={partnerName}
          venueCount={venueRecommendations.length}
          compact={true}
          collapsible={false}
        />
      )}

      {/* Venues Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            AI-Matched Venues ({venueRecommendations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {venueRecommendations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No venue recommendations found.</p>
              {onRetrySearch && (
                <Button onClick={onRetrySearch} variant="outline">
                  Search Again
                </Button>
              )}
            </div>
          ) : (
            [...venueRecommendations].sort((a, b) => b.ai_score - a.ai_score).map((venue, index) => {
              const venueId = getVenueId(venue);
              
              if (!venueId) {
                console.error('🚨 PLAN TOGETHER - Skipping venue without valid ID:', {
                  venue_name: venue.venue_name,
                  venue_id: venue.venue_id,
                  index,
                  fullVenue: venue
                });
                return null; // Skip venues without valid IDs - render nothing for invalid venues
              }

              console.log(`✅ PLAN TOGETHER - Rendering venue: ${venue.venue_name} with ID: ${venueId}`);

              const venueVouchers = vouchers.get(venueId) || [];
              
              return (
                <div key={`${venueId}-${index}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <AIVenueCard
                    recommendation={venue}
                    onSelect={(venueId) => {
                      console.log('🎯 PLAN TOGETHER - Venue selected:', venueId);
                      onVenueSelect(venueId);
                    }}
                    sessionContext={{
                      sessionId: sessionId,
                      partnerId: partnerId
                    }}
                    vouchers={venueVouchers}
                  />
                </div>
              );
            }).filter(Boolean)
          )}
        </CardContent>
      </Card>

      {/* Collaborative Features - Placeholder for future enhancement */}
      <Card className="border-dashed">
        <CardContent className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            💡 Future: Real-time chat and venue discussion features coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanTogether;