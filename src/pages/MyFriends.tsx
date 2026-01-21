
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Search, UserPlus, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FriendCard from '@/components/FriendCard';

const MyFriends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends } = useFriends();
  
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMessage = (friendId: string, friendName: string) => {
    toast({
      title: "Message sent!",
      description: `Starting conversation with ${friendName}`,
    });
  };

  const handleInviteDate = (friendId: string, friendName: string) => {
    // Navigate to Smart Date Planning with pre-selected friend
    navigate('/plan-date', { 
      state: { 
        preselectedFriend: { id: friendId, name: friendName }
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 pt-12 bg-card shadow-sm">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">My Friends</h1>
            <p className="text-sm text-muted-foreground">{friends.length} connections</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="text-sage-600 dark:text-sage-400 border-sage-200 dark:border-sage-800 hover:bg-sage-50 dark:hover:bg-sage-900/20"
          >
            <UserPlus className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-card border-border"
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-sage-50 to-sand-50 dark:from-sage-950/30 dark:to-sand-950/30 border-sage-200 dark:border-sage-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-sage-600 dark:text-sage-400">{friends.length}</div>
                <div className="text-sm text-muted-foreground">Total Friends</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-sand-50 to-terracotta-50 dark:from-sand-950/30 dark:to-terracotta-950/30 border-sand-200 dark:border-sand-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-terracotta-600 dark:text-terracotta-400">
                  {friends.filter(f => f.status === 'online').length}
                </div>
                <div className="text-sm text-muted-foreground">Online Now</div>
              </CardContent>
            </Card>
          </div>

          {/* Friends List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Your Friends</h2>
            
            {filteredFriends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onMessage={handleMessage}
                onInvite={handleInviteDate}
              />
            ))}
          </div>

          {/* Add Friends CTA */}
          <Card className="bg-muted/50 border-dashed border-2 border-border">
            <CardContent className="p-6 text-center">
              <div className="text-muted-foreground mb-2">
                <UserPlus className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Invite More Friends</h3>
              <p className="text-sm text-muted-foreground mb-4">Connect with more people to discover amazing dates together</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Contacts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyFriends;
