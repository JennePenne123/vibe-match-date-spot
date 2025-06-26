
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Search, UserPlus, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FriendCard from '@/components/FriendCard';
import { mockFriends } from '@/data/mockUsers';

const MyFriends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredFriends = mockFriends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMessage = (friendId: string, friendName: string) => {
    toast({
      title: "Message sent!",
      description: `Starting conversation with ${friendName}`,
    });
  };

  const handleInviteDate = (friendId: string, friendName: string) => {
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
            onClick={() => navigate(-1)}
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">My Friends</h1>
            <p className="text-sm text-gray-600">{mockFriends.length} connections</p>
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
                <div className="text-2xl font-bold text-pink-600">{mockFriends.length}</div>
                <div className="text-sm text-gray-600">Total Friends</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {mockFriends.filter(f => f.status === 'online').length}
                </div>
                <div className="text-sm text-gray-600">Online Now</div>
              </CardContent>
            </Card>
          </div>

          {/* Friends List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Friends</h2>
            
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
