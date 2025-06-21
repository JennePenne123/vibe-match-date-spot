import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, ArrowRight, Search, UserPlus, Check, Share2, Copy, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Friends = () => {
  const navigate = useNavigate();
  const { user, inviteFriend } = useAuth();
  const { updateInvitedFriends } = useApp();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  const [searchTerm, setSearchTerm] = useState('');
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const { toast } = useToast();

  if (!isDemoMode && !user) {
    navigate('/');
    return null;
  }

  // Enhanced demo friends data for testing
  const demoFriends = [
    { id: '1', name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', isInvited: false },
    { id: '2', name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', isInvited: false },
    { id: '3', name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', isInvited: false },
    { id: '4', name: 'David Rodriguez', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', isInvited: false },
    { id: '5', name: 'Jessica Lee', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', isInvited: false },
    { id: '6', name: 'Alex Thompson', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', isInvited: false },
    { id: '7', name: 'Maya Patel', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', isInvited: false },
    { id: '8', name: 'Ryan Kim', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f52?w=150&h=150&fit=crop&crop=face', isInvited: false },
  ];

  const friends = isDemoMode ? demoFriends : (user?.friends || []);
  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInviteFriend = (friendId: string) => {
    if (isDemoMode) {
      setInvitedIds(prev => 
        prev.includes(friendId) 
          ? prev.filter(id => id !== friendId)
          : [...prev, friendId]
      );
      toast({
        title: invitedIds.includes(friendId) ? "Friend uninvited" : "Friend invited!",
        description: invitedIds.includes(friendId) 
          ? "Friend removed from your date plans" 
          : "Friend will receive your date recommendations",
      });
    } else {
      inviteFriend(friendId);
    }
  };

  const handleNext = () => {
    const finalInvitedIds = isDemoMode ? invitedIds : friends.filter(f => f.isInvited).map(f => f.id);
    updateInvitedFriends(finalInvitedIds);
    navigate(isDemoMode ? '/area?demo=true' : '/area');
  };

  const handleSkip = () => {
    updateInvitedFriends([]);
    navigate(isDemoMode ? '/area?demo=true' : '/area');
  };

  const generateReferralLink = () => {
    const baseUrl = window.location.origin;
    const userId = isDemoMode ? 'demo-user' : (user?.id || 'user');
    return `${baseUrl}/?ref=${userId}`;
  };

  const copyReferralLink = () => {
    const link = generateReferralLink();
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Your referral link has been copied to clipboard.",
    });
  };

  const shareViaEmail = () => {
    const link = generateReferralLink();
    const subject = "Join me on DateSpot - Find Amazing Date Ideas!";
    const body = `Hey! I've been using DateSpot to discover amazing date spots and thought you'd love it too. Join me using this link: ${link}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12 bg-white shadow-sm">
        <Button
          onClick={() => navigate(isDemoMode ? '/preferences?demo=true' : '/preferences')}
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
            filteredFriends.map((friend) => {
              const isInvited = isDemoMode ? invitedIds.includes(friend.id) : friend.isInvited;
              return (
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
                      onClick={() => handleInviteFriend(friend.id)}
                      variant={isInvited ? "default" : "outline"}
                      className={isInvited 
                        ? "bg-datespot-gradient text-white hover:opacity-90" 
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }
                    >
                      {isInvited ? (
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
              );
            })
          ) : (
            <div className="space-y-6">
              {/* No Friends Found Message */}
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-gray-900 font-semibold mb-2">No friends found</h3>
                <p className="text-gray-600">Invite your friends to join DateSpot!</p>
              </div>

              {/* Referral Link Section */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="text-center mb-4">
                  <div className="bg-datespot-light-pink rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Share2 className="w-8 h-8 text-datespot-pink" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Invite Friends to DateSpot</h3>
                  <p className="text-sm text-gray-600">Share your referral link and discover amazing dates together</p>
                </div>

                {/* Referral Link Display */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={generateReferralLink()}
                      readOnly
                      className="flex-1 bg-transparent border-none text-sm text-gray-700"
                    />
                    <Button
                      onClick={copyReferralLink}
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Share Options */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={copyReferralLink}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    onClick={shareViaEmail}
                    variant="outline"
                    className="w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invited Count */}
        {(isDemoMode ? invitedIds.length : friends.filter(f => f.isInvited).length) > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="text-center text-gray-700">
              <h3 className="font-semibold mb-1">
                {(isDemoMode ? invitedIds.length : friends.filter(f => f.isInvited).length)} friend{(isDemoMode ? invitedIds.length : friends.filter(f => f.isInvited).length) !== 1 ? 's' : ''} invited
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
