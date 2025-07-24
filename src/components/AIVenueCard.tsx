// components/AIVenueCard.tsx
// Enhanced venue card with feedback buttons and AI insights

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Brain,
  TrendingUp
} from 'lucide-react';
import VenueFeedbackButtons from '@/components/VenueFeedbackButtons';
import { AIVenueRecommendation } from '@/services/aiVenueService';
import { type FeedbackType } from '@/services/feedbackService';
import VenuePhotoGallery from '@/components/VenuePhotoGallery';

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
  const [userFeedback, setUserFeedback] = useState<FeedbackType | null>(null);

  const {
    venue_id,
    venue_name,
    venue_address,
    venue_image,
    ai_score,
    match_factors,
    contextual_score,
    ai_reasoning,
    confidence_level
  } = recommendation;

  // Process venue photos for gallery
  const venuePhotos = recommendation.venue_photos && recommendation.venue_photos.length > 0 
    ? recommendation.venue_photos 
    : [{
        url: venue_image || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        width: 400,
        height: 300,
        attribution: recommendation.venue_photos?.length ? 'Google Photos' : 'Stock Photo',
        isGooglePhoto: recommendation.venue_photos?.length > 0
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
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200">
      {/* Venue Image */}
      <div className="relative">
        <VenuePhotoGallery 
          photos={venuePhotos}
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
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold text-gray-900 truncate">
              {venue_name}
            </CardTitle>
            
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{venue_address}</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-col items-end gap-2">
            <Button
              size="sm"
              onClick={() => onSelect(venue_id)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Select
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Venue Metrics */}
        <div className="flex items-center gap-4 text-sm">
          {match_factors?.rating && (
            <div className="flex items-center text-yellow-600">
              <Star className="w-4 h-4 mr-1 fill-current" />
              <span className="font-medium">{match_factors.rating}</span>
            </div>
          )}
          
          {match_factors?.price_range && (
            <div className="flex items-center text-green-600">
              <DollarSign className="w-4 h-4 mr-1" />
              <span className="font-medium">{match_factors.price_range}</span>
            </div>
          )}
          
          {contextual_score > 0 && (
            <div className="flex items-center text-blue-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="font-medium">Context Bonus</span>
            </div>
          )}
        </div>

        {/* AI Reasoning */}
        {showAIInsights && ai_reasoning && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-purple-900 mb-1">
                  AI Reasoning
                </p>
                <p className="text-sm text-purple-800 leading-relaxed">
                  {ai_reasoning}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Match Factors (Expandable) */}
        {showAIInsights && match_factors && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullInsights(!showFullInsights)}
              className="w-full justify-between p-2 h-auto"
            >
              <span className="text-sm font-medium">Match Details</span>
              {showFullInsights ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>

            {showFullInsights && (
              <div className="space-y-2 bg-gray-50 rounded-lg p-3">
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

        {/* Feedback Buttons */}
        <div className="border-t pt-4">
          <VenueFeedbackButtons
            venueId={venue_id}
            venueType="recommendations"
            context={{
              source: 'recommendations',
              session_id: sessionContext?.sessionId,
              partner_id: sessionContext?.partnerId,
              ai_score: ai_score,
              confidence_level: confidence_level
            }}
            onFeedbackChange={handleFeedbackChange}
            compact={compact}
            showStats={!compact}
            className="w-full"
          />
        </div>

        {/* AI Learning Note */}
        {userFeedback && ['like', 'super_like', 'dislike'].includes(userFeedback) && (
          <div className="text-xs text-center text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            <Sparkles className="w-3 h-3 inline mr-1" />
            This feedback improves AI recommendations for future dates
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIVenueCard;
