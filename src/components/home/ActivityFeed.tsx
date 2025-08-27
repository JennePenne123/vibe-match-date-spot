import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Activity, Calendar, Heart, ArrowRight, Clock, User } from 'lucide-react';
import { Text } from '@/design-system/components';
import { DateProposal } from '@/hooks/useDateProposals';
import { DateInvitation } from '@/types/index';
import { format, isToday, isThisWeek, differenceInDays } from 'date-fns';

interface ActivityFeedProps {
  proposals: DateProposal[];
  invitations: DateInvitation[];
  onProposalAction: (proposalId: string, action: 'accept' | 'decline') => void;
  onInvitationAction: (invitationId: string, action: 'accept' | 'decline') => void;
  onViewAll: () => void;
}

interface ActivityItem {
  id: string;
  type: 'proposal' | 'invitation';
  title: string;
  subtitle: string;
  date: Date;
  status: string;
  fromUser?: string;
  actions?: { label: string; action: () => void; variant?: 'default' | 'outline' }[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  proposals,
  invitations,
  onProposalAction,
  onInvitationAction,
  onViewAll
}) => {
  // Combine and sort activities
  const activities: ActivityItem[] = React.useMemo(() => {
    const proposalItems: ActivityItem[] = proposals
      .filter(p => p.status === 'pending')
      .slice(0, 3)
      .map(proposal => ({
        id: proposal.id,
        type: 'proposal',
        title: proposal.title,
        subtitle: format(new Date(proposal.proposed_date), 'MMM d, h:mm a'),
        date: new Date(proposal.created_at),
        status: proposal.status,
        fromUser: 'Someone',
        actions: [
          { 
            label: 'Accept', 
            action: () => onProposalAction(proposal.id, 'accept'),
            variant: 'default' as const
          },
          { 
            label: 'Decline', 
            action: () => onProposalAction(proposal.id, 'decline'),
            variant: 'outline' as const
          }
        ]
      }));

    const invitationItems: ActivityItem[] = invitations
      .filter(inv => inv.status === 'pending' && 'direction' in inv && inv.direction === 'received')
      .slice(0, 3)
      .map(invitation => ({
        id: invitation.id,
        type: 'invitation',
        title: invitation.title,
        subtitle: invitation.venue?.name || 'Date invitation',
        date: new Date(invitation.created_at),
        status: invitation.status,
        fromUser: 'sender' in invitation && invitation.sender ? invitation.sender.name : undefined,
        actions: [
          { 
            label: 'Accept', 
            action: () => onInvitationAction(invitation.id, 'accept'),
            variant: 'default' as const
          },
          { 
            label: 'Decline', 
            action: () => onInvitationAction(invitation.id, 'decline'),
            variant: 'outline' as const
          }
        ]
      }));

    return [...proposalItems, ...invitationItems]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 4);
  }, [proposals, invitations, onProposalAction, onInvitationAction]);

  const getTimeGroup = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isThisWeek(date)) return 'This Week';
    const days = differenceInDays(new Date(), date);
    if (days <= 7) return 'Last Week';
    return 'Earlier';
  };

  const groupedActivities = React.useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};
    activities.forEach(activity => {
      const group = getTimeGroup(activity.date);
      if (!groups[group]) groups[group] = [];
      groups[group].push(activity);
    });
    return groups;
  }, [activities]);

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <Text size="sm" className="text-muted-foreground">
              No recent activity
            </Text>
            <Text size="xs" className="text-muted-foreground mt-1">
              Your proposals and invitations will appear here
            </Text>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs">
            View All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedActivities).map(([group, items], groupIndex) => (
          <div key={group}>
            {groupIndex > 0 && <Separator className="my-3" />}
            <Text size="xs" className="text-muted-foreground font-medium mb-2">
              {group}
            </Text>
            <div className="space-y-3">
              {items.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="p-1.5 rounded-full bg-background flex-shrink-0">
                    {activity.type === 'proposal' ? 
                      <Calendar className="h-3 w-3 text-primary" /> : 
                      <Heart className="h-3 w-3 text-secondary" />
                    }
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <Text size="sm" className="font-medium truncate">
                          {activity.title}
                        </Text>
                        <div className="flex items-center gap-2 mt-1">
                          <Text size="xs" className="text-muted-foreground">
                            {activity.subtitle}
                          </Text>
                          {activity.fromUser && (
                            <>
                              <Text size="xs" className="text-muted-foreground">•</Text>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <Text size="xs" className="text-muted-foreground">
                                  {activity.fromUser}
                                </Text>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-2 w-2 mr-1" />
                        {activity.status}
                      </Badge>
                    </div>
                    
                    {activity.actions && (
                      <div className="flex gap-2">
                        {activity.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant={action.variant || 'default'}
                            size="sm"
                            onClick={action.action}
                            className="text-xs px-3 py-1 h-auto"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;