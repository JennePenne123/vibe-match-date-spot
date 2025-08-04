
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';
import { Display, Text, Caption } from '@/design-system/components';

interface PlanningHeaderProps {
  progress: number;
}

const PlanningHeader: React.FC<PlanningHeaderProps> = ({ progress }) => {
  return (
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="h-8 w-8 text-primary" />
        <Display size="lg">Smart Date Planner</Display>
      </div>
      <Text className="text-muted-foreground">
        AI-powered date planning with collaborative preferences and smart matching
      </Text>
      
      {/* Progress Bar */}
      <div className="max-w-md mx-auto space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          <Caption className="text-muted-foreground">Select Partner</Caption>
          <Caption className="text-muted-foreground">Set Preferences</Caption>
          <Caption className="text-muted-foreground">Review Matches</Caption>
          <Caption className="text-muted-foreground">Send Invitation</Caption>
        </div>
      </div>
    </div>
  );
};

export default PlanningHeader;
