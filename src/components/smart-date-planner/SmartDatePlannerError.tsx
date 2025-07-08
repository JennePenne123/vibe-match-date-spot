import React from 'react';
import { Button } from '@/components/ui/button';

interface SmartDatePlannerErrorProps {
  friendsError: any;
  datePlanningError: any;
  planningStepsError: any;
  onBackToHome: () => void;
}

const SmartDatePlannerError: React.FC<SmartDatePlannerErrorProps> = ({
  friendsError,
  datePlanningError,
  planningStepsError,
  onBackToHome
}) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Error</h1>
        <p className="text-gray-600 mb-6">
          There was an error loading the Smart Date Planner. Please try refreshing the page.
        </p>
        <div className="text-sm text-red-600 mb-4">
          {friendsError && <div>Friends Error: {friendsError.message}</div>}
          {datePlanningError && <div>Date Planning Error: {datePlanningError.message}</div>}
          {planningStepsError && <div>Planning Steps Error: {planningStepsError.message}</div>}
        </div>
        <Button onClick={onBackToHome}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default SmartDatePlannerError;