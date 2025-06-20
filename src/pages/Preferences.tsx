
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

const Preferences = () => {
  const navigate = useNavigate();
  const { updateCuisines, updateVibes } = useApp();
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [groupSize, setGroupSize] = useState<string>('alone');

  const cuisines = [
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

  const vibes = [
    { id: 'romantic', name: 'Romantic', emoji: '💕', desc: 'Intimate and cozy' },
    { id: 'casual', name: 'Casual', emoji: '😊', desc: 'Relaxed and comfortable' },
    { id: 'outdoor', name: 'Outdoor', emoji: '🌳', desc: 'Fresh air and nature' },
    { id: 'nightlife', name: 'Nightlife', emoji: '🌃', desc: 'Vibrant and energetic' },
    { id: 'cultural', name: 'Cultural', emoji: '🎭', desc: 'Arts and history' },
    { id: 'adventurous', name: 'Adventurous', emoji: '🗺️', desc: 'Something new and exciting' }
  ];

  const categories = [
    { id: 'lounge', name: 'Lounge' },
    { id: 'sushi', name: 'Sushi' },
    { id: 'bars', name: 'Bars' },
    { id: 'clubs', name: 'Clubs' },
    { id: 'coffee', name: 'Coffee' },
    { id: 'cinema', name: 'Cinema' },
    { id: 'restaurant', name: 'Restaurant' },
    { id: 'vegan', name: 'Vegan' },
    { id: 'brunch', name: 'Brunch' },
    { id: 'breakfast', name: 'Breakfast' },
    { id: 'theatre', name: 'Theatre' },
    { id: 'pizzeria', name: 'Pizzeria' },
    { id: 'museum', name: 'Museum' },
    { id: 'seafood', name: 'Seafood' },
    { id: 'ice-cream', name: 'Ice-Cream' },
    { id: 'minigolf', name: 'Minigolf' }
  ];

  const groupSizeOptions = [
    { id: 'alone', label: "I'm alone" },
    { id: 'two', label: 'There are two of us' },
    { id: 'group', label: 'We are a group (+3 person)' }
  ];

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const toggleVibe = (vibe: string) => {
    setSelectedVibes(prev =>
      prev.includes(vibe)
        ? prev.filter(v => v !== vibe)
        : [...prev, vibe]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

  const handleNext = () => {
    updateCuisines(selectedCuisines);
    updateVibes(selectedVibes);
    navigate('/friends');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12 bg-white shadow-sm">
        <Button
          onClick={() => navigate('/welcome')}
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Preferences</h1>
          <p className="text-sm text-gray-600">Step 1 of 3</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-8 pt-4">
        <div className="bg-gray-200 rounded-full h-2">
          <div className="bg-datespot-gradient rounded-full h-2 w-1/3 transition-all duration-300" />
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* Cuisine Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">What are you craving?</h2>
          <p className="text-gray-600 mb-6">Choose your favorite cuisines</p>
          
          <div className="grid grid-cols-2 gap-3">
            {cuisines.map((cuisine) => (
              <button
                key={cuisine.id}
                onClick={() => toggleCuisine(cuisine.id)}
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

        {/* Date Spot Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">What is your favorite date spot?</h2>
            <Button 
              onClick={clearAllCategories}
              variant="ghost"
              className="text-orange-500 hover:text-orange-600 text-sm font-medium"
            >
              Clear all
            </Button>
          </div>
          <p className="text-gray-600 mb-6">In order to get best results choose from the options</p>
          
          <div className="grid grid-cols-3 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                  selectedCategories.includes(category.id)
                    ? 'bg-orange-400 text-white border-orange-400'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Group Size Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Who is with you today?</h2>
          <p className="text-gray-600 mb-6">Let us know if you are solo or with company</p>
          
          <RadioGroup value={groupSize} onValueChange={setGroupSize} className="space-y-4">
            {groupSizeOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                <RadioGroupItem 
                  value={option.id} 
                  id={option.id}
                  className="border-2 border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor={option.id} className="text-gray-900 font-medium cursor-pointer flex-1">
                  {option.label}
                </label>
              </div>
            ))}
          </RadioGroup>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm mb-2">Are you with a bigger group?</p>
            <Button variant="link" className="text-orange-500 hover:text-orange-600 font-medium">
              Invite here
            </Button>
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
                onClick={() => toggleVibe(vibe.id)}
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

        {/* Bottom Note */}
        <div className="mb-8 text-center">
          <p className="text-gray-400 text-xs">
            *You can always customize and adjust your preferences in the account setting
          </p>
        </div>

        {/* Next Button */}
        <Button
          onClick={handleNext}
          disabled={selectedCuisines.length === 0 || selectedVibes.length === 0}
          className="w-full h-12 bg-orange-400 hover:bg-orange-500 text-white font-semibold disabled:opacity-50"
        >
          Confirm & Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Preferences;
