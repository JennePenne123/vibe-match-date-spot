
import React from 'react';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import SmartDatePlanner from '@/components/SmartDatePlanner';
import HomeHeader from '@/components/HomeHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getUserName } from '@/utils/typeHelpers';

const SmartDatePlanning: React.FC = () => {
  const { user } = useAuthRedirect();

  // Memoize user display logic
  const userInfo = React.useMemo(() => {
    if (!user) return null;
    
    const displayName = getUserName(user);
    const firstName = displayName.split(' ')[0];
    
    return { displayName, firstName };
  }, [user]);

  if (!user || !userInfo) return <LoadingSpinner />;

  const { displayName, firstName } = userInfo;

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeHeader 
        user={user}
        displayName={displayName}
        firstName={firstName}
      />
      
      <SmartDatePlanner />
    </div>
  );
};

export default SmartDatePlanning;
