// components/AIVenueCard.tsx
// Enhanced venue card with feedback buttons and AI insights

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heading, Text, Caption } from '@/design-system/components';
import { 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Brain,
  TrendingUp,
  Heart,
  ThumbsUp,
  Eye,
  Check,
  PlayCircle,
  X
} from 'lucide-react';
import VenueFeedbackButtons from '@/components/VenueFeedbackButtons';
import { AIVenueRecommendation } from '@/services/aiVenueService/recommendations';
import { type FeedbackType } from '@/services/feedbackService';
import VenuePhotoGallery from '@/components/VenuePhotoGallery';
import { formatVenueAddress, extractNeighborhood } from '@/utils/addressHelpers';

interface AIVenueCardProps {
  recommendation: AIVenueRecommendation;
  onSelect: (venueId: string) => void;
  showAIInsights?: boolean;
  compact?: boolean;
  sessionContext?: {
    sessionId?: string;
    partnerId?: string;
  };
}

const AIVenueCard: React.FC<AIVenueCardProps> = ({
  recommendation,
  onSelect,
  showAIInsights = true,
  compact = false,
  sessionContext
}) => {
  const [showFullInsights, setShowFullInsights] = useState(false);
  const [showAIReasoning, setShowAIReasoning] = useState(false);
  const [userFeedback, setUserFeedback] = useState<FeedbackType | null>(null);

  const {
    venue_id,
    venue_name,
    venue_address,
    venue_image,
    venue_photos,
    ai_score,
    match_factors,
    contextual_score,
    ai_reasoning,
    confidence_level,
    distance,
    neighborhood,
    isOpen,
    operatingHours,
    priceRange,
    rating,
    cuisine_type,
    amenities
  } = recommendation;

  // Format address with fallback
  const formattedAddress = formatVenueAddress(recommendation);
  const venueNeighborhood = neighborhood || extractNeighborhood(venue_address);

  // Process venue photos for gallery
  const processedPhotos = venue_photos && venue_photos.length > 0 
    ? venue_photos 
    : [{
        url: venue_image || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        width: 400,
        height: 300,
        attribution: venue_photos?.length ? 'Google Photos' : 'Stock Photo',
        isGooglePhoto: venue_photos?.length > 0
      }];

  // Handle feedback change for real-time UI updates
  const handleFeedbackChange = (feedbackType: FeedbackType | null) => {
    setUserFeedback(feedbackType);
    
    // Optional: Trigger parent component updates
    // onFeedbackChange?.(venue_id, feedbackType);
  };

  // Get AI score color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get confidence level indicator
  const getConfidenceIndicator = (confidence: number) => {
    if (confidence >= 0.8) return { text: 'High Confidence', color: 'bg-green-500' };
    if (confidence >= 0.6) return { text: 'Medium Confidence', color: 'bg-yellow-500' };
    return { text: 'Low Confidence', color: 'bg-red-500' };
  };

  const confidenceInfo = getConfidenceIndicator(confidence_level);

  return (
    <Card className="venue-ai-card hover:border-purple-200/50">
      {/* Venue Image */}
      <div className="relative">
        <VenuePhotoGallery 
          photos={processedPhotos}
          venueName={venue_name}
          maxHeight="h-48"
          showThumbnails={false}
          className="transition-transform duration-300 hover:scale-105"
        />
          
        {/* AI Score Overlay */}
        <div className="absolute top-3 right-3">
          <Badge className={`${getScoreColor(ai_score)} font-bold`}>
            <Brain className="w-3 h-3 mr-1" />
            {Math.round(ai_score)}% AI Match
          </Badge>
        </div>

        {/* Confidence Indicator */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
            <div className={`w-2 h-2 rounded-full ${confidenceInfo.color} mr-1`}></div>
            <span className="text-xs font-medium text-gray-700">{confidenceInfo.text}</span>
          </div>
        </div>

        {/* Feedback overlay for user's choice */}
        {userFeedback && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
              {userFeedback === 'like' && '❤️ Liked'}
              {userFeedback === 'super_like' && '✨ Super Liked'}
              {userFeedback === 'dislike' && '👎 Disliked'}
              {userFeedback === 'skip' && '⏭️ Skipped'}
              {userFeedback === 'interested' && '👀 Interested'}
              {userFeedback === 'visited' && '✅ Visited'}
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex-1 min-w-0">
          <Heading size="h2" className="truncate">
            {venue_name}
          </Heading>
          
          <div className="flex items-center mt-1">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0 text-muted-foreground" />
            <Text size="sm" className="text-muted-foreground truncate">{formattedAddress}</Text>
          </div>

          {/* Photo attribution */}
          {processedPhotos[0]?.attribution && (
            <Caption className="text-muted-foreground mt-1">
              Photo by {processedPhotos[0].attribution}
            </Caption>
          )}

          {/* Context Bonus Link */}
          {contextual_score > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowFullInsights(true)}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <TrendingUp className="w-3 h-3" />
                Context Bonus
              </button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Reasoning (Collapsible) */}
        {showAIInsights && ai_reasoning && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAIReasoning(!showAIReasoning)}
              className="w-full justify-between p-2 h-auto"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <Text size="sm" weight="semibold">AI Reasoning</Text>
              </div>
              {showAIReasoning ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>

            {showAIReasoning && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <Text size="sm" className="text-purple-800 leading-relaxed">
                  {ai_reasoning}
                </Text>
              </div>
            )}
          </div>
        )}

        {/* Match Details (Expandable) */}
        {showAIInsights && match_factors && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullInsights(!showFullInsights)}
              className="w-full justify-between p-2 h-auto"
            >
              <Text size="sm" weight="semibold">Match Details</Text>
              {showFullInsights ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>

            {showFullInsights && (
              <div className="space-y-3 bg-gray-50 rounded-lg p-3">
                {/* Venue Metrics */}
                <div className="flex items-center gap-4 text-sm pb-2 border-b">
                  {(rating || match_factors?.rating) && (
                    <div className="flex items-center text-yellow-600">
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      <span className="font-medium">{rating || match_factors.rating}</span>
                    </div>
                  )}
                  
                  {(priceRange || match_factors?.price_range) && (
                    <div className="flex items-center text-green-600">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span className="font-medium">{priceRange || match_factors.price_range}</span>
                    </div>
                  )}

                  {cuisine_type && (
                    <div className="flex items-center text-purple-600">
                      <span className="font-medium">{cuisine_type}</span>
                    </div>
                  )}
                </div>

                {/* Distance and Neighborhood */}
                {(distance || venueNeighborhood) && (
                  <div className="flex items-center gap-3 text-sm">
                    {distance && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{distance}</span>
                      </div>
                    )}
                    {venueNeighborhood && (
                      <span className="text-muted-foreground">• {venueNeighborhood}</span>
                    )}
                  </div>
                )}

                {/* Amenities */}
                {amenities && amenities.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm text-gray-600">Amenities</span>
                    <div className="flex flex-wrap gap-1">
                      {amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Operating Hours */}
                {operatingHours && operatingHours.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-600 font-medium">Hours:</span>{' '}
                    <span className="text-gray-700">{operatingHours[0]}</span>
                  </div>
                )}
                
                {match_factors.cuisine_match && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cuisine Match</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      ✓ Perfect
                    </Badge>
                  </div>
                )}
                
                {match_factors.price_match && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price Match</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      ✓ In Budget
                    </Badge>
                  </div>
                )}
                
                {match_factors.vibe_matches?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm text-gray-600">Vibe Matches</span>
                    <div className="flex flex-wrap gap-1">
                      {match_factors.vibe_matches.map((vibe: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {vibe}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {match_factors.rating_bonus > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quality Bonus</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      +{(match_factors.rating_bonus * 100).toFixed(0)}%
                    </Badge>
                  </div>
                )}

                {contextual_score > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Context Score</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      +{(contextual_score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Feedback Buttons - Vertical List */}
        <div className="border-t pt-4 space-y-2">
          <Button
            variant="ghost"
            onClick={() => handleFeedbackChange('super_like')}
            className={`w-full justify-start ${userFeedback === 'super_like' ? 'bg-purple-50 text-purple-700' : ''}`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Super Like
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => handleFeedbackChange('like')}
            className={`w-full justify-start ${userFeedback === 'like' ? 'bg-pink-50 text-pink-700' : ''}`}
          >
            <Heart className="w-4 h-4 mr-2" />
            Like
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => handleFeedbackChange('visited')}
            className={`w-full justify-start ${userFeedback === 'visited' ? 'bg-green-50 text-green-700' : ''}`}
          >
            <Check className="w-4 h-4 mr-2" />
            Visited
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => handleFeedbackChange('dislike')}
            className={`w-full justify-start ${userFeedback === 'dislike' ? 'bg-red-50 text-red-700' : ''}`}
          >
            <X className="w-4 h-4 mr-2" />
            Not for me
          </Button>
        </div>

        {/* Select Button - Prominent */}
        <Button
          onClick={() => onSelect(venue_id)}
          className="w-full bg-purple-600 hover:bg-purple-700"
          size="lg"
        >
          Select This Venue
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIVenueCard;
