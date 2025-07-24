
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Clock, Sparkles, Loader2, Check, DollarSign, MapPin, Coffee, Settings, CalendarIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import SafeComponent from '@/components/SafeComponent';

interface Preference {
  id: string;
  name: string;
  emoji: string;
  desc?: string;
}

interface UserPreferences {
  preferred_cuisines: string[];
  preferred_vibes: string[];
  preferred_price_range: string[];
  preferred_times: string[];
  max_distance: number;
  dietary_restrictions: string[];
}

interface PreferencesStepProps {
  sessionId: string;
  partnerId: string;
  partnerName: string;
  compatibilityScore: number | null;
  aiAnalyzing: boolean;
  onPreferencesComplete: (preferences: DatePreferences) => void;
}

interface DatePreferences {
  preferred_cuisines: string[];
  preferred_vibes: string[];
  preferred_price_range: string[];
  preferred_times: string[];
  max_distance: number;
  dietary_restrictions: string[];
  preferred_date?: Date;
  preferred_time?: string;
}

const PreferencesStep: React.FC<PreferencesStepProps> = ({
  sessionId,
  partnerId,
  partnerName,
  compatibilityScore,
  aiAnalyzing,
  onPreferencesComplete
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // State for all preferences
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string[]>([]);
  const [selectedTimePreferences, setSelectedTimePreferences] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState<number>(15);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [partnerPreferences, setPartnerPreferences] = useState<UserPreferences | null>(null);

  // Data definitions
  const cuisines: Preference[] = [
    { id: 'Italian', name: 'Italian', emoji: '🍝' },
    { id: 'Japanese', name: 'Japanese', emoji: '🍣' },
    { id: 'Mexican', name: 'Mexican', emoji: '🌮' },
    { id: 'French', name: 'French', emoji: '🥐' },
    { id: 'Indian', name: 'Indian', emoji: '🍛' },
    { id: 'Mediterranean', name: 'Mediterranean', emoji: '🫒' },
    { id: 'American', name: 'American', emoji: '🍔' },
    { id: 'Thai', name: 'Thai', emoji: '🍜' },
    { id: 'Chinese', name: 'Chinese', emoji: '🥢' },
    { id: 'Korean', name: 'Korean', emoji: '🍲' }
  ];

  const vibes: Preference[] = [
    { id: 'romantic', name: 'Romantic', emoji: '💕', desc: 'Intimate and cozy' },
    { id: 'casual', name: 'Casual', emoji: '😊', desc: 'Relaxed and comfortable' },
    { id: 'outdoor', name: 'Outdoor', emoji: '🌳', desc: 'Fresh air and nature' },
    { id: 'upscale', name: 'Upscale', emoji: '✨', desc: 'Elegant and refined' },
    { id: 'lively', name: 'Lively', emoji: '🎉', desc: 'Vibrant and energetic' },
    { id: 'cozy', name: 'Cozy', emoji: '🕯️', desc: 'Warm and intimate' }
  ];

  const priceRanges: Preference[] = [
    { id: '$', name: 'Budget', emoji: '💰', desc: 'Up to $15 per person' },
    { id: '$$', name: 'Moderate', emoji: '💳', desc: '$15-30 per person' },
    { id: '$$$', name: 'Upscale', emoji: '💎', desc: '$30-50 per person' },
    { id: '$$$$', name: 'Luxury', emoji: '👑', desc: 'Over $50 per person' }
  ];

  const timePreferences: Preference[] = [
    { id: 'morning', name: 'Morning', emoji: '🌅', desc: '9:00-12:00' },
    { id: 'lunch', name: 'Lunch', emoji: '☀️', desc: '12:00-15:00' },
    { id: 'afternoon', name: 'Afternoon', emoji: '🌤️', desc: '15:00-18:00' },
    { id: 'evening', name: 'Evening', emoji: '🌆', desc: '18:00-21:00' },
    { id: 'night', name: 'Night', emoji: '🌙', desc: 'After 21:00' }
  ];

  const dietaryRequirements: Preference[] = [
    { id: 'vegetarian', name: 'Vegetarian', emoji: '🥬' },
    { id: 'vegan', name: 'Vegan', emoji: '🌱' },
    { id: 'gluten-free', name: 'Gluten-Free', emoji: '🚫' },
    { id: 'dairy-free', name: 'Dairy-Free', emoji: '🥛' },
    { id: 'halal', name: 'Halal', emoji: '☪️' },
    { id: 'kosher', name: 'Kosher', emoji: '✡️' }
  ];

  // Load existing preferences
  useEffect(() => {
    loadUserPreferences();
    loadPartnerPreferences();
  }, [user?.id, partnerId]);

  const loadUserPreferences = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user preferences:', error);
        return;
      }

      if (data) {
        setSelectedCuisines(data.preferred_cuisines || []);
        setSelectedVibes(data.preferred_vibes || []);
        setSelectedPriceRange(data.preferred_price_range || []);
        setSelectedTimePreferences(data.preferred_times || []);
        setMaxDistance(data.max_distance || 15);
        setSelectedDietary(data.dietary_restrictions || []);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const loadPartnerPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', partnerId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading partner preferences:', error);
        return;
      }

      if (data) {
        setPartnerPreferences({
          preferred_cuisines: data.preferred_cuisines || [],
          preferred_vibes: data.preferred_vibes || [],
          preferred_price_range: data.preferred_price_range || [],
          preferred_times: data.preferred_times || [],
          max_distance: data.max_distance || 15,
          dietary_restrictions: data.dietary_restrictions || []
        });
      }
    } catch (error) {
      console.error('Error loading partner preferences:', error);
    }
  };

  // Toggle functions
  const toggleSelection = (item: string, selectedItems: string[], setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>) => {
    setSelectedItems(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const getSharedPreferences = (category: keyof UserPreferences): string[] => {
    if (!partnerPreferences) return [];
    
    const userItems = (() => {
      switch (category) {
        case 'preferred_cuisines': return selectedCuisines;
        case 'preferred_vibes': return selectedVibes;
        case 'preferred_price_range': return selectedPriceRange;
        case 'preferred_times': return selectedTimePreferences;
        case 'dietary_restrictions': return selectedDietary;
        default: return [];
      }
    })();

    return userItems.filter(item => 
      Array.isArray(partnerPreferences[category]) && 
      (partnerPreferences[category] as string[]).includes(item)
    );
  };

  const submitPreferences = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Update user preferences using upsert with conflict resolution
      const { error: prefError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferred_cuisines: selectedCuisines,
          preferred_vibes: selectedVibes,
          preferred_price_range: selectedPriceRange,
          preferred_times: selectedTimePreferences,
          max_distance: maxDistance,
          dietary_restrictions: selectedDietary,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (prefError) {
        console.error('Error saving user preferences:', prefError);
        throw prefError;
      }

      toast({
        title: "Preferences saved!",
        description: "Starting AI analysis to find perfect venues...",
      });

      // Pass preferences to parent component for AI analysis
      const preferences: DatePreferences = {
        preferred_cuisines: selectedCuisines,
        preferred_vibes: selectedVibes,
        preferred_price_range: selectedPriceRange,
        preferred_times: selectedTimePreferences,
        max_distance: maxDistance,
        dietary_restrictions: selectedDietary,
        preferred_date: selectedDate,
        preferred_time: selectedTime
      };

      onPreferencesComplete(preferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Food & Vibe';
      case 2: return 'Budget & Timing';
      case 3: return 'Distance & Diet';
      case 4: return 'Review & Submit';
      default: return 'Preferences';
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 1: return <Heart className="w-5 h-5" />;
      case 2: return <DollarSign className="w-5 h-5" />;
      case 3: return <MapPin className="w-5 h-5" />;
      case 4: return <Check className="w-5 h-5" />;
      default: return <Heart className="w-5 h-5" />;
    }
  };

  const renderPreferenceGrid = (
    items: Preference[], 
    selectedItems: string[], 
    setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>,
    category: keyof UserPreferences,
    gridCols = "grid-cols-2"
  ) => {
    const sharedItems = getSharedPreferences(category);

    return (
      <div className={`grid ${gridCols} gap-3`}>
        {items.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          const isShared = sharedItems.includes(item.id);

          return (
            <button
              key={item.id}
              onClick={() => toggleSelection(item.id, selectedItems, setSelectedItems)}
              className={`p-4 rounded-xl border-2 transition-all relative ${
                isSelected
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-foreground hover:bg-muted'
              }`}
            >
              <div className="text-2xl mb-1">{item.emoji}</div>
              <div className="font-medium text-sm">{item.name}</div>
              {item.desc && (
                <div className={`text-xs mt-1 ${isSelected ? 'text-primary/70' : 'text-muted-foreground'}`}>
                  {item.desc}
                </div>
              )}
              {isSelected && (
                <Check className="w-4 h-4 absolute top-2 right-2" />
              )}
              {isShared && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full text-xs px-1">
                  Match!
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderStep1 = () => (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">What are you craving?</h2>
        <p className="text-muted-foreground mb-6">Choose your favorite cuisines</p>
        {renderPreferenceGrid(cuisines, selectedCuisines, setSelectedCuisines, 'preferred_cuisines')}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">What vibe are you going for?</h2>
        <p className="text-muted-foreground mb-6">Choose the perfect atmosphere for your date</p>
        {renderPreferenceGrid(vibes, selectedVibes, setSelectedVibes, 'preferred_vibes', 'grid-cols-1')}
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">What's your budget?</h2>
        <p className="text-muted-foreground mb-6">Select your preferred price range</p>
        {renderPreferenceGrid(priceRanges, selectedPriceRange, setSelectedPriceRange, 'preferred_price_range', 'grid-cols-1')}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">When works best?</h2>
        <p className="text-muted-foreground mb-6">Choose your preferred timing</p>
        {renderPreferenceGrid(timePreferences, selectedTimePreferences, setSelectedTimePreferences, 'preferred_times')}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Specific Date & Time</h2>
        <p className="text-muted-foreground mb-6">When would you like to go on this date?</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Preferred Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Preferred Time</label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9:00">9:00 AM</SelectItem>
                <SelectItem value="10:00">10:00 AM</SelectItem>
                <SelectItem value="11:00">11:00 AM</SelectItem>
                <SelectItem value="12:00">12:00 PM</SelectItem>
                <SelectItem value="13:00">1:00 PM</SelectItem>
                <SelectItem value="14:00">2:00 PM</SelectItem>
                <SelectItem value="15:00">3:00 PM</SelectItem>
                <SelectItem value="16:00">4:00 PM</SelectItem>
                <SelectItem value="17:00">5:00 PM</SelectItem>
                <SelectItem value="18:00">6:00 PM</SelectItem>
                <SelectItem value="19:00">7:00 PM</SelectItem>
                <SelectItem value="20:00">8:00 PM</SelectItem>
                <SelectItem value="21:00">9:00 PM</SelectItem>
                <SelectItem value="22:00">10:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Maximum Distance</h2>
        <p className="text-muted-foreground mb-6">How far are you willing to travel?</p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Maximum Distance</h3>
          </div>
          <div className="space-y-2">
            <Slider
              value={[maxDistance]}
              onValueChange={(value) => setMaxDistance(value[0])}
              max={50}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 mile</span>
              <span className="font-medium">{maxDistance} miles</span>
              <span>50 miles</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Dietary Requirements</h2>
        <p className="text-muted-foreground mb-6">Any dietary restrictions or preferences?</p>
        {renderPreferenceGrid(dietaryRequirements, selectedDietary, setSelectedDietary, 'dietary_restrictions')}
      </div>
    </>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Review Your Preferences</h2>
        <p className="text-muted-foreground">Make sure everything looks good before submitting</p>
      </div>

      <div className="grid gap-4">
        {selectedCuisines.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Cuisines</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCuisines.map(cuisine => (
                  <Badge key={cuisine} variant="secondary">{cuisine}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedVibes.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Vibes</h3>
              <div className="flex flex-wrap gap-2">
                {selectedVibes.map(vibe => (
                  <Badge key={vibe} variant="secondary">{vibe}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedPriceRange.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Price Range</h3>
              <div className="flex flex-wrap gap-2">
                {selectedPriceRange.map(price => (
                  <Badge key={price} variant="secondary">{price}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTimePreferences.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Times</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTimePreferences.map(time => (
                  <Badge key={time} variant="secondary">{time}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Maximum Distance</h3>
            <Badge variant="secondary">{maxDistance} miles</Badge>
          </CardContent>
        </Card>

        {selectedDietary.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Dietary Requirements</h3>
              <div className="flex flex-wrap gap-2">
                {selectedDietary.map(diet => (
                  <Badge key={diet} variant="secondary">{diet}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {(selectedDate || selectedTime) && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Preferred Date & Time</h3>
              <div className="space-y-2">
                {selectedDate && (
                  <Badge variant="secondary">📅 {format(selectedDate, "PPP")}</Badge>
                )}
                {selectedTime && (
                  <Badge variant="secondary">🕐 {selectedTime}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Planning Date with {partnerName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              Session expires in 24h
            </Badge>
            {compatibilityScore !== null && (
              <Badge className="bg-purple-100 text-purple-700">
                <Sparkles className="h-3 w-3 mr-1" />
                {compatibilityScore}% Compatible
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {aiAnalyzing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              <h3 className="text-lg font-semibold text-blue-800">AI Analysis in Progress</h3>
            </div>
            <p className="text-blue-700">
              Analyzing compatibility and finding perfect venues...
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStepIcon()}
              {getStepTitle()}
            </CardTitle>
            <Badge variant="outline">
              Step {currentStep} of {totalSteps}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          <div className="flex justify-between pt-6">
            <Button
              onClick={prevStep}
              variant="outline"
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < totalSteps ? (
              <Button onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button onClick={submitPreferences} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Send Invite'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreferencesStep;
