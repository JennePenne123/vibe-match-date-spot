
import React from 'react';
import HomeHeader from '@/components/HomeHeader';
import HomeContent from '@/components/HomeContent';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getUserName } from '@/utils/typeHelpers';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { VenueAPITester } from '@/components/debug/VenueAPITester';
import { TestDataControls } from '@/components/debug/TestDataControls';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

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

  const { displayName, firstName } = userInfo;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <HomeHeader 
          user={user} 
          displayName={displayName} 
          firstName={firstName} 
        />
        <HomeContent />
      </div>
      
      {/* Debug Components - Remove after testing */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        <TestDataControls />
        <VenueAPITester />
      </div>
    </div>
  );
};

export default Home;
