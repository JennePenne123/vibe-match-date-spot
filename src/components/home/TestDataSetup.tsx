
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Users, MapPin, Settings } from 'lucide-react';
import { setupTestEnvironment } from '@/services/testDataService';

const TestDataSetup: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (process.env.NODE_ENV !== 'development' || !user) return null;

  const handleSetupTestData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await setupTestEnvironment(user.id);
      setSuccess(true);
      
      // Refresh the page after a short delay to see the changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Setup error:', err);
      setError('Failed to set up test data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <Sparkles className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          ✅ Test environment set up successfully! Page will refresh in 2 seconds...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Settings className="h-5 w-5" />
          Development Mode: Test AI Matching
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-blue-700">
          Set up test data to try the AI matching functionality:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-600">
            <Users className="h-3 w-3" />
            <span>3 Test Friends</span>
          </div>
          <div className="flex items-center gap-2 text-blue-600">
            <MapPin className="h-3 w-3" />
            <span>5 Test Venues</span>
          </div>
          <div className="flex items-center gap-2 text-blue-600">
            <Sparkles className="h-3 w-3" />
            <span>Your Preferences</span>
          </div>
        </div>

        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleSetupTestData}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          {loading ? 'Setting Up...' : 'Setup Test Data & Try AI Matching'}
          <Sparkles className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default TestDataSetup;
