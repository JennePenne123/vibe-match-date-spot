
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users } from 'lucide-react';
import SmartDatePlanningCTA from '@/components/home/SmartDatePlanningCTA';

const HomeContent: React.FC = () => {
  const navigate = useNavigate();
  const { friends } = useFriends();

  const handlePlanDate = () => {
    navigate('/plan-date');
  };

  const hasFriends = friends.length > 0;

  // Always show the Smart Date Planning CTA - it will handle the no friends case internally
  return (
    <main className="p-6">
      <div className="max-w-md mx-auto">
        <SmartDatePlanningCTA />
        
        {hasFriends && (
          <Card className="border-border bg-card mt-6">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Quick Plan</h2>
                  <p className="text-sm text-muted-foreground font-normal">Simple date planning</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-3 py-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {friends.length} friend{friends.length !== 1 ? 's' : ''} available
                </span>
              </div>
              
              <Button 
                onClick={handlePlanDate}
                className="w-full"
                size="lg"
                variant="outline"
              >
                Simple Planning
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
};

export default HomeContent;
