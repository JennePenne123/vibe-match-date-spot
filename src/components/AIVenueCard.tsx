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
  X,
  Car,
  PersonStanding
} from 'lucide-react';
import VenueFeedbackButtons from '@/components/VenueFeedbackButtons';
import { AIVenueRecommendation } from '@/services/aiVenueService/recommendations';
import { type FeedbackType } from '@/services/feedbackService';
import VenuePhotoGallery from '@/components/VenuePhotoGallery';
import { formatVenueAddress, extractNeighborhood } from '@/utils/addressHelpers';
import { VoucherBadge } from '@/components/VoucherBadge';
import { VoucherBadge as VoucherBadgeType } from '@/hooks/useVenueVouchers';
import { RouteInfo } from '@/services/routingService';

interface TravelInfo {
  driving?: RouteInfo | null;
  walking?: RouteInfo | null;
}

interface AIVenueCardProps {
  recommendation: AIVenueRecommendation;
  onSelect: (venueId: string) => void;
  showAIInsights?: boolean;
  compact?: boolean;
  isTopMatch?: boolean;
  sessionContext?: {
    sessionId?: string;
    partnerId?: string;
  };
  vouchers?: VoucherBadgeType[];
  travelInfo?: TravelInfo;
}

const AIVenueCard: React.FC<AIVenueCardProps> = ({
  recommendation,
  onSelect,
  showAIInsights = true,
  compact = false,
  isTopMatch = false,
  sessionContext,
  vouchers = [],
  travelInfo
}) => {

  const [showDetails, setShowDetails] = useState(false); // Collapsed by default for cleaner UI
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

  // Calculate display score (handle both 0-1 and 0-100 ranges)
  const displayScore = ai_score <= 1 ? Math.round(ai_score * 100) : Math.round(ai_score);

  // Determine confidence label based on score + data quality
  const getConfidenceLabel = (): { label: string; icon: React.ReactNode; className: string } | null => {
    const confLevel = confidence_level ?? 0;
    const hasStrongData = confLevel > 0.7 || (match_factors?.learned_weights_applied === true);
    
    if (isTopMatch && displayScore >= 80 && hasStrongData) {
      return { label: 'Top Match', icon: <Check className="w-3 h-3" />, className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' };
    }
    if (displayScore >= 80) {
      return { label: 'Guter Match', icon: <ThumbsUp className="w-3 h-3" />, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
    }
    if (displayScore >= 50) {
      return { label: 'Entdeckung', icon: <Eye className="w-3 h-3" />, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
    }
    return null;
  };

  const confidenceLabel = getConfidenceLabel();

  // Get AI score color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <Card className="venue-ai-card border-0 shadow-md hover:shadow-lg transition-shadow">
      {/* Venue Image */}
      <div className="relative">
        <VenuePhotoGallery 
          photos={processedPhotos}
          venueName={venue_name}
          maxHeight="h-48"
          showThumbnails={false}
          className="transition-transform duration-300 hover:scale-105"
        />
          
        {/* AI Match Score + Confidence Label Overlay */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-white font-bold text-sm tracking-tight">{displayScore}%</span>
          </div>
          {confidenceLabel && (
            <div className={`flex items-center gap-1 backdrop-blur-md rounded-full px-2.5 py-1 shadow-md border ${
              confidenceLabel.label === 'Top Match' 
                ? 'bg-emerald-500/80 border-emerald-400/30 text-white' 
                : confidenceLabel.label === 'Guter Match'
                ? 'bg-blue-500/80 border-blue-400/30 text-white'
                : 'bg-amber-500/80 border-amber-400/30 text-white'
            }`}>
              {confidenceLabel.icon}
              <span className="text-xs font-semibold">{confidenceLabel.label}</span>
            </div>
          )}
        </div>

        {/* Voucher badges */}
        {vouchers.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-col gap-1 items-start">
            {vouchers.slice(0, 2).map((voucher) => (
              <VoucherBadge key={voucher.id} voucher={voucher} compact />
            ))}
            {vouchers.length > 2 && (
              <Badge className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold shadow-lg">
                +{vouchers.length - 2} more
              </Badge>
            )}
          </div>
        )}

        {/* Feedback overlay for user's choice */}
        {userFeedback && (
          <div className="absolute bottom-3 right-3">
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

      <CardHeader className="pb-2">
        <div className="flex-1 min-w-0">
          <Heading size="h2" className="truncate">
            {venue_name}
          </Heading>
          
          {/* Compact address - show only neighborhood */}
          <div className="flex items-center mt-1">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0 text-muted-foreground" />
            <Text size="sm" className="text-muted-foreground truncate">
              {venueNeighborhood || formattedAddress}
            </Text>
          </div>

          {/* Travel time info */}
          {travelInfo && (travelInfo.driving || travelInfo.walking) && (
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              {travelInfo.driving && (
                <span className="flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  {travelInfo.driving.durationText}
                </span>
              )}
              {travelInfo.walking && (
                <span className="flex items-center gap-1">
                  <PersonStanding className="w-3 h-3" />
                  {travelInfo.walking.durationText}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* "Warum dieses Venue?" — Signal-based explanation */}
        {showAIInsights && ai_reasoning && (
          <div className="space-y-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Brain className="w-3.5 h-3.5 text-primary" />
                Warum dieses Venue?
              </span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>

            {showDetails && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                {/* AI Reasoning as signal chips */}
                <div className="flex flex-wrap gap-1.5">
                  {ai_reasoning.split(' • ').filter(Boolean).map((reason, i) => {
                    // Determine chip color based on content
                    const r = reason.toLowerCase();
                    let chipColor = 'bg-muted text-foreground border-border/50';
                    if (r.includes('freund')) chipColor = 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20';
                    else if (r.includes('wetter') || r.includes('draußen') || r.includes('outdoor') || r.includes('°c')) chipColor = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
                    else if (r.includes('perfekt für') || r.includes('ideal für')) chipColor = 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20';
                    else if (r.includes('liebling') || r.includes('favorit') || r.includes('liebst')) chipColor = 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20';
                    else if (r.includes('neuentdeckung')) chipColor = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
                    else if (r.includes('küche') || r.includes('passt')) chipColor = 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20';
                    else if (r.includes('bewertet') || r.includes('⭐')) chipColor = 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20';
                    else if (r.includes('besucht')) chipColor = 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20';

                    return (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${chipColor}`}
                      >
                        {reason}
                      </span>
                    );
                  })}
                </div>

                {/* Compact venue metrics */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/30">
                  {rating && (
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      {rating}
                    </span>
                  )}
                  {priceRange && (
                    <span className="flex items-center gap-0.5">
                      <DollarSign className="w-3 h-3" />
                      {priceRange}
                    </span>
                  )}
                  {cuisine_type && <span>{cuisine_type}</span>}
                  {distance && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      {distance}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feedback Buttons - Compact Icon Grid */}
        <div className="pt-2 grid grid-cols-4 gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedbackChange('super_like')}
            className={`justify-center p-2 h-auto ${userFeedback === 'super_like' ? 'bg-purple-50 text-purple-700' : ''}`}
            title="Super Like"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedbackChange('like')}
            className={`justify-center p-2 h-auto ${userFeedback === 'like' ? 'bg-pink-50 text-pink-700' : ''}`}
            title="Like"
          >
            <Heart className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedbackChange('visited')}
            className={`justify-center p-2 h-auto ${userFeedback === 'visited' ? 'bg-green-50 text-green-700' : ''}`}
            title="Visited"
          >
            <Check className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedbackChange('dislike')}
            className={`justify-center p-2 h-auto ${userFeedback === 'dislike' ? 'bg-red-50 text-red-700' : ''}`}
            title="Not for me"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Select Button - Compact */}
        <Button
          onClick={() => onSelect(venue_id)}
          className="w-full bg-purple-600 hover:bg-purple-700"
          size="default"
        >
          Select This Venue
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIVenueCard;
