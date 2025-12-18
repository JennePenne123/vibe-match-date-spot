import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  TEST_SCENARIOS, 
  applyTestScenario, 
  setupMainTestUsers, 
  resetToDefaultPreferences, 
  getTestUsers 
} from '@/services/testData/preferences';

export const TestDataControls: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const { toast } = useToast();

  if (process.env.NODE_ENV === 'production') return null;

  const handleApplyScenario = async () => {
    if (!selectedScenario) return;
    
    setLoading(true);
    try {
      const users = await getTestUsers();
      const janWiechmann = users.find(u => u.email === 'info@janwiechmann.de');
      const jennePenne = users.find(u => u.email === 'jennepenne123@gmail.com');
      
      if (!janWiechmann || !jennePenne) {
        throw new Error('Test users not found');
      }
      
      await applyTestScenario(
        selectedScenario as keyof typeof TEST_SCENARIOS, 
        janWiechmann.id, 
        jennePenne.id
      );
      
      toast({
        title: "Test scenario applied",
        description: `Applied "${selectedScenario}" scenario to Jan Wiechmann and Jenne Penne`,
      });
    } catch (error) {
      console.error('Error applying scenario:', error);
      toast({
        title: "Error",
        description: "Failed to apply test scenario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupMainUsers = async () => {
    setLoading(true);
    try {
      await setupMainTestUsers();
      toast({
        title: "Test users setup complete",
        description: "All main test users have been configured with diverse preferences",
      });
    } catch (error) {
      console.error('Error setting up users:', error);
      toast({
        title: "Error", 
        description: "Failed to setup test users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPreferences = async () => {
    setLoading(true);
    try {
      const users = await getTestUsers();
      await Promise.all(users.map(user => resetToDefaultPreferences(user.id)));
      
      toast({
        title: "Preferences reset",
        description: "All user preferences have been reset to defaults",
      });
    } catch (error) {
      console.error('Error resetting preferences:', error);
      toast({
        title: "Error",
        description: "Failed to reset preferences", 
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-blue-800">
          🧪 Smart Planner Test Data Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={handleSetupMainUsers} 
            disabled={loading}
            size="sm"
            className="w-full"
          >
            Setup Main Test Users
          </Button>
          <p className="text-xs text-gray-600">
            Configures Jan Wiechmann, Jenne Penne, and Jan W. with diverse preferences
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <Select value={selectedScenario} onValueChange={setSelectedScenario}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select test scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compatible">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Compatible</Badge>
                    <span>High compatibility</span>
                  </div>
                </SelectItem>
                <SelectItem value="incompatible">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-red-100 text-red-800">Incompatible</Badge>
                    <span>Low compatibility</span>
                  </div>
                </SelectItem>
                <SelectItem value="mixed">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Mixed</Badge>
                    <span>Partial overlap</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleApplyScenario}
              disabled={loading || !selectedScenario}
              size="sm"
            >
              Apply
            </Button>
          </div>
          <p className="text-xs text-gray-600">
            Apply predefined preference scenarios to test different compatibility levels
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Button 
            variant="outline" 
            onClick={handleResetPreferences}
            disabled={loading}
            size="sm"
            className="w-full"
          >
            Reset All Preferences
          </Button>
          <p className="text-xs text-gray-600">
            Reset all users to default preferences (useful for starting fresh)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};