import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bowlChopsticks } from '@lucide/lab';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, ArrowRight, Check, Clock, MapPin, Coffee, Heart, Navigation, Loader2, X,
  Icon,
  // Cuisine icons
  Pizza, Fish, Flame, Croissant, CookingPot, Leaf, Beef, Soup,
  // Vibe icons
  HeartHandshake, Smile, TreePine, Moon, Theater, Compass,
  // Price icons
  PiggyBank, CreditCard, Gem, Crown,
  // Time icons
  Sunrise, Sun, CloudSun, Sunset, MoonStar, Clock3,
  // Duration icons
  Zap, Hourglass, Timer, Shuffle,
  // Activity icons
  Wine, Tent, Martini, Palette, Dumbbell, PartyPopper,
  // Entertainment icons
  Guitar, Headphones, MessageCircle, Gamepad2, Music4, Tv,
  // Dietary icons
  Salad, Sprout, WheatOff, MilkOff, CircleDot, Star,
  // Accessibility icons
  Accessibility, ParkingCircle, TrainFront, Dog, CigaretteOff,
  // Template icons
  Sparkles, type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MapPreview = lazy(() => import('@/components/MapPreview'));

// Icon + color mapping for each preference ID
const prefIconMap: Record<string, { icon: LucideIcon | null; labIcon?: any; bg: string; fg: string }> = {
  // Cuisines — each icon chosen to represent the cuisine's most iconic element
  italian:        { icon: Pizza,           bg: 'bg-red-500/15', fg: 'text-red-500' },
  japanese:       { icon: Fish,            bg: 'bg-orange-500/15', fg: 'text-orange-500' },
  mexican:        { icon: Flame,           bg: 'bg-yellow-600/15', fg: 'text-yellow-600' },
  french:         { icon: Croissant,       bg: 'bg-amber-500/15', fg: 'text-amber-500' },
  indian:         { icon: Soup,            bg: 'bg-orange-600/15', fg: 'text-orange-600' },
  mediterranean:  { icon: Leaf,            bg: 'bg-emerald-500/15', fg: 'text-emerald-500' },
  american:       { icon: Beef,            bg: 'bg-sky-500/15', fg: 'text-sky-500' },
  thai:           { icon: CookingPot,      bg: 'bg-lime-500/15', fg: 'text-lime-500' },
  chinese:        { icon: null, labIcon: bowlChopsticks, bg: 'bg-rose-500/15', fg: 'text-rose-500' },
  korean:         { icon: CookingPot,      bg: 'bg-violet-500/15', fg: 'text-violet-500' },
  // Vibes
  romantic:       { icon: HeartHandshake,  bg: 'bg-pink-500/15', fg: 'text-pink-500' },
  casual:         { icon: Smile,           bg: 'bg-sky-500/15', fg: 'text-sky-500' },
  outdoor:        { icon: TreePine,        bg: 'bg-green-500/15', fg: 'text-green-500' },
  nightlife:      { icon: Moon,            bg: 'bg-indigo-500/15', fg: 'text-indigo-500' },
  cultural:       { icon: Theater,         bg: 'bg-purple-500/15', fg: 'text-purple-500' },
  adventurous:    { icon: Compass,         bg: 'bg-teal-500/15', fg: 'text-teal-500' },
  // Prices
  budget:         { icon: PiggyBank,       bg: 'bg-green-500/15', fg: 'text-green-500' },
  moderate:       { icon: CreditCard,      bg: 'bg-blue-500/15', fg: 'text-blue-500' },
  upscale:        { icon: Gem,             bg: 'bg-cyan-500/15', fg: 'text-cyan-500' },
  luxury:         { icon: Crown,           bg: 'bg-amber-500/15', fg: 'text-amber-500' },
  // Times
  brunch:         { icon: Sunrise,         bg: 'bg-orange-400/15', fg: 'text-orange-400' },
  lunch:          { icon: Sun,             bg: 'bg-yellow-500/15', fg: 'text-yellow-500' },
  afternoon:      { icon: CloudSun,        bg: 'bg-amber-400/15', fg: 'text-amber-400' },
  dinner:         { icon: Sunset,          bg: 'bg-orange-600/15', fg: 'text-orange-600' },
  evening:        { icon: MoonStar,        bg: 'bg-indigo-500/15', fg: 'text-indigo-500' },
  flexible:       { icon: Clock3,          bg: 'bg-slate-400/15', fg: 'text-slate-400' },
  // Durations
  quick:          { icon: Zap,             bg: 'bg-yellow-500/15', fg: 'text-yellow-500' },
  relaxed:        { icon: Hourglass,       bg: 'bg-teal-500/15', fg: 'text-teal-500' },
  extended:       { icon: Timer,           bg: 'bg-blue-500/15', fg: 'text-blue-500' },
  spontaneous:    { icon: Shuffle,         bg: 'bg-purple-400/15', fg: 'text-purple-400' },
  // Activities
  dining:         { icon: Wine,            bg: 'bg-red-500/15', fg: 'text-red-500' },
  dining_plus:    { icon: Tent,            bg: 'bg-pink-500/15', fg: 'text-pink-500' },
  cocktails:      { icon: Martini,         bg: 'bg-violet-500/15', fg: 'text-violet-500' },
  cultural_act:   { icon: Palette,         bg: 'bg-cyan-500/15', fg: 'text-cyan-500' },
  active:         { icon: Dumbbell,        bg: 'bg-rose-500/15', fg: 'text-rose-500' },
  nightlife_act:  { icon: PartyPopper,     bg: 'bg-fuchsia-500/15', fg: 'text-fuchsia-500' },
  // Entertainment
  live_music:          { icon: Guitar,         bg: 'bg-red-500/15', fg: 'text-red-500' },
  dj_playlist:         { icon: Headphones,     bg: 'bg-indigo-500/15', fg: 'text-indigo-500' },
  quiet_conversation:  { icon: MessageCircle,  bg: 'bg-sky-500/15', fg: 'text-sky-500' },
  games:               { icon: Gamepad2,       bg: 'bg-emerald-500/15', fg: 'text-emerald-500' },
  dancing:             { icon: Music4,         bg: 'bg-pink-500/15', fg: 'text-pink-500' },
  sports_viewing:      { icon: Tv,             bg: 'bg-blue-500/15', fg: 'text-blue-500' },
  // Dietary
  vegetarian:     { icon: Salad,           bg: 'bg-green-500/15', fg: 'text-green-500' },
  vegan:          { icon: Sprout,          bg: 'bg-lime-500/15', fg: 'text-lime-500' },
  gluten_free:    { icon: WheatOff,        bg: 'bg-amber-500/15', fg: 'text-amber-500' },
  dairy_free:     { icon: MilkOff,         bg: 'bg-sky-400/15', fg: 'text-sky-400' },
  halal:          { icon: CircleDot,       bg: 'bg-emerald-600/15', fg: 'text-emerald-600' },
  kosher:         { icon: Star,            bg: 'bg-blue-600/15', fg: 'text-blue-600' },
  // Accessibility
  wheelchair:       { icon: Accessibility,   bg: 'bg-blue-500/15', fg: 'text-blue-500' },
  parking:          { icon: ParkingCircle,   bg: 'bg-sky-500/15', fg: 'text-sky-500' },
  public_transport: { icon: TrainFront,      bg: 'bg-violet-500/15', fg: 'text-violet-500' },
  pet_friendly:     { icon: Dog,             bg: 'bg-amber-500/15', fg: 'text-amber-500' },
  non_smoking:      { icon: CigaretteOff,   bg: 'bg-red-500/15', fg: 'text-red-500' },
  // Templates
  template_romantic: { icon: Heart,          bg: 'bg-pink-500/15', fg: 'text-pink-500' },
  template_casual:   { icon: Coffee,         bg: 'bg-amber-500/15', fg: 'text-amber-500' },
  template_trendy:   { icon: Sparkles,       bg: 'bg-violet-500/15', fg: 'text-violet-500' },
};

function PrefIcon({ id, size = 'md' }: { id: string; size?: 'sm' | 'md' | 'lg' }) {
  const config = prefIconMap[id];
  if (!config) return null;
  const sizeClasses = {
    sm: 'w-8 h-8 [&_svg]:w-4 [&_svg]:h-4',
    md: 'w-10 h-10 [&_svg]:w-5 [&_svg]:h-5',
    lg: 'w-12 h-12 [&_svg]:w-6 [&_svg]:h-6',
  };
  return (
    <div className={cn(
      'rounded-xl flex items-center justify-center flex-shrink-0',
      config.bg, sizeClasses[size]
    )}>
      {config.labIcon ? (
        <Icon iconNode={config.labIcon} className={cn(config.fg)} />
      ) : config.icon ? (
        <config.icon className={cn(config.fg)} />
      ) : null}
    </div>
  );
}

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
  const { t } = useTranslation();
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
      title: t('preferences.romanticDinner'),
      emoji: '💕',
      description: t('preferences.romanticDinnerDesc'),
      cuisines: ['italian', 'french'],
      vibes: ['romantic'],
      priceRange: [2, 3],
      timePreference: 'dinner',
      activities: ['dining']
    },
    {
      id: 'casual',
      title: t('preferences.casualBrunch'),
      emoji: '☕',
      description: t('preferences.casualBrunchDesc'),
      cuisines: ['american'],
      vibes: ['casual'],
      priceRange: [1, 2],
      timePreference: 'brunch',
      activities: ['dining']
    },
    {
      id: 'trendy',
      title: t('preferences.trendyCocktail'),
      emoji: '🍸',
      description: t('preferences.trendyCocktailDesc'),
      cuisines: ['modern'],
      vibes: ['nightlife'],
      priceRange: [2, 3],
      timePreference: 'evening',
      activities: ['cocktails']
    }
  ];

  // Data definitions
  const cuisines: Preference[] = [
    { id: 'italian', name: t('preferences.cuisine_italian'), emoji: '🍝' },
    { id: 'japanese', name: t('preferences.cuisine_japanese'), emoji: '🍣' },
    { id: 'mexican', name: t('preferences.cuisine_mexican'), emoji: '🌮' },
    { id: 'french', name: t('preferences.cuisine_french'), emoji: '🥐' },
    { id: 'indian', name: t('preferences.cuisine_indian'), emoji: '🍛' },
    { id: 'mediterranean', name: t('preferences.cuisine_mediterranean'), emoji: '🫒' },
    { id: 'american', name: t('preferences.cuisine_american'), emoji: '🍔' },
    { id: 'thai', name: t('preferences.cuisine_thai'), emoji: '🍜' },
    { id: 'chinese', name: t('preferences.cuisine_chinese'), emoji: '🥢' },
    { id: 'korean', name: t('preferences.cuisine_korean'), emoji: '🍲' }
  ];

  const vibes: Preference[] = [
    { id: 'romantic', name: t('preferences.vibe_romantic'), emoji: '💕', desc: t('preferences.vibe_romanticDesc') },
    { id: 'casual', name: t('preferences.vibe_casual'), emoji: '😊', desc: t('preferences.vibe_casualDesc') },
    { id: 'outdoor', name: t('preferences.vibe_outdoor'), emoji: '🌳', desc: t('preferences.vibe_outdoorDesc') },
    { id: 'nightlife', name: t('preferences.vibe_nightlife'), emoji: '🌃', desc: t('preferences.vibe_nightlifeDesc') },
    { id: 'cultural', name: t('preferences.vibe_cultural'), emoji: '🎭', desc: t('preferences.vibe_culturalDesc') },
    { id: 'adventurous', name: t('preferences.vibe_adventurous'), emoji: '🗺️', desc: t('preferences.vibe_adventurousDesc') }
  ];

  const priceRanges: Preference[] = [
    { id: 'budget', name: t('preferences.price_budget'), emoji: '💰', desc: t('preferences.price_budgetDesc') },
    { id: 'moderate', name: t('preferences.price_moderate'), emoji: '💳', desc: t('preferences.price_moderateDesc') },
    { id: 'upscale', name: t('preferences.price_upscale'), emoji: '💎', desc: t('preferences.price_upscaleDesc') },
    { id: 'luxury', name: t('preferences.price_luxury'), emoji: '👑', desc: t('preferences.price_luxuryDesc') }
  ];

  const timePreferences: Preference[] = [
    { id: 'brunch', name: t('preferences.time_brunch'), emoji: '🌅', desc: t('preferences.time_brunchDesc') },
    { id: 'lunch', name: t('preferences.time_lunch'), emoji: '☀️', desc: t('preferences.time_lunchDesc') },
    { id: 'afternoon', name: t('preferences.time_afternoon'), emoji: '🌤️', desc: t('preferences.time_afternoonDesc') },
    { id: 'dinner', name: t('preferences.time_dinner'), emoji: '🌆', desc: t('preferences.time_dinnerDesc') },
    { id: 'evening', name: t('preferences.time_evening'), emoji: '🌙', desc: t('preferences.time_eveningDesc') },
    { id: 'flexible', name: t('preferences.time_flexible'), emoji: '🕐', desc: t('preferences.time_flexibleDesc') }
  ];

  const durations: Preference[] = [
    { id: 'quick', name: t('preferences.duration_quick'), emoji: '⚡', desc: t('preferences.duration_quickDesc') },
    { id: 'relaxed', name: t('preferences.duration_relaxed'), emoji: '⏰', desc: t('preferences.duration_relaxedDesc') },
    { id: 'extended', name: t('preferences.duration_extended'), emoji: '🕐', desc: t('preferences.duration_extendedDesc') },
    { id: 'spontaneous', name: t('preferences.duration_spontaneous'), emoji: '🤷', desc: t('preferences.duration_spontaneousDesc') }
  ];

  const activities: Preference[] = [
    { id: 'dining', name: t('preferences.activity_dining'), emoji: '🍽️', desc: t('preferences.activity_diningDesc') },
    { id: 'dining_plus', name: t('preferences.activity_dining_plus'), emoji: '🎪', desc: t('preferences.activity_dining_plusDesc') },
    { id: 'cocktails', name: t('preferences.activity_cocktails'), emoji: '🍸', desc: t('preferences.activity_cocktailsDesc') },
    { id: 'cultural', name: t('preferences.activity_cultural'), emoji: '🎨', desc: t('preferences.activity_culturalDesc') },
    { id: 'active', name: t('preferences.activity_active'), emoji: '🎳', desc: t('preferences.activity_activeDesc') },
    { id: 'nightlife', name: t('preferences.activity_nightlife'), emoji: '🎉', desc: t('preferences.activity_nightlifeDesc') }
  ];

  const entertainment: Preference[] = [
    { id: 'live_music', name: t('preferences.ent_live_music'), emoji: '🎵' },
    { id: 'dj_playlist', name: t('preferences.ent_dj_playlist'), emoji: '🎧' },
    { id: 'quiet_conversation', name: t('preferences.ent_quiet_conversation'), emoji: '💬' },
    { id: 'games', name: t('preferences.ent_games'), emoji: '🎮' },
    { id: 'dancing', name: t('preferences.ent_dancing'), emoji: '💃' },
    { id: 'sports_viewing', name: t('preferences.ent_sports_viewing'), emoji: '📺' }
  ];

  const dietaryRequirements: Preference[] = [
    { id: 'vegetarian', name: t('preferences.dietary_vegetarian'), emoji: '🥬' },
    { id: 'vegan', name: t('preferences.dietary_vegan'), emoji: '🌱' },
    { id: 'gluten_free', name: t('preferences.dietary_gluten_free'), emoji: '🚫' },
    { id: 'dairy_free', name: t('preferences.dietary_dairy_free'), emoji: '🥛' },
    { id: 'halal', name: t('preferences.dietary_halal'), emoji: '☪️' },
    { id: 'kosher', name: t('preferences.dietary_kosher'), emoji: '✡️' }
  ];

  const accessibilityNeeds: Preference[] = [
    { id: 'wheelchair', name: t('preferences.access_wheelchair'), emoji: '♿' },
    { id: 'parking', name: t('preferences.access_parking'), emoji: '🅿️' },
    { id: 'public_transport', name: t('preferences.access_public_transport'), emoji: '🚇' },
    { id: 'pet_friendly', name: t('preferences.access_pet_friendly'), emoji: '🐕' },
    { id: 'non_smoking', name: t('preferences.access_non_smoking'), emoji: '🚭' }
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
      setLocationError(t('preferences.locationNotSupported'));
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
      setLocationError(t('preferences.locationError'));
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
            title: t('preferences.prefsSaved'),
            description: t('preferences.prefsSavedDesc'),
          });
        } catch (error) {
          console.error('Error saving preferences:', error);
          toast({
            variant: 'destructive',
            title: t('preferences.prefsError'),
            description: t('preferences.prefsErrorDesc'),
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
      case 1: return t('preferences.foodAndVibe');
      case 2: return t('preferences.budgetAndTiming');
      case 3: return t('preferences.activities');
      case 4: return t('preferences.specialNeeds');
      default: return t('preferences.foodAndVibe');
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
        <h2 className="text-xl font-bold text-foreground mb-2">{t('preferences.quickStart')}</h2>
        <p className="text-muted-foreground mb-4">{t('preferences.orChooseTemplate')}</p>
        <div className="grid grid-cols-1 gap-3">
          {quickTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => applyQuickTemplate(template)}
              className="p-4 rounded-xl border-2 border-border bg-card hover:bg-accent/50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <PrefIcon id={'template_' + template.id} size="lg" />
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
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('preferences.whatCraving')}</h2>
        <p className="text-muted-foreground mb-6">{t('preferences.chooseCuisines')}</p>
        
        <div className="grid grid-cols-2 gap-3">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine.id}
              onClick={() => toggleSelection(cuisine.id, selectedCuisines, setSelectedCuisines)}
              className={`p-4 rounded-xl border-2 transition-none ${
                selectedCuisines.includes(cuisine.id)
                  ? 'bg-card border-primary text-foreground'
                  : 'bg-card border-border text-foreground'
              }`}
            >
              <PrefIcon id={cuisine.id} />
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
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('preferences.whatVibe')}</h2>
        <p className="text-muted-foreground mb-6">{t('preferences.chooseAtmosphere')}</p>
        
        <div className="space-y-3">
          {vibes.map((vibe) => (
            <button
              key={vibe.id}
              onClick={() => toggleSelection(vibe.id, selectedVibes, setSelectedVibes)}
              className={`w-full p-4 rounded-xl border-2 transition-none ${
                selectedVibes.includes(vibe.id)
                  ? 'bg-card border-primary text-foreground'
                  : 'bg-card border-border text-foreground'
              }`}
            >
              <div className="flex items-center gap-4">
                <PrefIcon id={vibe.id} />
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
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('preferences.whatBudget')}</h2>
        <p className="text-muted-foreground mb-6">{t('preferences.selectPriceRange')}</p>
        
        <div className="space-y-3">
          {priceRanges.map((price) => (
            <button
              key={price.id}
              onClick={() => toggleSelection(price.id, selectedPriceRange, setSelectedPriceRange)}
              className={`w-full p-4 rounded-xl border-2 transition-none ${
                selectedPriceRange.includes(price.id)
                  ? 'bg-card border-primary text-foreground'
                  : 'bg-card border-border text-foreground'
              }`}
            >
              <div className="flex items-center gap-4">
                <PrefIcon id={price.id} />
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
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('preferences.whenBest')}</h2>
        <p className="text-muted-foreground mb-6">{t('preferences.chooseTiming')}</p>
        
        <div className="grid grid-cols-2 gap-3">
          {timePreferences.map((time) => (
            <button
              key={time.id}
              onClick={() => toggleSelection(time.id, selectedTimePreferences, setSelectedTimePreferences)}
              className={`p-4 rounded-xl border-2 transition-none ${
                selectedTimePreferences.includes(time.id)
                  ? 'bg-card border-primary text-foreground'
                  : 'bg-card border-border text-foreground'
              }`}
            >
              <PrefIcon id={time.id} />
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
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('preferences.howLong')}</h2>
        <p className="text-muted-foreground mb-6">{t('preferences.chooseDuration')}</p>
        
        <div className="space-y-3">
          {durations.map((duration) => (
            <button
              key={duration.id}
              onClick={() => toggleSingleSelection(duration.id, setSelectedDuration)}
              className={`w-full p-4 rounded-xl border-2 transition-none ${
                selectedDuration === duration.id
                  ? 'bg-card border-primary text-foreground'
                  : 'bg-card border-border text-foreground'
              }`}
            >
              <div className="flex items-center gap-4">
                <PrefIcon id={duration.id} />
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
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('preferences.whatActivity')}</h2>
        <p className="text-muted-foreground mb-6">{t('preferences.whatToDo')}</p>
        
        <div className="space-y-3">
          {activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => toggleSelection(activity.id, selectedActivities, setSelectedActivities)}
              className={`w-full p-4 rounded-xl border-2 transition-none ${
                selectedActivities.includes(activity.id)
                  ? 'bg-card border-primary text-foreground'
                  : 'bg-card border-border text-foreground'
              }`}
            >
              <div className="flex items-center gap-4">
                <PrefIcon id={activity.id === 'cultural' ? 'cultural_act' : activity.id === 'nightlife' ? 'nightlife_act' : activity.id} />
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
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('preferences.whatEntertainment')}</h2>
        <p className="text-muted-foreground mb-6">{t('preferences.howEntertained')}</p>
        
        <div className="grid grid-cols-2 gap-3">
          {entertainment.map((ent) => (
            <button
              key={ent.id}
              onClick={() => toggleSelection(ent.id, selectedEntertainment, setSelectedEntertainment)}
              className={`p-4 rounded-xl border-2 transition-none ${
                selectedEntertainment.includes(ent.id)
                  ? 'bg-card border-primary text-foreground'
                  : 'bg-card border-border text-foreground'
              }`}
            >
              <PrefIcon id={ent.id} />
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
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('preferences.homeLocation')}</h2>
        <p className="text-muted-foreground mb-4">{t('preferences.setDefaultLocation')}</p>
        
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
              {t('preferences.gettingLocation')}
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              {t('preferences.useCurrentLocation')}
            </>
          )}
        </Button>
        
        {/* Manual Address Input */}
        <div className="relative">
          <Input
            type="text"
            placeholder={t('preferences.enterAddress')}
            value={homeAddress}
            onChange={(e) => setHomeAddress(e.target.value)}
            className="w-full h-12 pl-10"
          />
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
        
        {/* Display Coordinates and Map if Set */}
        {homeLatitude && homeLongitude && (
          <>
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-800 dark:text-green-300">
                    {t('preferences.locationSaved')} {homeAddress || `${homeLatitude.toFixed(4)}, ${homeLongitude.toFixed(4)}`}
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
            
            {/* Map Preview */}
            <div className="mt-4">
              <Suspense fallback={<Skeleton className="h-[180px] w-full rounded-lg" />}>
                <MapPreview 
                  latitude={homeLatitude}
                  longitude={homeLongitude}
                  address={homeAddress}
                  height="180px"
                  zoom={14}
                />
              </Suspense>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {t('preferences.yourSavedLocation')}
              </p>
            </div>
          </>
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
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('preferences.dietaryRequirements')}</h2>
        <p className="text-muted-foreground mb-6">{t('preferences.letUsKnow')}</p>
        
        <div className="grid grid-cols-2 gap-3">
          {dietaryRequirements.map((dietary) => (
            <button
              key={dietary.id}
              onClick={() => toggleSelection(dietary.id, selectedDietary, setSelectedDietary)}
              className={`p-4 rounded-xl border-2 transition-none ${
                selectedDietary.includes(dietary.id)
                  ? 'bg-card border-primary text-foreground'
                  : 'bg-card border-border text-foreground'
              }`}
            >
              <PrefIcon id={dietary.id} />
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
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('preferences.specialNeedsTitle')}</h2>
        <p className="text-muted-foreground mb-6">{t('preferences.accessibilityFeatures')}</p>
        
        <div className="space-y-3">
          {accessibilityNeeds.map((access) => (
            <button
              key={access.id}
              onClick={() => toggleSelection(access.id, selectedAccessibility, setSelectedAccessibility)}
              className={`w-full p-4 rounded-xl border-2 transition-none ${
                selectedAccessibility.includes(access.id)
                  ? 'bg-card border-primary text-foreground'
                  : 'bg-card border-border text-foreground'
              }`}
            >
              <div className="flex items-center gap-4">
                <PrefIcon id={access.id} />
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
            <p className="text-sm text-muted-foreground">{t('preferences.step', { current: currentStep, total: totalSteps })}</p>
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
                {t('common.back')}
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
                  {t('preferences.saving')}
                </>
              ) : currentStep === totalSteps ? (
                t('preferences.findDates')
              ) : (
                t('common.next')
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
                {t('preferences.skipStep')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Preferences;
