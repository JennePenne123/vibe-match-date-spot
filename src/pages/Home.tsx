
import React from 'react';
import HomeHeader from '@/components/HomeHeader';
import HomeContent from '@/components/HomeContent';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getUserName } from '@/utils/typeHelpers';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/use-mobile';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const { isMobile } = useBreakpoint();

  // Handle authentication redirect
  React.useEffect(() => {
    const redirectTimer = setTimeout(() => {
      if (!authLoading && !user) {
        console.log('No authenticated user found, redirecting to login');
        navigate('/register-login', { replace: true });
      }
    }, 100);

    return () => clearTimeout(redirectTimer);
  }, [user, authLoading, navigate]);

  // Memoize user display logic
  const userInfo = React.useMemo(() => {
    if (!user) return null;
    
    const displayName = getUserName(user);
    const firstName = displayName.split(' ')[0];
    
    return { displayName, firstName };
  }, [user]);

  // Early returns for loading and unauthenticated states
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  if (!user || !userInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Redirecting to login...</p>
          <LoadingSpinner size="md" />
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
