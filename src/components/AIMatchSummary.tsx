
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Heart, MapPin, TrendingUp } from 'lucide-react';
import { CompatibilityScore } from '@/services/aiMatchingService';

interface AIMatchSummaryProps {
  compatibilityScore: number | CompatibilityScore;
  partnerName: string;
  venueCount: number;
}

const AIMatchSummary: React.FC<AIMatchSummaryProps> = ({
  compatibilityScore,
  partnerName,
  venueCount
}) => {
  // Extract scores from the compatibility object or use the number directly
  const detailedScore = typeof compatibilityScore === 'object' ? compatibilityScore : null;
  const overallScore = typeof compatibilityScore === 'number' 
    ? Math.round(compatibilityScore * 100) 
    : Math.round((compatibilityScore?.overall_score || 0) * 100);

  const cuisineScore = detailedScore ? Math.round(detailedScore.cuisine_score * 100) : 0;
  const vibeScore = detailedScore ? Math.round(detailedScore.vibe_score * 100) : 0;
  const priceScore = detailedScore ? Math.round(detailedScore.price_score * 100) : 0;
  const timingScore = detailedScore ? Math.round(detailedScore.timing_score * 100) : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return 'Excellent Match!';
    if (score >= 60) return 'Good Match';
    return 'Fair Match';
  };

  const getRecommendationText = (score: number) => {
    if (score >= 80) {
      return "You two are incredibly compatible! The AI has found venues that perfectly align with both of your preferences.";
    } else if (score >= 60) {
      return "You have solid compatibility with some great shared interests. These venues should work well for both of you.";
    }
    return "While you have different preferences, these venues offer something for both of you to enjoy.";
  };

  return (
    <>
      {/* Compatibility Score */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Heart className="h-6 w-6 text-pink-500" />
          <div>
            <div className="text-4xl font-bold text-foreground">
              {overallScore}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Compatibility with {partnerName}
            </div>
          </div>
        </div>
        
        <Badge className={`${getScoreColor(overallScore)} border text-sm px-3 py-1.5 font-medium`}>
          {getScoreText(overallScore)}
        </Badge>
        
        <Progress 
          value={overallScore} 
          className="w-full max-w-xs mx-auto h-2.5 bg-pink-100 dark:bg-pink-950/30"
        />
      </div>

      {/* AI Insights */}
      <div className="bg-card p-3 rounded-lg border border-purple-100 dark:border-purple-800">
        <div className="flex items-start gap-2.5">
          <TrendingUp className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-foreground mb-1.5 text-sm">AI Insights</h4>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {getRecommendationText(overallScore)}
            </p>
          </div>
        </div>
      </div>

      {/* Venue Recommendations Summary */}
      <div className="flex items-center justify-center flex-col gap-2 bg-card p-3 rounded-lg border border-purple-100 dark:border-purple-800">
        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 text-purple-500" />
          <div className="text-center">
            <div className="font-semibold text-foreground text-base">{venueCount} Perfect Venues Found</div>
            <div className="text-xs text-muted-foreground">
              Ranked by AI compatibility score
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xs px-2.5 py-0.5">
          AI Curated
        </Badge>
      </div>

      {/* Compatibility Breakdown */}
      {detailedScore && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-2.5 bg-card rounded-lg border border-purple-100 dark:border-purple-800">
            <div className="text-base font-bold text-purple-600 dark:text-purple-400">{cuisineScore}%</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Cuisine Match</div>
          </div>
          <div className="text-center p-2.5 bg-card rounded-lg border border-purple-100 dark:border-purple-800">
            <div className="text-base font-bold text-purple-600 dark:text-purple-400">{vibeScore}%</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Vibe Match</div>
          </div>
          <div className="text-center p-2.5 bg-card rounded-lg border border-purple-100 dark:border-purple-800">
            <div className="text-base font-bold text-purple-600 dark:text-purple-400">{priceScore}%</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Price Match</div>
          </div>
          <div className="text-center p-2.5 bg-card rounded-lg border border-purple-100 dark:border-purple-800">
            <div className="text-base font-bold text-purple-600 dark:text-purple-400">{timingScore}%</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Time Match</div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIMatchSummary;