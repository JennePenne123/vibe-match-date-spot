
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMockAuth } from '@/contexts/MockAuthContext';
import { IS_MOCK_MODE } from '@/utils/mockMode';
import SmartDatePlanner from '@/components/SmartDatePlanner';
import HomeHeader from '@/components/HomeHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { getUserName } from '@/utils/typeHelpers';

const SmartDatePlanning: React.FC = () => {
  const realAuth = useAuth();
  const mockAuth = useMockAuth();
  const location = useLocation();
  
  // Use mock or real auth based on mode
  const { user } = IS_MOCK_MODE ? mockAuth : realAuth;
  
  // Get pre-selected friend from navigation state
  const preselectedFriend = location.state?.preselectedFriend || null;

  console.log('SmartDatePlanning - Auth state:', { user: user?.id, mockMode: IS_MOCK_MODE });
  console.log('SmartDatePlanning - Preselected friend:', preselectedFriend);

  // Memoize user display logic
  const userInfo = React.useMemo(() => {
    if (!user) return null;
    
    try {
      const displayName = getUserName(user);
      const firstName = displayName.split(' ')[0];
      
      return { displayName, firstName };
    } catch (error) {
      console.error('Error getting user name:', error);
      return { displayName: 'User', firstName: 'User' };
    }
  }, [user]);

  if (!user || !userInfo) {
    console.log('SmartDatePlanning - No user or userInfo, checking mock mode');
    
    // In mock mode, automatically provide a user
    if (IS_MOCK_MODE) {
      const mockUser = {
        id: 'mock-user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: null
      };
      const displayName = 'Test User';
      const firstName = 'Test';
      
      console.log('SmartDatePlanning - Using mock user');
      
      return (
        <div className="min-h-screen bg-gray-50">
          <HomeHeader 
            user={mockUser}
            displayName={displayName}
            firstName={firstName}
          />
          
          <ErrorBoundary level="component">
            <SmartDatePlanner preselectedFriend={preselectedFriend} />
          </ErrorBoundary>
        </div>
      );
    }
    
    console.log('SmartDatePlanning - No user, showing loading spinner');
    return <LoadingSpinner />;
  }

  const { displayName, firstName } = userInfo;

  console.log('SmartDatePlanning - Rendering with user:', { displayName, firstName });

  return (
    <ErrorBoundary level="page">
      <div className="min-h-screen bg-gray-50">
        <HomeHeader 
          user={user}
          displayName={displayName}
          firstName={firstName}
        />
        
        <ErrorBoundary level="component">
          <SmartDatePlanner preselectedFriend={preselectedFriend} />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

export default SmartDatePlanning;
