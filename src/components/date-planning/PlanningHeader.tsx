
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

interface PlanningHeaderProps {
  progress: number;
}

const PlanningHeader: React.FC<PlanningHeaderProps> = ({ progress }) => {
  return (
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="h-8 w-8 text-purple-500" />
        <h1 className="text-3xl font-bold text-gray-900">Smart Date Planner</h1>
      </div>
      <p className="text-gray-600">
        AI-powered date planning with collaborative preferences and smart matching
      </p>
      
      {/* Progress Bar */}
      <div className="max-w-md mx-auto space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-gray-500">
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
