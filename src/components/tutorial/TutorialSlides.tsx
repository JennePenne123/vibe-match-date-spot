import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, Heart, MapPin, Send, Trophy, 
  ChevronRight, ChevronLeft, X 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TutorialSlide {
  icon: React.ReactNode;
  gradient: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
}

const SWIPE_THRESHOLD = 50;

const TutorialSlides: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const slides: TutorialSlide[] = [
    {
      icon: <Sparkles className="w-10 h-10" />,
      gradient: 'from-primary via-secondary to-accent',
      title: t('tutorial.slide1Title', 'Willkommen bei H!Outz'),
      subtitle: t('tutorial.slide1Subtitle', 'Dein KI-Concierge'),
      description: t('tutorial.slide1Desc', 'Entdecke perfekte Spots, die zu dir passen — powered by KI, die mit jedem Erlebnis dazulernt.'),
      emoji: '✨',
    },
    {
      icon: <Heart className="w-10 h-10" />,
      gradient: 'from-accent via-primary to-secondary',
      title: t('tutorial.slide2Title', 'Sag uns, was du magst'),
      subtitle: t('tutorial.slide2Subtitle', 'Präferenzen & Stimmung'),
      description: t('tutorial.slide2Desc', 'Wähle Küche, Vibe und Budget — oder check einfach deine Tagesstimmung ein. Je mehr du teilst, desto besser die Vorschläge.'),
      emoji: '🎯',
    },
    {
      icon: <MapPin className="w-10 h-10" />,
      gradient: 'from-secondary via-accent to-primary',
      title: t('tutorial.slide3Title', 'KI-Empfehlungen'),
      subtitle: t('tutorial.slide3Subtitle', 'Perfekt gematcht'),
      description: t('tutorial.slide3Desc', 'Unsere KI findet Spots, die zu deiner Stimmung, deinem Geschmack und deiner Location passen — mit Echtzeit-Kontext.'),
      emoji: '📍',
    },
    {
      icon: <Send className="w-10 h-10" />,
      gradient: 'from-primary to-accent',
      title: t('tutorial.slide4Title', 'Plane solo oder gemeinsam'),
      subtitle: t('tutorial.slide4Subtitle', 'Allein, zu zweit oder als Gruppe'),
      description: t('tutorial.slide4Desc', 'Plane für dich, lade jemanden ein oder entscheidet gemeinsam in der Gruppe. Vorschläge teilen per Link — ganz easy über WhatsApp, Telegram oder E-Mail.'),
      emoji: '💌',
    },
    {
      icon: <Trophy className="w-10 h-10" />,
      gradient: 'from-accent via-secondary to-primary',
      title: t('tutorial.slide5Title', 'Sammle Punkte & Rewards'),
      subtitle: t('tutorial.slide5Subtitle', 'Bewerte & profitiere'),
      description: t('tutorial.slide5Desc', 'Bewerte deine Erlebnisse, sammle Punkte und löse Gutscheine bei Partner-Venues ein. Dein Feedback macht die KI schlauer!'),
      emoji: '🏆',
    },
  ];

  const goTo = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const next = () => {
    if (currentSlide < slides.length - 1) goTo(currentSlide + 1);
    else onComplete();
  };

  const prev = () => {
    if (currentSlide > 0) goTo(currentSlide - 1);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) next();
    else if (info.offset.x > SWIPE_THRESHOLD) prev();
  };

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden">
      {/* Skip button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onComplete}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          {t('tutorial.skip', 'Überspringen')}
        </Button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="flex flex-col items-center text-center max-w-sm mx-auto select-none"
          >
            {/* Icon orb with overlaid emoji */}
            <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-5 shadow-xl shadow-primary/20`}>
              <div className="text-primary-foreground [&>svg]:w-8 [&>svg]:h-8">
                {slide.icon}
              </div>
              <span className="absolute -bottom-1 -right-1 text-2xl drop-shadow">{slide.emoji}</span>
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-foreground mb-1.5 leading-tight">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-xs font-medium text-primary mb-3 uppercase tracking-wide">
              {slide.subtitle}
            </p>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-6 space-y-4">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted-foreground/30'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {currentSlide > 0 && (
            <Button
              variant="outline"
              onClick={prev}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('tutorial.back', 'Zurück')}
            </Button>
          )}
          <Button
            onClick={next}
            className="flex-1 bg-gradient-to-r from-primary to-secondary text-primary-foreground"
          >
            {isLast
              ? t('tutorial.start', "Los geht's! 🚀")
              : t('tutorial.next', 'Weiter')}
            {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TutorialSlides;
