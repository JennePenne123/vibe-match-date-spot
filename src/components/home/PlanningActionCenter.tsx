import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Sparkles, Zap, Clock, MapPin } from 'lucide-react';
import { Heading, Text } from '@/design-system/components';

interface PlanningActionCenterProps {
  onCollaborativePlanning: () => void;
  onSoloPlanning: () => void;
  hasFriends: boolean;
}

const PlanningActionCenter: React.FC<PlanningActionCenterProps> = ({
  onCollaborativePlanning,
  onSoloPlanning,
  hasFriends
}) => {
  const getTimeBasedSuggestion = () => {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    if (hour >= 11 && hour <= 14) return { icon: '☀️', text: 'Perfect for lunch dates!' };
    if (hour >= 17 && hour <= 20) return { icon: '🌅', text: 'Golden hour dinner time!' };
    if (day === 5 && hour >= 16) return { icon: '🎉', text: 'Weekend plans ahead!' };
    if (day === 6 || day === 0) return { icon: '✨', text: 'Weekend date vibes!' };
    return { icon: '💫', text: 'Any time is date time!' };
  };

  const suggestion = getTimeBasedSuggestion();

  return (
    <div className="space-y-4">
      {/* Header with contextual suggestion */}
      <div className="text-center space-y-2">
        <Heading size="h3" className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Plan a New Date
        </Heading>
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg">{suggestion.icon}</span>
          <Text size="sm" className="text-muted-foreground">
            {suggestion.text}
          </Text>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 gap-3">
        {/* Collaborative Planning */}
        <Card 
          className="border-border hover:border-primary/50 transition-all duration-200 cursor-pointer hover:shadow-md" 
          onClick={hasFriends ? onCollaborativePlanning : undefined}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Plan Together</CardTitle>
                  <Text size="sm" className="text-muted-foreground">
                    Send proposal & collaborate
                  </Text>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-2 w-2 mr-1" />
                Most Fun
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button 
              className="w-full" 
              disabled={!hasFriends}
              onClick={hasFriends ? onCollaborativePlanning : undefined}
            >
              {hasFriends ? 'Send Date Proposal' : 'Add Friends First'}
            </Button>
            {!hasFriends && (
              <Text size="xs" className="text-muted-foreground text-center mt-2">
                You need friends to send proposals
              </Text>
            )}
          </CardContent>
        </Card>

        {/* Solo Planning */}
        <Card 
          className="border-border hover:border-secondary/50 transition-all duration-200 cursor-pointer hover:shadow-md"
          onClick={onSoloPlanning}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-secondary/10">
                  <Zap className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-base">AI-Powered Planning</CardTitle>
                  <Text size="sm" className="text-muted-foreground">
                    Quick, smart recommendations
                  </Text>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                <MapPin className="h-2 w-2 mr-1" />
                Instant
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="secondary" className="w-full" onClick={onSoloPlanning}>
              Plan with AI
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips */}
      <div className="p-3 rounded-lg bg-muted/30 border">
        <Text size="xs" className="text-muted-foreground text-center">
          💡 <strong>Tip:</strong> Collaborative planning lets both of you choose preferences for the perfect match!
        </Text>
      </div>
    </div>
  );
};

export default PlanningActionCenter;