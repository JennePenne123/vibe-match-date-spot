import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, User } from 'lucide-react';

interface PlanningModeSelectorProps {
  onModeSelect: (mode: 'solo' | 'collaborative') => void;
  selectedFriendName?: string;
}

const PlanningModeSelector: React.FC<PlanningModeSelectorProps> = ({
  onModeSelect,
  selectedFriendName
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Choose Planning Mode</h2>
        <p className="text-muted-foreground">
          How would you like to plan your date{selectedFriendName ? ` with ${selectedFriendName}` : ''}?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => onModeSelect('solo')}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Solo Planning</CardTitle>
            <CardDescription>
              Plan the date yourself and send an invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li>• You set all preferences</li>
              <li>• AI generates recommendations</li>
              <li>• Send invitation with venue</li>
              <li>• Quick and simple process</li>
            </ul>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => onModeSelect('solo')}
            >
              Plan Solo
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => onModeSelect('collaborative')}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-secondary/10">
              <Users className="h-8 w-8 text-secondary" />
            </div>
            <CardTitle>Collaborative Planning</CardTitle>
            <CardDescription>
              Plan together with your friend's input
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li>• Both set preferences</li>
              <li>• AI considers both inputs</li>
              <li>• Mutual venue selection</li>
              <li>• Better compatibility</li>
            </ul>
            <Button 
              className="w-full" 
              variant="default"
              onClick={() => onModeSelect('collaborative')}
            >
              Plan Together
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlanningModeSelector;