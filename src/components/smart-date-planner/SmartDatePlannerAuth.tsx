import React from 'react';
import { Button } from '@/components/ui/button';

interface SmartDatePlannerAuthProps {
  onSignIn: () => void;
}

const SmartDatePlannerAuth: React.FC<SmartDatePlannerAuthProps> = ({ onSignIn }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
        <p className="text-gray-600 mb-6">Please sign in to use the Smart Date Planner.</p>
        <Button onClick={onSignIn}>
          Sign In
        </Button>
      </div>
    </div>
  );
};

export default SmartDatePlannerAuth;