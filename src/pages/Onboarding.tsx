import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';

import onboarding1 from '@/assets/onboarding-1.png';
import onboarding2 from '@/assets/onboarding-2.png';
import onboarding3 from '@/assets/onboarding-3.png';

const SWIPE_THRESHOLD = 50;
const TRANSITION_MS = 400;

const screens = [
  {
    titleKey: 'onboarding.screen1Title',
    descKey: 'onboarding.screen1Desc',
    image: onboarding1,
    gradient: 'from-pink-500/30 via-rose-500/20 to-violet-500/30',
    ring: 'ring-pink-400/30',
    accentGradient: 'from-pink-400 to-rose-500',
  },
  {
    titleKey: 'onboarding.screen2Title',
    descKey: 'onboarding.screen2Desc',
    image: onboarding2,
    gradient: 'from-indigo-500/30 via-blue-500/20 to-purple-500/30',
    ring: 'ring-indigo-400/30',
    accentGradient: 'from-indigo-400 to-purple-500',
  },
  {
    titleKey: 'onboarding.screen3Title',
    descKey: 'onboarding.screen3Desc',
    image: onboarding3,
    gradient: 'from-violet-500/30 via-purple-500/20 to-indigo-500/30',
    ring: 'ring-violet-400/30',
    accentGradient: 'from-violet-400 to-indigo-500',
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const touchStartX = useRef(0);
  const isDragging = useRef(false);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const goTo = useCallback((index: number, direction: 'left' | 'right') => {
    if (isAnimating) return;
    setSlideDirection(direction);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentScreen(index);
      setSlideDirection(null);
      setIsAnimating(false);
    }, TRANSITION_MS);
  }, [isAnimating]);

  const handleNext = () => {
    if (currentScreen < screens.length - 1) goTo(currentScreen + 1, 'left');
    else navigate('/?auth=required');
  };
  const handlePrevious = () => {
    if (currentScreen > 0) goTo(currentScreen - 1, 'right');
  };
  const handleSkip = () => navigate('/?auth=required');

  const onTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
    isHorizontalSwipe.current = null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isAnimating) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - (e.touches[0].clientY); // simplified
    if (isHorizontalSwipe.current === null && Math.abs(dx) > 8) {
      isHorizontalSwipe.current = true;
    }
    if (!isHorizontalSwipe.current) return;
    const atEdge = (dx > 0 && currentScreen === 0) || (dx < 0 && currentScreen === screens.length - 1);
    setDragOffset(atEdge ? dx * 0.25 : dx);
  };
  const onTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
      if (dragOffset < 0 && currentScreen < screens.length - 1) goTo(currentScreen + 1, 'left');
      else if (dragOffset > 0 && currentScreen > 0) goTo(currentScreen - 1, 'right');
      else if (dragOffset < 0 && currentScreen === screens.length - 1) navigate('/?auth=required');
    }
    setDragOffset(0);
  };

  const currentScreenData = screens[currentScreen];

  const getSlideStyle = (): React.CSSProperties => {
    if (dragOffset !== 0) return { transform: `translateX(${dragOffset}px)`, transition: 'none' };
    if (slideDirection === 'left') return { animation: `onb-slide-out-left ${TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1) forwards` };
    if (slideDirection === 'right') return { animation: `onb-slide-out-right ${TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1) forwards` };
    return { animation: `onb-slide-enter ${TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1) forwards` };
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden select-none relative">
      <style>{`
        @keyframes onb-slide-out-left {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(-60px); opacity: 0; }
        }
        @keyframes onb-slide-out-right {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(60px); opacity: 0; }
        }
        @keyframes onb-slide-enter {
          0% { transform: translateX(30px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes onb-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes onb-ring-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
      `}</style>

      {/* Animated gradient background blobs */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentScreenData.gradient} transition-all duration-700 ease-out`} />
      <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md mx-auto relative z-10">
        {/* Skip */}
        <div className="flex justify-end mb-3">
          <Button onClick={handleSkip} variant="ghost" className="text-muted-foreground hover:text-foreground text-sm">
            {t('common.skip')}
          </Button>
        </div>

        {/* Glass Card */}
        <div
          className="relative rounded-3xl border border-border/30 bg-card/60 backdrop-blur-xl shadow-gentle-lg p-6 touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div style={getSlideStyle()} className="will-change-transform">
            {/* Illustration with animated ring */}
            <div className="relative mx-auto w-48 h-48 mb-6 flex items-center justify-center">
              {/* Pulsing ring */}
              <div
                className={`absolute inset-0 rounded-full ring-2 ${currentScreenData.ring}`}
                style={{ animation: 'onb-ring-pulse 3s ease-in-out infinite' }}
              />
              {/* Floating image */}
              <img
                src={currentScreenData.image}
                alt=""
                className="w-40 h-40 object-contain drop-shadow-lg"
                style={{ animation: 'onb-float 4s ease-in-out infinite' }}
              />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground mb-3 text-center">
              {t(currentScreenData.titleKey)}
            </h1>

            {/* Description in glass box */}
            <div className="rounded-2xl bg-muted/30 backdrop-blur-sm border border-border/20 px-4 py-3 mb-6">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                {t(currentScreenData.descKey)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 justify-center mb-5">
            {screens.map((screen, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ease-out overflow-hidden ${
                  index === currentScreen ? 'w-8' : 'w-2 bg-muted-foreground/20'
                }`}
              >
                {index === currentScreen && (
                  <div className={`h-full w-full rounded-full bg-gradient-to-r ${screen.accentGradient}`} />
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={handlePrevious}
              variant="ghost"
              size="sm"
              disabled={isAnimating}
              className={`text-muted-foreground hover:text-foreground transition-opacity duration-200 ${
                currentScreen === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              {t('common.back')}
            </Button>
            <Button
              onClick={handleNext}
              disabled={isAnimating}
              className={`bg-gradient-to-r ${currentScreenData.accentGradient} text-white hover:opacity-90 font-semibold px-6 shadow-glow-primary transition-transform duration-200 active:scale-95`}
            >
              {currentScreen === screens.length - 1 ? t('common.getStarted') : t('common.next')}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>

        {/* Swipe hint */}
        {currentScreen === 0 && !isAnimating && (
          <p className="text-center text-xs text-muted-foreground/60 mt-4 animate-fade-in">
            ← {t('onboarding.swipeHint', 'Swipe to navigate')} →
          </p>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
