
import React, { useRef } from 'react';
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
  const hasRefreshedProfile = useRef(false);
  const hasCheckedOnboarding = useRef(false);

  // Refresh profile once on mount
  React.useEffect(() => {
    if (user && !authLoading && !hasRefreshedProfile.current) {
      hasRefreshedProfile.current = true;
      refreshProfile();
    }
  }, [user, authLoading]);

  // Handle authentication redirect + mood check + onboarding (run once)
  React.useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      console.log('No authenticated user found, redirecting to login');
      navigate('/?auth=required', { replace: true });
      return;
    }

    // Only check onboarding once per mount
    if (hasCheckedOnboarding.current) return;
    hasCheckedOnboarding.current = true;

    // 1. Mood check first
    if (!hasMoodToday()) {
      navigate('/mood', { replace: true });
      return;
    }

    // 2. Check if preferences are set (onboarding)
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
  }, [user?.id, user?.name, user?.avatar_url]);

  if (authLoading || !user || !userInfo) {
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
