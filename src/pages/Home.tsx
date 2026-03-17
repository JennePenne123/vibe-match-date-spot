
import React from 'react';
import HomeHeader from '@/components/HomeHeader';
import HomeContent from '@/components/HomeContent';
import SkeletonLoader from '@/components/SkeletonLoader';
import { getUserName } from '@/utils/typeHelpers';
import { safeFirstWord } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/use-mobile';
import { hasMoodToday } from '@/pages/MoodCheckIn';
import { supabase } from '@/integrations/supabase/client';

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

  // Handle authentication redirect + mood check first, then onboarding
  React.useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) {
        console.log('No authenticated user found, redirecting to login');
        navigate('/?auth=required', { replace: true });
      }
      return;
    }

    // 1. Mood check first (quick emotional icebreaker)
    if (!hasMoodToday()) {
      navigate('/mood', { replace: true });
      return;
    }

    // 2. Then check if preferences are set (onboarding)
    const checkOnboarding = async () => {
      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('id, preferred_cuisines')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!data || !data.preferred_cuisines || data.preferred_cuisines.length === 0) {
          navigate('/preferences?onboarding=true', { replace: true });
        }
      } catch (error) {
        console.error('Error checking preferences:', error);
      }
    };

    checkOnboarding();
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
