import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, RefreshCw } from 'lucide-react';

export const PreferencesReset: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const resetUserPreferences = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to reset preferences",
        variant: "destructive"
      });
      return;
    }

    setIsResetting(true);
    try {
      console.log('🔄 PREFERENCES RESET: Starting reset for user:', user.id);

      // Delete existing preferences
      const { error: deleteError } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Insert fresh default preferences
      const { error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          preferred_cuisines: ['italian', 'international'],
          preferred_price_range: ['$$', '$$$'],
          preferred_vibes: ['romantic', 'cozy'],
          dietary_restrictions: [],
          max_distance: 5000
        });

      if (insertError) throw insertError;

      console.log('✅ PREFERENCES RESET: Successfully reset preferences');
      toast({
        title: "Success",
        description: "Your preferences have been reset to defaults",
      });

    } catch (error) {
      console.error('❌ PREFERENCES RESET: Error:', error);
      toast({
        title: "Error",
        description: "Failed to reset preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const clearAllPreferences = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to clear preferences",
        variant: "destructive"
      });
      return;
    }

    setIsResetting(true);
    try {
      console.log('🔄 PREFERENCES CLEAR: Starting complete clear for user:', user.id);

      // Delete existing preferences
      const { error: deleteError } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Insert completely empty preferences
      const { error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          preferred_cuisines: [],
          preferred_price_range: [],
          preferred_vibes: [],
          preferred_times: [],
          dietary_restrictions: [],
          max_distance: null
        });

      if (insertError) throw insertError;

      console.log('✅ PREFERENCES CLEAR: Successfully cleared all preferences');
      toast({
        title: "Success",
        description: "All preferences have been completely cleared",
      });

    } catch (error) {
      console.error('❌ PREFERENCES CLEAR: Error:', error);
      toast({
        title: "Error",
        description: "Failed to clear preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const clearAllSessions = async () => {
    if (!user) return;

    setIsResetting(true);
    try {
      console.log('🔄 SESSION RESET: Clearing all sessions for user:', user.id);

      // Clear all planning sessions
      const { error } = await supabase
        .from('planning_sessions')
        .delete()
        .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`);

      if (error) throw error;

      console.log('✅ SESSION RESET: Successfully cleared sessions');
      toast({
        title: "Success",
        description: "All planning sessions have been cleared",
      });

    } catch (error) {
      console.error('❌ SESSION RESET: Error:', error);
      toast({
        title: "Error",
        description: "Failed to clear sessions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reset Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please log in to reset preferences.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Debug: Reset User Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Control your preferences to test different scenarios and eliminate cached state issues.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={resetUserPreferences}
              disabled={isResetting}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>

            <Button
              onClick={clearAllPreferences}
              disabled={isResetting}
              variant="outline"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Preferences
            </Button>

            <Button
              onClick={clearAllSessions}
              disabled={isResetting}
              variant="outline"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Sessions
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Reset to Defaults:</strong> Sets Italian/International cuisine defaults with standard preferences</p>
          <p><strong>Clear All Preferences:</strong> Completely empties all preference arrays (for testing no-preference scenarios)</p>
          <p><strong>Clear Sessions:</strong> Removes all your planning sessions to start fresh</p>
        </div>
      </CardContent>
    </Card>
  );
};