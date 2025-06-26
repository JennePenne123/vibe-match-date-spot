import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import StartNewDateCard from '@/components/StartNewDateCard';
import DateInvitationsSection from '@/components/DateInvitationsSection';
import LoadingSpinner from '@/components/LoadingSpinner';
import { mockFriendInvitations } from '@/data/mockData';
import { Menu, X, User, Settings, Heart, Calendar, LogOut, Bell } from 'lucide-react';

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
    avatar_url?: string;
  };
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  
  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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
    const avatarUrl = user?.profile?.avatar_url || user?.user_metadata?.avatar_url;
    
    return { displayName, firstName, avatarUrl };
  }, [user]);

  // Handle authentication redirect with proper cleanup
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      if (!authLoading && !user) {
        console.log('No authenticated user found, redirecting to login');
        navigate('/register-login', { replace: true });
      }
    }, 100);

    return () => clearTimeout(redirectTimer);
  }, [user, authLoading, navigate]);

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

  // Simulate loading invitations with proper cleanup
  useEffect(() => {
    if (!user || showEmptyState) return;

    setInvitationsLoading(true);
    const loadingTimer = setTimeout(() => {
      setInvitationsLoading(false);
    }, 1500);

    return () => clearTimeout(loadingTimer);
  }, [user, showEmptyState]);

  // Menu handlers
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
      case 'settings':
        navigate('/settings');
        break;
      case 'favorites':
        navigate('/favorites');
        break;
      case 'calendar':
        navigate('/calendar');
        break;
      case 'notifications':
        navigate('/notifications');
        break;
      case 'logout':
        signOut();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, [navigate, signOut, closeMenu]);

  // Optimized invitation handlers using useCallback
  const handleAcceptInvitation = useCallback((id: number) => {
    setInvitationState(prev => ({
      accepted: [...prev.accepted, id],
      declined: prev.declined.filter(invId => invId !== id)
    }));
    
    console.log('Accepted invitation:', id);
  }, []);

  const handleDeclineInvitation = useCallback((id: number) => {
    setInvitationState(prev => ({
      declined: [...prev.declined, id],
      accepted: prev.accepted.filter(invId => invId !== id)
    }));
    
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
  }, [showEmptyState, invitationState]);

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

  const { displayName, firstName, avatarUrl } = userInfo;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="max-w-md mx-auto relative">
        {/* Enhanced Header with Burger Menu */}
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white transform -translate-x-12 translate-y-12"></div>
          </div>
          
          <div className="relative px-6 py-6">
            <div className="flex items-center justify-between">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={displayName}
                      className="w-12 h-12 rounded-full border-2 border-white/30 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Hallo, {firstName}! 👋</h1>
                  <p className="text-white/80 text-sm">Bereit für neue Dates?</p>
                </div>
              </div>

              {/* Enhanced Burger Menu Button */}
              <button
                onClick={toggleMenu}
                className="burger-menu-container relative p-3 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 transition-all duration-200 backdrop-blur-sm border border-white/20 group"
                aria-label="Menu öffnen"
              >
                <div className="relative w-6 h-6">
                  <span className={`absolute block h-0.5 w-6 bg-white rounded-full transition-all duration-300 ease-in-out ${
                    isMenuOpen ? 'top-3 rotate-45' : 'top-1'
                  }`}></span>
                  <span className={`absolute block h-0.5 w-6 bg-white rounded-full transition-all duration-300 ease-in-out top-3 ${
                    isMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}></span>
                  <span className={`absolute block h-0.5 w-6 bg-white rounded-full transition-all duration-300 ease-in-out ${
                    isMenuOpen ? 'top-3 -rotate-45' : 'top-5'
                  }`}></span>
                </div>
                
                {/* Ripple effect */}
                <div className="absolute inset-0 rounded-xl bg-white/0 group-active:bg-white/10 transition-colors duration-150"></div>
              </button>
            </div>
          </div>
        </header>

        {/* Slide-out Menu Overlay */}
        <div className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'visible' : 'invisible'
        }`}>
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${
              isMenuOpen ? 'opacity-50' : 'opacity-0'
            }`}
            onClick={closeMenu}
          ></div>
          
          {/* Menu Panel */}
          <div className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            {/* Menu Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={displayName}
                      className="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-semibold text-lg">{displayName}</h2>
                    <p className="text-white/80 text-sm">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                  aria-label="Menu schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="py-4">
              <div className="space-y-1">
                <MenuItem 
                  icon={<User className="w-5 h-5" />}
                  label="Mein Profil"
                  onClick={() => handleMenuItemClick('profile')}
                />
                <MenuItem 
                  icon={<Heart className="w-5 h-5" />}
                  label="Favoriten"
                  onClick={() => handleMenuItemClick('favorites')}
                />
                <MenuItem 
                  icon={<Calendar className="w-5 h-5" />}
                  label="Meine Dates"
                  onClick={() => handleMenuItemClick('calendar')}
                />
                <MenuItem 
                  icon={<Bell className="w-5 h-5" />}
                  label="Benachrichtigungen"
                  onClick={() => handleMenuItemClick('notifications')}
                />
                <MenuItem 
                  icon={<Settings className="w-5 h-5" />}
                  label="Einstellungen"
                  onClick={() => handleMenuItemClick('settings')}
                />
              </div>
              
              {/* Divider */}
              <div className="border-t border-gray-200 my-4"></div>
              
              <MenuItem 
                icon={<LogOut className="w-5 h-5" />}
                label="Abmelden"
                onClick={() => handleMenuItemClick('logout')}
                variant="danger"
              />
            </nav>
          </div>
        </div>

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

// Menu Item Component
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, variant = 'default' }) => {
  const baseClasses = "flex items-center space-x-3 px-6 py-3 transition-all duration-200 hover:bg-gray-50 active:bg-gray-100";
  const variantClasses = variant === 'danger' 
    ? "text-red-600 hover:bg-red-50 active:bg-red-100" 
    : "text-gray-700";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} w-full text-left`}
    >
      <span className={variant === 'danger' ? 'text-red-500' : 'text-gray-500'}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
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
