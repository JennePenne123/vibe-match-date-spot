
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Heart, Users, Clock, DollarSign, MapPin, Sparkles } from 'lucide-react';
import { useDatePlanning } from '@/hooks/useDatePlanning';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CollaborativePreferencesProps {
  sessionId: string;
  partnerId: string;
  onPreferencesUpdated: () => void;
}

interface Preferences {
  preferred_cuisines: string[];
  preferred_vibes: string[];
  preferred_price_range: string[];
  preferred_times: string[];
  max_distance: number;
  dietary_restrictions: string[];
}

const CollaborativePreferences: React.FC<CollaborativePreferencesProps> = ({
  sessionId,
  partnerId,
  onPreferencesUpdated
}) => {
  const { user } = useAuth();
  const { updateSessionPreferences, currentSession, loading } = useDatePlanning();
  
  const [preferences, setPreferences] = useState<Preferences>({
    preferred_cuisines: [],
    preferred_vibes: [],
    preferred_price_range: [],
    preferred_times: [],
    max_distance: 10,
    dietary_restrictions: []
  });
  
  const [partnerPreferences, setPartnerPreferences] = useState<Preferences | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Load existing preferences
  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  // Load partner preferences if they exist
  useEffect(() => {
    if (partnerId) {
      loadPartnerPreferences();
    }
  }, [partnerId]);

  const loadUserPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPreferences({
          preferred_cuisines: data.preferred_cuisines || [],
          preferred_vibes: data.preferred_vibes || [],
          preferred_price_range: data.preferred_price_range || [],
          preferred_times: data.preferred_times || [],
          max_distance: data.max_distance || 10,
          dietary_restrictions: data.dietary_restrictions || []
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadPartnerPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', partnerId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPartnerPreferences({
          preferred_cuisines: data.preferred_cuisines || [],
          preferred_vibes: data.preferred_vibes || [],
          preferred_price_range: data.preferred_price_range || [],
          preferred_times: data.preferred_times || [],
          max_distance: data.max_distance || 10,
          dietary_restrictions: data.dietary_restrictions || []
        });
      }
    } catch (error) {
      console.error('Error loading partner preferences:', error);
    }
  };

  const handlePreferenceChange = (category: keyof Preferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const toggleArrayPreference = (category: keyof Preferences, item: string) => {
    setPreferences(prev => {
      const currentArray = prev[category] as string[];
      const newArray = currentArray.includes(item)
        ? currentArray.filter(i => i !== item)
        : [...currentArray, item];
      
      return {
        ...prev,
        [category]: newArray
      };
    });
  };

  const submitPreferences = async () => {
    if (!user || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // First update user preferences
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      // Then update the session preferences (this triggers AI analysis)
      await updateSessionPreferences(sessionId, preferences);
      
      setHasSubmitted(true);
      
      // Trigger the callback to notify parent component
      setTimeout(() => {
        onPreferencesUpdated();
      }, 1000);
      
    } catch (error) {
      console.error('Error submitting preferences:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cuisineOptions = ['Italian', 'Japanese', 'Mexican', 'French', 'American', 'Indian', 'Thai', 'Chinese', 'Mediterranean'];
  const vibeOptions = ['romantic', 'casual', 'upscale', 'outdoor', 'quiet', 'lively', 'cozy', 'modern'];
  const priceOptions = ['$', '$$', '$$$', '$$$$'];
  const timeOptions = ['morning', 'lunch', 'afternoon', 'dinner', 'late night'];
  const dietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'halal', 'kosher'];

  const getSharedPreferences = (category: keyof Preferences) => {
    if (!partnerPreferences) return [];
    const userPrefs = preferences[category] as string[];
    const partnerPrefs = partnerPreferences[category] as string[];
    return userPrefs.filter(item => partnerPrefs.includes(item));
  };

  if (hasSubmitted && currentSession?.ai_compatibility_score) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">AI Analysis Complete!</h3>
          </div>
          <p className="text-green-700 mb-4">
            Your preferences have been analyzed and AI recommendations are ready.
          </p>
          <Badge className="bg-green-500 text-white">
            {currentSession.ai_compatibility_score}% Compatible
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Collaborative Preferences
          </CardTitle>
          <p className="text-sm text-gray-600">
            Share your preferences to get AI-powered venue recommendations
          </p>
        </CardHeader>
      </Card>

      {/* Cuisines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferred Cuisines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {cuisineOptions.map((cuisine) => {
              const isSelected = preferences.preferred_cuisines.includes(cuisine);
              const isShared = partnerPreferences && getSharedPreferences('preferred_cuisines').includes(cuisine);
              
              return (
                <div key={cuisine} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cuisine-${cuisine}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleArrayPreference('preferred_cuisines', cuisine)}
                  />
                  <Label htmlFor={`cuisine-${cuisine}`} className="text-sm">
                    {cuisine}
                    {isShared && <Heart className="inline h-3 w-3 ml-1 text-red-500" />}
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Vibes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferred Vibes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {vibeOptions.map((vibe) => {
              const isSelected = preferences.preferred_vibes.includes(vibe);
              const isShared = partnerPreferences && getSharedPreferences('preferred_vibes').includes(vibe);
              
              return (
                <div key={vibe} className="flex items-center space-x-2">
                  <Checkbox
                    id={`vibe-${vibe}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleArrayPreference('preferred_vibes', vibe)}
                  />
                  <Label htmlFor={`vibe-${vibe}`} className="text-sm capitalize">
                    {vibe}
                    {isShared && <Heart className="inline h-3 w-3 ml-1 text-red-500" />}
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Price Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {priceOptions.map((price) => {
              const isSelected = preferences.preferred_price_range.includes(price);
              const isShared = partnerPreferences && getSharedPreferences('preferred_price_range').includes(price);
              
              return (
                <div key={price} className="flex items-center space-x-2">
                  <Checkbox
                    id={`price-${price}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleArrayPreference('preferred_price_range', price)}
                  />
                  <Label htmlFor={`price-${price}`} className="text-sm">
                    {price}
                    {isShared && <Heart className="inline h-3 w-3 ml-1 text-red-500" />}
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Times */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Preferred Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {timeOptions.map((time) => {
              const isSelected = preferences.preferred_times.includes(time);
              const isShared = partnerPreferences && getSharedPreferences('preferred_times').includes(time);
              
              return (
                <div key={time} className="flex items-center space-x-2">
                  <Checkbox
                    id={`time-${time}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleArrayPreference('preferred_times', time)}
                  />
                  <Label htmlFor={`time-${time}`} className="text-sm capitalize">
                    {time}
                    {isShared && <Heart className="inline h-3 w-3 ml-1 text-red-500" />}
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Distance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Maximum Distance: {preferences.max_distance} miles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Slider
            value={[preferences.max_distance]}
            onValueChange={(value) => handlePreferenceChange('max_distance', value[0])}
            max={25}
            min={1}
            step={1}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Dietary Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dietary Restrictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {dietaryOptions.map((dietary) => {
              const isSelected = preferences.dietary_restrictions.includes(dietary);
              const isShared = partnerPreferences && getSharedPreferences('dietary_restrictions').includes(dietary);
              
              return (
                <div key={dietary} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dietary-${dietary}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleArrayPreference('dietary_restrictions', dietary)}
                  />
                  <Label htmlFor={`dietary-${dietary}`} className="text-sm capitalize">
                    {dietary}
                    {isShared && <Heart className="inline h-3 w-3 ml-1 text-red-500" />}
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Card>
        <CardContent className="p-6">
          <Button
            onClick={submitPreferences}
            disabled={isSubmitting || loading}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Preferences...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Submit & Get AI Recommendations
              </>
            )}
          </Button>
          
          {partnerPreferences && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              <Heart className="inline h-3 w-3 mr-1 text-red-500" />
              Heart icons show shared preferences with your partner
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CollaborativePreferences;
