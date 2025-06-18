import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, ArrowRight, Search, UserPlus, Check } from 'lucide-react';

const Friends = () => {
  const navigate = useNavigate();
  const { user, inviteFriend } = useAuth();
  const { updateInvitedFriends } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  if (!user) {
    navigate('/');
    return null;
  }

  const filteredFriends = user.friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const invitedFriendIds = user.friends.filter(f => f.isInvited).map(f => f.id);

  const handleNext = () => {
    updateInvitedFriends(invitedFriendIds);
    navigate('/area');
  };

  const handleSkip = () => {
    updateInvitedFriends([]);
    navigate('/area');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12 bg-white shadow-sm">
        <Button
          onClick={() => navigate('/preferences')}
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Invite Friends</h1>
          <p className="text-sm text-gray-600">Step 2 of 3</p>
        </div>
        <Button
          onClick={handleSkip}
          variant="ghost"
          className="text-gray-600 hover:bg-gray-100 text-sm"
        >
          Skip
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-8 pt-4">
        <div className="bg-gray-200 rounded-full h-2">
          <div className="bg-datespot-gradient rounded-full h-2 w-2/3 transition-all duration-300" />
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* Header Text */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Who's joining you?</h2>
          <p className="text-gray-600">Invite friends to join your date adventure</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 bg-white border-gray-200"
          />
        </div>

        {/* Friends List */}
        <div className="space-y-3 mb-8">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={friend.avatar} alt={friend.name} />
                    <AvatarFallback className="bg-datespot-light-pink text-datespot-dark-pink">
                      {friend.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{friend.name}</h3>
                    <p className="text-sm text-gray-500">Available for dates</p>
                  </div>
                  <Button
                    onClick={() => inviteFriend(friend.id)}
                    variant={friend.isInvited ? "default" : "outline"}
                    className={friend.isInvited 
                      ? "bg-datespot-gradient text-white hover:opacity-90" 
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }
                  >
                    {friend.isInvited ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Invited
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-gray-900 font-semibold mb-2">No friends found</h3>
              <p className="text-gray-600">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Invited Count */}
        {invitedFriendIds.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="text-center text-gray-700">
              <h3 className="font-semibold mb-1">
                {invitedFriendIds.length} friend{invitedFriendIds.length !== 1 ? 's' : ''} invited
              </h3>
              <p className="text-sm text-gray-500">
                They'll get recommendations that work for the group
              </p>
            </div>
          </div>
        )}

        {/* Next Button */}
        <Button
          onClick={handleNext}
          className="w-full h-12 bg-datespot-gradient text-white hover:opacity-90 font-semibold"
        >
          Next: Choose Area
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Friends;
