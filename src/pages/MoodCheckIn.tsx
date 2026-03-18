import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sparkles, Sun, Coffee, Moon } from 'lucide-react';

const MOOD_STORAGE_KEY = 'vybe-daily-mood';

export type DailyMood = 'great' | 'okay' | 'me-time';

interface MoodOption {
  id: DailyMood;
  emoji: string;
  labelKey: string;
  descKey: string;
  icon: React.ReactNode;
  gradient: string;
  ring: string;
}

const moodOptions: MoodOption[] = [
  {
    id: 'great',
    emoji: '✨',
    labelKey: 'mood.great',
    descKey: 'mood.greatDesc',
    icon: <Sun className="w-6 h-6" />,
    gradient: 'from-yellow-500/20 via-amber-500/15 to-orange-500/20',
    ring: 'ring-yellow-400/40 hover:ring-yellow-400/70',
  },
  {
    id: 'okay',
    emoji: '👍',
    labelKey: 'mood.okay',
    descKey: 'mood.okayDesc',
    icon: <Coffee className="w-6 h-6" />,
    gradient: 'from-blue-500/20 via-indigo-500/15 to-violet-500/20',
    ring: 'ring-blue-400/40 hover:ring-blue-400/70',
  },
  {
    id: 'me-time',
    emoji: '🧘',
    labelKey: 'mood.meTime',
    descKey: 'mood.meTimeDesc',
    icon: <Moon className="w-6 h-6" />,
    gradient: 'from-violet-500/20 via-purple-500/15 to-indigo-500/20',
    ring: 'ring-violet-400/40 hover:ring-violet-400/70',
  },
];

/** Check if mood was already set today */
export const hasMoodToday = (): boolean => {
  try {
    const stored = localStorage.getItem(MOOD_STORAGE_KEY);
    if (!stored) return false;
    const { date } = JSON.parse(stored);
    return date === new Date().toISOString().split('T')[0];
  } catch {
    return false;
  }
};

/** Get today's mood if set */
export const getTodayMood = (): DailyMood | null => {
  try {
    const stored = localStorage.getItem(MOOD_STORAGE_KEY);
    if (!stored) return null;
    const { date, mood } = JSON.parse(stored);
    if (date === new Date().toISOString().split('T')[0]) return mood;
    return null;
  } catch {
    return null;
  }
};

const MoodCheckIn: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [selectedMood, setSelectedMood] = useState<DailyMood | null>(null);
  const [animateOut, setAnimateOut] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Already checked in today → go to home
  useEffect(() => {
    if (hasMoodToday()) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const saveMoodAndContinue = async (mood: DailyMood | null) => {
    if (mood) {
      localStorage.setItem(
        MOOD_STORAGE_KEY,
        JSON.stringify({ mood, date: new Date().toISOString().split('T')[0] })
      );
      // Award points for mood check-in
      try {
        const { awardPoints } = await import('@/services/awardPointsService');
        await awardPoints('mood_checkin');
      } catch (e) {
        console.error('Failed to award mood check-in points:', e);
      }
    } else {
      // Skipped – still mark as checked so we don't show again today
      localStorage.setItem(
        MOOD_STORAGE_KEY,
        JSON.stringify({ mood: 'skipped', date: new Date().toISOString().split('T')[0] })
      );
    }
    setAnimateOut(true);
    // Check if user needs preferences onboarding
    setTimeout(async () => {
      if (user) {
        try {
          const { data } = await supabase
            .from('user_preferences')
            .select('id, preferred_cuisines')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!data || !data.preferred_cuisines || data.preferred_cuisines.length === 0) {
            navigate('/preferences?onboarding=true', { replace: true });
            return;
          }
        } catch (error) {
          console.error('Error checking preferences after mood:', error);
        }
      }
      navigate('/home', { replace: true });
    }, 350);
  };

  const handleMoodSelect = (mood: DailyMood) => {
    setSelectedMood(mood);
    // Small delay for visual feedback, then navigate
    setTimeout(() => saveMoodAndContinue(mood), 600);
  };

  const handleSkip = () => saveMoodAndContinue(null);

  if (loading || !user) return null;

  return (
    <div className={`min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden transition-opacity duration-300 ${animateOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-accent/8 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-sm mx-auto">
        {/* Greeting */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/10">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('mood.greeting', { name: user.name?.split(' ')[0] || 'Hey' })}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('mood.question')}
          </p>
        </div>

        {/* Mood options */}
        <div className="space-y-3 mb-8">
          {moodOptions.map((option, index) => {
            const isSelected = selectedMood === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleMoodSelect(option.id)}
                disabled={selectedMood !== null}
                className={`
                  w-full rounded-2xl border p-4 text-left transition-all duration-300 
                  bg-gradient-to-r ${option.gradient} 
                  ring-2 ${isSelected ? option.ring.replace('hover:', '') : 'ring-transparent'} ${option.ring}
                  backdrop-blur-sm
                  ${isSelected ? 'scale-[1.02] shadow-lg' : 'hover:scale-[1.01]'}
                  ${selectedMood !== null && !isSelected ? 'opacity-40 scale-[0.98]' : ''}
                  animate-fade-in
                `}
                style={{ animationDelay: `${index * 100 + 200}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{option.emoji}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-base">
                      {t(option.labelKey)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t(option.descKey)}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                      <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Skip */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '500ms' }}>
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="text-muted-foreground hover:text-foreground text-sm"
            disabled={selectedMood !== null}
          >
            {t('mood.skip')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MoodCheckIn;
