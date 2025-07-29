
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SmartDatePlanner from '@/components/SmartDatePlanner';
import HomeHeader from '@/components/HomeHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { getUserName } from '@/utils/typeHelpers';

const SmartDatePlanning: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Get pre-selected friend from navigation state
  const preselectedFriend = location.state?.preselectedFriend || null;

  console.log('SmartDatePlanning - Auth state:', { user: user?.id, loading });
  console.log('SmartDatePlanning - Preselected friend:', preselectedFriend);

  // Show loading spinner while auth is loading
  if (loading) {
    console.log('SmartDatePlanning - Auth loading, showing spinner');
    return <LoadingSpinner />;
  }

  // Redirect to login if no user
  if (!user) {
    console.log('SmartDatePlanning - No user, redirecting to login');
    return (
      <div className="min-h-screen bg-background p-layout-sm">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-heading-h1 font-heading-h1 text-foreground mb-component-lg">Authentication Required</h1>
          <p className="text-body-base text-muted-foreground mb-layout-sm">Please sign in to use the Smart Date Planner.</p>
          <button 
            onClick={() => window.location.href = '/register-login'}
            className="bg-primary text-primary-foreground px-layout-sm py-component-md rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Get user display info
  const userInfo = React.useMemo(() => {
    try {
      const displayName = getUserName(user);
      const firstName = displayName.split(' ')[0];
      
      return { displayName, firstName };
    } catch (error) {
      console.error('Error getting user name:', error);
      return { displayName: 'User', firstName: 'User' };
    }
  }, [user]);

  const { displayName, firstName } = userInfo;

  console.log('SmartDatePlanning - Rendering with user:', { displayName, firstName });

  return (
    <ErrorBoundary level="page">
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto">
          <HomeHeader 
            user={user}
            displayName={displayName}
            firstName={firstName}
          />
          
          <ErrorBoundary level="component">
            <SmartDatePlanner preselectedFriend={preselectedFriend} />
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SmartDatePlanning;
