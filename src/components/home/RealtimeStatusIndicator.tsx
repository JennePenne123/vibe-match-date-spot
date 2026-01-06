
import React from 'react';

interface RealtimeStatusIndicatorProps {
  isLoading: boolean;
}

const RealtimeStatusIndicator: React.FC<RealtimeStatusIndicatorProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="flex items-center justify-center py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Real-time updates active</span>
      </div>
    </div>
  );
};

export default RealtimeStatusIndicator;