
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Calendar, Check, X } from 'lucide-react';
import { Friend } from '@/types';

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
  const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('');

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-2">
        <Avatar className="w-10 h-10 border-2 border-datespot-light-coral">
          <AvatarImage src={friend.avatar_url} alt={friend.name} />
          <AvatarFallback className="bg-datespot-light-coral text-datespot-dark-coral">
            {getInitials(friend.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{friend.name}</h4>
          {friend.lastSeen && (
            <p className="text-sm text-gray-500">{friend.lastSeen}</p>
          )}
        </div>
        {onToggleInvite && (
          <Button
            onClick={() => onToggleInvite(friend.id)}
            size="sm"
            variant={friend.isInvited ? "default" : "outline"}
            className={friend.isInvited ? 
              "bg-datespot-gradient text-white hover:opacity-90" : 
              "border-gray-200 text-gray-700 hover:bg-gray-50"
            }
          >
            {friend.isInvited ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-14 h-14 border-2 border-datespot-light-coral">
              <AvatarImage src={friend.avatar_url} alt={friend.name} />
              <AvatarFallback className="bg-datespot-light-coral text-datespot-dark-coral">
                {getInitials(friend.name)}
              </AvatarFallback>
            </Avatar>
            {friend.status && (
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {friend.name}
            </h3>
            
            {friend.lastSeen && (
              <p className="text-sm text-gray-500 mb-1">{friend.lastSeen}</p>
            )}
            
            {friend.mutualFriends !== undefined && (
              <p className="text-xs text-gray-400">{friend.mutualFriends} mutual friends</p>
            )}
            
            {showActions && (
              <div className="flex gap-2 mt-3">
                {onMessage && (
                  <Button
                    onClick={() => onMessage(friend.id, friend.name)}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                )}
                {onInvite && (
                  <Button
                    onClick={() => onInvite(friend.id, friend.name)}
                    size="sm"
                    className="flex-1 bg-datespot-gradient text-white hover:opacity-90"
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
