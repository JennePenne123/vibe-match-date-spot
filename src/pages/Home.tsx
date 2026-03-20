
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
import { hasCompletedPreferenceSetup } from '@/utils/preferenceCompletion';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const { isMobile } = useBreakpoint();
  const hasRefreshedProfile = useRef(false);
  const hasCheckedOnboarding = useRef(false);

  React.useEffect(() => {
    if (user && !authLoading && !hasRefreshedProfile.current) {
      hasRefreshedProfile.current = true;
      refreshProfile();
    }
  }, [user, authLoading, refreshProfile]);

  React.useEffect(() => {
    if (authLoading) return;

    if (!user) {
      console.log('No authenticated user found, redirecting to login');
      navigate('/?auth=required', { replace: true });
      return;
    }

    if (hasCheckedOnboarding.current) return;
    hasCheckedOnboarding.current = true;

    // Check mood first, then onboarding
    if (!hasMoodToday()) {
      navigate('/mood', { replace: true });
      return;
    }


    const checkOnboarding = async () => {
      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('home_address, home_latitude, home_longitude, preferred_cuisines, preferred_vibes, preferred_price_range, preferred_times, dietary_restrictions, preferred_activities, preferred_entertainment, preferred_duration, accessibility_needs, preferred_venue_types, personality_traits, relationship_goal')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!hasCompletedPreferenceSetup(data)) {
          navigate('/preferences?onboarding=true', { replace: true });
        }
      } catch (error) {
        console.error('Error checking preferences:', error);
      }
    };

    void checkOnboarding();
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
