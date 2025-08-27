import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar, Heart, Clock } from 'lucide-react';
import { Heading, Text } from '@/design-system/components';
import { AppUser } from '@/types/app';

interface HeroSectionProps {
  user: AppUser;
  firstName: string;
  pendingProposals: number;
  pendingInvitations: number;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  user,
  firstName,
  pendingProposals,
  pendingInvitations
}) => {
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getContextualMessage = () => {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    if (day === 5 && hour >= 16) return "Weekend's almost here! Perfect for planning dates 🎉";
    if (day === 6 || day === 0) return "Weekend vibes! Great time for a special date ✨";
    if (hour >= 17 && hour <= 20) return "Golden hour - perfect timing for dinner plans 🌅";
    if (hour >= 11 && hour <= 14) return "Lunch break? Maybe plan a lunch date! ☀️";
    return "Ready to plan something amazing? 💫";
  };

  const totalPending = pendingProposals + pendingInvitations;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Heading size="h2" className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              {getTimeBasedGreeting()}, {firstName}!
            </Heading>
            <Text size="sm" className="text-muted-foreground">
              {getContextualMessage()}
            </Text>
          </div>
          
          {totalPending > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {totalPending} pending
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
            <div className="p-1.5 rounded-full bg-primary/10">
              <Calendar className="h-3 w-3 text-primary" />
            </div>
            <div>
              <Text size="xs" className="text-muted-foreground">Proposals</Text>
              <Text size="sm" className="font-medium">{pendingProposals}</Text>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
            <div className="p-1.5 rounded-full bg-secondary/10">
              <Heart className="h-3 w-3 text-secondary" />
            </div>
            <div>
              <Text size="xs" className="text-muted-foreground">Invitations</Text>
              <Text size="sm" className="font-medium">{pendingInvitations}</Text>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeroSection;