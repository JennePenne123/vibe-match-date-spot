
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Clock, Sparkles, Loader2, AlertCircle, Navigation } from 'lucide-react';

const Area = () => {
  const navigate = useNavigate();
  const { updateArea, generateRecommendations, appState, requestLocation } = useApp();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  const [selectedArea, setSelectedArea] = useState('');

  const areas = [
    {
      id: 'downtown',
      name: 'Downtown',
      description: 'Urban vibes with trendy restaurants and rooftop bars',
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=200&fit=crop',
      time: '10-15 min drive',
      venues: 24
    },
    {
      id: 'waterfront',
      name: 'Waterfront',
      description: 'Scenic views with seafood and sunset spots',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
      time: '15-20 min drive',
      venues: 18
    },
    {
      id: 'arts-district',
      name: 'Arts District',
      description: 'Creative atmosphere with galleries and jazz clubs',
      image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=200&fit=crop',
      time: '8-12 min drive',
      venues: 16
    },
    {
      id: 'oldtown',
      name: 'Old Town',
      description: 'Historic charm with cozy cafes and wine bars',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=200&fit=crop',
      time: '12-18 min drive',
      venues: 22
    },
    {
      id: 'uptown',
      name: 'Uptown',
      description: 'Upscale dining and sophisticated cocktail lounges',
      image: 'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=400&h=200&fit=crop',
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
      navigate(isDemoMode ? '/results?demo=true' : '/results');
    }
  };

  const handleRequestLocation = async () => {
    await requestLocation();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vyy-soft via-vyy-glow to-vyy-warm">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-12 bg-white/70 backdrop-blur-sm shadow-sm">
          <Button
            onClick={() => navigate(isDemoMode ? '/friends?demo=true' : '/friends')}
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:bg-white/50 rounded-2xl"
            disabled={appState.isLoading}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 text-organic">Choose Area</h1>
            <p className="text-sm text-gray-600">Step 3 of 3</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="px-6 mb-8 pt-4">
          <div className="bg-white/50 rounded-full h-3 backdrop-blur-sm">
            <div className="bg-vyy-primary rounded-full h-3 w-full transition-all duration-300 animate-pulse-glow" />
          </div>
        </div>

        <div className="px-6 pb-8">
          {/* Location Status */}
          <div className="mb-6">
            {appState.userLocation ? (
              <div className="organic-card bg-green-50/80 backdrop-blur-sm border-2 border-green-200 p-4">
                <div className="flex items-center gap-3">
                  <Navigation className="w-5 h-5 text-green-600 animate-pulse" />
                  <span className="text-sm text-green-700 font-medium">Location enabled - finding venues near you ✨</span>
                </div>
              </div>
            ) : appState.locationError ? (
              <div className="organic-card bg-orange-50/80 backdrop-blur-sm border-2 border-orange-200 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-orange-700 font-bold">Location Access Needed</p>
                    <p className="text-xs text-orange-600 mt-1">{appState.locationError}</p>
                  </div>
                </div>
                <Button
                  onClick={handleRequestLocation}
                  size="sm"
                  className="bg-orange-500 text-white hover:bg-orange-600 rounded-xl"
                >
                  <Navigation className="w-3 h-3 mr-1" />
                  Enable Location
                </Button>
              </div>
            ) : (
              <div className="organic-card bg-blue-50/80 backdrop-blur-sm border-2 border-blue-200 p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-sm text-blue-700 font-medium">Getting your location...</span>
                </div>
              </div>
            )}
          </div>

          {/* Header Text */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-expressive text-organic">Where would you like to go?</h2>
            <p className="text-gray-700 text-lg">Pick your preferred neighborhood for the perfect date ✨</p>
          </div>

          {/* Area Selection */}
          <div className="space-y-4 mb-8">
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.id)}
                disabled={appState.isLoading}
                className={`w-full organic-card overflow-hidden transition-all duration-300 ${
                  selectedArea === area.id
                    ? 'ring-4 ring-vyy-coral transform scale-105 shadow-2xl animate-pulse-glow'
                    : 'hover:transform hover:scale-102 shadow-lg hover:shadow-xl'
                } ${appState.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="relative">
                  <img
                    src={area.image}
                    alt={area.name}
                    className="w-full h-36 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-left">
                    <h3 className="text-white font-bold text-xl text-organic mb-1">{area.name}</h3>
                    <p className="text-white/90 text-sm mb-3">{area.description}</p>
                    <div className="flex items-center gap-4 text-white/80 text-xs">
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
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 animate-scale-in">
                      <Sparkles className="w-5 h-5 text-vyy-coral animate-pulse" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Find Spots Button */}
          <Button
            onClick={handleNext}
            disabled={!selectedArea || appState.isLoading}
            className="w-full h-14 bg-vyy-primary hover:opacity-90 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 animate-organic-morph"
          >
            {appState.isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Finding Perfect Spots...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
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
