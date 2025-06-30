
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Users, Clock, DollarSign, Utensils, Sparkles, MapPin } from 'lucide-react';

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

const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'Asian', 'American', 'Mediterranean', 'Indian', 'French', 'Japanese', 'Thai', 'Chinese'
];

const PRICE_OPTIONS = ['$', '$$', '$$$', '$$$$'];

const TIME_OPTIONS = [
  'Morning (8-11 AM)', 'Lunch (11 AM-2 PM)', 'Afternoon (2-5 PM)', 
  'Dinner (5-8 PM)', 'Evening (8-11 PM)', 'Late Night (11 PM+)'
];

const VIBE_OPTIONS = [
  'Romantic', 'Casual', 'Upscale', 'Cozy', 'Lively', 'Quiet', 'Outdoor', 'Modern', 'Traditional', 'Trendy'
];

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher'
];

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

  const getMatchingItems = (myItems: string[], partnerItems: string[]) => {
    return myItems.filter(item => partnerItems.includes(item));
  };

  const renderPreferenceSection = (
    title: string,
    icon: React.ReactNode,
    options: string[],
    key: keyof UserPreferences,
    isArray: boolean = true
  ) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
      
      {isArray ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {options.map((option) => {
            const myItems = myPreferences[key] as string[];
            const partnerItems = partnerPreferences?.[key] as string[] || [];
            const isSelected = myItems.includes(option);
            const isPartnerSelected = partnerItems.includes(option);
            const isMatching = isSelected && isPartnerSelected;

            return (
              <div key={option} className="relative">
                <div
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? isMatching
                        ? 'bg-green-50 border-green-300 text-green-800'
                        : 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => toggleArrayPreference(key, option)}
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={isSelected} />
                    <span className="text-sm">{option}</span>
                  </div>
                </div>
                
                {isMatching && (
                  <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 py-0">
                    Match!
                  </Badge>
                )}
                {isPartnerSelected && !isSelected && (
                  <Badge className="absolute -top-1 -right-1 bg-purple-100 text-purple-600 text-xs px-1 py-0">
                    Partner ♥
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          <Slider
            value={[myPreferences[key] as number]}
            onValueChange={(value) => updatePreference(key, value[0])}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1 mile</span>
            <span className="font-medium">{myPreferences[key]} miles</span>
            <span>50 miles</span>
          </div>
        </div>
      )}
    </div>
  );

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
          {renderPreferenceSection(
            'Cuisine Preferences',
            <Utensils className="h-4 w-4 text-orange-500" />,
            CUISINE_OPTIONS,
            'preferred_cuisines'
          )}

          <Separator />

          {renderPreferenceSection(
            'Price Range',
            <DollarSign className="h-4 w-4 text-green-500" />,
            PRICE_OPTIONS,
            'preferred_price_range'
          )}

          <Separator />

          {renderPreferenceSection(
            'Preferred Times',
            <Clock className="h-4 w-4 text-blue-500" />,
            TIME_OPTIONS,
            'preferred_times'
          )}

          <Separator />

          {renderPreferenceSection(
            'Atmosphere & Vibe',
            <Sparkles className="h-4 w-4 text-purple-500" />,
            VIBE_OPTIONS,
            'preferred_vibes'
          )}

          <Separator />

          {renderPreferenceSection(
            'Maximum Distance',
            <MapPin className="h-4 w-4 text-red-500" />,
            [],
            'max_distance',
            false
          )}

          <Separator />

          {renderPreferenceSection(
            'Dietary Restrictions',
            <Utensils className="h-4 w-4 text-yellow-500" />,
            DIETARY_OPTIONS,
            'dietary_restrictions'
          )}

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
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Compatibility Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {getMatchingItems(myPreferences.preferred_cuisines, partnerPreferences.preferred_cuisines).length}
                </div>
                <div className="text-xs text-green-700">Cuisine Matches</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {getMatchingItems(myPreferences.preferred_vibes, partnerPreferences.preferred_vibes).length}
                </div>
                <div className="text-xs text-green-700">Vibe Matches</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {getMatchingItems(myPreferences.preferred_times, partnerPreferences.preferred_times).length}
                </div>
                <div className="text-xs text-green-700">Time Matches</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {getMatchingItems(myPreferences.preferred_price_range, partnerPreferences.preferred_price_range).length}
                </div>
                <div className="text-xs text-green-700">Price Matches</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CollaborativePreferences;
