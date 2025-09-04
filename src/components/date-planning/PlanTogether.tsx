import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Users } from 'lucide-react';
import { AIVenueRecommendation } from '@/services/aiVenueService';
import AIVenueCard from '@/components/AIVenueCard';
import { useAuth } from '@/contexts/AuthContext';

interface PlanTogetherProps {
  partnerName: string;
  partnerId?: string;
  venueRecommendations: AIVenueRecommendation[];
  onVenueSelect: (venueId: string) => void;
  error?: string;
  onRetrySearch?: () => void;
  sessionId?: string;
  isCollaborative?: boolean;
}

const PlanTogether: React.FC<PlanTogetherProps> = ({
  partnerName,
  partnerId,
  venueRecommendations,
  onVenueSelect,
  error,
  onRetrySearch,
  sessionId,
  isCollaborative = true
}) => {
  const { user } = useAuth();

  console.log('🤝 PLAN TOGETHER: Rendering collaborative venue selection:', {
    count: venueRecommendations?.length || 0,
    partnerName,
    sessionId,
    venuesSample: venueRecommendations?.slice(0, 2)
  });

  // Enhanced helper function to extract venue ID from various formats
  const getVenueId = (venue: AIVenueRecommendation): string | null => {
    // Handle venue_id as an object with value property (data transformation issue)
    if (venue.venue_id && typeof venue.venue_id === 'object') {
      if ('value' in (venue.venue_id as any)) {
        const extractedValue = (venue.venue_id as any).value;
        if (typeof extractedValue === 'string' && extractedValue.trim() && extractedValue !== 'undefined') {
          return extractedValue.trim();
        }
      }
      console.warn('⚠️ VENUE ID EXTRACTION: Invalid object venue_id for', venue.venue_name, venue.venue_id);
      return null;
    }
    
    // Handle venue_id as a string
    if (typeof venue.venue_id === 'string' && venue.venue_id.trim() && venue.venue_id !== 'undefined') {
      return venue.venue_id.trim();
    }
    
    // Fallback: try to use any available ID field
    const fallbackId = (venue as any).id || (venue as any).place_id || (venue as any).google_place_id;
    if (fallbackId && typeof fallbackId === 'string' && fallbackId.trim()) {
      return fallbackId.trim();
    }
    
    console.error('❌ VENUE ID EXTRACTION: No valid ID found for venue:', venue.venue_name);
    return null;
  };

  const handleVenueSelect = (venue: AIVenueRecommendation) => {
    const venueId = getVenueId(venue);
    
    console.log('🎯 PLAN TOGETHER - Venue selected:', {
      venueName: venue.venue_name,
      extractedVenueId: venueId,
      rawVenueId: venue.venue_id
    });

    if (!venueId) {
      console.error('🎯 PLAN TOGETHER - CRITICAL ERROR: Venue missing valid ID!', venue);
      alert('Error: This venue cannot be selected due to missing data. Please try another venue or refresh the page.');
      return;
    }

    console.log('🎯 PLAN TOGETHER - Proceeding with venue selection:', venueId);
    onVenueSelect(venueId);
  };

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
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center">
            <Users className="h-5 w-5 text-primary" />
            Plan Together with {partnerName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Select a venue that you'd both love to visit. You can discuss your choices and decide together!
          </p>
        </CardContent>
      </Card>

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
            venueRecommendations.map((venue, index) => {
              const venueId = getVenueId(venue);
              
              if (!venueId) {
                console.error('🚨 PLAN TOGETHER - Skipping venue without valid ID:', {
                  venue_name: venue.venue_name,
                  venue_id: venue.venue_id,
                  index
                });
                return null;
              }

              return (
                <div key={`${venueId}-${index}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <AIVenueCard
                    recommendation={venue}
                    onSelect={() => handleVenueSelect(venue)}
                    sessionContext={{
                      sessionId: sessionId,
                      partnerId: partnerId
                    }}
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