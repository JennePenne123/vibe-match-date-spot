
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

interface PlanningHeaderProps {
  progress: number;
}

const PlanningHeader: React.FC<PlanningHeaderProps> = ({ progress }) => {
  return (
    <div className="text-center space-y-component-lg">
      <div className="flex items-center justify-center gap-component-xs">
        <Sparkles className="h-8 w-8 text-primary" />
        <h1 className="text-display-md font-display-md text-foreground">Smart Date Planner</h1>
      </div>
      <p className="text-body-base text-muted-foreground">
        AI-powered date planning with collaborative preferences and smart matching
      </p>
      
      {/* Progress Bar */}
      <div className="max-w-md mx-auto space-y-component-xs">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-caption text-muted-foreground">
          <span>Select Partner</span>
          <span>Set Preferences</span>
          <span>Review Matches</span>
          <span>Send Invitation</span>
        </div>
      </div>
    </div>
  );
};

export default PlanningHeader;
