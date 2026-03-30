
import React from 'react';
import HomeHeader from '@/components/HomeHeader';
import HomeContent from '@/components/HomeContent';
import SkeletonLoader from '@/components/SkeletonLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import { getUserName } from '@/utils/typeHelpers';
import { safeFirstWord } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/use-mobile';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { hasCompletedPreferenceSetup } from '@/utils/preferenceCompletion';
import { hasMoodToday } from '@/utils/moodStorage';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isMobile } = useBreakpoint();
  const { data: preferences, isLoading: prefsLoading } = useUserPreferences();
  const hasCheckedOnboarding = React.useRef(false);

  React.useEffect(() => {
    if (authLoading || prefsLoading) return;

    if (!user) {
      navigate('/?auth=required', { replace: true });
      return;
    }

    if (hasCheckedOnboarding.current) return;
    hasCheckedOnboarding.current = true;

    if (!hasMoodToday()) {
      navigate('/mood', { replace: true });
      return;
    }

    if (!hasCompletedPreferenceSetup(preferences as any)) {
      navigate('/preferences?onboarding=true', { replace: true });
    }
  }, [user, authLoading, prefsLoading, preferences, navigate]);

  const userInfo = React.useMemo(() => {
    if (!user) return null;
    const displayName = getUserName(user);
    const firstName = safeFirstWord(displayName, 'User');
    return { displayName, firstName };
  }, [user?.id, user?.name, user?.avatar_url]);

  if (authLoading || prefsLoading || !user || !userInfo) {
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
        <ErrorBoundary level="page">
          <HomeContent />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Home;
