// components/AIVenueCard.tsx
// Enhanced venue card with feedback buttons, AI insights, and confidence transparency

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heading, Text } from '@/design-system/components';
import { 
  MapPin, 
  Star, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Brain,
  Heart,
  Check,
  X,
  Car,
  PersonStanding,
  ShieldCheck,
  TrendingUp,
  Zap
} from 'lucide-react';
import { AIVenueRecommendation } from '@/services/aiVenueService/recommendations';
import { type FeedbackType } from '@/services/feedbackService';
import VenuePhotoGallery from '@/components/VenuePhotoGallery';
import { formatVenueAddress, extractNeighborhood } from '@/utils/addressHelpers';
import { VoucherBadge } from '@/components/VoucherBadge';
import { VoucherBadge as VoucherBadgeType } from '@/hooks/useVenueVouchers';
import { RouteInfo } from '@/services/routingService';
import { motion, AnimatePresence } from 'framer-motion';

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

  const [showDetails, setShowDetails] = useState(false);
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

  const formattedAddress = formatVenueAddress(recommendation);
  const venueNeighborhood = neighborhood || extractNeighborhood(venue_address);

  const processedPhotos = venue_photos && venue_photos.length > 0 
    ? venue_photos 
    : [{
        url: venue_image || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        width: 400,
        height: 300,
        attribution: venue_photos?.length ? 'Google Photos' : 'Stock Photo',
        isGooglePhoto: venue_photos?.length > 0
      }];

  const handleFeedbackChange = (feedbackType: FeedbackType | null) => {
    setUserFeedback(feedbackType);
  };

  const displayScore = ai_score <= 1 ? Math.round(ai_score * 100) : Math.round(ai_score);
  const confPercent = Math.round((confidence_level ?? 0.5) * 100);

  // Confidence label with more transparency
  const getConfidenceLabel = (): { label: string; icon: React.ReactNode; className: string; description: string } | null => {
    const confLevel = confidence_level ?? 0;
    const hasStrongData = confLevel > 0.7 || (match_factors?.learned_weights_applied === true);
    
    if (isTopMatch && displayScore >= 80 && hasStrongData) {
      return { 
        label: 'Top Match', 
        icon: <ShieldCheck className="w-3 h-3" />, 
        className: 'bg-emerald-500/80 border-emerald-400/30 text-white',
        description: 'Basierend auf deinem Feedback & Präferenzen'
      };
    }
    if (displayScore >= 80) {
      return { 
        label: 'Guter Match', 
        icon: <TrendingUp className="w-3 h-3" />, 
        className: 'bg-blue-500/80 border-blue-400/30 text-white',
        description: 'Starke Übereinstimmung mit deinem Profil'
      };
    }
    if (displayScore >= 50) {
      return { 
        label: 'Entdeckung', 
        icon: <Zap className="w-3 h-3" />, 
        className: 'bg-amber-500/80 border-amber-400/30 text-white',
        description: 'Könnte dir gefallen — probier es aus!'
      };
    }
    return null;
  };

  const confidenceLabel = getConfidenceLabel();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card className="venue-ai-card border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
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
              <div className={`flex items-center gap-1 backdrop-blur-md rounded-full px-2.5 py-1 shadow-md border ${confidenceLabel.className}`}>
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

          {/* Feedback overlay */}
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

            {/* AI Confidence summary line */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Brain className="w-3 h-3 text-primary" />
              <span>
                KI-Sicherheit: <span className={`font-semibold ${confPercent >= 70 ? 'text-emerald-600 dark:text-emerald-400' : confPercent >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'}`}>{confPercent}%</span>
                {match_factors?.learned_weights_applied && (
                  <span className="ml-1 text-primary">• Personalisiert</span>
                )}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {/* "Warum dieses Venue?" */}
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

              <AnimatePresence>
                {showDetails && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pt-1">
                      {/* AI Reasoning chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {ai_reasoning.split(' • ').filter(Boolean).map((reason, i) => {
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
                            <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${chipColor}`}>
                              {reason}
                            </span>
                          );
                        })}
                      </div>

                      {/* Confidence explanation */}
                      {confidenceLabel && (
                        <div className="text-[11px] text-muted-foreground bg-muted/30 px-2 py-1.5 rounded-md">
                          💡 {confidenceLabel.description}
                          {confPercent < 60 && ' — Je mehr Feedback du gibst, desto besser werden die Empfehlungen.'}
                        </div>
                      )}

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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Feedback Buttons */}
          <div className="pt-2 grid grid-cols-4 gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedbackChange('super_like')}
              className={`justify-center p-2 h-auto ${userFeedback === 'super_like' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' : ''}`}
              title="Super Like"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedbackChange('like')}
              className={`justify-center p-2 h-auto ${userFeedback === 'like' ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300' : ''}`}
              title="Like"
            >
              <Heart className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedbackChange('visited')}
              className={`justify-center p-2 h-auto ${userFeedback === 'visited' ? 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300' : ''}`}
              title="Visited"
            >
              <Check className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedbackChange('dislike')}
              className={`justify-center p-2 h-auto ${userFeedback === 'dislike' ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300' : ''}`}
              title="Not for me"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Select Button */}
          <Button
            onClick={() => onSelect(venue_id)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="default"
          >
            Venue auswählen
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AIVenueCard;
