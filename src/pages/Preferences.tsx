import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Clock, DollarSign, MapPin, Settings, Coffee, Heart } from 'lucide-react';

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
  
  // Step 4: Special Requirements
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedAccessibility, setSelectedAccessibility] = useState<string[]>([]);

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

  const handleNext = () => {
    if (currentStep === totalSteps) {
      // Final submission
      updateCuisines(selectedCuisines);
      updateVibes(selectedVibes);
      // Here you would also update other preferences
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
      case 4: return 'Special Needs';
      default: return 'Preferences';
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 1: return <Heart className="w-5 h-5" />;
      case 2: return <Clock className="w-5 h-5" />;
      case 3: return <Coffee className="w-5 h-5" />;
      case 4: return <Settings className="w-5 h-5" />;
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
        <h2 className="text-xl font-bold text-gray-900 mb-2">Quick Start</h2>
        <p className="text-gray-600 mb-4">Or choose a ready-made template</p>
        <div className="grid grid-cols-1 gap-3">
          {quickTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => applyQuickTemplate(template)}
              className="p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{template.emoji}</div>
                <div>
                  <div className="font-semibold text-gray-900">{template.title}</div>
                  <div className="text-sm text-gray-600">{template.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What are you craving?</h2>
        <p className="text-gray-600 mb-6">Choose your favorite cuisines</p>
        
        <div className="grid grid-cols-2 gap-3">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine.id}
              onClick={() => toggleSelection(cuisine.id, selectedCuisines, setSelectedCuisines)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedCuisines.includes(cuisine.id)
                  ? 'bg-datespot-light-pink border-datespot-pink text-datespot-dark-pink'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What vibe are you going for?</h2>
        <p className="text-gray-600 mb-6">Choose the perfect atmosphere for your date</p>
        
        <div className="space-y-3">
          {vibes.map((vibe) => (
            <button
              key={vibe.id}
              onClick={() => toggleSelection(vibe.id, selectedVibes, setSelectedVibes)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedVibes.includes(vibe.id)
                  ? 'bg-datespot-light-pink border-datespot-pink text-datespot-dark-pink'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{vibe.emoji}</div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{vibe.name}</div>
                  <div className={`text-sm ${selectedVibes.includes(vibe.id) ? 'text-datespot-dark-pink' : 'text-gray-500'}`}>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your budget?</h2>
        <p className="text-gray-600 mb-6">Select your preferred price range</p>
        
        <div className="space-y-3">
          {priceRanges.map((price) => (
            <button
              key={price.id}
              onClick={() => toggleSelection(price.id, selectedPriceRange, setSelectedPriceRange)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedPriceRange.includes(price.id)
                  ? 'bg-datespot-light-pink border-datespot-pink text-datespot-dark-pink'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{price.emoji}</div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{price.name}</div>
                  <div className={`text-sm ${selectedPriceRange.includes(price.id) ? 'text-datespot-dark-pink' : 'text-gray-500'}`}>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">When works best?</h2>
        <p className="text-gray-600 mb-6">Choose your preferred timing</p>
        
        <div className="grid grid-cols-2 gap-3">
          {timePreferences.map((time) => (
            <button
              key={time.id}
              onClick={() => toggleSelection(time.id, selectedTimePreferences, setSelectedTimePreferences)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedTimePreferences.includes(time.id)
                  ? 'bg-datespot-light-pink border-datespot-pink text-datespot-dark-pink'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-1">{time.emoji}</div>
              <div className="font-medium text-sm">{time.name}</div>
              <div className={`text-xs ${selectedTimePreferences.includes(time.id) ? 'text-datespot-dark-pink' : 'text-gray-500'}`}>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">How long should it last?</h2>
        <p className="text-gray-600 mb-6">Choose your ideal date duration</p>
        
        <div className="space-y-3">
          {durations.map((duration) => (
            <button
              key={duration.id}
              onClick={() => toggleSingleSelection(duration.id, setSelectedDuration)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedDuration === duration.id
                  ? 'bg-datespot-light-pink border-datespot-pink text-datespot-dark-pink'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{duration.emoji}</div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{duration.name}</div>
                  <div className={`text-sm ${selectedDuration === duration.id ? 'text-datespot-dark-pink' : 'text-gray-500'}`}>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What type of activity?</h2>
        <p className="text-gray-600 mb-6">What do you want to do together?</p>
        
        <div className="space-y-3">
          {activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => toggleSelection(activity.id, selectedActivities, setSelectedActivities)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedActivities.includes(activity.id)
                  ? 'bg-datespot-light-pink border-datespot-pink text-datespot-dark-pink'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{activity.emoji}</div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{activity.name}</div>
                  <div className={`text-sm ${selectedActivities.includes(activity.id) ? 'text-datespot-dark-pink' : 'text-gray-500'}`}>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What entertainment?</h2>
        <p className="text-gray-600 mb-6">How do you like to be entertained?</p>
        
        <div className="grid grid-cols-2 gap-3">
          {entertainment.map((ent) => (
            <button
              key={ent.id}
              onClick={() => toggleSelection(ent.id, selectedEntertainment, setSelectedEntertainment)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedEntertainment.includes(ent.id)
                  ? 'bg-datespot-light-pink border-datespot-pink text-datespot-dark-pink'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
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
      {/* Dietary Requirements */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Any dietary requirements?</h2>
        <p className="text-gray-600 mb-6">Let us know your dietary needs</p>
        
        <div className="grid grid-cols-2 gap-3">
          {dietaryRequirements.map((dietary) => (
            <button
              key={dietary.id}
              onClick={() => toggleSelection(dietary.id, selectedDietary, setSelectedDietary)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedDietary.includes(dietary.id)
                  ? 'bg-datespot-light-pink border-datespot-pink text-datespot-dark-pink'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Any special needs?</h2>
        <p className="text-gray-600 mb-6">What accessibility features do you need?</p>
        
        <div className="space-y-3">
          {accessibilityNeeds.map((access) => (
            <button
              key={access.id}
              onClick={() => toggleSelection(access.id, selectedAccessibility, setSelectedAccessibility)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedAccessibility.includes(access.id)
                  ? 'bg-datespot-light-pink border-datespot-pink text-datespot-dark-pink'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-12 bg-white shadow-sm">
          <Button
            onClick={currentStep === 1 ? () => navigate('/welcome') : prevStep}
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              {getStepIcon()}
              <h1 className="text-xl font-semibold text-gray-900">{getStepTitle()}</h1>
            </div>
            <p className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="px-6 mb-8 pt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-datespot-gradient rounded-full h-2 transition-all duration-300" 
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
                className="flex-1 h-12 border-datespot-pink text-datespot-pink hover:bg-datespot-light-pink"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`h-12 bg-datespot-gradient text-white hover:opacity-90 font-semibold disabled:opacity-50 ${
                currentStep === 1 ? 'w-full' : 'flex-1'
              }`}
            >
              {currentStep === totalSteps ? 'Find Dates!' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Skip Option for Optional Steps */}
          {currentStep > 1 && (
            <div className="text-center mt-4">
              <Button
                onClick={handleNext}
                variant="ghost"
                className="text-gray-500 hover:text-gray-700"
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