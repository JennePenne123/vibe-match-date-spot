
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, ArrowRight, Check, Calendar } from 'lucide-react';

const Preferences = () => {
  const navigate = useNavigate();
  const { updateCuisines, updateVibes } = useApp();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGroupSize, setSelectedGroupSize] = useState<string>('alone');

  const categories = [
    { id: 'lounge', name: 'Lounge', emoji: '🍸' },
    { id: 'sushi', name: 'Sushi', emoji: '🍣' },
    { id: 'bars', name: 'Bars', emoji: '🍻' },
    { id: 'clubs', name: 'Clubs', emoji: '🎵' },
    { id: 'coffee', name: 'Coffee', emoji: '☕' },
    { id: 'cinema', name: 'Cinema', emoji: '🎬' },
    { id: 'restaurant', name: 'Restaurant', emoji: '🍽️' },
    { id: 'vegan', name: 'Vegan', emoji: '🥗' },
    { id: 'brunch', name: 'Brunch', emoji: '🥐' },
    { id: 'breakfast', name: 'Breakfast', emoji: '🍳' },
    { id: 'theatre', name: 'Theatre', emoji: '🎭' },
    { id: 'pizzeria', name: 'Pizzeria', emoji: '🍕' },
    { id: 'museum', name: 'Museum', emoji: '🏛️' },
    { id: 'seafood', name: 'Seafood', emoji: '🦐' },
    { id: 'ice-cream', name: 'Ice-Cream', emoji: '🍦' },
    { id: 'minigolf', name: 'Minigolf', emoji: '⛳' }
  ];

  const groupSizes = [
    { id: 'alone', label: "I'm alone", desc: 'Solo experience' },
    { id: 'couple', label: 'There are two of us', desc: 'Couple or pair' },
    { id: 'group', label: 'We are a group (+3 person)', desc: 'Group activity' }
  ];

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleNext = () => {
    updateCuisines(selectedCategories);
    updateVibes([selectedGroupSize]);
    navigate('/friends');
  };

  const clearAll = () => {
    setSelectedCategories([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vyybmtch-soft-purple via-vyybmtch-light-purple to-white">
      <div className="max-w-md mx-auto">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-vyybmtch-deep-purple to-vyybmtch-purple px-6 pt-12 pb-8 rounded-b-[2rem] shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={() => navigate('/welcome')}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="w-10" />
          </div>

          <div className="text-center text-white mb-6">
            <h1 className="text-3xl font-bold mb-2">What is your favorite date Spot?</h1>
            <p className="text-white/80 text-lg">In order to get best results chose from the options</p>
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2">
            <div className="h-1 w-16 bg-vyybmtch-sunrise rounded-full" />
            <div className="h-1 w-16 bg-white/30 rounded-full" />
            <div className="h-1 w-16 bg-white/30 rounded-full" />
          </div>
        </div>

        <div className="px-6 py-8">
          {/* Categories Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-vyybmtch-deep-purple">Categories</h2>
              <Button
                onClick={clearAll}
                variant="ghost"
                className="text-vyybmtch-sunrise hover:bg-vyybmtch-light-purple/50 font-semibold"
              >
                Clear all
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 animate-scale-in ${
                    selectedCategories.includes(category.id)
                      ? 'bg-gradient-to-br from-vyybmtch-sunrise to-vyybmtch-coral border-vyybmtch-coral text-white shadow-lg scale-105'
                      : 'bg-white/80 border-gray-200 text-vyybmtch-deep-purple hover:bg-vyybmtch-light-purple/30 hover:border-vyybmtch-purple/30'
                  }`}
                >
                  <div className="text-xl mb-2">{category.emoji}</div>
                  <div className="font-medium text-sm">{category.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Group Size Selection */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-vyybmtch-purple" />
              <h2 className="text-2xl font-bold text-vyybmtch-deep-purple">Who is with you today?</h2>
            </div>
            <p className="text-vyybmtch-purple/70 mb-6">Let us know if you are solo or with company</p>
            
            <RadioGroup value={selectedGroupSize} onValueChange={setSelectedGroupSize} className="space-y-4">
              {groupSizes.map((size) => (
                <div key={size.id} className="flex items-center space-x-4">
                  <RadioGroupItem 
                    value={size.id} 
                    id={size.id}
                    className="border-2 border-vyybmtch-purple data-[state=checked]:bg-vyybmtch-sunrise data-[state=checked]:border-vyybmtch-sunrise"
                  />
                  <label 
                    htmlFor={size.id} 
                    className="flex-1 cursor-pointer p-4 rounded-xl bg-white/60 hover:bg-vyybmtch-light-purple/30 transition-all"
                  >
                    <div className="font-semibold text-vyybmtch-deep-purple">{size.label}</div>
                    <div className="text-sm text-vyybmtch-purple/70">{size.desc}</div>
                  </label>
                </div>
              ))}
            </RadioGroup>

            <div className="mt-6 text-center">
              <p className="text-vyybmtch-purple/60 text-sm mb-2">Are you with a bigger group?</p>
              <Button variant="ghost" className="text-vyybmtch-sunrise hover:bg-vyybmtch-light-purple/50 font-semibold">
                Invite here
              </Button>
            </div>
          </div>

          <div className="text-center text-sm text-vyybmtch-purple/60 mb-8">
            *You can always customize and adjust your preferences in the account setting
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleNext}
            disabled={selectedCategories.length === 0}
            className="w-full h-14 bg-gradient-to-r from-vyybmtch-sunrise to-vyybmtch-coral text-white hover:opacity-90 font-bold text-lg rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            Confirm & Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
