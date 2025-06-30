
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Users, Clock, DollarSign, Utensils, Sparkles } from 'lucide-react';
import PreferenceSection from './preferences/PreferenceSection';
import DistanceSlider from './preferences/DistanceSlider';
import CompatibilitySummary from './preferences/CompatibilitySummary';
import {
  CUISINE_OPTIONS,
  PRICE_OPTIONS,
  TIME_OPTIONS,
  VIBE_OPTIONS,
  DIETARY_OPTIONS
} from './preferences/PreferenceConstants';

interface CollaborativePreferencesProps {
  sessionId: string;
  partnerId: string;
  onPreferencesUpdated?: () => void;
}

interface UserPreferences {
  preferred_cuisines: string[];
  preferred_price_range: string[];
  preferred_times: string[];
  preferred_vibes: string[];
  max_distance: number;
  dietary_restrictions: string[];
}

const CollaborativePreferences: React.FC<CollaborativePreferencesProps> = ({
  sessionId,
  partnerId,
  onPreferencesUpdated
}) => {
  const { user } = useAuth();
  const [myPreferences, setMyPreferences] = useState<UserPreferences>({
    preferred_cuisines: [],
    preferred_price_range: [],
    preferred_times: [],
    preferred_vibes: [],
    max_distance: 10,
    dietary_restrictions: []
  });
  
  const [partnerPreferences, setPartnerPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Load existing preferences
  useEffect(() => {
    loadPreferences();
    setupRealtimeSubscription();
  }, [sessionId]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      // Load user's existing preferences
      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userPrefs) {
        setMyPreferences({
          preferred_cuisines: userPrefs.preferred_cuisines || [],
          preferred_price_range: userPrefs.preferred_price_range || [],
          preferred_times: userPrefs.preferred_times || [],
          preferred_vibes: userPrefs.preferred_vibes || [],
          max_distance: userPrefs.max_distance || 10,
          dietary_restrictions: userPrefs.dietary_restrictions || []
        });
      }

      // Load partner's preferences
      const { data: partnerPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', partnerId)
        .maybeSingle();

      if (partnerPrefs) {
        setPartnerPreferences({
          preferred_cuisines: partnerPrefs.preferred_cuisines || [],
          preferred_price_range: partnerPrefs.preferred_price_range || [],
          preferred_times: partnerPrefs.preferred_times || [],
          preferred_vibes: partnerPrefs.preferred_vibes || [],
          max_distance: partnerPrefs.max_distance || 10,
          dietary_restrictions: partnerPrefs.dietary_restrictions || []
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`preferences-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'date_planning_sessions',
          filter: `id=eq.${sessionId}`,
        },
        () => {
          loadPreferences();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    setMyPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleArrayPreference = (key: keyof UserPreferences, value: string) => {
    setMyPreferences(prev => {
      const currentArray = prev[key] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [key]: newArray
      };
    });
  };

  const submitPreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Update user preferences
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...myPreferences
        });

      // Update planning session
      await supabase
        .from('date_planning_sessions')
        .update({
          preferences_data: {
            [user.id]: myPreferences,
            ...(partnerPreferences && { [partnerId]: partnerPreferences })
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      setHasSubmitted(true);
      onPreferencesUpdated?.();
    } catch (error) {
      console.error('Error submitting preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaborative Date Preferences
          </CardTitle>
          <p className="text-sm text-gray-600">
            Set your preferences and see how they match with your partner's choices
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <PreferenceSection
            title="Cuisine Preferences"
            icon={<Utensils className="h-4 w-4 text-orange-500" />}
            options={CUISINE_OPTIONS}
            selectedItems={myPreferences.preferred_cuisines}
            partnerItems={partnerPreferences?.preferred_cuisines || []}
            onToggle={(option) => toggleArrayPreference('preferred_cuisines', option)}
          />

          <Separator />

          <PreferenceSection
            title="Price Range"
            icon={<DollarSign className="h-4 w-4 text-green-500" />}
            options={PRICE_OPTIONS}
            selectedItems={myPreferences.preferred_price_range}
            partnerItems={partnerPreferences?.preferred_price_range || []}
            onToggle={(option) => toggleArrayPreference('preferred_price_range', option)}
          />

          <Separator />

          <PreferenceSection
            title="Preferred Times"
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            options={TIME_OPTIONS}
            selectedItems={myPreferences.preferred_times}
            partnerItems={partnerPreferences?.preferred_times || []}
            onToggle={(option) => toggleArrayPreference('preferred_times', option)}
          />

          <Separator />

          <PreferenceSection
            title="Atmosphere & Vibe"
            icon={<Sparkles className="h-4 w-4 text-purple-500" />}
            options={VIBE_OPTIONS}
            selectedItems={myPreferences.preferred_vibes}
            partnerItems={partnerPreferences?.preferred_vibes || []}
            onToggle={(option) => toggleArrayPreference('preferred_vibes', option)}
          />

          <Separator />

          <DistanceSlider
            value={myPreferences.max_distance}
            onChange={(value) => updatePreference('max_distance', value)}
          />

          <Separator />

          <PreferenceSection
            title="Dietary Restrictions"
            icon={<Utensils className="h-4 w-4 text-yellow-500" />}
            options={DIETARY_OPTIONS}
            selectedItems={myPreferences.dietary_restrictions}
            partnerItems={partnerPreferences?.dietary_restrictions || []}
            onToggle={(option) => toggleArrayPreference('dietary_restrictions', option)}
          />

          <div className="pt-4">
            <Button
              onClick={submitPreferences}
              disabled={loading || hasSubmitted}
              className="w-full"
              size="lg"
            >
              {loading ? 'Analyzing Compatibility...' : hasSubmitted ? 'Preferences Submitted' : 'Submit Preferences & Get AI Matches'}
              <Sparkles className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {partnerPreferences && (
        <CompatibilitySummary
          myPreferences={myPreferences}
          partnerPreferences={partnerPreferences}
        />
      )}
    </div>
  );
};

export default CollaborativePreferences;
