import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Clock, Heart, Volume2, PartyPopper, Save, Loader2, Users,
  Armchair, Plus, X, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

// ── Time slot definitions ──

const TIME_SLOTS = [
  { id: 'monday_lunch', label: 'Mo Mittag', day: 'Mo', time: '🌤️' },
  { id: 'monday_evening', label: 'Mo Abend', day: 'Mo', time: '🌙' },
  { id: 'tuesday_lunch', label: 'Di Mittag', day: 'Di', time: '🌤️' },
  { id: 'tuesday_evening', label: 'Di Abend', day: 'Di', time: '🌙' },
  { id: 'wednesday_lunch', label: 'Mi Mittag', day: 'Mi', time: '🌤️' },
  { id: 'wednesday_evening', label: 'Mi Abend', day: 'Mi', time: '🌙' },
  { id: 'thursday_lunch', label: 'Do Mittag', day: 'Do', time: '🌤️' },
  { id: 'thursday_evening', label: 'Do Abend', day: 'Do', time: '🌙' },
  { id: 'friday_lunch', label: 'Fr Mittag', day: 'Fr', time: '🌤️' },
  { id: 'friday_evening', label: 'Fr Abend', day: 'Fr', time: '🌙' },
  { id: 'saturday_lunch', label: 'Sa Mittag', day: 'Sa', time: '🌤️' },
  { id: 'saturday_evening', label: 'Sa Abend', day: 'Sa', time: '🌙' },
  { id: 'sunday_lunch', label: 'So Mittag', day: 'So', time: '🌤️' },
  { id: 'sunday_evening', label: 'So Abend', day: 'So', time: '🌙' },
];

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const MOODS = [
  { key: 'romantic', label: 'Romantisch', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { key: 'quiet', label: 'Ruhig & Gemütlich', icon: Volume2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'lively', label: 'Lebhaft & Feier', icon: PartyPopper, color: 'text-amber-500', bg: 'bg-amber-500/10' },
] as const;

const PAIR_FEATURES = [
  { id: 'candle_lit', label: 'Kerzenlicht-Tische' },
  { id: 'corner_seats', label: 'Ecktische / Nischen' },
  { id: 'garden_table', label: 'Gartentisch für 2' },
  { id: 'window_seat', label: 'Fensterplatz' },
  { id: 'bar_seats', label: 'Bar-Plätze nebeneinander' },
  { id: 'private_room', label: 'Privater Raum buchbar' },
  { id: 'quiet_corner', label: 'Ruhige Ecke' },
  { id: 'terrace_2', label: 'Terrassen-Tisch für 2' },
  { id: 'fireplace', label: 'Am Kamin' },
  { id: 'view_table', label: 'Tisch mit Aussicht' },
];

// ── Component ──

interface VenueBestTimesEditorProps {
  venueId: string;
  currentBestTimes?: any;
  currentCapacity?: number | null;
  currentHasSeparee?: boolean;
  currentPairFeatures?: string[] | null;
  onUpdated: () => void;
}

export default function VenueBestTimesEditor({
  venueId,
  currentBestTimes,
  currentCapacity,
  currentHasSeparee,
  currentPairFeatures,
  onUpdated,
}: VenueBestTimesEditorProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeMood, setActiveMood] = useState<string>('romantic');

  // Best times state: { romantic: ["friday_evening", ...], quiet: [...], lively: [...] }
  const [bestTimes, setBestTimes] = useState<Record<string, string[]>>({
    romantic: [],
    quiet: [],
    lively: [],
  });

  const [capacity, setCapacity] = useState<string>('');
  const [hasSeparee, setHasSeparee] = useState(false);
  const [pairFeatures, setPairFeatures] = useState<string[]>([]);

  useEffect(() => {
    if (currentBestTimes && typeof currentBestTimes === 'object') {
      setBestTimes({
        romantic: currentBestTimes.romantic || [],
        quiet: currentBestTimes.quiet || [],
        lively: currentBestTimes.lively || [],
      });
    }
    if (currentCapacity) setCapacity(String(currentCapacity));
    if (currentHasSeparee) setHasSeparee(currentHasSeparee);
    if (currentPairFeatures) setPairFeatures(currentPairFeatures);
  }, [currentBestTimes, currentCapacity, currentHasSeparee, currentPairFeatures]);

  const toggleTimeSlot = (slotId: string) => {
    setBestTimes(prev => {
      const current = prev[activeMood] || [];
      const isSelected = current.includes(slotId);
      return {
        ...prev,
        [activeMood]: isSelected
          ? current.filter(id => id !== slotId)
          : [...current, slotId],
      };
    });
  };

  const togglePairFeature = (featureId: string) => {
    setPairFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('venues')
        .update({
          best_times: bestTimes as any,
          capacity: capacity ? parseInt(capacity, 10) : null,
          has_separee: hasSeparee,
          pair_friendly_features: pairFeatures.length > 0 ? pairFeatures : null,
        })
        .eq('id', venueId);

      if (error) throw error;

      toast({
        title: 'Gespeichert! ✨',
        description: 'Beste Zeiten und Kapazität wurden aktualisiert.',
      });
      onUpdated();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const totalTimesSet = Object.values(bestTimes).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-6">
      {/* Best Times Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Beste Zeiten nach Stimmung</h3>
          {totalTimesSet > 0 && (
            <Badge variant="secondary" className="text-[10px]">{totalTimesSet} gesetzt</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Wann ist dein Venue am romantischsten, ruhigsten oder lebhaftesten? Die KI empfiehlt dein Venue dann passend zur Stimmung der Paare.
        </p>

        {/* Mood selector */}
        <div className="flex gap-2">
          {MOODS.map((mood) => {
            const isActive = activeMood === mood.key;
            const count = bestTimes[mood.key]?.length || 0;
            return (
              <button
                key={mood.key}
                onClick={() => setActiveMood(mood.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  isActive
                    ? `border-primary ${mood.bg} ${mood.color}`
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <mood.icon className="w-3.5 h-3.5" />
                {mood.label}
                {count > 0 && (
                  <Badge variant="secondary" className="text-[9px] px-1 h-4">{count}</Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-8 bg-muted/30">
            <div className="p-2 text-[10px] font-medium text-muted-foreground" />
            {DAYS.map(day => (
              <div key={day} className="p-2 text-[10px] font-medium text-center text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          {/* Rows: Mittag and Abend */}
          {['lunch', 'evening'].map(timeOfDay => (
            <div key={timeOfDay} className="grid grid-cols-8 border-t border-border">
              <div className="p-2 text-[10px] font-medium text-muted-foreground flex items-center">
                {timeOfDay === 'lunch' ? '🌤️' : '🌙'}
              </div>
              {DAYS.map(day => {
                const dayMap: Record<string, string> = {
                  Mo: 'monday', Di: 'tuesday', Mi: 'wednesday', Do: 'thursday',
                  Fr: 'friday', Sa: 'saturday', So: 'sunday',
                };
                const slotId = `${dayMap[day]}_${timeOfDay}`;
                const isSelected = bestTimes[activeMood]?.includes(slotId);
                const mood = MOODS.find(m => m.key === activeMood);

                return (
                  <button
                    key={slotId}
                    onClick={() => toggleTimeSlot(slotId)}
                    className={`p-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? `${mood?.bg} ${mood?.color}`
                        : 'hover:bg-muted/30'
                    }`}
                  >
                  {isSelected && (
                    (() => {
                      const MoodIcon = mood!.icon;
                      return (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400 }}
                        >
                          <MoodIcon className="w-3.5 h-3.5" />
                        </motion.div>
                      );
                    })()
                  )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Capacity & Separee */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Kapazität & Räumlichkeiten</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="capacity" className="text-xs">Max. Sitzplätze</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="9999"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="z.B. 60"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Separée verfügbar?</Label>
            <div className="flex items-center gap-2 h-9">
              <Switch
                checked={hasSeparee}
                onCheckedChange={setHasSeparee}
              />
              <span className="text-sm text-muted-foreground">
                {hasSeparee ? 'Ja' : 'Nein'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pair-friendly features */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Armchair className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Paar-freundliche Highlights</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Welche besonderen Sitzplätze oder Settings bietet ihr für Paare?
        </p>

        <div className="grid grid-cols-2 gap-1.5">
          {PAIR_FEATURES.map((feature) => {
            const isSelected = pairFeatures.includes(feature.id);
            return (
              <button
                key={feature.id}
                onClick={() => togglePairFeature(feature.id)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                {isSelected ? (
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : (
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{feature.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Speichert...' : 'Änderungen speichern'}
      </Button>
    </div>
  );
}
