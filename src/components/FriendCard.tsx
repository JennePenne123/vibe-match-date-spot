
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Calendar, Check, X } from 'lucide-react';
import { Friend } from '@/types';
import { Heading, Text } from '@/design-system/components';
import { getInitials } from '@/lib/utils';

interface FriendCardProps {
  friend: Friend;
  variant?: 'default' | 'invite' | 'compact';
  onMessage?: (friendId: string, friendName: string) => void;
  onInvite?: (friendId: string, friendName: string) => void;
  onToggleInvite?: (friendId: string) => void;
  showActions?: boolean;
}

const FriendCard = ({ 
  friend, 
  variant = 'default',
  onMessage,
  onInvite,
  onToggleInvite,
  showActions = true 
}: FriendCardProps) => {

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-2">
        <Avatar className="w-10 h-10 border-2 border-primary/30 ring-2 ring-primary/10">
          <AvatarImage src={friend.avatar_url} alt={friend.name} referrerPolicy="no-referrer" />
          <AvatarFallback className="bg-primary/20 text-primary">
            {getInitials(friend.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Heading size="h3" className="truncate">{friend.name}</Heading>
          {friend.lastSeen && (
            <Text size="sm" className="text-muted-foreground">{friend.lastSeen}</Text>
          )}
        </div>
        {onToggleInvite && (
          <Button
            onClick={() => onToggleInvite(friend.id)}
            size="sm"
            variant={friend.isInvited ? "default" : "outline"}
          >
            {friend.isInvited ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-glow-md hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-14 h-14 border-2 border-primary/30 ring-2 ring-primary/10">
              <AvatarImage src={friend.avatar_url} alt={friend.name} referrerPolicy="no-referrer" />
              <AvatarFallback className="bg-primary/20 text-primary font-medium">
                {getInitials(friend.name)}
              </AvatarFallback>
            </Avatar>
            {friend.status && (
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${
                friend.status === 'online' ? 'bg-emerald-500' : 'bg-muted-foreground'
              }`} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <Heading size="h2" className="truncate">
              {friend.name}
            </Heading>
            
            {friend.lastSeen && (
              <Text size="sm" className="text-muted-foreground mb-1">{friend.lastSeen}</Text>
            )}
            
            {friend.mutualFriends !== undefined && (
              <Text size="xs" className="text-muted-foreground">{friend.mutualFriends} mutual friends</Text>
            )}
            
            {showActions && (
              <div className="flex gap-2 mt-3">
                {onMessage && (
                  <Button
                    onClick={() => onMessage(friend.id, friend.name)}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-border text-foreground hover:bg-white/10"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                )}
                {onInvite && (
                  <Button
                    onClick={() => onInvite(friend.id, friend.name)}
                    size="sm"
                    variant="default"
                    className="flex-1"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Invite
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendCard;
