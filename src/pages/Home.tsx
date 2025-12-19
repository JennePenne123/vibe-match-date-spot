
import React from 'react';
import HomeHeader from '@/components/HomeHeader';
import HomeContent from '@/components/HomeContent';
import SkeletonLoader from '@/components/SkeletonLoader';
import { getUserName } from '@/utils/typeHelpers';
import { safeFirstWord } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/use-mobile';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const { isMobile } = useBreakpoint();

  // Refresh profile on mount to get latest avatar data
  React.useEffect(() => {
    if (user && !authLoading) {
      refreshProfile();
    }
  }, []);

  // Handle authentication redirect
  React.useEffect(() => {
    if (!authLoading && !user) {
      console.log('No authenticated user found, redirecting to login');
      navigate('/register-login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Memoize user display logic
  const userInfo = React.useMemo(() => {
    if (!user) return null;
    
    const displayName = getUserName(user);
    const firstName = safeFirstWord(displayName, 'User');
    
    return { displayName, firstName };
  }, [user]);

  // Early returns for loading and unauthenticated states
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className={isMobile ? "max-w-md mx-auto" : "max-w-none px-6"}>
          <SkeletonLoader variant="home-dashboard" />
        </div>
      </div>
    );
  }

  if (!user || !userInfo) {
    return (
      <div className="min-h-screen bg-background">
        <div className={isMobile ? "max-w-md mx-auto" : "max-w-none px-6"}>
          <SkeletonLoader variant="home-dashboard" />
        </div>
      </div>
    );
  }

  const { displayName, firstName } = userInfo;

  return (
    <div className="min-h-screen bg-background">
      <div className={isMobile ? "max-w-md mx-auto" : "max-w-none"}>
        {isMobile && (
          <HomeHeader 
            user={user} 
            displayName={displayName} 
            firstName={firstName} 
          />
        )}
        <HomeContent />
      </div>
    </div>
  );
};

export default Home;
