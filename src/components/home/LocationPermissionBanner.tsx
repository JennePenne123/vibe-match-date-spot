import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Loader2, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const DISMISS_KEY = 'hioutz-location-banner-dismissed-at';
const REMIND_AFTER_DAYS = 7;

const LocationPermissionBanner: React.FC = () => {
  const { user } = useAuth();
  const { data: prefs, isLoading } = useUserPreferences();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'denied'>('idle');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (!dismissedAt) return;
      const ageMs = Date.now() - parseInt(dismissedAt, 10);
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays < REMIND_AFTER_DAYS) setDismissed(true);
    } catch { /* ignore */ }
  }, []);

  const hasLocation = !!(prefs?.home_latitude && prefs?.home_longitude);

  // Hide if loading, already has location, dismissed recently, or just succeeded
  if (isLoading || hasLocation || dismissed || !user) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch { /* ignore */ }
    setDismissed(true);
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Standort nicht verfügbar',
        description: 'Dein Browser unterstützt keine Standortabfrage.',
        variant: 'destructive',
      });
      setStatus('denied');
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { error } = await supabase
            .from('user_preferences')
            .update({
              home_latitude: pos.coords.latitude,
              home_longitude: pos.coords.longitude,
            })
            .eq('user_id', user.id);

          if (error) throw error;

          setStatus('success');
          await queryClient.invalidateQueries({ queryKey: ['user-preferences', user.id] });
          toast({
            title: 'Standort gespeichert ✓',
            description: 'Wir empfehlen dir jetzt Venues in deiner Nähe.',
            duration: 3000,
          });
        } catch (err) {
          console.error('Failed to save location:', err);
          setStatus('denied');
          toast({
            title: 'Speichern fehlgeschlagen',
            description: 'Bitte versuche es später erneut.',
            variant: 'destructive',
          });
        }
      },
      (err) => {
        console.warn('Geolocation denied:', err.message);
        setStatus('denied');
        // Treat denial as a soft dismiss for the reminder window
        try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch { /* ignore */ }
      },
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="absolute -top-8 -right-8 w-28 h-28 bg-primary/10 rounded-full blur-2xl" />
          <CardContent className="relative p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug">
                  Venues in deiner Nähe entdecken
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Gib deinen Standort frei für persönliche Empfehlungen.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleRequestLocation}
                    disabled={status === 'loading' || status === 'success'}
                    className="h-8 text-xs"
                  >
                    {status === 'loading' && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    {status === 'success' && <Check className="w-3.5 h-3.5 mr-1.5" />}
                    {status === 'success' ? 'Erfasst' : status === 'loading' ? 'Lädt…' : 'Standort freigeben'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Später
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                aria-label="Banner schließen"
                className="shrink-0 -mr-1 -mt-1 p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default LocationPermissionBanner;
