import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Users, ArrowRight, ArrowLeft } from 'lucide-react';

const SWIPE_THRESHOLD = 50;
const TRANSITION_MS = 400;

const screens = [
  { icon: Heart, titleKey: 'onboarding.screen1Title', descKey: 'onboarding.screen1Desc', image: '❤️', gradient: 'from-pink-400 to-rose-500' },
  { icon: MapPin, titleKey: 'onboarding.screen2Title', descKey: 'onboarding.screen2Desc', image: '🗺️', gradient: 'from-blue-400 to-purple-500' },
  { icon: Users, titleKey: 'onboarding.screen3Title', descKey: 'onboarding.screen3Desc', image: '👥', gradient: 'from-green-400 to-teal-500' },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
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

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    isHorizontalSwipe.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isAnimating) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Determine swipe direction on first significant move
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        isHorizontalSwipe.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontalSwipe.current) return;

    // Dampen at edges
    const atEdge = (dx > 0 && currentScreen === 0) || (dx < 0 && currentScreen === screens.length - 1);
    setDragOffset(atEdge ? dx * 0.25 : dx);
  };

  const onTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
      if (dragOffset < 0 && currentScreen < screens.length - 1) {
        goTo(currentScreen + 1, 'left');
      } else if (dragOffset > 0 && currentScreen > 0) {
        goTo(currentScreen - 1, 'right');
      } else if (dragOffset < 0 && currentScreen === screens.length - 1) {
        navigate('/?auth=required');
      }
    }
    setDragOffset(0);
  };

  const currentScreenData = screens[currentScreen];

  // Compute slide transform
  const getSlideStyle = (): React.CSSProperties => {
    if (dragOffset !== 0) {
      return {
        transform: `translateX(${dragOffset}px)`,
        transition: 'none',
      };
    }
    if (slideDirection === 'left') {
      return {
        animation: `slide-out-left ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
      };
    }
    if (slideDirection === 'right') {
      return {
        animation: `slide-out-right-rev ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
      };
    }
    return {
      animation: `slide-enter ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
    };
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden select-none">
      <style>{`
        @keyframes slide-out-left {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(-60px); opacity: 0; }
        }
        @keyframes slide-out-right-rev {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(60px); opacity: 0; }
        }
        @keyframes slide-enter {
          0% { transform: translateX(30px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div className="w-full max-w-md mx-auto">
        {/* Skip */}
        <div className="flex justify-end mb-4">
          <Button onClick={handleSkip} variant="ghost" className="text-muted-foreground hover:text-foreground">
            {t('common.skip')}
          </Button>
        </div>

        {/* Card with swipe */}
        <div
          className="bg-card rounded-3xl shadow-gentle-lg p-8 text-center touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div style={getSlideStyle()} className="will-change-transform">
            {/* Icon */}
            <div className={`mx-auto w-28 h-28 rounded-full bg-gradient-to-r ${currentScreenData.gradient} flex items-center justify-center mb-8 shadow-gentle-md`}>
              <div className="text-5xl">{currentScreenData.image}</div>
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl font-bold text-foreground mb-3">
              {t(currentScreenData.titleKey)}
            </h1>
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">
              {t(currentScreenData.descKey)}
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 justify-center mb-6">
            {screens.map((_, index) => (
              <div
                key={index}
                className="h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: index === currentScreen ? '2rem' : '0.5rem',
                  background: index === currentScreen
                    ? `linear-gradient(to right, var(--tw-gradient-stops))`
                    : 'hsl(var(--muted))',
                  ...(index === currentScreen ? { '--tw-gradient-from': '', '--tw-gradient-to': '' } : {}),
                }}
              >
                {index === currentScreen && (
                  <div className={`h-full w-full rounded-full bg-gradient-to-r ${currentScreenData.gradient}`} />
                )}
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <Button
              onClick={handlePrevious}
              variant="ghost"
              disabled={isAnimating}
              className={`text-muted-foreground hover:text-foreground transition-opacity duration-200 ${currentScreen === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
            <Button
              onClick={handleNext}
              disabled={isAnimating}
              className={`bg-gradient-to-r ${currentScreenData.gradient} text-white hover:opacity-90 font-semibold px-8 transition-transform duration-200 active:scale-95`}
            >
              {currentScreen === screens.length - 1 ? t('common.getStarted') : t('common.next')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Swipe hint on first screen */}
        {currentScreen === 0 && !isAnimating && (
          <p className="text-center text-xs text-muted-foreground mt-4 animate-fade-in">
            ← {t('onboarding.swipeHint', 'Swipe to navigate')} →
          </p>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
