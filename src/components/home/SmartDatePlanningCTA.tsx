import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, Brain, ArrowRight, UserPlus } from 'lucide-react';
const SmartDatePlanningCTA: React.FC = () => {
  const navigate = useNavigate();

  const handleStartPlanning = () => {
    navigate('/plan-date');
  };

  return (
    <Button 
      onClick={handleStartPlanning} 
      size="lg" 
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
    >
      Start Smart Planning
      <ArrowRight className="h-4 w-4 ml-2" />
    </Button>
  );
};
export default SmartDatePlanningCTA;