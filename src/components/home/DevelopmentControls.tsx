
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { createOneMockFriend } from '@/services/testData';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';

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
  const { handleAsyncError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);
    console.log('Adding mock friend for user:', user.id);
    
    const result = await handleAsyncError(
      () => createOneMockFriend(user.id),
      {
        toastTitle: "Failed to add mock friend",
        toastDescription: "Check console for details",
        onError: (error) => {
          console.error('Mock friend creation failed:', error);
        }
      }
    );

    if (result) {
      toast({
        title: "Success",
        description: "Mock friend Sarah Johnson added! Refresh to see changes.",
      });
      console.log('Mock friend added successfully');
    }
    
    setIsLoading(false);
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
        disabled={isLoading}
      >
        {isLoading ? 'Adding...' : 'Add Mock Friend'}
      </Button>
    </div>
  );
};

export default DevelopmentControls;
