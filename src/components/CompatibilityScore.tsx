
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Clock, DollarSign, Utensils, Sparkles } from 'lucide-react';
import { CompatibilityScore as CompatibilityScoreType } from '@/services/aiMatchingService';

interface CompatibilityScoreProps {
  score: CompatibilityScoreType;
  partnerName?: string;
  className?: string;
}

const CompatibilityScore: React.FC<CompatibilityScoreProps> = ({
  score,
  partnerName = 'your friend',
  className = ''
}) => {
  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 0.8) return 'text-green-600';
    if (scoreValue >= 0.6) return 'text-yellow-600';
    return 'text-red-500';
  };

  const getScoreText = (scoreValue: number) => {
    if (scoreValue >= 0.8) return 'Excellent';
    if (scoreValue >= 0.6) return 'Good';
    if (scoreValue >= 0.4) return 'Fair';
    return 'Needs Work';
  };

  const formatPercentage = (value: number) => Math.round(value * 100);

  return (
    <Card variant="elevated" className={`w-full ${className}`}>
      <CardHeader className="pb-component-lg">
        <CardTitle className="flex items-center gap-component-xs">
          <Heart className="h-5 w-5 text-destructive" />
          Compatibility with {partnerName}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-layout-sm">
        {/* Overall Score */}
        <div className="text-center space-y-component-xs">
          <div className="flex items-center justify-center gap-component-xs">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className={`text-display-lg font-display-lg ${getScoreColor(score.overall_score)}`}>
              {formatPercentage(score.overall_score)}%
            </span>
          </div>
          <p className="text-body-sm text-muted-foreground">
            {getScoreText(score.overall_score)} compatibility overall
          </p>
          <Progress 
            value={formatPercentage(score.overall_score)} 
            className="w-full max-w-xs mx-auto" 
          />
        </div>

        {/* Detailed Scores */}
        <div className="grid grid-cols-2 gap-component-lg">
          <div className="space-y-component-xs">
            <div className="flex items-center gap-component-xs">
              <Utensils className="h-4 w-4 text-accent" />
              <span className="text-body-sm font-body-sm">Cuisine</span>
            </div>
            <div className="flex items-center gap-component-xs">
              <Progress value={formatPercentage(score.cuisine_score)} className="flex-1" />
              <span className="text-body-sm font-body-sm min-w-[3rem]">
                {formatPercentage(score.cuisine_score)}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Vibe</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={formatPercentage(score.vibe_score)} className="flex-1" />
              <span className="text-sm font-semibold min-w-[3rem]">
                {formatPercentage(score.vibe_score)}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Budget</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={formatPercentage(score.price_score)} className="flex-1" />
              <span className="text-sm font-semibold min-w-[3rem]">
                {formatPercentage(score.price_score)}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Timing</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={formatPercentage(score.timing_score)} className="flex-1" />
              <span className="text-sm font-semibold min-w-[3rem]">
                {formatPercentage(score.timing_score)}%
              </span>
            </div>
          </div>
        </div>

        {/* Shared Preferences */}
        {score.compatibility_factors && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Shared Interests</h4>
            <div className="flex flex-wrap gap-2">
              {score.compatibility_factors.shared_cuisines?.map((cuisine: string) => (
                <Badge key={cuisine} variant="secondary" className="text-xs">
                  🍽️ {cuisine}
                </Badge>
              ))}
              {score.compatibility_factors.shared_vibes?.map((vibe: string) => (
                <Badge key={vibe} variant="secondary" className="text-xs">
                  ✨ {vibe}
                </Badge>
              ))}
              {score.compatibility_factors.shared_price_ranges?.map((price: string) => (
                <Badge key={price} variant="secondary" className="text-xs">
                  💰 {price}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompatibilityScore;
