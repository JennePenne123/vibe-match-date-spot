
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Plus, Clock, MapPin, Check, X, Settings, User } from 'lucide-react';
import { toast } from 'sonner';
import NavigationBar from '@/components/NavigationBar';

const Landing = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';

  // Mock data for friend invitations with state management
  const [friendInvitations, setFriendInvitations] = useState([
    {
      id: 1,
      friendName: 'Sarah Chen',
      friendAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      dateType: 'Coffee & Brunch',
      location: 'Downtown',
      time: '2:00 PM Today',
      message: 'Want to try that new cafe we talked about?',
      status: 'pending'
    },
    {
      id: 2,
      friendName: 'Mike Johnson',
      friendAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      dateType: 'Dinner & Movies',
      location: 'Uptown',
      time: '7:30 PM Tomorrow',
      message: 'New restaurant just opened! Should be amazing 🍽️',
      status: 'pending'
    },
    {
      id: 3,
      friendName: 'Emma Wilson',
      friendAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      dateType: 'Art Gallery',
      location: 'Arts District',
      time: '3:00 PM Saturday',
      message: 'There\'s a new exhibition opening this weekend!',
      status: 'pending'
    }
  ]);

  const handleAcceptInvitation = (id: number) => {
    const invitation = friendInvitations.find(inv => inv.id === id);
    if (invitation) {
      setFriendInvitations(prev => prev.filter(inv => inv.id !== id));
      toast.success(`Accepted invitation from ${invitation.friendName}! 🎉`);
      // Here you would typically make an API call to accept the invitation
      console.log('Accepted invitation:', id);
    }
  };

  const handleDeclineInvitation = (id: number) => {
    const invitation = friendInvitations.find(inv => inv.id === id);
    if (invitation) {
      setFriendInvitations(prev => prev.filter(inv => inv.id !== id));
      toast(`Declined invitation from ${invitation.friendName}`);
      // Here you would typically make an API call to decline the invitation
      console.log('Declined invitation:', id);
    }
  };

  const handleStartNewDate = () => {
    navigate(isDemoMode ? '/preferences?demo=true' : '/preferences');
  };

  const handleLogout = () => {
    if (isDemoMode) {
      navigate('/');
    } else {
      logout();
    }
  };

  const displayName = isDemoMode 
    ? 'Demo User' 
    : (user?.profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User');
  const firstName = displayName.split(' ')[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 pt-12 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-datespot-light-pink">
              <AvatarImage src={isDemoMode ? undefined : user?.profile?.avatar_url} alt={displayName} />
              <AvatarFallback className="bg-datespot-light-pink text-datespot-dark-pink text-sm">
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Hey {firstName}! 👋</h1>
              <p className="text-sm text-gray-600">Ready for your next adventure?</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(isDemoMode ? '/profile?demo=true' : '/profile')}
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:bg-gray-100"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:bg-gray-100"
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Start New Date Card */}
          <Card className="bg-gradient-to-br from-datespot-light-pink to-datespot-soft-pink border-datespot-pink/20 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                <div className="bg-datespot-gradient rounded-full p-3 shadow-md">
                  <Heart className="w-8 h-8 text-white" fill="currentColor" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-datespot-dark-pink">
                Start New Date
              </CardTitle>
              <CardDescription className="text-datespot-dark-pink/70">
                Discover amazing places with AI-powered recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                onClick={handleStartNewDate}
                className="w-full h-12 bg-datespot-gradient text-white hover:opacity-90 font-semibold shadow-md"
              >
                <Plus className="w-5 h-5 mr-2" />
                Find Perfect Spots
              </Button>
            </CardContent>
          </Card>

          {/* Friend Invitations */}
          {friendInvitations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Date Invitations</h2>
                <div className="bg-datespot-pink text-white text-xs px-2 py-1 rounded-full font-medium">
                  {friendInvitations.length} new
                </div>
              </div>

              {friendInvitations.map((invitation) => (
                <Card key={invitation.id} className="bg-white shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-datespot-pink">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 border-2 border-datespot-light-pink">
                        <AvatarImage src={invitation.friendAvatar} alt={invitation.friendName} />
                        <AvatarFallback className="bg-datespot-light-pink text-datespot-dark-pink">
                          {invitation.friendName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {invitation.friendName}
                          </h3>
                          <span className="text-xs text-datespot-pink font-medium bg-datespot-light-pink px-2 py-0.5 rounded-full">
                            {invitation.dateType}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{invitation.message}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {invitation.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {invitation.location}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAcceptInvitation(invitation.id)}
                            size="sm"
                            className="flex-1 bg-datespot-gradient text-white hover:opacity-90 font-medium"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleDeclineInvitation(invitation.id)}
                            size="sm"
                            variant="outline"
                            className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(isDemoMode ? '/friends?demo=true' : '/friends')}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">👥</div>
                <h3 className="font-medium text-gray-900 text-sm">Invite Friends</h3>
                <p className="text-xs text-gray-600 mt-1">Share date ideas</p>
              </CardContent>
            </Card>
            
            <Card 
              className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(isDemoMode ? '/results?demo=true' : '/results')}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">📍</div>
                <h3 className="font-medium text-gray-900 text-sm">Saved Places</h3>
                <p className="text-xs text-gray-600 mt-1">Your favorites</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <NavigationBar />
    </div>
  );
};

export default Landing;
