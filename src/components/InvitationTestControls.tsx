import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvitations } from '@/hooks/useInvitations';
import { useToast } from '@/hooks/use-toast';
import { TestTube, UserPlus, Calendar, MapPin } from 'lucide-react';

const InvitationTestControls: React.FC = () => {
  const { createTestInvitation } = useInvitations();
  const { toast } = useToast();

  const handleCreateTestInvitation = async () => {
    const success = await createTestInvitation();
    if (success) {
      toast({
        title: "Test Invitation Created! 🧪",
        description: "A sample date invitation has been added for testing the complete flow",
        duration: 4000,
      });
    } else {
      toast({
        title: "Cannot Create Test Invitation",
        description: "Ensure you have friends and venues in the database first",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="border-dashed border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <TestTube className="h-5 w-5" />
          Invitation Testing Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-amber-700 mb-4">
          Test the complete smart invitation flow with sample data
        </p>
        
        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={handleCreateTestInvitation}
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Create Test Invitation
          </Button>
        </div>

        <div className="text-xs text-amber-600 mt-3 space-y-1">
          <p>• Creates a pending invitation from a friend</p>
          <p>• Includes AI compatibility score & reasoning</p>
          <p>• Linked to an existing venue</p>
          <p>• Test accept/decline responses</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvitationTestControls;