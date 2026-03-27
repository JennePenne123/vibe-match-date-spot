import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Progress } from '@/components/ui/progress';
import { Brain, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

function calculateConfidence(data: Record<string, unknown> | null): number {
  if (!data) return 0;
  const checks: [string, number][] = [
    ['preferred_cuisines', 15],
    ['preferred_vibes', 15],
    ['preferred_price_range', 10],
    ['preferred_times', 10],
    ['dietary_restrictions', 5],
    ['personality_traits', 15],
    ['relationship_goal', 5],
    ['max_distance', 10],
    ['home_latitude', 10],
    ['preferred_activities', 5],
  ];
  let score = 0;
  for (const [key, weight] of checks) {
    const val = data[key];
    if (Array.isArray(val) ? val.length > 0 : !!val) score += weight;
  }
  return score;
}

function getConfidenceMessage(score: number): string {
  if (score >= 90) return 'Die KI kennt dich hervorragend!';
  if (score >= 70) return 'Gute Basis – ein paar Details fehlen noch.';
  if (score >= 50) return 'Die KI lernt dich kennen – vervollständige dein Profil.';
  return 'Hilf der KI, dich besser zu verstehen!';
}

const AIConfidenceBanner: React.FC = () => {
  const navigate = useNavigate();
  const { data: prefs, isLoading } = useUserPreferences();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || dismissed) return null;

  const confidence = calculateConfidence(prefs as unknown as Record<string, unknown>);
  if (confidence >= 100) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 mb-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Brain className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-foreground">
                KI-Genauigkeit: {confidence}%
              </span>
              <button
                onClick={() => setDismissed(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-2.5">
              {getConfidenceMessage(confidence)}
            </p>
            <Progress value={confidence} className="h-1.5 mb-2.5" />
            {confidence < 70 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary h-7 px-2 -ml-2"
                onClick={() => navigate('/preferences')}
              >
                Profil vervollständigen
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIConfidenceBanner;
