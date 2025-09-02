
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Clock, Sparkles, Loader2, Check, DollarSign, MapPin, Coffee, Settings, CalendarIcon, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import SafeComponent from '@/components/SafeComponent';
import CollaborativeWaitingState from '@/components/date-planning/CollaborativeWaitingState';

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

interface CompatibilityScore {
  overall_score: number;
  cuisine_score: number;
  vibe_score: number;
  price_score: number;
  timing_score: number;
  compatibility_factors: string[];
}

interface PreferencesStepProps {
  sessionId: string;
  partnerId: string;
  partnerName: string;
  compatibilityScore: CompatibilityScore | number | null;
  aiAnalyzing: boolean;
  onPreferencesComplete: (preferences: DatePreferences) => void;
  initialProposedDate?: string; // ISO string from proposal, optional
  planningMode?: 'solo' | 'collaborative';
  collaborativeSession?: {
    hasUserSetPreferences: boolean;
    hasPartnerSetPreferences: boolean;
    canShowResults: boolean;
  };
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
  onPreferencesComplete,
  initialProposedDate,
  planningMode = 'solo',
  collaborativeSession
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

// Prefill date & time from proposal when provided
useEffect(() => {
  if (initialProposedDate) {
    const dt = new Date(initialProposedDate);
    if (!isNaN(dt.getTime())) {
      setSelectedDate((prev) => prev ?? dt);
      const hhmm = format(dt, 'H:mm');
      setSelectedTime((prev) => prev || hhmm);
    }
  }
}, [initialProposedDate]);

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

  const quickStartTemplates = [
    {
      id: 'romantic-dinner',
      title: 'Romantic Dinner',
      emoji: '💕',
      description: 'Candlelight, fine dining, intimate atmosphere',
      cuisines: ['Italian', 'French'],
      vibes: ['romantic', 'upscale'],
      priceRange: ['$$$', '$$$$'],
      timePreferences: ['evening']
    },
    {
      id: 'casual-brunch',
      title: 'Casual Brunch',
      emoji: '☕',
      description: 'Relaxed, tasty, social',
      cuisines: ['American', 'Mediterranean'],
      vibes: ['casual', 'cozy'],
      priceRange: ['$', '$$'],
      timePreferences: ['morning', 'lunch']
    },
    {
      id: 'trendy-cocktail',
      title: 'Trendy Cocktail Bar',
      emoji: '🍸',
      description: 'Hip, stylish, perfect for drinks',
      cuisines: ['American'],
      vibes: ['lively', 'upscale'],
      priceRange: ['$$', '$$$'],
      timePreferences: ['evening', 'night']
    }
  ];

  // Load partner preferences for compatibility
  useEffect(() => {
    loadPartnerPreferences();
  }, [user?.id, partnerId]);

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

  const applyQuickStartTemplate = (template: typeof quickStartTemplates[0]) => {
    setSelectedCuisines(template.cuisines);
    setSelectedVibes(template.vibes);
    setSelectedPriceRange(template.priceRange);
    setSelectedTimePreferences(template.timePreferences);
    
    toast({
      title: `${template.title} template applied!`,
      description: "You can still customize your preferences.",
    });
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

      // Update session flags for collaborative mode
      if (planningMode === 'collaborative' && sessionId) {
        // First get session to determine if current user is initiator
        const { data: sessionData } = await supabase
          .from('date_planning_sessions')
          .select('initiator_id')
          .eq('id', sessionId)
          .single();
        
        if (sessionData) {
          const isInitiator = sessionData.initiator_id === user.id;
          const updateField = isInitiator ? 'initiator_preferences_complete' : 'partner_preferences_complete';
          const preferencesJsonField = isInitiator ? 'initiator_preferences' : 'partner_preferences';
          
          // Create the preferences JSON object
          const preferencesData = {
            preferred_cuisines: selectedCuisines,
            preferred_vibes: selectedVibes,
            preferred_price_range: selectedPriceRange,
            preferred_times: selectedTimePreferences,
            max_distance: maxDistance,
            dietary_restrictions: selectedDietary
          };
          
          const { error: sessionError } = await supabase
            .from('date_planning_sessions')
            .update({
              [updateField]: true,
              [preferencesJsonField]: preferencesData,
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);

          if (sessionError) {
            console.error('Error updating session flags:', sessionError);
          } else {
            console.log(`✅ Session ${updateField} flag and ${preferencesJsonField} data updated successfully`);
            console.log('🔧 PREFERENCES FIXED: Updated session with both completion flag and JSON data:', {
              updateField,
              preferencesJsonField,
              preferencesData
            });
          }
        }
      }

      // Show appropriate toast based on planning mode and collaborative session
      if (planningMode === 'collaborative' && collaborativeSession) {
        const { hasPartnerSetPreferences } = collaborativeSession;
        
        if (!hasPartnerSetPreferences) {
          toast({
            title: "Preferences saved!",
            description: `Waiting for ${partnerName} to set their preferences...`,
          });
        } else {
          toast({
            title: "Preferences saved!",
            description: "Starting AI analysis to find perfect venues...",
          });
        }
      } else {
        toast({
          title: "Preferences saved!",
          description: "Starting AI analysis to find perfect venues...",
        });
      }

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

  // Validation function for step 2 (allow proceed if proposal prefilled)
  const canProceedFromStep2 = () => {
    return Boolean(initialProposedDate) || (Boolean(selectedDate) && Boolean(selectedTime));
  };

  const nextStep = () => {
    // Validate step 2 before proceeding
    if (currentStep === 2 && !canProceedFromStep2()) {
      toast({
        title: "Date and Time Required",
        description: "Please select both a preferred date and time to continue.",
        variant: "destructive"
      });
      return;
    }

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
    // Only show matches in collaborative mode when partner has set preferences
    const shouldShowMatches = planningMode === 'collaborative' && 
                             collaborativeSession?.hasPartnerSetPreferences;
    const sharedItems = shouldShowMatches ? getSharedPreferences(category) : [];

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
      {/* Quick Start Section */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2">Quick Start</h2>
        <p className="text-muted-foreground mb-4">Or choose a ready-made template</p>
        <div className="grid grid-cols-1 gap-3">
          {quickStartTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => applyQuickStartTemplate(template)}
              className="p-4 rounded-lg border border-border text-left transition-all hover:bg-muted hover:border-primary/20"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{template.emoji}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{template.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

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
        <h2 className="text-2xl font-bold mb-2">{initialProposedDate ? 'Proposed Date & Time (adjustable)' : 'Specific Date & Time'}</h2>
        <p className="text-muted-foreground mb-6">{initialProposedDate ? 'Pre-filled from the proposal. You can adjust below.' : 'When would you like to go on this date?'}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Preferred Date { !initialProposedDate && (<span className="text-destructive">*</span>) }
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    (!selectedDate && !initialProposedDate) && "text-muted-foreground border-destructive/50"
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
            {(!selectedDate && !initialProposedDate) && (
              <p className="text-sm text-destructive">Date is required to continue</p>
            )}
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Preferred Time { !initialProposedDate && (<span className="text-destructive">*</span>) }
            </label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className={cn(
                "w-full",
                (!selectedTime && !initialProposedDate) && "border-destructive/50"
              )}>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {initialProposedDate && (() => {
                  const dt = new Date(initialProposedDate);
                  if (isNaN(dt.getTime())) return null;
                  const hhmm = format(dt, 'H:mm');
                  const label = format(dt, 'p');
                  const exists = ['9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'].includes(hhmm);
                  return !exists ? (
                    <SelectItem value={hhmm}>Proposed {label}</SelectItem>
                  ) : null;
                })()}
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
            {(!selectedTime && !initialProposedDate) && (
              <p className="text-sm text-destructive">Time is required to continue</p>
            )}
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
                {typeof compatibilityScore === 'number' 
                  ? Math.round(compatibilityScore * 100) 
                  : Math.round(compatibilityScore.overall_score * 100)}% Compatible
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
      
      {/* Show collaborative waiting state if user has completed preferences but partner hasn't */}
      {planningMode === 'collaborative' && collaborativeSession && !aiAnalyzing && (
        (() => {
          const userHasCompletedPrefs = collaborativeSession.hasUserSetPreferences;
          const partnerHasCompletedPrefs = collaborativeSession.hasPartnerSetPreferences;
          const canShowResults = collaborativeSession.canShowResults;
          
          console.log('PreferencesStep - Collaborative state check:', {
            userHasCompletedPrefs,
            partnerHasCompletedPrefs,
            canShowResults,
            currentStep,
            hasCompatibilityScore: !!compatibilityScore
          });
          
          // If user has completed but partner hasn't, show waiting state
          if (userHasCompletedPrefs && !partnerHasCompletedPrefs) {
            return (
              <div className="space-y-4">
                <CollaborativeWaitingState
                  partnerName={partnerName}
                  sessionId={sessionId}
                  hasPartnerSetPreferences={partnerHasCompletedPrefs}
                  isWaitingForPartner={true}
                />
                
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-800">Your Preferences Saved!</h3>
                    </div>
                    <p className="text-green-700 mb-4">
                      Your date preferences have been successfully saved. We'll show AI-matched venues once {partnerName} completes their preferences.
                    </p>
                    <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                      <p className="text-sm text-green-700">
                        <strong>What happens next:</strong> Once {partnerName} sets their preferences, 
                        you'll both see AI-curated venue recommendations based on your combined compatibility.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          }
          
          return null;
        })()
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
              <Button 
                onClick={nextStep}
                disabled={currentStep === 2 && !canProceedFromStep2()}
              >
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
