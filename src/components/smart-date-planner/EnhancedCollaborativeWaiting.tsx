import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Users, Heart, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface EnhancedCollaborativeWaitingProps {
  partnerName: string;
  sessionId: string;
  hasUserSetPreferences: boolean;
  hasPartnerSetPreferences: boolean;
  canShowResults: boolean;
  isWaitingForPartner: boolean;
  onRefresh?: () => void;
  compatibilityScore?: number | null;
  estimatedWaitTime?: number;
}

const EnhancedCollaborativeWaiting: React.FC<EnhancedCollaborativeWaitingProps> = ({
  partnerName,
  sessionId,
  hasUserSetPreferences,
  hasPartnerSetPreferences,
  canShowResults,
  isWaitingForPartner,
  onRefresh,
  compatibilityScore,
  estimatedWaitTime = 5
}) => {
  const [elapsedTime, setElapsedTime] = React.useState(0);

  // Timer for elapsed time
  React.useEffect(() => {
    if (isWaitingForPartner) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isWaitingForPartner]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    if (canShowResults) {
      return compatibilityScore ? "Analysis complete! Reviewing matches..." : "Both preferences received. Analyzing compatibility...";
    }
    if (hasUserSetPreferences && !hasPartnerSetPreferences) {
      return `Waiting for ${partnerName} to set their preferences...`;
    }
    if (!hasUserSetPreferences && hasPartnerSetPreferences) {
      return `${partnerName} is waiting for your preferences.`;
    }
    return "Setting up collaborative planning session...";
  };

  const getStatusColor = () => {
    if (canShowResults) return "bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30";
    if (hasUserSetPreferences) return "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200";
    return "bg-gradient-to-r from-muted/50 to-muted/30 border-border";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className={`${getStatusColor()} transition-all duration-500`}>
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Collaborative Planning</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Planning your perfect date together with {partnerName}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Partner Status */}
          <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {partnerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{partnerName}</p>
                <p className="text-xs text-muted-foreground">Your planning partner</p>
              </div>
            </div>
            <Badge variant={hasPartnerSetPreferences ? "default" : "secondary"} className="text-xs">
              {hasPartnerSetPreferences ? "Preferences Set" : "Setting Preferences"}
            </Badge>
          </div>

          {/* Progress Indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center transition-all duration-300 ${
                hasUserSetPreferences ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {hasUserSetPreferences ? '✓' : '1'}
              </div>
              <p className="text-xs font-medium">Your Preferences</p>
              <p className="text-xs text-muted-foreground">
                {hasUserSetPreferences ? 'Complete' : 'Pending'}
              </p>
            </div>
            
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center transition-all duration-300 ${
                hasPartnerSetPreferences ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {hasPartnerSetPreferences ? '✓' : '2'}
              </div>
              <p className="text-xs font-medium">{partnerName}'s Preferences</p>
              <p className="text-xs text-muted-foreground">
                {hasPartnerSetPreferences ? 'Complete' : 'Waiting'}
              </p>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center p-4 bg-background/30 rounded-lg border-dashed border-2 border-border/50">
            <div className="flex items-center justify-center gap-2 mb-2">
              {isWaitingForPartner ? (
                <Clock className="h-4 w-4 text-primary animate-pulse" />
              ) : (
                <Heart className="h-4 w-4 text-primary" />
              )}
              <p className="text-sm font-medium">{getStatusText()}</p>
            </div>
            
            {isWaitingForPartner && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Elapsed time: {formatTime(elapsedTime)}
                </p>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((elapsedTime / (estimatedWaitTime * 60)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis Preview */}
          {canShowResults && (
            <div className="border rounded-lg p-4 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">AI Compatibility Analysis</p>
                  <p className="text-xs text-muted-foreground">Analyzing your perfect match...</p>
                </div>
              </div>
              
              {compatibilityScore ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Compatibility Score</span>
                    <Badge className="bg-primary/10 text-primary">{compatibilityScore}%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Finding venues that match your combined preferences...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="flex-1 hover-scale transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Date Planning Session',
                    text: `I'm planning a date with ${partnerName}. Session ID: ${sessionId.slice(0, 8)}`,
                    url: window.location.href
                  });
                } else {
                  navigator.clipboard.writeText(`Session ID: ${sessionId.slice(0, 8)}`);
                }
              }}
              className="flex-1 hover-scale transition-all duration-200"
            >
              Share Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedCollaborativeWaiting;