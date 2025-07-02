
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { createOneMockFriend } from '@/services/testDataService';
import { useToast } from '@/hooks/use-toast';

interface DevelopmentControlsProps {
  showEmptyState: boolean;
  onToggleEmptyState: () => void;
}

const DevelopmentControls: React.FC<DevelopmentControlsProps> = ({
  showEmptyState,
  onToggleEmptyState
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  if (process.env.NODE_ENV !== 'development') return null;

  const handleAddMockFriend = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    try {
      await createOneMockFriend(user.id);
      toast({
        title: "Success",
        description: "Mock friend Sarah Johnson added! Refresh to see.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add mock friend",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex justify-center gap-2">
      <Button
        onClick={onToggleEmptyState}
        variant="outline"
        size="sm"
        className="text-xs text-gray-500 hover:text-gray-700"
        aria-label={showEmptyState ? 'Show invitations' : 'Test empty state'}
      >
        {showEmptyState ? 'Show Invites' : 'Test Empty State'}
      </Button>
      <Button
        onClick={handleAddMockFriend}
        variant="outline"
        size="sm"
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        Add Mock Friend
      </Button>
    </div>
  );
};

export default DevelopmentControls;
