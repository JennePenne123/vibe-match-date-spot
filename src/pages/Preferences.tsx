
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';

const Preferences = () => {
  const navigate = useNavigate();
  const { updateCuisines, updateVibes } = useApp();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

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

  const handleNext = () => {
    updateCuisines(selectedCuisines);
    updateVibes(selectedVibes);
    navigate(isDemoMode ? '/friends?demo=true' : '/friends');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vyy-soft via-vyy-glow to-vyy-warm">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-12 bg-white/70 backdrop-blur-sm shadow-sm">
          <Button
            onClick={() => navigate(isDemoMode ? '/welcome?demo=true' : '/welcome')}
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:bg-white/50 rounded-2xl"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 text-organic">Preferences</h1>
            <p className="text-sm text-gray-600">Step 1 of 3</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="px-6 mb-8 pt-4">
          <div className="bg-white/50 rounded-full h-3 backdrop-blur-sm">
            <div className="bg-vyy-primary rounded-full h-3 w-1/3 transition-all duration-300 animate-pulse-glow" />
          </div>
        </div>

        <div className="px-6 pb-8">
          {/* Cuisine Selection */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 text-expressive text-organic">What are you craving?</h2>
              <p className="text-gray-700 text-lg">Choose your favorite cuisines ✨</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {cuisines.map((cuisine) => (
                <button
                  key={cuisine.id}
                  onClick={() => toggleCuisine(cuisine.id)}
                  className={`organic-card p-6 transition-all duration-300 ${
                    selectedCuisines.includes(cuisine.id)
                      ? 'bg-vyy-primary text-white shadow-2xl transform scale-105 animate-pulse-glow'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:shadow-xl hover:scale-105'
                  }`}
                >
                  <div className="text-3xl mb-2 animate-float">{cuisine.emoji}</div>
                  <div className="font-semibold text-sm text-organic">{cuisine.name}</div>
                  {selectedCuisines.includes(cuisine.id) && (
                    <Check className="w-5 h-5 mx-auto mt-2 animate-scale-in" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Vibe Selection */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 text-expressive text-organic">What vibe are you going for?</h2>
              <p className="text-gray-700 text-lg">Choose the perfect atmosphere for your date 💫</p>
            </div>
            
            <div className="space-y-4">
              {vibes.map((vibe) => (
                <button
                  key={vibe.id}
                  onClick={() => toggleVibe(vibe.id)}
                  className={`organic-card w-full p-6 transition-all duration-300 ${
                    selectedVibes.includes(vibe.id)
                      ? 'bg-vyy-secondary text-white shadow-2xl transform scale-105'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl animate-float">{vibe.emoji}</div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-lg text-organic">{vibe.name}</div>
                      <div className={`text-sm ${selectedVibes.includes(vibe.id) ? 'text-white/90' : 'text-gray-600'}`}>
                        {vibe.desc}
                      </div>
                    </div>
                    {selectedVibes.includes(vibe.id) && (
                      <Check className="w-6 h-6 animate-scale-in" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <Button
            onClick={handleNext}
            disabled={selectedCuisines.length === 0 || selectedVibes.length === 0}
            className="w-full h-14 bg-vyy-primary hover:opacity-90 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 animate-organic-morph"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Next: Invite Friends
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
