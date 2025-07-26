import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users } from 'lucide-react';
import SmartDatePlanningCTA from '@/components/home/SmartDatePlanningCTA';
import RecentReceivedInvitationsCard from '@/components/home/RecentReceivedInvitationsCard';
import DateProposalsList from '@/components/date-planning/DateProposalsList';

import { useToast } from '@/hooks/use-toast';
const HomeContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const {
    friends
  } = useFriends();
  
  const handlePlanDate = () => {
    navigate('/plan-date');
  };
  const hasFriends = friends.length > 0;

  // Show success toast when returning from successful invitation sending
  useEffect(() => {
    if (location.state?.toastData) {
      const { title, description, duration } = location.state.toastData;
      toast({
        title,
        description,
        duration
      });
      // Clear the state to prevent showing the toast again
      navigate('/home', { replace: true, state: {} });
    }
  }, [location.state, toast, navigate]);

  return (
    <main className="p-6">
      <div className="max-w-md mx-auto space-y-6">
        <DateProposalsList />
        <RecentReceivedInvitationsCard />
        <SmartDatePlanningCTA />
      </div>
    </main>
  );
};
export default HomeContent;