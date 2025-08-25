import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';
import { Display, Text, Caption } from '@/design-system/components';

interface PlanningHeaderProps {
  progress: number;
  planningMode?: 'solo' | 'collaborative';
}

const PlanningHeader: React.FC<PlanningHeaderProps> = ({ progress, planningMode = 'solo' }) => {
  return (
    <div className="text-center space-y-6 animate-fade-in">
      <div className="flex items-center justify-center gap-3">
        <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        <Display size="lg" className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Smart Date Planner
        </Display>
      </div>
      <Text className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
        AI-powered date planning with collaborative preferences and smart matching
      </Text>
      
      {/* Progress Bar */}
      <div className="max-w-md mx-auto space-y-3">
        <Progress value={progress} className="h-3 animate-scale-in" />
        <div className="flex justify-between px-2">
          {planningMode === 'collaborative' ? (
            <>
              <Caption className={`tracking-tight transition-colors duration-300 ${progress >= 33 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                Both Set Preferences
              </Caption>
              <Caption className={`tracking-tight transition-colors duration-300 ${progress >= 66 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                AI Match Analysis
              </Caption>
              <Caption className={`tracking-tight transition-colors duration-300 ${progress >= 100 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                Plan Together
              </Caption>
            </>
          ) : (
            <>
              <Caption className={`tracking-tight transition-colors duration-300 ${progress >= 25 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                Select Partner
              </Caption>
              <Caption className={`tracking-tight transition-colors duration-300 ${progress >= 50 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                Set Preferences
              </Caption>
              <Caption className={`tracking-tight transition-colors duration-300 ${progress >= 75 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                AI Match Analysis
              </Caption>
              <Caption className={`tracking-tight transition-colors duration-300 ${progress >= 100 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                Send Invitation
              </Caption>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanningHeader;