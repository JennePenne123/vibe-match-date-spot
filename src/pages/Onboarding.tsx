
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    {
      icon: Heart,
      title: "Find Perfect Date Spots",
      description: "Discover amazing places tailored to your preferences and create unforgettable memories together.",
      gradient: "from-pink-400 to-rose-500"
    },
    {
      icon: Sparkles,
      title: "AI-Powered Recommendations",
      description: "Our smart AI analyzes your preferences to suggest the most romantic and exciting date locations.",
      gradient: "from-purple-400 to-pink-500"
    },
    {
      icon: MapPin,
      title: "Explore Your City",
      description: "From cozy cafes to adventure parks, uncover hidden gems and popular spots in your area.",
      gradient: "from-blue-400 to-purple-500"
    }
  ];

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      navigate('/');
    }
  };

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  const currentScreenData = screens[currentScreen];
  const IconComponent = currentScreenData.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Skip Button */}
        <div className="flex justify-end mb-8">
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="text-gray-600 hover:bg-gray-100"
          >
            Skip
          </Button>
        </div>

        {/* Main Content */}
        <div className="text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={`bg-gradient-to-r ${currentScreenData.gradient} rounded-full p-6 shadow-xl`}>
              <IconComponent className="w-16 h-16 text-white" fill="currentColor" />
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {currentScreenData.title}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed px-4">
              {currentScreenData.description}
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center space-x-2 py-4">
            {screens.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentScreen
                    ? 'bg-pink-500 scale-110'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-8">
            <Button
              onClick={handlePrevious}
              variant="ghost"
              className={`text-gray-600 hover:bg-gray-100 ${
                currentScreen === 0 ? 'invisible' : 'visible'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600 font-semibold px-8"
            >
              {currentScreen === screens.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
