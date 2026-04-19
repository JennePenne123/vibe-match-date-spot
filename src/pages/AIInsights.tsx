import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Brain, TrendingUp, TrendingDown, Minus, Target, Sparkles, RefreshCw, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAdvancedInsights } from '@/hooks/useAdvancedInsights';
import { 
  RatingTimelineChart, 
  PreferenceRadarChart, 
  CategoryPerformanceChart,
  AccuracyTrendChart 
} from '@/components/profile/InsightCharts';

const AIInsights: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { insights, loading, refreshInsights } = useAdvancedInsights();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              {t('aiLearning.title')}
            </h1>
          </div>
          <div className="grid gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-500';
      case 'declining': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const trendLabel = (trend: string) => {
    switch (trend) {
      case 'improving': return t('aiLearning.trendImproving');
      case 'declining': return t('aiLearning.trendDeclining');
      default: return t('aiLearning.trendStable');
    }
  };

  const confidenceColor = {
    low: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    medium: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    high: 'bg-green-500/20 text-green-600 border-green-500/30'
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              {t('aiLearning.dashboard')}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => refreshInsights()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('aiLearning.refresh')}
          </Button>
        </div>

        {insights ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{insights.totalDates}</div>
                  <div className="text-xs text-muted-foreground">{t('aiLearning.experiencesRated')}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{insights.avgRating}⭐</div>
                  <div className="text-xs text-muted-foreground">{t('aiLearning.avgRating')}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{insights.aiAccuracy}%</div>
                  <div className="text-xs text-muted-foreground">{t('aiLearning.aiAccuracy')}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <Badge variant="outline" className={confidenceColor[insights.confidenceLevel]}>
                    {t(`aiLearning.confidence${insights.confidenceLevel.charAt(0).toUpperCase() + insights.confidenceLevel.slice(1)}`)}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">{t('aiLearning.confidence')}</div>
                </CardContent>
              </Card>
            </div>

            {/* Trends Section */}
            {insights.trends && (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {t('aiLearning.trends')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">{t('aiLearning.ratingTrend')}</span>
                      <div className={`flex items-center gap-1 ${getTrendColor(insights.trends.ratingTrend)}`}>
                        {getTrendIcon(insights.trends.ratingTrend)}
                        <span className="text-sm font-medium">{trendLabel(insights.trends.ratingTrend)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">{t('aiLearning.accuracyTrendLabel')}</span>
                      <div className={`flex items-center gap-1 ${getTrendColor(insights.trends.accuracyTrend)}`}>
                        {getTrendIcon(insights.trends.accuracyTrend)}
                        <span className="text-sm font-medium">{trendLabel(insights.trends.accuracyTrend)}</span>
                      </div>
                    </div>
                  </div>
                  {insights.trends.improvementPercent !== 0 && (
                    <p className="text-sm text-muted-foreground mt-3">
                      {insights.trends.improvementPercent > 0
                        ? t('aiLearning.recentRatings_higher', { percent: Math.abs(insights.trends.improvementPercent).toFixed(1) }).replace(/<\/?0>/g, '')
                        : t('aiLearning.recentRatings_lower', { percent: Math.abs(insights.trends.improvementPercent).toFixed(1) }).replace(/<\/?0>/g, '')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Learning Progress */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {t('aiLearning.progress')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={insights.learningProgress} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  {insights.learningProgress < 100 
                    ? t('aiLearning.rateMoreToMaximize', { count: Math.ceil((100 - insights.learningProgress) / 10) })
                    : t('aiLearning.enoughData')}
                </p>
              </CardContent>
            </Card>

            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {insights.timelineData && (
                <RatingTimelineChart data={insights.timelineData} />
              )}
              {insights.radarData && (
                <PreferenceRadarChart data={insights.radarData} />
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {insights.categoryPerformance && (
                <CategoryPerformanceChart data={insights.categoryPerformance} />
              )}
              {insights.timelineData && (
                <AccuracyTrendChart data={insights.timelineData} />
              )}
            </div>

            {/* AI Predictions */}
            {insights.predictions && insights.predictions.length > 0 && (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {t('aiLearning.aiPredictions')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.predictions.map((prediction, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">•</span>
                        <span className="text-muted-foreground">{prediction}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Success/Failure Patterns */}
            {(insights.topSuccessPatterns.length > 0 || insights.topFailurePatterns.length > 0) && (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{t('aiLearning.successFailurePatterns')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {insights.topSuccessPatterns.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">✅ {t('aiLearning.successFactors')}</p>
                        <div className="flex flex-wrap gap-2">
                          {insights.topSuccessPatterns.map((p, i) => (
                            <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-600">
                              {p.pattern.replace(/_/g, ' ')} ({p.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {insights.topFailurePatterns.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">❌ {t('aiLearning.areasToAvoid')}</p>
                        <div className="flex flex-wrap gap-2">
                          {insights.topFailurePatterns.map((p, i) => (
                            <Badge key={i} variant="secondary" className="bg-red-500/10 text-red-600">
                              {p.pattern.replace(/_/g, ' ')} ({p.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Text Insights */}
            {insights.textInsights.length > 0 && (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    {t('aiLearning.keyInsights')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.textInsights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-3 w-3 mt-1 text-primary shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="py-12 text-center">
              <Brain className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-lg font-medium mb-2">{t('aiLearning.noInsightsYet')}</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {t('aiLearning.noInsightsDesc')}
              </p>
              <Button 
                className="mt-6" 
                onClick={() => navigate('/preferences')}
              >
                {t('aiLearning.planFirst')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
