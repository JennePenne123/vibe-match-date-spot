import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useDatePlanning } from '@/hooks/useDatePlanning';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';

const InvitationTestButton: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const userLocation = {
    latitude: 37.7749,
    longitude: -122.4194,
    address: "San Francisco, CA"
  };
  
  const { completePlanningSession } = useDatePlanning(userLocation);

  const testInvitationFlow = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please sign in to test invitations'
      });
      return;
    }

    setTesting(true);
    setTestResults([]);
    const results: string[] = [];
    
    try {
      results.push('🚀 Starting invitation test...');
      results.push(`✅ User authenticated: ${user.email}`);
      
      // Test with mock data
      const mockSessionId = 'test-session-' + Date.now();
      const mockVenueId = 'test-venue-123';
      const mockMessage = 'Test invitation message for debugging purposes';
      
      results.push(`📝 Test data prepared: Session ${mockSessionId}, Venue ${mockVenueId}`);
      setTestResults([...results]);
      
      // This will test the validation and error handling
      const success = await completePlanningSession(
        mockSessionId,
        mockVenueId,
        mockMessage
      );
      
      if (success) {
        results.push('✅ Test completed successfully!');
        toast({
          title: 'Test Successful',
          description: 'Invitation flow validation passed'
        });
      } else {
        results.push('❌ Test failed - check console for details');
        toast({
          variant: 'destructive',
          title: 'Test Failed',
          description: 'Check console logs for error details'
        });
      }
    } catch (error) {
      results.push(`❌ Test error: ${error.message}`);
      console.error('Invitation test error:', error);
      toast({
        variant: 'destructive',
        title: 'Test Error',
        description: error.message
      });
    } finally {
      setTestResults(results);
      setTesting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          Test Invitation Flow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testInvitationFlow}
          disabled={testing}
          variant="outline"
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Test Invitation Validation
            </>
          )}
        </Button>
        
        {testResults.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="font-medium mb-2">Test Results:</h4>
            <div className="space-y-1 text-sm font-mono">
              {testResults.map((result, index) => (
                <div key={index} className="text-gray-700">{result}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvitationTestButton;