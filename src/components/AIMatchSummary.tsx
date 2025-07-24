
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
    ? compatibilityScore 
    : Math.round((compatibilityScore?.overall_score || 0) * 100);

  const cuisineScore = detailedScore ? Math.round(detailedScore.cuisine_score * 100) : 0;
  const vibeScore = detailedScore ? Math.round(detailedScore.vibe_score * 100) : 0;
  const priceScore = detailedScore ? Math.round(detailedScore.price_score * 100) : 0;
  const timingScore = detailedScore ? Math.round(detailedScore.timing_score * 100) : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
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
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          AI Compatibility Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Compatibility Score */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Heart className="h-8 w-8 text-pink-500" />
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {overallScore}%
              </div>
              <div className="text-sm text-gray-600">
                Compatibility with {partnerName}
              </div>
            </div>
          </div>
          
          <Badge className={`${getScoreColor(overallScore)} border text-lg px-4 py-1`}>
            {getScoreText(overallScore)}
          </Badge>
          
          <Progress 
            value={overallScore} 
            className="w-full max-w-xs mx-auto h-3"
          />
        </div>

        {/* AI Insights */}
        <div className="bg-white p-4 rounded-lg border border-purple-100">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">AI Insights</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                {getRecommendationText(overallScore)}
              </p>
            </div>
          </div>
        </div>

        {/* Venue Recommendations Summary */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-purple-100">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-purple-500" />
            <div>
              <div className="font-medium text-gray-900">{venueCount} Perfect Venues Found</div>
              <div className="text-sm text-gray-600">
                Ranked by AI compatibility score
              </div>
            </div>
          </div>
          
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            AI Curated
          </Badge>
        </div>

        {/* Compatibility Breakdown */}
        {detailedScore && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
              <div className="text-lg font-bold text-purple-600">{cuisineScore}%</div>
              <div className="text-xs text-gray-600">Cuisine Match</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
              <div className="text-lg font-bold text-purple-600">{vibeScore}%</div>
              <div className="text-xs text-gray-600">Vibe Match</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
              <div className="text-lg font-bold text-purple-600">{priceScore}%</div>
              <div className="text-xs text-gray-600">Price Match</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
              <div className="text-lg font-bold text-purple-600">{timingScore}%</div>
              <div className="text-xs text-gray-600">Time Match</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIMatchSummary;
