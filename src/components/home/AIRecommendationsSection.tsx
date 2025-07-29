
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight } from 'lucide-react';
import AIVenueCard from '@/components/AIVenueCard';
import SafeComponent from '@/components/SafeComponent';
import { AIVenueRecommendation } from '@/services/aiVenueService';

interface AIRecommendationsSectionProps {
  recommendations: AIVenueRecommendation[];
  loading: boolean;
}

const AIRecommendationsSection: React.FC<AIRecommendationsSectionProps> = ({
  recommendations,
  loading
}) => {
  const navigate = useNavigate();

  return (
    <SafeComponent componentName="AIRecommendationsSection">
      <Card variant="premium" className="bg-gradient-primary">
        <CardHeader className="pb-component-lg">
          <CardTitle className="flex items-center gap-component-xs text-white">
            <Sparkles className="h-5 w-5" />
            AI-Powered Recommendations
          </CardTitle>
          <p className="text-body-sm text-white/80">
            Discover perfect venues matched to your preferences
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-component-xs text-white">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span className="text-body-sm">AI is analyzing your preferences...</span>
              </div>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-component-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-component-lg">
                {recommendations.slice(0, 2).map((recommendation) => (
                  <AIVenueCard
                    key={recommendation.venue_id}
                    recommendation={recommendation}
                    onSelect={(venueId) => {
                      console.log('Selected venue for date:', venueId);
                    }}
                    showAIInsights={true}
                  />
                ))}
              </div>
              
              <div className="text-center pt-component-lg">
                <Button 
                  onClick={() => navigate('/ai-recommendations')}
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  View All AI Recommendations
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-white/60 mx-auto mb-component-lg" />
              <p className="text-white/80 mb-component-lg">
                Complete your preferences to get AI-powered venue recommendations
              </p>
              <Button 
                onClick={() => navigate('/preferences')}
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                Set Preferences
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </SafeComponent>
  );
};

export default AIRecommendationsSection;
