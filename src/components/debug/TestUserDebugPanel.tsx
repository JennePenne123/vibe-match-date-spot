import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { clearAllTestUsersData, isTestUser } from '@/services/testUserService';
import { validateSessionPreferences, resetSessionToCleanState } from '@/services/sessionValidationService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

const TestUserDebugPanel: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleClearAllTestUsers = async () => {
    try {
      await clearAllTestUsersData();
      toast({
        title: "Test Users Cleared",
        description: "All test user data has been completely cleared",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear test user data",
        variant: "destructive"
      });
    }
  };

  const handleValidateCurrentSessions = async () => {
    try {
      // This would need session ID - for now just show the function exists
      toast({
        title: "Validation Available",
        description: "Session validation service is ready for use",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate sessions",
        variant: "destructive"
      });
    }
  };

  // Only show for test users
  if (!user || !isTestUser(user.email)) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700">
          <AlertTriangle className="h-5 w-5" />
          Test User Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-yellow-600">
          Debug tools for test users to ensure clean testing environment
        </p>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleClearAllTestUsers}
            variant="destructive"
            size="sm"
            className="gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Clear All Test Data
          </Button>
          
          <Button
            onClick={handleValidateCurrentSessions}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Validate Sessions
          </Button>
        </div>

        <div className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
          <strong>Note:</strong> This panel only appears for test users (info@janwiechmann.de, janwiechmann@hotmail.com).
          These tools help ensure each test session starts with completely clean preferences.
        </div>
      </CardContent>
    </Card>
  );
};

export default TestUserDebugPanel;