import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Clock, Sparkles, Loader2, Check, DollarSign, MapPin, Coffee, Settings, CalendarIcon, CheckCircle, AlertCircle, X } from 'lucide-react';
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

export interface PreferencesStepProps {
  sessionId: string;
  partnerId: string;
  partnerName: string;
  compatibilityScore: CompatibilityScore | number | null;
  aiAnalyzing: boolean;
  onPreferencesComplete: (preferences: DatePreferences) => void;
  initialProposedDate?: string;
  planningMode?: 'solo' | 'collaborative';
  collaborativeSession?: {
    hasUserSetPreferences: boolean;
    hasPartnerSetPreferences: boolean;
    canShowResults: boolean;
  };
  onManualContinue?: () => void;
  onDisplayVenues?: () => void;
  venueRecommendations?: any[];
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

const PreferencesStep: React.FC<PreferencesStepProps> = (props) => {
  const {
    sessionId,
    partnerId,
    partnerName,
    compatibilityScore,
    aiAnalyzing,
    onPreferencesComplete,
    initialProposedDate,
    planningMode = 'solo',
    collaborativeSession,
    onManualContinue,
    onDisplayVenues,
    venueRecommendations = []
  } = props;

  const { user } = useAuth();
  
  // Debug: Log when initialProposedDate prop is received
  useEffect(() => {
    console.log('📥 PREFERENCES STEP: Received initialProposedDate:', initialProposedDate);
  }, [initialProposedDate]);
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasCompletedAllSteps, setHasCompletedAllSteps] = useState(false);
  const totalSteps = 4;
  
  // Timeout fallback state
  const [aiAnalysisStartTime, setAiAnalysisStartTime] = useState<number | null>(null);
  const [timeoutTriggered, setTimeoutTriggered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const NAVIGATION_TIMEOUT_MS = 10000; // 10 seconds

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
  const [autoNavigating, setAutoNavigating] = useState(false);
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);
  
  // Track user modifications to prevent overwriting their choices
  const [userModifiedDate, setUserModifiedDate] = useState(false);
  const [userModifiedTime, setUserModifiedTime] = useState(false);
  const [userModifiedTimePrefs, setUserModifiedTimePrefs] = useState(false);
  const [prefilledFromProposal, setPrefilledFromProposal] = useState(false);

  // Helper function to map time string to time preference ID
  const getTimePreferenceFromTime = (timeString: string): string | null => {
    if (!timeString) return null;
    
    const [hours] = timeString.split(':').map(Number);
    
    if (hours >= 9 && hours < 12) return 'morning';
    if (hours >= 12 && hours < 15) return 'lunch';
    if (hours >= 15 && hours < 18) return 'afternoon';
    if (hours >= 18 && hours < 21) return 'evening';
    if (hours >= 21 || hours < 9) return 'night';
    
    return null;
  };

  // Prefill date, time, and time preferences from proposal when provided
  useEffect(() => {
    if (initialProposedDate && !prefilledFromProposal) {
      const dt = new Date(initialProposedDate);
      if (!isNaN(dt.getTime())) {
        console.log('📅 Pre-filling from proposal:', {
          proposedDate: initialProposedDate,
          parsedDate: dt,
          userModifiedDate,
          userModifiedTime
        });
        
        // Pre-fill date if user hasn't manually changed it
        if (!userModifiedDate) {
          setSelectedDate(dt);
        }
        
        // Pre-fill time if user hasn't manually changed it
        if (!userModifiedTime) {
          try {
            const hhmm = format(dt, 'HH:mm');
            console.log('⏰ PREFILL: Formatted time as:', hhmm);
            setSelectedTime(hhmm);
            
            // Auto-select matching time preference
            if (!userModifiedTimePrefs) {
              const timePref = getTimePreferenceFromTime(hhmm);
              if (timePref && !selectedTimePreferences.includes(timePref)) {
                setSelectedTimePreferences(prev => [...prev, timePref]);
                console.log('🕐 Auto-selected time preference:', timePref, 'for time', hhmm);
              }
            }
          } catch (err) {
            console.error('❌ PREFILL: Failed to format time:', err);
          }
        }
        
        setPrefilledFromProposal(true);
      }
    }
  }, [initialProposedDate, prefilledFromProposal, userModifiedDate, userModifiedTime, userModifiedTimePrefs, selectedTimePreferences]);

  // Debug: Log when selectedTime changes
  useEffect(() => {
    console.log('🔄 SELECT STATE: selectedTime changed to:', selectedTime);
  }, [selectedTime]);

// Track when AI analysis starts/stops
useEffect(() => {
  if (aiAnalyzing && !aiAnalysisStartTime) {
    const startTime = Date.now();
    setAiAnalysisStartTime(startTime);
    console.log('⏱️ AI Analysis started at:', new Date(startTime).toISOString());
  } else if (!aiAnalyzing && aiAnalysisStartTime) {
    console.log('✅ AI Analysis completed after:', (Date.now() - aiAnalysisStartTime) / 1000, 'seconds');
    setAiAnalysisStartTime(null);
  }
}, [aiAnalyzing, aiAnalysisStartTime]);

// Auto-navigation effect for collaborative mode with timeout fallback
useEffect(() => {
  if (planningMode === 'collaborative' && 
      collaborativeSession && 
      onDisplayVenues && 
      !hasAutoNavigated && 
      !autoNavigating) {
    
    const userHasCompletedPrefs = collaborativeSession.hasUserSetPreferences;
    const partnerHasCompletedPrefs = collaborativeSession.hasPartnerSetPreferences;
    
    // Comprehensive logging for navigation state
    console.log('🚦 NAVIGATION CHECK:', {
      userComplete: userHasCompletedPrefs,
      partnerComplete: partnerHasCompletedPrefs,
      stepsComplete: hasCompletedAllSteps,
      aiAnalyzing,
      venueCount: venueRecommendations.length,
      hasAutoNavigated,
      autoNavigating,
      timeElapsed: aiAnalysisStartTime ? (Date.now() - aiAnalysisStartTime) / 1000 : 0
    });
    
    // Check if all conditions are met for auto-navigation
    const shouldAutoNavigate = userHasCompletedPrefs && 
                              partnerHasCompletedPrefs && 
                              hasCompletedAllSteps && 
                              !aiAnalyzing && 
                              venueRecommendations.length > 0;
    
    if (shouldAutoNavigate) {
      console.log('🚀 Auto-navigating to results with', venueRecommendations.length, 'venues');
      setAutoNavigating(true);
      setHasAutoNavigated(true);
      
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Brief delay to let users see the success message
      const timer = setTimeout(() => {
        onDisplayVenues();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    // Set timeout fallback if both users ready but waiting for venues
    if (userHasCompletedPrefs && 
        partnerHasCompletedPrefs && 
        hasCompletedAllSteps && 
        !timeoutRef.current) {
      
      console.log('⏰ Setting navigation timeout fallback');
      timeoutRef.current = setTimeout(() => {
        console.warn('⚠️ Navigation timeout triggered - proceeding with', venueRecommendations.length, 'venues');
        
        if (!hasAutoNavigated) {
          setTimeoutTriggered(true);
          
          setAutoNavigating(true);
          setHasAutoNavigated(true);
          onDisplayVenues();
        }
      }, NAVIGATION_TIMEOUT_MS);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setTimeoutTriggered(false);
    };
  }
}, [
  planningMode, 
  collaborativeSession, 
  hasCompletedAllSteps, 
  aiAnalyzing, 
  venueRecommendations.length, 
  onDisplayVenues, 
  hasAutoNavigated, 
  autoNavigating,
  aiAnalysisStartTime,
  NAVIGATION_TIMEOUT_MS
]);

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
  const toggleSelection = (
    item: string, 
    selectedItems: string[], 
    setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>,
    category?: keyof UserPreferences
  ) => {
    setSelectedItems(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
    
    // Track if user manually changed time preferences
    if (category === 'preferred_times') {
      setUserModifiedTimePrefs(true);
    }
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
      
      // Mark that user has completed all steps
      setHasCompletedAllSteps(true);
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
    gridCols = "grid-cols-1 sm:grid-cols-2"
  ) => {
    // Only show matches in collaborative mode when partner has set preferences
    const shouldShowMatches = planningMode === 'collaborative' && 
                             collaborativeSession?.hasPartnerSetPreferences;
    const sharedItems = shouldShowMatches ? getSharedPreferences(category) : [];

    return (
      <div className={`grid ${gridCols} gap-3 md:gap-4`}>
        {items.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          const isShared = sharedItems.includes(item.id);

          return (
            <button
              key={item.id}
              onClick={() => toggleSelection(item.id, selectedItems, setSelectedItems, category)}
              className={`p-3 md:p-4 rounded-xl border-2 transition-all relative min-h-[80px] ${
                isSelected
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-foreground hover:bg-muted'
              }`}
            >
              <div className="text-xl md:text-2xl mb-1">{item.emoji}</div>
              <div className="font-medium text-sm md:text-base">{item.name}</div>
              {item.desc && (
                <div className={`text-xs mt-1 leading-tight ${isSelected ? 'text-primary/70' : 'text-muted-foreground'}`}>
                  {item.desc}
                </div>
              )}
              {isSelected && (
                <Check className="w-3 h-3 md:w-4 md:h-4 absolute top-2 right-2" />
              )}
              {isShared && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full text-xs px-1.5 py-0.5">
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
      <div className="mb-6 md:mb-8">
        <h2 className="text-base md:text-lg font-bold mb-2">Quick Start</h2>
        <p className="text-muted-foreground text-sm mb-3 md:mb-4">Or choose a ready-made template</p>
        <div className="grid grid-cols-1 gap-2 md:gap-3">
          {quickStartTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => applyQuickStartTemplate(template)}
              className="p-3 md:p-4 rounded-lg border border-border text-left transition-all hover:bg-muted hover:border-primary/20"
            >
              <div className="flex items-center gap-3">
                <div className="text-xl md:text-2xl flex-shrink-0">{template.emoji}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm md:text-base">{template.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-tight">{template.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine Selection */}
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-base md:text-lg font-bold mb-2">What type of food are you in the mood for?</h2>
          <p className="text-muted-foreground text-sm mb-3 md:mb-4">Select all cuisines that interest you</p>
          {renderPreferenceGrid(cuisines, selectedCuisines, setSelectedCuisines, 'preferred_cuisines')}
        </div>

        {/* Vibe Selection */}
        <div>
          <h2 className="text-base md:text-lg font-bold mb-2">What's the vibe you're going for?</h2>
          <p className="text-muted-foreground text-sm mb-3 md:mb-4">Choose the atmosphere you want</p>
          {renderPreferenceGrid(vibes, selectedVibes, setSelectedVibes, 'preferred_vibes')}
        </div>
      </div>
    </>
  );

  const renderStep2 = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Price Range */}
      <div>
        <h2 className="text-base md:text-lg font-bold mb-2">What's your budget?</h2>
        <p className="text-muted-foreground text-sm mb-3 md:mb-4">Choose your preferred price range</p>
        {renderPreferenceGrid(priceRanges, selectedPriceRange, setSelectedPriceRange, 'preferred_price_range')}
      </div>

      {/* Time Preferences */}
      <div>
        <h2 className="text-base md:text-lg font-bold mb-2">When do you prefer to go out?</h2>
        <p className="text-muted-foreground text-sm mb-3 md:mb-4">Select your preferred times</p>
        {renderPreferenceGrid(timePreferences, selectedTimePreferences, setSelectedTimePreferences, 'preferred_times', 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3')}
      </div>

      {/* Date & Time Selection */}
      <div className="space-y-3 md:space-y-4">
        <h2 className="text-base md:text-lg font-bold">When would you like to go?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Date Picker */}
          <div>
            <label className="text-sm font-medium mb-2 block">Preferred Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 md:h-11",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setUserModifiedDate(true);
                    console.log('👤 User manually selected date:', date);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                  defaultMonth={selectedDate || (initialProposedDate ? new Date(initialProposedDate) : undefined)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div>
            <label className="text-sm font-medium mb-2 block">Preferred Time</label>
            <Select value={selectedTime} onValueChange={(time) => {
              setSelectedTime(time);
              setUserModifiedTime(true);
              console.log('👤 User manually selected time:', time);
            }}>
              <SelectTrigger className="h-10 md:h-11">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return (
                    <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                      {hour}:00
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Visual indicator when values are pre-filled from proposal */}
        {prefilledFromProposal && (selectedDate || selectedTime) && (
          <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 rounded-md p-2 border border-purple-200">
            <Sparkles className="w-3 h-3" />
            <span>
              {selectedDate && selectedTime 
                ? 'Date and time pre-filled from your accepted proposal' 
                : selectedDate 
                ? 'Date pre-filled from your accepted proposal'
                : 'Time pre-filled from your accepted proposal'}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Distance Slider */}
      <div>
        <h2 className="text-lg font-bold mb-2">How far are you willing to travel?</h2>
        <p className="text-muted-foreground mb-4">Maximum distance from your location</p>
        <div className="space-y-4">
          <Slider
            value={[maxDistance]}
            onValueChange={(value) => setMaxDistance(value[0])}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>1 km</span>
            <span className="font-medium text-foreground">{maxDistance} km</span>
            <span>50 km</span>
          </div>
        </div>
      </div>

      {/* Dietary Requirements */}
      <div>
        <h2 className="text-lg font-bold mb-2">Any dietary requirements?</h2>
        <p className="text-muted-foreground mb-4">Select any dietary restrictions (optional)</p>
        {renderPreferenceGrid(dietaryRequirements, selectedDietary, setSelectedDietary, 'dietary_restrictions', 'grid-cols-2')}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-bold mb-4">Review Your Preferences</h2>
      
      <div className="space-y-4">
        {/* Cuisines */}
        {selectedCuisines.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              Cuisines
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedCuisines.map((cuisine) => (
                <Badge key={cuisine} variant="secondary">
                  {cuisines.find(c => c.id === cuisine)?.emoji} {cuisine}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Vibes */}
        {selectedVibes.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Vibes
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedVibes.map((vibe) => (
                <Badge key={vibe} variant="secondary">
                  {vibes.find(v => v.id === vibe)?.emoji} {vibe}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Price Range */}
        {selectedPriceRange.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Budget
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedPriceRange.map((range) => (
                <Badge key={range} variant="secondary">
                  {range}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Time Preferences */}
        {selectedTimePreferences.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Preferred Times
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedTimePreferences.map((time) => (
                <Badge key={time} variant="secondary">
                  {timePreferences.find(t => t.id === time)?.emoji} {time}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Date & Time */}
        {(selectedDate || selectedTime) && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Date & Time
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedDate && (
                <Badge variant="secondary">
                  📅 {format(selectedDate, "PPP")}
                </Badge>
              )}
              {selectedTime && (
                <Badge variant="secondary">
                  🕐 {selectedTime}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Distance */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Travel Distance
          </h3>
          <Badge variant="secondary">
            📍 Up to {maxDistance} km
          </Badge>
        </div>

        {/* Dietary */}
        {selectedDietary.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Dietary Requirements
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedDietary.map((diet) => (
                <Badge key={diet} variant="secondary">
                  {dietaryRequirements.find(d => d.id === diet)?.emoji} {diet}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Enhanced debug logging for collaborative preferences state
  console.log('🔧 PREFERENCES STEP COMPREHENSIVE DEBUG:', {
    planningMode,
    hasCollaborativeSession: !!collaborativeSession,
    collaborativeSessionDetails: {
      hasUserSetPreferences: collaborativeSession?.hasUserSetPreferences,
      hasPartnerSetPreferences: collaborativeSession?.hasPartnerSetPreferences,
      canShowResults: collaborativeSession?.canShowResults
    },
    aiAnalyzing,
    sessionId,
    partnerName,
    shouldShowCollaborative: planningMode === 'collaborative' && collaborativeSession && !aiAnalyzing,
    renderingPath: planningMode === 'collaborative' && collaborativeSession ? 'collaborative' : 'regular'
  });

  // Get completion status for status indicators
  const getCompletionStatus = () => {
    if (planningMode === 'collaborative' && collaborativeSession) {
      const userCompleted = collaborativeSession.hasUserSetPreferences;
      const partnerCompleted = collaborativeSession.hasPartnerSetPreferences;
      const bothCompleted = userCompleted && partnerCompleted;
      
      return {
        userCompleted,
        partnerCompleted,
        bothCompleted,
        analysisComplete: bothCompleted && !aiAnalyzing && venueRecommendations.length > 0
      };
    }
    return { userCompleted: false, partnerCompleted: false, bothCompleted: false, analysisComplete: false };
  };

  const status = getCompletionStatus();

  return (
    <SafeComponent>
      {/* Main Preferences Setting Interface */}
      <Card>
        <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4">
          <div className="space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg md:text-xl">
              {getStepIcon()}
              <span className="font-bold">{getStepTitle()}</span>
              {/* Status indicator for collaborative mode */}
              {planningMode === 'collaborative' && status.userCompleted && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Saved
                </Badge>
              )}
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Step {currentStep} of {totalSteps}
              </Badge>
              {/* Collaborative progress indicators */}
              {planningMode === 'collaborative' && (
                <div className="flex items-center gap-1" title="Progress status">
                  <div className={`w-2 h-2 rounded-full ${status.userCompleted ? 'bg-green-500' : 'bg-gray-300'}`} 
                       title="Your preferences" />
                  <div className={`w-2 h-2 rounded-full ${status.partnerCompleted ? 'bg-green-500' : 'bg-gray-300'}`} 
                       title={`${partnerName}'s preferences`} />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6 space-y-4 md:space-y-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 md:pt-6">
            <Button
              onClick={prevStep}
              variant="outline"
              disabled={currentStep === 1}
              className="w-full sm:w-auto"
            >
              Previous
            </Button>
            
            {currentStep < totalSteps ? (
              <Button 
                onClick={nextStep}
                disabled={currentStep === 2 && !canProceedFromStep2()}
                className="w-full sm:w-auto"
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={submitPreferences} 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Separator for visual hierarchy */}
      {planningMode === 'collaborative' && (status.userCompleted || status.partnerCompleted) && (
        <div className="my-6 border-t border-border"></div>
      )}

      {/* AI Analysis Status Section - appears after preferences form */}
      {planningMode === 'collaborative' && collaborativeSession && (
        (() => {
          const userHasCompletedPrefs = collaborativeSession.hasUserSetPreferences;
          const partnerHasCompletedPrefs = collaborativeSession.hasPartnerSetPreferences;
          
          // Debug logging for preferences step state
          console.log('🔧 PREFERENCES STEP DEBUG:', {
            sessionId,
            partnerName,
            userHasCompletedPrefs,
            partnerHasCompletedPrefs,
            hasCompletedAllSteps,
            aiAnalyzing,
            venueRecommendationsLength: venueRecommendations.length,
            shouldShowAICard: userHasCompletedPrefs && partnerHasCompletedPrefs && hasCompletedAllSteps && aiAnalyzing
          });
          
          // Show waiting state for partner (still inline, not overlay)
          if (userHasCompletedPrefs && hasCompletedAllSteps && !partnerHasCompletedPrefs) {
            return (
              <div className="space-y-4">
                <CollaborativeWaitingState
                  partnerName={partnerName}
                  sessionId={sessionId}
                  hasPartnerSetPreferences={partnerHasCompletedPrefs}
                  isWaitingForPartner={true}
                  hasCurrentUserSetPreferences={userHasCompletedPrefs}
                  currentUserName={user?.name || 'You'}
                />
                
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-blue-800">Your Preferences Saved!</h3>
                    </div>
                    <p className="text-blue-700 mb-4">
                      Your date preferences have been successfully saved. Waiting for {partnerName} to complete their preferences.
                    </p>
                    <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
                      <p className="text-sm text-blue-700">
                        <strong>Next step:</strong> Our AI will analyze your compatibility and suggest perfect venues when both partners are ready.
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

      {/* AI Analysis Overlay - appears on top when analyzing */}
      {planningMode === 'collaborative' && collaborativeSession?.hasUserSetPreferences && collaborativeSession?.hasPartnerSetPreferences && hasCompletedAllSteps && aiAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background shadow-md hover:bg-destructive hover:text-destructive-foreground z-10"
              onClick={() => {
                console.log('❌ User cancelled AI analysis');
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
                setAiAnalysisStartTime(null);
                toast({
                  title: "Analysis Cancelled",
                  description: "You can review your preferences or start again.",
                });
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            <Card className="border-primary/20 bg-card shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  <h3 className="text-lg font-semibold">
                    {timeoutTriggered ? "Taking a while?" : "AI Analysis in Progress"}
                  </h3>
                </div>
                <p className="text-muted-foreground">
                  {timeoutTriggered 
                    ? "We're showing you the best available results now."
                    : "Analyzing your compatibility and finding perfect venues..."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Redirecting Overlay - appears on top when ready */}
      {planningMode === 'collaborative' && collaborativeSession?.hasUserSetPreferences && collaborativeSession?.hasPartnerSetPreferences && hasCompletedAllSteps && !aiAnalyzing && (
        (() => {
          const hasVenues = venueRecommendations.length > 0;
          const timeElapsed = aiAnalysisStartTime ? Date.now() - aiAnalysisStartTime : 0;
          const timeRemaining = Math.max(0, NAVIGATION_TIMEOUT_MS - timeElapsed);
          const secondsRemaining = Math.ceil(timeRemaining / 1000);
          
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="w-full max-w-md mx-4 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background shadow-md hover:bg-destructive hover:text-destructive-foreground z-10"
                  onClick={() => {
                    console.log('❌ User cancelled redirect overlay');
                    if (timeoutRef.current) {
                      clearTimeout(timeoutRef.current);
                      timeoutRef.current = null;
                    }
                    setAutoNavigating(false);
                    setHasAutoNavigated(false);
                    setAiAnalysisStartTime(null);
                    toast({
                      title: "Auto-redirect Cancelled",
                      description: "You can manually view your matches using the 'View Matches' button when ready.",
                    });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Card className={hasVenues ? "border-green-500/20 bg-card shadow-lg" : "border-yellow-500/20 bg-card shadow-lg"}>
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      {autoNavigating ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : hasVenues ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Clock className="h-6 w-6 text-yellow-600" />
                      )}
                      <h3 className="text-lg font-semibold">
                        {autoNavigating 
                          ? 'Redirecting to your matches...' 
                          : hasVenues 
                            ? 'AI Analysis Complete!' 
                            : 'Almost Ready...'}
                      </h3>
                    </div>
                    
                    {hasVenues ? (
                      <>
                        <p className="text-foreground mb-2">
                          Found {venueRecommendations.length} perfect venues for you and {partnerName}!
                        </p>
                        {compatibilityScore && (
                          <p className="text-sm text-muted-foreground mb-4">
                            Compatibility Score: {typeof compatibilityScore === 'object' ? compatibilityScore.overall_score : compatibilityScore}%
                          </p>
                        )}
                        {!autoNavigating && (
                          <Button 
                            onClick={() => {
                              setHasAutoNavigated(true);
                              onDisplayVenues();
                            }}
                            className="mt-2"
                          >
                            View Matches Now
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-foreground mb-2">
                          Preparing your results...
                          {timeRemaining > 0 && secondsRemaining > 0 && (
                            <span className="block text-sm mt-1 text-muted-foreground">Auto-continuing in {secondsRemaining}s</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          We're finding the best venues in your area. This may take a moment.
                        </p>
                        <Button 
                          onClick={() => {
                            console.log('👆 User clicked Continue Anyway');
                            if (timeoutRef.current) {
                              clearTimeout(timeoutRef.current);
                              timeoutRef.current = null;
                            }
                            setHasAutoNavigated(true);
                            onDisplayVenues();
                          }}
                          variant="outline"
                          className="gap-2"
                        >
                          <AlertCircle className="h-4 w-4" />
                          Continue Anyway
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })()
      )}

      {/* Solo mode AI analysis status */}
      {planningMode !== 'collaborative' && aiAnalyzing && (
        <Card className="border-blue-200 bg-blue-50 mt-6">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              <h3 className="text-lg font-semibold text-blue-800">AI Analysis in Progress</h3>
            </div>
            <p className="text-blue-700">
              Analyzing your preferences and finding perfect venues...
            </p>
          </CardContent>
        </Card>
      )}
    </SafeComponent>
  );
};

export default PreferencesStep;