import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Users, ArrowRight, ArrowLeft } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    { icon: Heart, titleKey: 'onboarding.screen1Title', descKey: 'onboarding.screen1Desc', image: '❤️', gradient: 'from-pink-400 to-rose-500' },
    { icon: MapPin, titleKey: 'onboarding.screen2Title', descKey: 'onboarding.screen2Desc', image: '🗺️', gradient: 'from-blue-400 to-purple-500' },
    { icon: Users, titleKey: 'onboarding.screen3Title', descKey: 'onboarding.screen3Desc', image: '👥', gradient: 'from-green-400 to-teal-500' },
  ];

  const handleNext = () => {
    if (currentScreen < screens.length - 1) setCurrentScreen(currentScreen + 1);
    else navigate('/?auth=required');
  };
  const handlePrevious = () => { if (currentScreen > 0) setCurrentScreen(currentScreen - 1); };
  const handleSkip = () => navigate('/?auth=required');

  const currentScreenData = screens[currentScreen];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-end mb-4">
          <Button onClick={handleSkip} variant="ghost" className="text-muted-foreground hover:text-foreground">{t('common.skip')}</Button>
        </div>
        <div className="bg-card rounded-3xl shadow-xl p-8 text-center animate-fade-in">
          <div className={`mx-auto w-32 h-32 rounded-full bg-gradient-to-r ${currentScreenData.gradient} flex items-center justify-center mb-8 shadow-lg`}>
            <div className="text-6xl">{currentScreenData.image}</div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">{t(currentScreenData.titleKey)}</h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{t(currentScreenData.descKey)}</p>
          <div className="flex justify-center space-x-2 mb-8">
            {screens.map((_, index) => (
              <div key={index} className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentScreen ? `bg-gradient-to-r ${currentScreenData.gradient}` : 'bg-muted'}`} />
            ))}
          </div>
          <div className="flex justify-between items-center">
            <Button onClick={handlePrevious} variant="ghost" className={`text-muted-foreground hover:text-foreground ${currentScreen === 0 ? 'invisible' : ''}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />{t('common.back')}
            </Button>
            <Button onClick={handleNext} className={`bg-gradient-to-r ${currentScreenData.gradient} text-white hover:opacity-90 font-semibold px-8`}>
              {currentScreen === screens.length - 1 ? t('common.getStarted') : t('common.next')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
        <div className="mt-8">
          <svg viewBox="0 0 1200 120" className="w-full h-16 text-muted" fill="currentColor">
            <path d="M0,96L48,80C96,64,192,32,288,37.3C384,43,480,85,576,112C672,139,768,149,864,133.3C960,117,1056,75,1152,69.3C1248,64,1344,96,1392,112L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
