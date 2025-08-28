
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Clock, Sparkles, Loader2, AlertCircle, Navigation, Check } from 'lucide-react';

const Area = () => {
  const navigate = useNavigate();
  const { updateArea, generateRecommendations, appState, requestLocation } = useApp();
  const [selectedArea, setSelectedArea] = useState('');

  const areas = [
    {
      id: 'downtown',
      name: 'Downtown',
      description: 'Urban vibes with trendy restaurants and rooftop bars',
      emoji: '🏙️',
      time: '10-15 min drive',
      venues: 24
    },
    {
      id: 'waterfront',
      name: 'Waterfront',
      description: 'Scenic views with seafood and sunset spots',
      emoji: '🌊',
      time: '15-20 min drive',
      venues: 18
    },
    {
      id: 'arts-district',
      name: 'Arts District',
      description: 'Creative atmosphere with galleries and jazz clubs',
      emoji: '🎨',
      time: '8-12 min drive',
      venues: 16
    },
    {
      id: 'oldtown',
      name: 'Old Town',
      description: 'Historic charm with cozy cafes and wine bars',
      emoji: '🏛️',
      time: '12-18 min drive',
      venues: 22
    },
    {
      id: 'uptown',
      name: 'Uptown',
      description: 'Upscale dining and sophisticated cocktail lounges',
      emoji: '✨',
      time: '5-10 min drive',
      venues: 19
    }
  ];

  // Request location when component mounts
  useEffect(() => {
    if (!appState.userLocation && !appState.locationError) {
      requestLocation();
    }
  }, []);

  const handleNext = async () => {
    if (selectedArea) {
      const selectedAreaData = areas.find(area => area.id === selectedArea);
      updateArea(selectedAreaData?.name || selectedArea);
      
      await generateRecommendations();
      navigate('/results');
    }
  };

  const handleRequestLocation = async () => {
    await requestLocation();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-12 bg-white shadow-sm">
          <Button
            onClick={() => navigate('/friends')}
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:bg-gray-100"
            disabled={appState.isLoading}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">Choose Area</h1>
            <p className="text-sm text-gray-600">Step 3 of 3</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="px-6 mb-8 pt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-primary rounded-full h-2 w-full transition-all duration-300" />
          </div>
        </div>

        <div className="px-6 pb-8">
          {/* Location Status */}
          <div className="mb-6">
            {appState.userLocation ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Navigation className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">Location enabled - finding venues near you</span>
              </div>
            ) : appState.locationError ? (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-orange-700 font-medium">Location Access Needed</p>
                    <p className="text-xs text-orange-600 mt-1">{appState.locationError}</p>
                  </div>
                </div>
                <Button
                  onClick={handleRequestLocation}
                  size="sm"
                  className="bg-orange-500 text-white hover:bg-orange-600"
                >
                  <Navigation className="w-3 h-3 mr-1" />
                  Enable Location
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-blue-700">Getting your location...</span>
              </div>
            )}
          </div>

          {/* Header Text */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Where would you like to go?</h2>
            <p className="text-gray-600">Pick your preferred neighborhood for the perfect date</p>
          </div>

          {/* Area Selection */}
          <div className="space-y-3 mb-8">
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.id)}
                disabled={appState.isLoading}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedArea === area.id
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                } ${appState.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{area.emoji}</div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{area.name}</div>
                    <div className={`text-sm ${selectedArea === area.id ? 'text-primary' : 'text-gray-500'}`}>
                      {area.description}
                    </div>
                    <div className={`flex items-center gap-4 text-xs mt-1 ${selectedArea === area.id ? 'text-primary' : 'text-gray-500'}`}>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {area.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {area.venues} venues
                      </div>
                    </div>
                  </div>
                  {selectedArea === area.id && (
                    <Check className="w-5 h-5" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Find Spots Button */}
          <Button
            onClick={handleNext}
            disabled={!selectedArea || appState.isLoading}
            className="w-full h-12 bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold disabled:opacity-50"
          >
            {appState.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Finding Perfect Spots...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Find Perfect Spots
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Area;
