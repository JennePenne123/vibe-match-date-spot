import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateJennePreferences, setupMainTestUsers } from '@/services/testData/preferences';

export const useTestDataSetup = () => {
  const { toast } = useToast();

  const setupSmartPlannerTestData = useCallback(async () => {
    try {
      console.log('🧪 Setting up Smart Planner test data...');
      
      // Update Jenne Penne's preferences for diverse testing
      await updateJennePreferences();
      
      // Setup all main test users with diverse preferences
      await setupMainTestUsers();
      
      toast({
        title: "Test Data Setup Complete",
        description: "Smart Planner is ready for testing with diverse user preferences",
      });
      
      console.log('✅ Smart Planner test data setup complete');
      return true;
    } catch (error) {
      console.error('❌ Error setting up test data:', error);
      
      toast({
        title: "Setup Failed",
        description: "Failed to setup test data. Check console for details.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [toast]);

  return {
    setupSmartPlannerTestData
  };
};
