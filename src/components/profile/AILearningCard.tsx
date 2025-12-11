import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Sparkles, Target, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAILearning } from '@/hooks/useAILearning';

const AILearningCard: React.FC = () => {
  const navigate = useNavigate();
  const { insights, loading, refreshInsights } = useAILearning();

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Learning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const confidenceColor = {
    low: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    medium: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    high: 'bg-green-500/20 text-green-600 border-green-500/30'
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Learning
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshInsights}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights ? (
          <>
            {/* Learning Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Learning Progress</span>
                <span className="font-medium">{insights.learningProgress}%</span>
              </div>
              <Progress value={insights.learningProgress} className="h-2" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{insights.totalDates}</div>
                <div className="text-xs text-muted-foreground">Dates Rated</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{insights.aiAccuracy}%</div>
                <div className="text-xs text-muted-foreground">AI Accuracy</div>
              </div>
            </div>

            {/* Confidence Badge */}
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Confidence:</span>
              <Badge 
                variant="outline" 
                className={confidenceColor[insights.confidenceLevel]}
              >
                {insights.confidenceLevel}
              </Badge>
            </div>

            {/* Text Insights */}
            {insights.textInsights.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Insights
                </div>
                <ul className="space-y-1">
                  {insights.textInsights.map((insight, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <TrendingUp className="h-3 w-3 mt-1 text-primary shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Feature Weights */}
            {insights.featureWeights && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="text-sm font-medium">Learned Preferences</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(insights.featureWeights)
                    .filter(([key]) => key !== 'distance')
                    .map(([key, value]) => (
                      <Badge 
                        key={key} 
                        variant="secondary"
                        className={value > 1.1 ? 'bg-primary/20 text-primary' : ''}
                      >
                        {key}: {(value as number).toFixed(2)}x
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* View Details Button */}
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => navigate('/ai-insights')}
            >
              View Detailed Insights
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <Brain className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Rate your dates to help the AI learn your preferences!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AILearningCard;
