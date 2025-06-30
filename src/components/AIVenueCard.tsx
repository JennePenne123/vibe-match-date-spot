
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Clock, DollarSign, Sparkles } from 'lucide-react';
import { AIVenueRecommendation } from '@/services/aiVenueService';

interface AIVenueCardProps {
  recommendation: AIVenueRecommendation;
  onSelect?: (venueId: string) => void;
  showAIInsights?: boolean;
}

const AIVenueCard: React.FC<AIVenueCardProps> = ({
  recommendation,
  onSelect,
  showAIInsights = true
}) => {
  const {
    venue_id,
    venue_name,
    venue_address,
    venue_image,
    ai_score,
    match_factors,
    ai_reasoning,
    confidence_level
  } = recommendation;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <Card className="w-full max-w-md mx-auto hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
              {venue_name}
            </CardTitle>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="truncate">{venue_address}</span>
            </div>
          </div>
          
          {showAIInsights && (
            <div className="flex flex-col items-end ml-3">
              <Badge className={`${getScoreColor(ai_score)} border text-xs font-medium mb-1`}>
                <Sparkles className="h-3 w-3 mr-1" />
                {Math.round(ai_score)}% Match
              </Badge>
              <span className="text-xs text-gray-500">
                {getConfidenceText(confidence_level)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {venue_image && (
          <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 overflow-hidden">
            <img
              src={venue_image}
              alt={venue_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
              }}
            />
          </div>
        )}

        {showAIInsights && (
          <div className="space-y-3 mb-4">
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">AI Insights:</p>
              <p className="text-gray-600">{ai_reasoning}</p>
            </div>

            {match_factors && (
              <div className="flex flex-wrap gap-1">
                {match_factors.cuisine_match && (
                  <Badge variant="secondary" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Cuisine Match
                  </Badge>
                )}
                {match_factors.price_match && (
                  <Badge variant="secondary" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Price Match
                  </Badge>
                )}
                {match_factors.vibe_matches?.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Vibe Match
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => onSelect?.(venue_id)}
          >
            Select Venue
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-3"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIVenueCard;
