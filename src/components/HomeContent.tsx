import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users } from 'lucide-react';
import SmartDatePlanningCTA from '@/components/home/SmartDatePlanningCTA';
const HomeContent: React.FC = () => {
  const navigate = useNavigate();
  const {
    friends
  } = useFriends();
  const handlePlanDate = () => {
    navigate('/plan-date');
  };
  const hasFriends = friends.length > 0;

  // Always show the Smart Date Planning CTA - it will handle the no friends case internally
  return <main className="p-6">
      <div className="max-w-md mx-auto">
        <SmartDatePlanningCTA />
        
        {hasFriends}
      </div>
    </main>;
};
export default HomeContent;