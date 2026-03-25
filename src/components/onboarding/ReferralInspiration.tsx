import React, { useEffect, useState } from 'react';
import { Users, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ReferralInspirationProps {
  referrerId: string | null;
  onAdoptPreferences: (prefs: AdoptedPreferences) => void;
  adopted: boolean;
}

export interface AdoptedPreferences {
  cuisines: string[];
  vibes: string[];
  personalityTraits?: { spontaneity: number; adventure: number; social_energy: number } | null;
  maxDistance?: number | null;
}

interface ReferrerPrefs {
  name: string;
  cuisines: string[];
  vibes: string[];
  personalityTraits: { spontaneity: number; adventure: number; social_energy: number } | null;
  maxDistance: number | null;
}

const ReferralInspiration: React.FC<ReferralInspirationProps> = ({
  referrerId,
  onAdoptPreferences,
  adopted,
}) => {
  const [referrerPrefs, setReferrerPrefs] = useState<ReferrerPrefs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!referrerId) {
      setLoading(false);
      return;
    }

    const fetchReferrerPrefs = async () => {
      try {
        // Fetch referrer's name and preferences
        const [profileRes, prefsRes] = await Promise.all([
          supabase.from('profiles').select('name').eq('id', referrerId).single(),
          supabase.from('user_preferences').select('preferred_cuisines, preferred_vibes, personality_traits, max_distance').eq('user_id', referrerId).single(),
        ]);

        if (profileRes.data && prefsRes.data) {
          const pTraits = prefsRes.data.personality_traits as Record<string, number> | null;
          setReferrerPrefs({
            name: profileRes.data.name || 'Dein Freund',
            cuisines: (prefsRes.data.preferred_cuisines || []).slice(0, 4),
            vibes: (prefsRes.data.preferred_vibes || []).slice(0, 3),
            personalityTraits: pTraits && pTraits.spontaneity != null ? {
              spontaneity: pTraits.spontaneity,
              adventure: pTraits.adventure,
              social_energy: pTraits.social_energy,
            } : null,
            maxDistance: prefsRes.data.max_distance || null,
          });
        }
      } catch (err) {
        console.error('Failed to fetch referrer prefs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrerPrefs();
  }, [referrerId]);

  if (loading || !referrerPrefs || (referrerPrefs.cuisines.length === 0 && referrerPrefs.vibes.length === 0)) {
    return null;
  }

  const cuisineLabels: Record<string, string> = {
    italian: 'Italienisch', japanese: 'Japanisch', turkish: 'Türkisch',
    mexican: 'Mexikanisch', french: 'Französisch', indian: 'Indisch',
    greek: 'Griechisch', vietnamese: 'Vietnamesisch', mediterranean: 'Mediterran',
    american: 'Amerikanisch', thai: 'Thai', chinese: 'Chinesisch',
    korean: 'Koreanisch', spanish: 'Spanisch', german: 'Deutsch',
  };

  const vibeLabels: Record<string, string> = {
    romantic: 'Romantisch', casual: 'Entspannt', outdoor: 'Draußen',
    nightlife: 'Nachtleben', cultural: 'Kultur', adventurous: 'Abenteuer',
    trendy: 'Trendy', cozy: 'Gemütlich', elegant: 'Elegant',
    lively: 'Lebhaft', family: 'Familiär',
  };

  const firstName = referrerPrefs.name.split(' ')[0];

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          Inspiration von {firstName}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {firstName} hat dich eingeladen! Hier sind {firstName}s Lieblings-Picks:
      </p>

      {/* Referrer's preferences */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {referrerPrefs.cuisines.map(c => (
          <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-card/60 text-foreground/80 font-medium">
            🍽️ {cuisineLabels[c] || c}
          </span>
        ))}
        {referrerPrefs.vibes.map(v => (
          <span key={v} className="text-xs px-2 py-0.5 rounded-full bg-card/60 text-foreground/80 font-medium">
            ✨ {vibeLabels[v] || v}
          </span>
        ))}
      </div>

      {/* Adopt button */}
      <button
        onClick={() => onAdoptPreferences({
          cuisines: referrerPrefs.cuisines,
          vibes: referrerPrefs.vibes,
          personalityTraits: referrerPrefs.personalityTraits,
          maxDistance: referrerPrefs.maxDistance,
        })}
        disabled={adopted}
        className={cn(
          'w-full py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97]',
          adopted
            ? 'bg-green-400/10 text-green-500 border border-green-400/30'
            : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15'
        )}
      >
        {adopted ? (
          <span className="flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" /> Übernommen!
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Gleiche Vorlieben übernehmen
          </span>
        )}
      </button>
    </div>
  );
};

export default ReferralInspiration;
