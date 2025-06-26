import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import HomeHeader from '@/components/HomeHeader';
import StartNewDateCard from '@/components/StartNewDateCard';
import DateInvitationsSection from '@/components/DateInvitationsSection';
import LoadingSpinner from '@/components/LoadingSpinner';
import { mockFriendInvitations } from '@/data/mockData';

// Types for better type safety
interface InvitationState {
  accepted: number[];
  declined: number[];
}

interface User {
  id?: string;
  email?: string;
  profile?: {
    name?: string;
  };
  user_metadata?: {
    name?: string;
  };
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // Consolidate invitation state into single object
  const [invitationState, setInvitationState] = useState<InvitationState>({
    accepted: [],
    declined: []
  });
  
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [invitationsLoading, setInvitationsLoading] = useState(false);

  // Memoize user display logic
  const userInfo = React.useMemo(() => {
    if (!user) return null;
    
    const displayName = user?.profile?.name || 
                       user?.user_metadata?.name || 
                       user?.email?.split('@')[0] || 
                       'User';
    const firstName = displayName.split(' ')[0];
    
    return { displayName, firstName };
  }, [user]);

  // Handle authentication redirect with proper cleanup
  useEffect(() => {
    // Add a small delay to prevent flashing
    const redirectTimer = setTimeout(() => {
      if (!authLoading && !user) {
        console.log('No authenticated user found, redirecting to login');
        navigate('/register-login', { replace: true });
      }
    }, 100);

    return () => clearTimeout(redirectTimer);
  }, [user, authLoading, navigate]);

  // Simulate loading invitations with proper cleanup
  useEffect(() => {
    if (!user || showEmptyState) return;

    setInvitationsLoading(true);
    const loadingTimer = setTimeout(() => {
      setInvitationsLoading(false);
    }, 1500);

    return () => clearTimeout(loadingTimer);
  }, [user, showEmptyState]);

  // Optimized invitation handlers using useCallback
  const handleAcceptInvitation = useCallback((id: number) => {
    setInvitationState(prev => ({
      accepted: [...prev.accepted, id],
      declined: prev.declined.filter(invId => invId !== id)
    }));
    
    // Optional: Add analytics or API call here
    console.log('Accepted invitation:', id);
  }, []);

  const handleDeclineInvitation = useCallback((id: number) => {
    setInvitationState(prev => ({
      declined: [...prev.declined, id],
      accepted: prev.accepted.filter(invId => invId !== id)
    }));
    
    // Optional: Add analytics or API call here
    console.log('Declined invitation:', id);
  }, []);

  // Toggle empty state for testing
  const toggleEmptyState = useCallback(() => {
    setShowEmptyState(prev => !prev);
  }, []);

  // Calculate available invitations
  const availableInvitations = React.useMemo(() => {
    if (showEmptyState) return [];
    
    return mockFriendInvitations.filter(
      inv => !invitationState.accepted.includes(inv.id) && 
             !invitationState.declined.includes(inv.id)
    );
  }, [showEmptyState, invitationState, mockFriendInvitations]);

  // Early returns for loading and unauthenticated states
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  if (!user || !userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Redirecting to login...</p>
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  const { displayName, firstName } = userInfo;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <HomeHeader 
          user={user} 
          displayName={displayName} 
          firstName={firstName} 
        />

        <main className="p-6 space-y-6">
          {/* Development/Testing Controls */}
          {process.env.NODE_ENV === 'development' && (
            <div className="flex justify-center">
              <Button
                onClick={toggleEmptyState}
                variant="outline"
                size="sm"
                className="text-xs text-gray-500 hover:text-gray-700"
                aria-label={showEmptyState ? 'Show invitations' : 'Test empty state'}
              >
                {showEmptyState ? 'Show Invites' : 'Test Empty State'}
              </Button>
            </div>
          )}

          {/* Main Content */}
          {!showEmptyState && (
            <StartNewDateCard />
          )}

          <DateInvitationsSection
            invitations={availableInvitations}
            onAccept={handleAcceptInvitation}
            onDecline={handleDeclineInvitation}
            isLoading={invitationsLoading}
          />

          {/* Status Summary */}
          <InvitationStatus invitationState={invitationState} />
        </main>
      </div>
    </div>
  );
};

// Separate component for invitation status to improve readability
const InvitationStatus: React.FC<{ invitationState: InvitationState }> = ({ 
  invitationState 
}) => {
  const { accepted, declined } = invitationState;
  const hasActivity = accepted.length > 0 || declined.length > 0;

  if (!hasActivity) return null;

  return (
    <div className="text-center text-sm text-gray-500 pt-4 space-y-1">
      {accepted.length > 0 && (
        <p className="text-green-600 flex items-center justify-center gap-1">
          <span className="inline-block w-4 h-4 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center">
            ✓
          </span>
          {accepted.length} invitation{accepted.length !== 1 ? 's' : ''} accepted
        </p>
      )}
      {declined.length > 0 && (
        <p className="text-red-600 flex items-center justify-center gap-1">
          <span className="inline-block w-4 h-4 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center">
            ✗
          </span>
          {declined.length} invitation{declined.length !== 1 ? 's' : ''} declined
        </p>
      )}
    </div>
  );
};

export default Home;