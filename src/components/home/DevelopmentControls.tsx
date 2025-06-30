
import React from 'react';
import { Button } from '@/components/ui/button';

interface DevelopmentControlsProps {
  showEmptyState: boolean;
  onToggleEmptyState: () => void;
}

const DevelopmentControls: React.FC<DevelopmentControlsProps> = ({
  showEmptyState,
  onToggleEmptyState
}) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="flex justify-center">
      <Button
        onClick={onToggleEmptyState}
        variant="outline"
        size="sm"
        className="text-xs text-gray-500 hover:text-gray-700"
        aria-label={showEmptyState ? 'Show invitations' : 'Test empty state'}
      >
        {showEmptyState ? 'Show Invites' : 'Test Empty State'}
      </Button>
    </div>
  );
};

export default DevelopmentControls;
