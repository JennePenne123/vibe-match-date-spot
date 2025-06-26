
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Plus, Clock, MapPin, Check, X, Calendar, Users } from 'lucide-react';
import BurgerMenu from '@/components/BurgerMenu';
import DateInviteCard from '@/components/DateInviteCard';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [acceptedInvitations, setAcceptedInvitations] = useState<number[]>([]);
  const [declinedInvitations, setDeclinedInvitations] = useState<number[]>([]);
  const [showEmptyState, setShowEmptyState] = useState(false);

  // Redirect to register-login if no user is authenticated
  React.useEffect(() => {
    console.log('Home component - user:', user);
    if (!user) {
      console.log('No user found, redirecting to register-login');
      navigate('/register-login');
    }
  }, [user, navigate]);

  // Mock data for friend invitations
  const friendInvitations = [
    {
      id: 1,
      friendName: 'Sarah Chen',
      friendAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      dateType: 'Coffee & Brunch',
      location: 'Downtown',
      time: '2:00 PM Today',
      message: 'Want to try that new cafe we talked about?',
      status: 'pending',
      venueName: 'Sunset Rooftop Cafe',
      venueAddress: '123 Main St, Downtown',
      estimatedCost: '$25-35 per person',
      duration: '2-3 hours',
      specialNotes: 'They have the best avocado toast in the city! Perfect spot for catching up.',
      venueImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      friendName: 'Mike Johnson',
      friendAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      dateType: 'Dinner & Movies',
      location: 'Uptown',
      time: '7:30 PM Tomorrow',
      message: 'New restaurant just opened! Should be amazing 🍽️',
      status: 'pending',
      venueName: 'The Garden Bistro',
      venueAddress: '456 Oak Ave, Uptown',
      estimatedCost: '$45-60 per person',
      duration: '3-4 hours',
      specialNotes: 'Award-winning chef, romantic atmosphere. Movie theater is just 2 blocks away!',
      venueImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      friendName: 'Emma Wilson',
      friendAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      dateType: 'Art Gallery',
      location: 'Arts District',
      time: '3:00 PM Saturday',
      message: 'There\'s a new exhibition opening this weekend!',
      status: 'pending',
      venueName: 'Modern Art Gallery',
      venueAddress: '789 Creative Blvd, Arts District',
      estimatedCost: '$15-20 per person',
      duration: '2-3 hours',
      specialNotes: 'Contemporary art exhibition featuring local artists. Wine tasting included!',
      venueImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
    }
  ];

  const handleAcceptInvitation = (id: number) => {
    setAcceptedInvitations(prev => [...prev, id]);
    setDeclinedInvitations(prev => prev.filter(invId => invId !== id));
    console.log('Accepted invitation:', id);
  };

  const handleDeclineInvitation = (id: number) => {
    setDeclinedInvitations(prev => [...prev, id]);
    setAcceptedInvitations(prev => prev.filter(invId => invId !== id));
    console.log('Declined invitation:', id);
  };

  // Don't render anything while checking authentication
  if (!user) {
    return null;
  }

  const displayName = user?.profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const firstName = displayName.split(' ')[0];

  const availableInvitations = showEmptyState ? [] : friendInvitations.filter(
    inv => !acceptedInvitations.includes(inv.id) && !declinedInvitations.includes(inv.id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 pt-12 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-pink-200">
              <AvatarImage src={user?.profile?.avatar_url} alt={displayName} />
              <AvatarFallback className="bg-pink-100 text-pink-600 text-sm">
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Hey {firstName}! 👋</h1>
              <p className="text-sm text-gray-600">Ready for your next adventure?</p>
            </div>
          </div>
          <BurgerMenu />
        </div>

        <div className="p-6 space-y-6">
          {/* Test Empty State Toggle */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowEmptyState(!showEmptyState)}
              variant="outline"
              size="sm"
              className="text-xs text-gray-500"
            >
              {showEmptyState ? 'Show Invites' : 'Test Empty State'}
            </Button>
          </div>

          {/* Start New Date Card - Only show when NOT in empty state */}
          {!showEmptyState && (
            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-3">
                  <div className="bg-gradient-to-r from-pink-400 to-rose-500 rounded-full p-3 shadow-md">
                    <Heart className="w-8 h-8 text-white" fill="currentColor" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800">
                  Start New Date
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Discover amazing places with AI-powered recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={() => navigate('/preferences')}
                  className="w-full h-12 bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600 font-semibold shadow-md"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Find Perfect Spots
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Friend Invitations */}
          {availableInvitations.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Date Invitations</h2>
                <div className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {availableInvitations.length} new
                </div>
              </div>

              {availableInvitations.map((invitation) => (
                <DateInviteCard
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={handleAcceptInvitation}
                  onDecline={handleDeclineInvitation}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <Card className="bg-white shadow-sm border-gray-200">
              <CardContent className="p-8 text-center">
                <div className="text-gray-300 mb-4">
                  <Calendar className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Date Invitations</h3>
                <p className="text-gray-600 mb-4">
                  You don't have any pending date invitations right now. Start planning your own date or invite friends!
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate('/preferences')}
                    className="w-full bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Plan a New Date
                  </Button>
                  <Button
                    onClick={() => navigate('/my-friends')}
                    variant="outline"
                    className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Invite Friends
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Accepted/Declined Status */}
          {(acceptedInvitations.length > 0 || declinedInvitations.length > 0) && (
            <div className="text-center text-sm text-gray-500 pt-4">
              {acceptedInvitations.length > 0 && (
                <p className="text-green-600">✓ {acceptedInvitations.length} invitation(s) accepted</p>
              )}
              {declinedInvitations.length > 0 && (
                <p className="text-red-600">✗ {declinedInvitations.length} invitation(s) declined</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
