
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Clock, Sparkles, Loader2 } from 'lucide-react';

const Area = () => {
  const navigate = useNavigate();
  const { updateArea, generateRecommendations, appState } = useApp();
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

  const handleNext = async () => {
    if (selectedArea) {
      const selectedAreaData = areas.find(area => area.id === selectedArea);
      updateArea(selectedAreaData?.name || selectedArea);
      
      await generateRecommendations();
      navigate('/results');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
          <div className="bg-datespot-gradient rounded-full h-2 w-full transition-all duration-300" />
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* Header Text */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Where would you like to go?</h2>
          <p className="text-gray-600">Pick your preferred neighborhood for the perfect date</p>
        </div>

        {/* Area Selection */}
        <div className="space-y-4 mb-8">
          {areas.map((area) => (
            <button
              key={area.id}
              onClick={() => setSelectedArea(area.id)}
              disabled={appState.isLoading}
              className={`w-full rounded-xl overflow-hidden transition-all ${
                selectedArea === area.id
                  ? 'ring-4 ring-datespot-pink transform scale-[1.02]'
                  : 'hover:transform hover:scale-[1.01]'
              } ${appState.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="relative">
                <img
                  src={area.image}
                  alt={area.name}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <h3 className="text-white font-bold text-lg">{area.name}</h3>
                  <p className="text-white/90 text-sm mb-2">{area.description}</p>
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
                  <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                    <Sparkles className="w-4 h-4 text-datespot-pink" />
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
          className="w-full h-12 bg-datespot-gradient text-white hover:opacity-90 font-semibold disabled:opacity-50"
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
  );
};

export default Area;
