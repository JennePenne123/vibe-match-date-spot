import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, UserPlus, MessageCircle, Calendar, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MyFriends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const displayName = user?.profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  // Extended mock friends data
  const allFriends = [
    { 
      id: '1', 
      name: 'Sarah Johnson', 
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      status: 'online',
      lastSeen: 'Active now',
      mutualFriends: 3,
      joinedDate: '2 months ago'
    },
    { 
      id: '2', 
      name: 'Mike Chen', 
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      status: 'offline',
      lastSeen: '2 hours ago',
      mutualFriends: 5,
      joinedDate: '3 months ago'
    },
    { 
      id: '3', 
      name: 'Emma Wilson', 
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      status: 'online',
      lastSeen: 'Active now',
      mutualFriends: 2,
      joinedDate: '1 month ago'
    },
    { 
      id: '4', 
      name: 'David Rodriguez', 
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      status: 'offline',
      lastSeen: '1 day ago',
      mutualFriends: 4,
      joinedDate: '4 months ago'
    },
    { 
      id: '5', 
      name: 'Jessica Lee', 
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      status: 'online',
      lastSeen: 'Active now',
      mutualFriends: 1,
      joinedDate: '2 weeks ago'
    }
  ];

  const filteredFriends = allFriends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMessage = (friendName: string) => {
    toast({
      title: "Message sent!",
      description: `Starting conversation with ${friendName}`,
    });
  };

  const handleInviteDate = (friendName: string) => {
    toast({
      title: "Date invitation sent!",
      description: `${friendName} will receive your date invitation`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 pt-12 bg-white shadow-sm">
          <Button
            onClick={() => navigate('/home')}
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">My Friends</h1>
            <p className="text-sm text-gray-600">{allFriends.length} connections</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="text-pink-600 border-pink-200 hover:bg-pink-50"
          >
            <UserPlus className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white border-gray-200"
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-pink-600">{allFriends.length}</div>
                <div className="text-sm text-gray-600">Total Friends</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {allFriends.filter(f => f.status === 'online').length}
                </div>
                <div className="text-sm text-gray-600">Online Now</div>
              </CardContent>
            </Card>
          </div>

          {/* Friends List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Friends</h2>
            
            {filteredFriends.map((friend) => (
              <Card key={friend.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="w-14 h-14 border-2 border-pink-200">
                        <AvatarImage src={friend.avatar} alt={friend.name} />
                        <AvatarFallback className="bg-pink-100 text-pink-600">
                          {friend.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {friend.name}
                        </h3>
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-1">{friend.lastSeen}</p>
                      <p className="text-xs text-gray-400">{friend.mutualFriends} mutual friends</p>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={() => handleMessage(friend.name)}
                          size="sm"
                          variant="outline"
                          className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                        <Button
                          onClick={() => handleInviteDate(friend.name)}
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600"
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Invite
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Friends CTA */}
          <Card className="bg-gray-100 border-dashed border-2 border-gray-300">
            <CardContent className="p-6 text-center">
              <div className="text-gray-400 mb-2">
                <UserPlus className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="font-medium text-gray-600 mb-1">Invite More Friends</h3>
              <p className="text-sm text-gray-500 mb-4">Connect with more people to discover amazing dates together</p>
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
