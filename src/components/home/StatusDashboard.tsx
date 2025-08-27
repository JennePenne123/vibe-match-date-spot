import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Calendar, Heart, CheckCircle, Clock } from 'lucide-react';
import { Text } from '@/design-system/components';

interface StatusDashboardProps {
  totalProposals: number;
  totalInvitations: number;
  acceptedCount: number;
  pendingCount: number;
}

const StatusDashboard: React.FC<StatusDashboardProps> = ({
  totalProposals,
  totalInvitations,
  acceptedCount,
  pendingCount
}) => {
  const totalActivities = totalProposals + totalInvitations;
  const completionRate = totalActivities > 0 ? (acceptedCount / totalActivities) * 100 : 0;

  return (
    <Card className="bg-gradient-to-r from-background to-muted/20">
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Total Activity */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-primary mr-1" />
              <Text size="lg" className="font-semibold">
                {totalActivities}
              </Text>
            </div>
            <Text size="xs" className="text-muted-foreground">
              Total Activity
            </Text>
          </div>

          {/* Pending Items */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-amber-500 mr-1" />
              <Text size="lg" className="font-semibold">
                {pendingCount}
              </Text>
            </div>
            <Text size="xs" className="text-muted-foreground">
              Pending
            </Text>
          </div>

          {/* Success Rate */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <Text size="lg" className="font-semibold">
                {Math.round(completionRate)}%
              </Text>
            </div>
            <Text size="xs" className="text-muted-foreground">
              Success Rate
            </Text>
          </div>
        </div>

        {totalActivities > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <Text size="xs" className="text-muted-foreground">Progress</Text>
              <Text size="xs" className="text-muted-foreground">
                {acceptedCount} of {totalActivities} accepted
              </Text>
            </div>
            <Progress value={completionRate} className="h-1.5" />
          </div>
        )}

        {/* Quick Stats Row */}
        <div className="flex justify-center gap-4 mt-4">
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            {totalProposals} proposals
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Heart className="h-3 w-3" />
            {totalInvitations} invitations
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusDashboard;