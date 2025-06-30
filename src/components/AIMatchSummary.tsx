
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Heart, MapPin, TrendingUp } from 'lucide-react';

interface AIMatchSummaryProps {
  compatibilityScore: number;
  partnerName: string;
  venueCount: number;
}

const AIMatchSummary: React.FC<AIMatchSummaryProps> = ({
  compatibilityScore,
  partnerName,
  venueCount
}) => {
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
                {Math.round(compatibilityScore)}%
              </div>
              <div className="text-sm text-gray-600">
                Compatibility with {partnerName}
              </div>
            </div>
          </div>
          
          <Badge className={`${getScoreColor(compatibilityScore)} border text-lg px-4 py-1`}>
            {getScoreText(compatibilityScore)}
          </Badge>
          
          <Progress 
            value={compatibilityScore} 
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
                {getRecommendationText(compatibilityScore)}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
            <div className="text-lg font-bold text-purple-600">85%</div>
            <div className="text-xs text-gray-600">Cuisine Match</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
            <div className="text-lg font-bold text-purple-600">78%</div>
            <div className="text-xs text-gray-600">Vibe Match</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
            <div className="text-lg font-bold text-purple-600">92%</div>
            <div className="text-xs text-gray-600">Price Match</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
            <div className="text-lg font-bold text-purple-600">67%</div>
            <div className="text-xs text-gray-600">Time Match</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIMatchSummary;
