
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Users, ArrowRight, ArrowLeft } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    {
      icon: Heart,
      title: "Discover Perfect Date Spots",
      description: "Let AI find the ideal romantic locations tailored to your preferences and mood. From cozy cafés to scenic viewpoints.",
      image: "❤️",
      gradient: "from-pink-400 to-rose-500"
    },
    {
      icon: MapPin,
      title: "Explore Your Area",
      description: "Find hidden gems and popular destinations in your neighborhood. Get personalized recommendations based on your location.",
      image: "🗺️",
      gradient: "from-blue-400 to-purple-500"
    },
    {
      icon: Users,
      title: "Connect with Friends",
      description: "Invite friends, share experiences, and plan group dates together. Make every moment memorable with the people you love.",
      image: "👥",
      gradient: "from-green-400 to-teal-500"
    }
  ];

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      navigate('/welcome');
    }
  };

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handleSkip = () => {
    navigate('/welcome');
  };

  const currentScreenData = screens[currentScreen];
  const IconComponent = currentScreenData.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Skip Button */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="text-gray-500 hover:text-gray-700"
          >
            Skip
          </Button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center animate-fade-in">
          {/* Icon/Image */}
          <div className={`mx-auto w-32 h-32 rounded-full bg-gradient-to-r ${currentScreenData.gradient} flex items-center justify-center mb-8 shadow-lg`}>
            <div className="text-6xl">{currentScreenData.image}</div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {currentScreenData.title}
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            {currentScreenData.description}
          </p>

          {/* Progress Indicators */}
          <div className="flex justify-center space-x-2 mb-8">
            {screens.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentScreen
                    ? `bg-gradient-to-r ${currentScreenData.gradient}`
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <Button
              onClick={handlePrevious}
              variant="ghost"
              className={`text-gray-500 hover:text-gray-700 ${
                currentScreen === 0 ? 'invisible' : ''
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              className={`bg-gradient-to-r ${currentScreenData.gradient} text-white hover:opacity-90 font-semibold px-8`}
            >
              {currentScreen === screens.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Bottom Wave Decoration */}
        <div className="mt-8">
          <svg
            viewBox="0 0 1200 120"
            className="w-full h-16 text-gray-100"
            fill="currentColor"
          >
            <path d="M0,96L48,80C96,64,192,32,288,37.3C384,43,480,85,576,112C672,139,768,149,864,133.3C960,117,1056,75,1152,69.3C1248,64,1344,96,1392,112L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
