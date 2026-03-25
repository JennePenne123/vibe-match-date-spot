import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Brain, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfidenceFactors {
  hasCuisines: boolean;
  hasVibes: boolean;
  hasPriceRange: boolean;
  hasTimes: boolean;
  hasDietary: boolean;
  hasPersonality: boolean;
  hasRelationshipGoal: boolean;
  hasDistance: boolean;
  hasLocation: boolean;
  hasActivities: boolean;
}

function calculateConfidence(factors: ConfidenceFactors): number {
  const weights: Record<keyof ConfidenceFactors, number> = {
    hasCuisines: 15,
    hasVibes: 15,
    hasPriceRange: 10,
    hasTimes: 10,
    hasDietary: 5,
    hasPersonality: 15,
    hasRelationshipGoal: 5,
    hasDistance: 10,
    hasLocation: 10,
    hasActivities: 5,
  };

  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    if (factors[key as keyof ConfidenceFactors]) score += weight;
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confidence, setConfidence] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchConfidence = async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select('preferred_cuisines, preferred_vibes, preferred_price_range, preferred_times, dietary_restrictions, personality_traits, relationship_goal, max_distance, home_latitude, preferred_activities')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) {
        setConfidence(0);
        return;
      }

      const factors: ConfidenceFactors = {
        hasCuisines: !!data.preferred_cuisines?.length,
        hasVibes: !!data.preferred_vibes?.length,
        hasPriceRange: !!data.preferred_price_range?.length,
        hasTimes: !!data.preferred_times?.length,
        hasDietary: !!data.dietary_restrictions?.length,
        hasPersonality: !!data.personality_traits,
        hasRelationshipGoal: !!data.relationship_goal,
        hasDistance: !!data.max_distance,
        hasLocation: !!data.home_latitude,
        hasActivities: !!data.preferred_activities?.length,
      };

      setConfidence(calculateConfidence(factors));
    };

    fetchConfidence();
  }, [user]);

  if (confidence === null || confidence >= 100 || dismissed) return null;

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
