import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CompatibilityScore {
  overall_score?: number;
  category_scores?: Record<string, number>;
  reasoning?: string;
}

interface CompatibilitySummaryBannerProps {
  compatibilityScore: number | CompatibilityScore;
  partnerName: string;
  venueCount: number;
  compact?: boolean;
  collapsible?: boolean;
}

const CompatibilitySummaryBanner: React.FC<CompatibilitySummaryBannerProps> = ({
  compatibilityScore,
  partnerName,
  venueCount,
  compact = true,
  collapsible = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Extract score percentage
  const scoreValue = typeof compatibilityScore === 'object' && compatibilityScore?.overall_score
    ? Math.round(compatibilityScore.overall_score * 100)
    : typeof compatibilityScore === 'number'
      ? Math.round(compatibilityScore * 100)
      : 0;

  // Determine match quality
  const getMatchQuality = (score: number) => {
    if (score >= 80) return { label: 'Excellent Match', variant: 'default' as const, color: 'bg-green-500/10 text-green-700 border-green-500/20' };
    if (score >= 65) return { label: 'Great Match', variant: 'secondary' as const, color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' };
    return { label: 'Good Match', variant: 'outline' as const, color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' };
  };

  const matchQuality = getMatchQuality(scoreValue);

  const reasoning = typeof compatibilityScore === 'object' ? compatibilityScore.reasoning : null;

  if (!collapsible) {
    return (
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-purple-500/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-muted-foreground">Did you know?</span>
              </div>
              <p className="text-base font-semibold text-foreground mb-2">
                You have {scoreValue}% compatibility with {partnerName}!
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={matchQuality.color}>
                  {matchQuality.label}
                </Badge>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {venueCount} perfect {venueCount === 1 ? 'venue' : 'venues'} found
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-purple-500/10 border-primary/20">
        <CollapsibleTrigger className="w-full">
          <CardContent className="p-4 cursor-pointer hover:bg-primary/5 transition-colors">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-muted-foreground">Did you know?</span>
                </div>
                <p className="text-base font-semibold text-foreground mb-2">
                  You have {scoreValue}% compatibility with {partnerName}!
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={matchQuality.color}>
                    {matchQuality.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    {venueCount} perfect {venueCount === 1 ? 'venue' : 'venues'} found
                  </span>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          </CardContent>
        </CollapsibleTrigger>

        {reasoning && (
          <CollapsibleContent>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="pl-8 pt-2 border-t border-primary/10">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {reasoning}
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        )}
      </Card>
    </Collapsible>
  );
};

export default CompatibilitySummaryBanner;
