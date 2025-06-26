import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
        <EnhancedHomeHeader 
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

// Enhanced Header Component with Optimized Burger Menu
interface EnhancedHomeHeaderProps {
  user: any;
  displayName: string;
  firstName: string;
}

const EnhancedHomeHeader: React.FC<EnhancedHomeHeaderProps> = ({ 
  user, 
  displayName, 
  firstName 
}) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && !(event.target as Element).closest('.burger-menu-container')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleMenuItemClick = useCallback((action: string) => {
    closeMenu();
    
    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'friends':
        navigate('/friends');
        break;
      case 'venues':
        navigate('/venues');
        break;
      case 'signout':
        signOut();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, [navigate, signOut, closeMenu]);

  const avatarUrl = user?.profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <>
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white transform translate-x-20 -translate-y-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white transform -translate-x-16 translate-y-16 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-white transform -translate-x-12 -translate-y-12 animate-bounce delay-500"></div>
        </div>
        
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between">
            {/* Enhanced User Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={displayName}
                    className="w-16 h-16 rounded-full border-3 border-white/40 object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/20 border-3 border-white/40 flex items-center justify-center shadow-lg backdrop-blur-sm">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {/* Enhanced Online Status */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-3 border-white shadow-md animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wide">
                  Hallo, {firstName}! 
                  <span className="ml-2 text-2xl animate-bounce inline-block">👋</span>
                </h1>
                <p className="text-white/90 text-base font-medium mt-1">
                  Bereit für neue Abenteuer?
                </p>
              </div>
            </div>

            {/* Premium Burger Menu Button */}
            <button
              onClick={toggleMenu}
              className="burger-menu-container relative p-4 rounded-2xl bg-white/15 hover:bg-white/25 active:bg-white/35 transition-all duration-300 backdrop-blur-md border-2 border-white/30 group shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
              aria-label="Menu öffnen"
            >
              <div className="relative w-7 h-7">
                <span className={`absolute block h-1 w-7 bg-white rounded-full transition-all duration-400 ease-in-out shadow-sm ${
                  isMenuOpen ? 'top-3 rotate-45' : 'top-1'
                }`}></span>
                <span className={`absolute block h-1 w-7 bg-white rounded-full transition-all duration-400 ease-in-out top-3 shadow-sm ${
                  isMenuOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                }`}></span>
                <span className={`absolute block h-1 w-7 bg-white rounded-full transition-all duration-400 ease-in-out shadow-sm ${
                  isMenuOpen ? 'top-3 -rotate-45' : 'top-5'
                }`}></span>
              </div>
              
              {/* Enhanced Ripple Effect */}
              <div className="absolute inset-0 rounded-2xl bg-white/0 group-active:bg-white/20 transition-all duration-200 transform group-active:scale-95"></div>
            </button>
          </div>
        </div>
      </header>

      {/* Premium Slide-out Menu Overlay */}
      <div className={`fixed inset-0 z-50 transition-all duration-400 ease-out ${
        isMenuOpen ? 'visible' : 'invisible'
      }`}>
        {/* Enhanced Backdrop with Blur */}
        <div 
          className={`absolute inset-0 backdrop-blur-sm bg-black/60 transition-all duration-400 ease-out ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMenu}
        ></div>
        
        {/* Premium Menu Panel */}
        <div className={`absolute top-0 right-0 h-full w-96 max-w-[90vw] bg-white shadow-2xl transform transition-all duration-400 ease-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Gradient Menu Header */}
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white px-8 py-8 relative overflow-hidden">
            {/* Header Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white transform translate-x-10 -translate-y-10"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={displayName}
                    className="w-12 h-12 rounded-full border-2 border-white/40 object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-lg">{displayName}</h2>
                  <p className="text-white/90 text-sm">{user.email}</p>
                </div>
              </div>
              <button
                onClick={closeMenu}
                className="p-3 rounded-xl hover:bg-white/15 transition-all duration-200 group"
                aria-label="Menu schließen"
              >
                <svg className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Premium Menu Items */}
          <nav className="py-6">
            <div className="space-y-2">
              <PremiumMenuItem 
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                label="Profile"
                description="Manage your account"
                onClick={() => handleMenuItemClick('profile')}
                color="bg-blue-50 text-blue-600"
              />
              
              <PremiumMenuItem 
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-8.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                }
                label="My Friends"
                description="Your connections"
                onClick={() => handleMenuItemClick('friends')}
                color="bg-pink-50 text-pink-600"
              />
              
              <PremiumMenuItem 
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
                label="My Venues"
                description="Favorite places"
                onClick={() => handleMenuItemClick('venues')}
                color="bg-purple-50 text-purple-600"
              />
            </div>
            
            {/* Enhanced Divider */}
            <div className="border-t border-gray-200 my-6 mx-6"></div>
            
            <PremiumMenuItem 
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              }
              label="Sign Out"
              description="Log out of your account"
              onClick={() => handleMenuItemClick('signout')}
              color="bg-red-50 text-red-600"
              variant="danger"
            />
          </nav>
        </div>
      </div>
    </>
  );
};

// Premium Menu Item Component
interface PremiumMenuItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  color: string;
  variant?: 'default' | 'danger';
}

const PremiumMenuItem: React.FC<PremiumMenuItemProps> = ({ 
  icon, 
  label, 
  description, 
  onClick, 
  color,
  variant = 'default'
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center space-x-4 px-8 py-4 transition-all duration-300 hover:bg-gray-50 active:bg-gray-100 group"
    >
      <div className={`p-3 rounded-xl ${color} transition-all duration-300 group-hover:scale-110 group-active:scale-95 shadow-sm`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-gray-800 transition-colors">
          {label}
        </h3>
        <p className="text-gray-500 text-sm mt-1 group-hover:text-gray-600 transition-colors">
          {description}
        </p>
      </div>
      <svg 
        className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-all duration-300 group-hover:translate-x-1" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
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