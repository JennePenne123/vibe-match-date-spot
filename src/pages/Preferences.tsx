import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Check, Clock, DollarSign, MapPin, Settings, Coffee, Heart, Navigation, Loader2, X } from 'lucide-react';

interface Preference {
  id: string;
  name: string;
  emoji: string;
  desc?: string;
}

interface QuickTemplate {
  id: string;
  title: string;
  emoji: string;
  description: string;
  cuisines: string[];
  vibes: string[];
  priceRange: number[];
  timePreference?: string;
  activities?: string[];
}

const Preferences = () => {
  const navigate = useNavigate();
  const { updateCuisines, updateVibes } = useApp();
  const { user } = useAuth();
  
  // Multi-step state management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Step 1: Cuisine & Vibes (existing)
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  
  // Step 2: Budget & Timing
  const [selectedPriceRange, setSelectedPriceRange] = useState<string[]>([]);
  const [selectedTimePreferences, setSelectedTimePreferences] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  
  // Step 3: Activities & Entertainment
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedEntertainment, setSelectedEntertainment] = useState<string[]>([]);
  
  // Step 4: Special Requirements & Home Location
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedAccessibility, setSelectedAccessibility] = useState<string[]>([]);
  const [homeAddress, setHomeAddress] = useState<string>('');
  const [homeLatitude, setHomeLatitude] = useState<number | null>(null);
  const [homeLongitude, setHomeLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Load existing preferences on mount
  useEffect(() => {
    const loadExistingPreferences = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('home_latitude, home_longitude, home_address, preferred_cuisines, preferred_vibes, preferred_price_range, preferred_times, dietary_restrictions')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          if (data.home_latitude) setHomeLatitude(data.home_latitude);
          if (data.home_longitude) setHomeLongitude(data.home_longitude);
          if (data.home_address) setHomeAddress(data.home_address);
          if (data.preferred_cuisines) setSelectedCuisines(data.preferred_cuisines);
          if (data.preferred_vibes) setSelectedVibes(data.preferred_vibes);
          if (data.preferred_price_range) setSelectedPriceRange(data.preferred_price_range);
          if (data.preferred_times) setSelectedTimePreferences(data.preferred_times);
          if (data.dietary_restrictions) setSelectedDietary(data.dietary_restrictions);
        }
      } catch (error) {
        console.log('No existing preferences found');
      }
    };
    
    loadExistingPreferences();
  }, [user]);

  // Quick Templates
  const quickTemplates: QuickTemplate[] = [
    {
      id: 'romantic',
      title: 'Romantic Dinner',
      emoji: '💕',
      description: 'Candlelight, fine dining, intimate atmosphere',
      cuisines: ['italian', 'french'],
      vibes: ['romantic'],
      priceRange: [2, 3],
      timePreference: 'dinner',
      activities: ['dining']
    },
    {
      id: 'casual',
      title: 'Casual Brunch',
      emoji: '☕',
      description: 'Relaxed, tasty, social',
      cuisines: ['american'],
      vibes: ['casual'],
      priceRange: [1, 2],
      timePreference: 'brunch',
      activities: ['dining']
    },
    {
      id: 'trendy',
      title: 'Trendy Cocktail Bar',
      emoji: '🍸',
      description: 'Hip, stylish, perfect for drinks',
      cuisines: ['modern'],
      vibes: ['nightlife'],
      priceRange: [2, 3],
      timePreference: 'evening',
      activities: ['cocktails']
    }
  ];

  // Data definitions
  const cuisines: Preference[] = [
    { id: 'italian', name: 'Italian', emoji: '🍝' },
    { id: 'japanese', name: 'Japanese', emoji: '🍣' },
    { id: 'mexican', name: 'Mexican', emoji: '🌮' },
    { id: 'french', name: 'French', emoji: '🥐' },
    { id: 'indian', name: 'Indian', emoji: '🍛' },
    { id: 'mediterranean', name: 'Mediterranean', emoji: '🫒' },
    { id: 'american', name: 'American', emoji: '🍔' },
    { id: 'thai', name: 'Thai', emoji: '🍜' },
    { id: 'chinese', name: 'Chinese', emoji: '🥢' },
    { id: 'korean', name: 'Korean', emoji: '🍲' }
  ];

  const vibes: Preference[] = [
    { id: 'romantic', name: 'Romantic', emoji: '💕', desc: 'Intimate and cozy' },
    { id: 'casual', name: 'Casual', emoji: '😊', desc: 'Relaxed and comfortable' },
    { id: 'outdoor', name: 'Outdoor', emoji: '🌳', desc: 'Fresh air and nature' },
    { id: 'nightlife', name: 'Nightlife', emoji: '🌃', desc: 'Vibrant and energetic' },
    { id: 'cultural', name: 'Cultural', emoji: '🎭', desc: 'Arts and history' },
    { id: 'adventurous', name: 'Adventurous', emoji: '🗺️', desc: 'Something new and exciting' }
  ];

  const priceRanges: Preference[] = [
    { id: 'budget', name: 'Budget', emoji: '💰', desc: 'Up to $15 per person' },
    { id: 'moderate', name: 'Moderate', emoji: '💳', desc: '$15-30 per person' },
    { id: 'upscale', name: 'Upscale', emoji: '💎', desc: '$30-50 per person' },
    { id: 'luxury', name: 'Luxury', emoji: '👑', desc: 'Over $50 per person' }
  ];

  const timePreferences: Preference[] = [
    { id: 'brunch', name: 'Brunch', emoji: '🌅', desc: '9:00-12:00' },
    { id: 'lunch', name: 'Lunch', emoji: '☀️', desc: '12:00-15:00' },
    { id: 'afternoon', name: 'Afternoon', emoji: '🌤️', desc: '15:00-18:00' },
    { id: 'dinner', name: 'Dinner', emoji: '🌆', desc: '18:00-21:00' },
    { id: 'evening', name: 'Evening', emoji: '🌙', desc: 'After 21:00' },
    { id: 'flexible', name: 'Flexible', emoji: '🕐', desc: 'Anytime' }
  ];

  const durations: Preference[] = [
    { id: 'quick', name: 'Quick & Sweet', emoji: '⚡', desc: '1-2 hours' },
    { id: 'relaxed', name: 'Relaxed', emoji: '⏰', desc: '2-3 hours' },
    { id: 'extended', name: 'Full Experience', emoji: '🕐', desc: '3+ hours' },
    { id: 'spontaneous', name: 'Go with the flow', emoji: '🤷', desc: 'Let\'s see how it goes' }
  ];

  const activities: Preference[] = [
    { id: 'dining', name: 'Just Dining', emoji: '🍽️', desc: 'Restaurant/café focus' },
    { id: 'dining_plus', name: 'Dining + Activity', emoji: '🎪', desc: 'Dinner & show/event' },
    { id: 'cocktails', name: 'Cocktails/Bar', emoji: '🍸', desc: 'Drinks & conversation' },
    { id: 'cultural', name: 'Cultural', emoji: '🎨', desc: 'Museum, theater, concert' },
    { id: 'active', name: 'Active', emoji: '🎳', desc: 'Bowling, mini-golf, escape room' },
    { id: 'nightlife', name: 'Nightlife', emoji: '🎉', desc: 'Club, disco, live music' }
  ];

  const entertainment: Preference[] = [
    { id: 'live_music', name: 'Live Music', emoji: '🎵' },
    { id: 'dj_playlist', name: 'DJ/Playlist', emoji: '🎧' },
    { id: 'quiet_conversation', name: 'Quiet Chat', emoji: '💬' },
    { id: 'games', name: 'Games', emoji: '🎮' },
    { id: 'dancing', name: 'Dancing', emoji: '💃' },
    { id: 'sports_viewing', name: 'Watch Sports', emoji: '📺' }
  ];

  const dietaryRequirements: Preference[] = [
    { id: 'vegetarian', name: 'Vegetarian', emoji: '🥬' },
    { id: 'vegan', name: 'Vegan', emoji: '🌱' },
    { id: 'gluten_free', name: 'Gluten-Free', emoji: '🚫' },
    { id: 'dairy_free', name: 'Dairy-Free', emoji: '🥛' },
    { id: 'halal', name: 'Halal', emoji: '☪️' },
    { id: 'kosher', name: 'Kosher', emoji: '✡️' }
  ];

  const accessibilityNeeds: Preference[] = [
    { id: 'wheelchair', name: 'Wheelchair Accessible', emoji: '♿' },
    { id: 'parking', name: 'Parking Available', emoji: '🅿️' },
    { id: 'public_transport', name: 'Near Public Transport', emoji: '🚇' },
    { id: 'pet_friendly', name: 'Pet Friendly', emoji: '🐕' },
    { id: 'non_smoking', name: 'Non-Smoking', emoji: '🚭' }
  ];

  // Toggle functions
  const toggleSelection = (item: string, selectedItems: string[], setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>) => {
    setSelectedItems(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const toggleSingleSelection = (item: string, setSelectedItem: React.Dispatch<React.SetStateAction<string>>) => {
    setSelectedItem(prev => prev === item ? '' : item);
  };

  // Quick template application
  const applyQuickTemplate = (template: QuickTemplate) => {
    setSelectedCuisines(template.cuisines);
    setSelectedVibes(template.vibes);
    if (template.timePreference) {
      setSelectedTimePreferences([template.timePreference]);
    }
    if (template.activities) {
      setSelectedActivities(template.activities);
    }
  };

  // Location functions
  const useCurrentLocation = async () => {
    setIsLocating(true);
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000
        });
      });
      
      setHomeLatitude(position.coords.latitude);
      setHomeLongitude(position.coords.longitude);
      
      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
        );
        if (response.ok) {
          const data = await response.json();
          const addressParts = [data.city, data.principalSubdivision, data.countryName].filter(Boolean);
          setHomeAddress(addressParts.join(', ') || 'Current Location');
        } else {
          setHomeAddress('Current Location');
        }
      } catch {
        setHomeAddress('Current Location');
      }
    } catch (error) {
      setLocationError('Unable to get your location. Please try again or enter an address manually.');
    } finally {
      setIsLocating(false);
    }
  };

  const clearHomeLocation = () => {
    setHomeAddress('');
    setHomeLatitude(null);
    setHomeLongitude(null);
    setLocationError('');
  };

  // Navigation functions
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

  const handleNext = async () => {
    if (currentStep === totalSteps) {
      // Update local context
      updateCuisines(selectedCuisines);
      updateVibes(selectedVibes);
      
      // Save preferences to database if user is logged in
      if (user) {
        setIsSaving(true);
        try {
          const { error } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              home_latitude: homeLatitude,
              home_longitude: homeLongitude,
              home_address: homeAddress || null,
              preferred_cuisines: selectedCuisines.length > 0 ? selectedCuisines : null,
              preferred_vibes: selectedVibes.length > 0 ? selectedVibes : null,
              preferred_price_range: selectedPriceRange.length > 0 ? selectedPriceRange : null,
              preferred_times: selectedTimePreferences.length > 0 ? selectedTimePreferences : null,
              dietary_restrictions: selectedDietary.length > 0 ? selectedDietary : null,
            }, { onConflict: 'user_id' });
          
          if (error) throw error;
          
          toast({
            title: 'Preferences saved!',
            description: 'Your preferences have been saved successfully.',
          });
        } catch (error) {
          console.error('Error saving preferences:', error);
          toast({
            variant: 'destructive',
            title: 'Error saving preferences',
            description: 'Please try again later.',
          });
        } finally {
          setIsSaving(false);
        }
      }
      
      navigate('/friends');
    } else {
      nextStep();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Food & Vibe';
      case 2: return 'Budget & Timing';
      case 3: return 'Activities';
      case 4: return 'Special Needs & Location';
      default: return 'Preferences';
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 1: return <Heart className="w-5 h-5" />;
      case 2: return <Clock className="w-5 h-5" />;
      case 3: return <Coffee className="w-5 h-5" />;
      case 4: return <MapPin className="w-5 h-5" />;
      default: return <Heart className="w-5 h-5" />;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return selectedCuisines.length > 0 || selectedVibes.length > 0;
      case 2: return true; // Optional step
      case 3: return true; // Optional step
      case 4: return true; // Optional step
      default: return false;
    }
  };

  // Render functions for each step
  const renderStep1 = () => (
    <>
      {/* Quick Templates */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-2">Quick Start</h2>
        <p className="text-muted-foreground mb-4">Or choose a ready-made template</p>
        <div className="grid grid-cols-1 gap-3">
          {quickTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => applyQuickTemplate(template)}
              className="p-4 rounded-xl border-2 border-border bg-card hover:bg-accent/50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{template.emoji}</div>
                <div>
                  <div className="font-semibold text-foreground">{template.title}</div>
                  <div className="text-sm text-muted-foreground">{template.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">What are you craving?</h2>
        <p className="text-muted-foreground mb-6">Choose your favorite cuisines</p>
        
        <div className="grid grid-cols-2 gap-3">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine.id}
              onClick={() => toggleSelection(cuisine.id, selectedCuisines, setSelectedCuisines)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedCuisines.includes(cuisine.id)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-foreground hover:bg-accent/50'
              }`}
            >
              <div className="text-2xl mb-1">{cuisine.emoji}</div>
              <div className="font-medium text-sm">{cuisine.name}</div>
              {selectedCuisines.includes(cuisine.id) && (
                <Check className="w-4 h-4 mx-auto mt-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Vibe Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">What vibe are you going for?</h2>
        <p className="text-muted-foreground mb-6">Choose the perfect atmosphere for your date</p>
        
        <div className="space-y-3">
          {vibes.map((vibe) => (
            <button
              key={vibe.id}
              onClick={() => toggleSelection(vibe.id, selectedVibes, setSelectedVibes)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedVibes.includes(vibe.id)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-foreground hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{vibe.emoji}</div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{vibe.name}</div>
                  <div className={`text-sm ${selectedVibes.includes(vibe.id) ? 'text-primary' : 'text-muted-foreground'}`}>
                    {vibe.desc}
                  </div>
                </div>
                {selectedVibes.includes(vibe.id) && (
                  <Check className="w-5 h-5" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      {/* Price Range */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">What's your budget?</h2>
        <p className="text-muted-foreground mb-6">Select your preferred price range</p>
        
        <div className="space-y-3">
          {priceRanges.map((price) => (
            <button
              key={price.id}
              onClick={() => toggleSelection(price.id, selectedPriceRange, setSelectedPriceRange)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedPriceRange.includes(price.id)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-foreground hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{price.emoji}</div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{price.name}</div>
                  <div className={`text-sm ${selectedPriceRange.includes(price.id) ? 'text-primary' : 'text-muted-foreground'}`}>
                    {price.desc}
                  </div>
                </div>
                {selectedPriceRange.includes(price.id) && (
                  <Check className="w-5 h-5" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Preferences */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">When works best?</h2>
        <p className="text-muted-foreground mb-6">Choose your preferred timing</p>
        
        <div className="grid grid-cols-2 gap-3">
          {timePreferences.map((time) => (
            <button
              key={time.id}
              onClick={() => toggleSelection(time.id, selectedTimePreferences, setSelectedTimePreferences)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedTimePreferences.includes(time.id)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-foreground hover:bg-accent/50'
              }`}
            >
              <div className="text-2xl mb-1">{time.emoji}</div>
              <div className="font-medium text-sm">{time.name}</div>
              <div className={`text-xs ${selectedTimePreferences.includes(time.id) ? 'text-primary' : 'text-muted-foreground'}`}>
                {time.desc}
              </div>
              {selectedTimePreferences.includes(time.id) && (
                <Check className="w-4 h-4 mx-auto mt-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">How long should it last?</h2>
        <p className="text-muted-foreground mb-6">Choose your ideal date duration</p>
        
        <div className="space-y-3">
          {durations.map((duration) => (
            <button
              key={duration.id}
              onClick={() => toggleSingleSelection(duration.id, setSelectedDuration)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedDuration === duration.id
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-foreground hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{duration.emoji}</div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{duration.name}</div>
                  <div className={`text-sm ${selectedDuration === duration.id ? 'text-primary' : 'text-muted-foreground'}`}>
                    {duration.desc}
                  </div>
                </div>
                {selectedDuration === duration.id && (
                  <Check className="w-5 h-5" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      {/* Activities */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">What type of activity?</h2>
        <p className="text-muted-foreground mb-6">What do you want to do together?</p>
        
        <div className="space-y-3">
          {activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => toggleSelection(activity.id, selectedActivities, setSelectedActivities)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedActivities.includes(activity.id)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-foreground hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{activity.emoji}</div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{activity.name}</div>
                  <div className={`text-sm ${selectedActivities.includes(activity.id) ? 'text-primary' : 'text-muted-foreground'}`}>
                    {activity.desc}
                  </div>
                </div>
                {selectedActivities.includes(activity.id) && (
                  <Check className="w-5 h-5" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Entertainment */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">What entertainment?</h2>
        <p className="text-muted-foreground mb-6">How do you like to be entertained?</p>
        
        <div className="grid grid-cols-2 gap-3">
          {entertainment.map((ent) => (
            <button
              key={ent.id}
              onClick={() => toggleSelection(ent.id, selectedEntertainment, setSelectedEntertainment)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedEntertainment.includes(ent.id)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-foreground hover:bg-accent/50'
              }`}
            >
              <div className="text-2xl mb-1">{ent.emoji}</div>
              <div className="font-medium text-sm">{ent.name}</div>
              {selectedEntertainment.includes(ent.id) && (
                <Check className="w-4 h-4 mx-auto mt-1" />
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const renderStep4 = () => (
    <>
      {/* Home Location */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Your Home Location</h2>
        <p className="text-muted-foreground mb-4">Set your default location for venue searches</p>
        
        {/* Use Current Location Button */}
        <Button
          onClick={useCurrentLocation}
          disabled={isLocating}
          variant="outline"
          className="w-full mb-4 h-12 border-primary text-primary hover:bg-primary/10"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting location...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              Use Current Location
            </>
          )}
        </Button>
        
        {/* Manual Address Input */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Or enter your city/address..."
            value={homeAddress}
            onChange={(e) => setHomeAddress(e.target.value)}
            className="w-full h-12 pl-10"
          />
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
        
        {/* Display Coordinates if Set */}
        {homeLatitude && homeLongitude && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-800 dark:text-green-300">
                  Location saved: {homeAddress || `${homeLatitude.toFixed(4)}, ${homeLongitude.toFixed(4)}`}
                </span>
              </div>
              <Button
                onClick={clearHomeLocation}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {locationError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{locationError}</p>
          </div>
        )}
      </div>

      {/* Dietary Requirements */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Any dietary requirements?</h2>
        <p className="text-muted-foreground mb-6">Let us know your dietary needs</p>
        
        <div className="grid grid-cols-2 gap-3">
          {dietaryRequirements.map((dietary) => (
            <button
              key={dietary.id}
              onClick={() => toggleSelection(dietary.id, selectedDietary, setSelectedDietary)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedDietary.includes(dietary.id)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-foreground hover:bg-accent/50'
              }`}
            >
              <div className="text-2xl mb-1">{dietary.emoji}</div>
              <div className="font-medium text-sm">{dietary.name}</div>
              {selectedDietary.includes(dietary.id) && (
                <Check className="w-4 h-4 mx-auto mt-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Any special needs?</h2>
        <p className="text-muted-foreground mb-6">What accessibility features do you need?</p>
        
        <div className="space-y-3">
          {accessibilityNeeds.map((access) => (
            <button
              key={access.id}
              onClick={() => toggleSelection(access.id, selectedAccessibility, setSelectedAccessibility)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedAccessibility.includes(access.id)
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-foreground hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{access.emoji}</div>
                <div className="font-semibold">{access.name}</div>
                {selectedAccessibility.includes(access.id) && (
                  <Check className="w-5 h-5 ml-auto" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-12 bg-card shadow-sm">
          <Button
            onClick={currentStep === 1 ? () => navigate('/welcome') : prevStep}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-accent"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              {getStepIcon()}
              <h1 className="text-xl font-semibold text-foreground">{getStepTitle()}</h1>
            </div>
            <p className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="px-6 mb-8 pt-4">
          <div className="bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-primary rounded-full h-2 transition-all duration-300" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="px-6 pb-8">
          {/* Dynamic Step Content */}
          {renderCurrentStep()}

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button
                onClick={prevStep}
                variant="outline"
                className="flex-1 h-12 border-primary text-primary hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={!isStepValid() || isSaving}
              className={`h-12 bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold disabled:opacity-50 ${
                currentStep === 1 ? 'w-full' : 'flex-1'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : currentStep === totalSteps ? (
                'Find Dates!'
              ) : (
                'Next'
              )}
              {!isSaving && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>

          {/* Skip Option for Optional Steps */}
          {currentStep > 1 && (
            <div className="text-center mt-4">
              <Button
                onClick={handleNext}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                disabled={isSaving}
              >
                Skip this step
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Preferences;
