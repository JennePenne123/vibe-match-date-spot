import React, { useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles, Heart, Sun, Moon, Music, Wine, UtensilsCrossed,
  PartyPopper, Camera, TreePine, Waves, Building2, Flame,
  Star, Coffee, Cake, ChevronRight, ChevronLeft, Check, Loader2,
  Baby, Accessibility, Dog, Wifi, CreditCard, MapPin, Zap, Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Step definitions ──

interface WizardChoice {
  id: string;
  label: string;
  icon: React.ElementType;
  tag: string; // maps to venue tag for AI
}

interface WizardStep {
  key: string;
  title: string;
  subtitle: string;
  emoji: string;
  multiSelect: boolean;
  maxSelect?: number;
  choices: WizardChoice[];
  freeText?: boolean;
  freeTextPlaceholder?: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    key: 'vibe',
    title: 'Welche Atmosphäre bietet dein Venue?',
    subtitle: 'Wähle alles, was passt – die KI nutzt diese Infos für perfektes Matching.',
    emoji: '✨',
    multiSelect: true,
    maxSelect: 5,
    choices: [
      { id: 'romantic', label: 'Romantisch', icon: Heart, tag: 'romantisch' },
      { id: 'cozy', label: 'Gemütlich', icon: Coffee, tag: 'gemütlich' },
      { id: 'trendy', label: 'Trendy & Hip', icon: Zap, tag: 'trendy' },
      { id: 'elegant', label: 'Elegant', icon: Star, tag: 'elegant' },
      { id: 'lively', label: 'Lebhaft', icon: PartyPopper, tag: 'lively' },
      { id: 'intimate', label: 'Intim & Privat', icon: Moon, tag: 'intimate' },
      { id: 'chill', label: 'Entspannt', icon: Sun, tag: 'chill' },
      { id: 'luxurious', label: 'Luxuriös', icon: Sparkles, tag: 'luxus' },
    ],
  },
  {
    key: 'location',
    title: 'Was macht deine Location besonders?',
    subtitle: 'Besondere Merkmale heben dein Venue bei Suchanfragen hervor.',
    emoji: '📍',
    multiSelect: true,
    maxSelect: 4,
    choices: [
      { id: 'rooftop', label: 'Rooftop / Terrasse', icon: Sun, tag: 'rooftop' },
      { id: 'outdoor', label: 'Outdoor / Garten', icon: TreePine, tag: 'outdoor' },
      { id: 'waterfront', label: 'Am Wasser', icon: Waves, tag: 'waterfront' },
      { id: 'oldtown', label: 'Altstadt / Historisch', icon: Building2, tag: 'altstadt' },
      { id: 'panorama', label: 'Panorama-View', icon: Camera, tag: 'panorama' },
      { id: 'lounge', label: 'Lounge / Bar-Bereich', icon: Wine, tag: 'lounge' },
      { id: 'cellar', label: 'Gewölbe / Keller', icon: Flame, tag: 'gewölbe' },
      { id: 'biergarten', label: 'Biergarten', icon: Coffee, tag: 'biergarten' },
    ],
  },
  {
    key: 'offerings',
    title: 'Was bietest du an?',
    subtitle: 'Deine Spezialitäten helfen der KI, die richtigen Paare zu matchen.',
    emoji: '🍽️',
    multiSelect: true,
    maxSelect: 6,
    choices: [
      { id: 'finedining', label: 'Fine Dining', icon: UtensilsCrossed, tag: 'fine dining' },
      { id: 'cocktails', label: 'Cocktails', icon: Wine, tag: 'cocktail' },
      { id: 'wine', label: 'Weinbar', icon: Wine, tag: 'wine bar' },
      { id: 'craftbeer', label: 'Craft Beer', icon: Coffee, tag: 'craft beer' },
      { id: 'brunch', label: 'Brunch', icon: Cake, tag: 'brunch' },
      { id: 'tapas', label: 'Tapas / Sharing', icon: UtensilsCrossed, tag: 'tapas' },
      { id: 'vegan', label: 'Vegan-Freundlich', icon: TreePine, tag: 'vegan' },
      { id: 'tasting', label: 'Tasting / Degustationsmenü', icon: Star, tag: 'tasting' },
      { id: 'latenight', label: 'Late Night', icon: Moon, tag: 'late night' },
      { id: 'happyhour', label: 'Happy Hour', icon: PartyPopper, tag: 'happy hour' },
    ],
  },
  {
    key: 'occasions',
    title: 'Für welche Anlässe ist dein Venue perfekt?',
    subtitle: 'Paare suchen oft nach dem perfekten Ort für besondere Momente.',
    emoji: '🎉',
    multiSelect: true,
    maxSelect: 5,
    choices: [
      { id: 'anniversary', label: 'Jahrestag', icon: Heart, tag: 'jahrestag' },
      { id: 'firstdate', label: 'Erstes Date', icon: Star, tag: 'erstes-date' },
      { id: 'birthday', label: 'Geburtstag', icon: Cake, tag: 'geburtstag' },
      { id: 'proposal', label: 'Verlobung', icon: Gift, tag: 'verlobung' },
      { id: 'casual', label: 'Casual Hangout', icon: Coffee, tag: 'casual' },
      { id: 'celebration', label: 'Feier / Event', icon: PartyPopper, tag: 'feier' },
    ],
  },
  {
    key: 'activities',
    title: 'Gibt es besondere Erlebnisse?',
    subtitle: 'Aktivitäten machen dein Venue einzigartig und unvergesslich.',
    emoji: '🎭',
    multiSelect: true,
    maxSelect: 4,
    choices: [
      { id: 'livemusic', label: 'Live-Musik', icon: Music, tag: 'live music' },
      { id: 'cooking', label: 'Kochkurs', icon: UtensilsCrossed, tag: 'kochkurs' },
      { id: 'winetasting', label: 'Weinprobe', icon: Wine, tag: 'weinprobe' },
      { id: 'cocktailclass', label: 'Cocktail-Workshop', icon: Wine, tag: 'cocktail-workshop' },
      { id: 'comedy', label: 'Comedy / Show', icon: PartyPopper, tag: 'comedy' },
      { id: 'gallery', label: 'Kunst / Galerie', icon: Camera, tag: 'gallery' },
      { id: 'spa', label: 'Spa / Wellness', icon: Sparkles, tag: 'spa' },
      { id: 'karaoke', label: 'Karaoke', icon: Music, tag: 'karaoke' },
    ],
  },
  {
    key: 'accessibility',
    title: 'Wie gut ist dein Venue erreichbar & inklusiv?',
    subtitle: 'Inklusivität macht dein Venue für mehr Paare relevant.',
    emoji: '♿',
    multiSelect: true,
    choices: [
      { id: 'wheelchair', label: 'Rollstuhlgerecht', icon: Accessibility, tag: 'barrierefrei' },
      { id: 'kidfriendly', label: 'Kinderfreundlich', icon: Baby, tag: 'kinderfreundlich' },
      { id: 'dogfriendly', label: 'Hundefreundlich', icon: Dog, tag: 'hundefreundlich' },
      { id: 'wifi', label: 'Kostenloses WLAN', icon: Wifi, tag: 'wifi' },
      { id: 'parking', label: 'Parkplätze', icon: MapPin, tag: 'parkplätze' },
      { id: 'cardpayment', label: 'Kartenzahlung', icon: CreditCard, tag: 'kartenzahlung' },
    ],
  },
  {
    key: 'signature',
    title: 'Was macht dein Venue besonders?',
    subtitle: 'Beschreibe in 1-2 Sätzen, was Gäste bei euch erwartet.',
    emoji: '💎',
    multiSelect: false,
    choices: [],
    freeText: true,
    freeTextPlaceholder: 'z.B. "Unser Gewölbekeller aus dem 18. Jahrhundert mit hausgemachter Pasta und selbst importierten Weinen aus der Toskana bietet eine einzigartige Atmosphäre für romantische Abende."',
  },
];

// ── Component ──

interface VenuePersonalityWizardProps {
  venueId: string;
  existingTags?: string[];
  existingDescription?: string | null;
  onComplete: () => void;
  onSkip?: () => void;
}

export default function VenuePersonalityWizard({
  venueId,
  existingTags = [],
  existingDescription,
  onComplete,
  onSkip,
}: VenuePersonalityWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [freeText, setFreeText] = useState(existingDescription || '');
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState(1); // 1=forward, -1=back

  const step = WIZARD_STEPS[currentStep];
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  const currentSelections = selections[step.key] || [];

  const toggleChoice = useCallback((choiceId: string) => {
    setSelections(prev => {
      const current = prev[step.key] || [];
      const isSelected = current.includes(choiceId);
      let next: string[];

      if (isSelected) {
        next = current.filter(id => id !== choiceId);
      } else {
        if (step.maxSelect && current.length >= step.maxSelect) {
          // Remove oldest, add new
          next = [...current.slice(1), choiceId];
        } else {
          next = [...current, choiceId];
        }
      }

      return { ...prev, [step.key]: next };
    });
  }, [step.key, step.maxSelect]);

  const totalSelections = useMemo(() => {
    return Object.values(selections).reduce((sum, arr) => sum + arr.length, 0);
  }, [selections]);

  const goNext = () => {
    if (!isLastStep) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Collect all selected tags
      const newTags = new Set<string>(existingTags);
      for (const stepDef of WIZARD_STEPS) {
        const stepSelections = selections[stepDef.key] || [];
        for (const choiceId of stepSelections) {
          const choice = stepDef.choices.find(c => c.id === choiceId);
          if (choice) newTags.add(choice.tag);
        }
      }

      const updateData: Record<string, any> = {
        tags: Array.from(newTags),
      };

      if (freeText.trim()) {
        updateData.description = freeText.trim();
      }

      const { error } = await supabase
        .from('venues')
        .update(updateData)
        .eq('id', venueId);

      if (error) throw error;

      toast({
        title: 'Venue-Persönlichkeit gespeichert! 🎉',
        description: `${newTags.size} Tags für besseres KI-Matching hinterlegt.`,
      });

      onComplete();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="space-y-5">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Schritt {currentStep + 1} von {WIZARD_STEPS.length}</span>
          <span>{totalSelections} Merkmale ausgewählt</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step.key}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <div className="text-center mb-5">
            <span className="text-3xl mb-2 block">{step.emoji}</span>
            <h3 className="text-lg font-bold">{step.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{step.subtitle}</p>
            {step.maxSelect && (
              <Badge variant="outline" className="mt-2 text-[10px]">
                max. {step.maxSelect} auswählen
              </Badge>
            )}
          </div>

          {step.freeText ? (
            <Textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder={step.freeTextPlaceholder}
              rows={5}
              className="text-sm"
              maxLength={500}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {step.choices.map((choice) => {
                const isSelected = currentSelections.includes(choice.id);
                return (
                  <motion.button
                    key={choice.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleChoice(choice.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                        : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/30 hover:bg-muted/40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-primary/20' : 'bg-muted/50'
                    }`}>
                      <choice.icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <span className="text-sm font-medium flex-1">{choice.label}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}

          {step.freeText && (
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {freeText.length}/500 Zeichen
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-2">
        {currentStep > 0 ? (
          <Button variant="outline" onClick={goBack} className="gap-1">
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </Button>
        ) : onSkip ? (
          <Button variant="ghost" onClick={onSkip} className="text-muted-foreground text-sm">
            Überspringen
          </Button>
        ) : (
          <div />
        )}

        <div className="flex-1" />

        {isLastStep ? (
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Speichert...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Persönlichkeit speichern
              </>
            )}
          </Button>
        ) : (
          <Button onClick={goNext} className="gap-1">
            Weiter
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-1.5">
        {WIZARD_STEPS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDirection(idx > currentStep ? 1 : -1);
              setCurrentStep(idx);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentStep ? 'bg-primary w-5' : idx < currentStep ? 'bg-primary/40' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
