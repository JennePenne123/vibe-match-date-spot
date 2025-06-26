
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import HomeHeader from '@/components/HomeHeader';
import StartNewDateCard from '@/components/StartNewDateCard';
import DateInvitationsSection from '@/components/DateInvitationsSection';
import LoadingSpinner from '@/components/LoadingSpinner';
import { mockFriendInvitations } from '@/data/mockData';

const Home = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [acceptedInvitations, setAcceptedInvitations] = useState<number[]>([]);
  const [declinedInvitations, setDeclinedInvitations] = useState<number[]>([]);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [invitationsLoading, setInvitationsLoading] = useState(false);

  // Redirect to register-login if no user is authenticated
  React.useEffect(() => {
    console.log('Home component - user:', user, 'loading:', authLoading);
    if (!authLoading && !user) {
      console.log('No user found, redirecting to register-login');
      navigate('/register-login');
    }
  }, [user, authLoading, navigate]);

  // Simulate loading invitations
  React.useEffect(() => {
    if (user && !showEmptyState) {
      setInvitationsLoading(true);
      const timer = setTimeout(() => {
        setInvitationsLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, showEmptyState]);

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

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  // Don't render anything if no user
  if (!user) {
    return null;
  }

  const displayName = user?.profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const firstName = displayName.split(' ')[0];

  const availableInvitations = showEmptyState ? [] : mockFriendInvitations.filter(
    inv => !acceptedInvitations.includes(inv.id) && !declinedInvitations.includes(inv.id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <HomeHeader user={user} displayName={displayName} firstName={firstName} />

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
          {!showEmptyState && <StartNewDateCard />}

          {/* Date Invitations Section */}
          <DateInvitationsSection
            invitations={availableInvitations}
            onAccept={handleAcceptInvitation}
            onDecline={handleDeclineInvitation}
            isLoading={invitationsLoading}
          />

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
