
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
      <Card className="bg-gradient-to-r from-purple-50 to-orange-50 border-purple-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Powered Recommendations
          </CardTitle>
          <p className="text-sm text-gray-600">
            Discover perfect venues matched to your preferences
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-purple-600">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span className="text-sm">AI is analyzing your preferences...</span>
              </div>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <div className="text-center pt-4">
                <Button 
                  onClick={() => navigate('/ai-recommendations')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  View All AI Recommendations
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-purple-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Complete your preferences to get AI-powered venue recommendations
              </p>
              <Button 
                onClick={() => navigate('/preferences')}
                variant="outline"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
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
