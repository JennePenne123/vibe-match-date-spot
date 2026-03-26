import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, X, Save, Loader2, Sparkles, Clock } from 'lucide-react';
import { SEASONAL_TEMPLATES, type SeasonalSpecial, getActiveSpecials } from '@/services/aiVenueService/seasonalScoring';
import { motion, AnimatePresence } from 'framer-motion';

interface SeasonalSpecialsEditorProps {
  venueId: string;
  currentSpecials?: SeasonalSpecial[] | null;
  onUpdated: () => void;
}

export default function SeasonalSpecialsEditor({
  venueId,
  currentSpecials,
  onUpdated,
}: SeasonalSpecialsEditorProps) {
  const { toast } = useToast();
  const [specials, setSpecials] = useState<SeasonalSpecial[]>([]);
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (Array.isArray(currentSpecials)) {
      setSpecials(currentSpecials);
    }
  }, [currentSpecials]);

  const activeSpecials = getActiveSpecials(specials);

  const addFromTemplate = (template: typeof SEASONAL_TEMPLATES[0]) => {
    const now = new Date();
    const threeMonths = new Date(now);
    threeMonths.setMonth(threeMonths.getMonth() + 3);

    const newSpecial: SeasonalSpecial = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: template.title,
      emoji: template.emoji,
      tags: template.tags,
      startDate: now.toISOString().split('T')[0],
      endDate: threeMonths.toISOString().split('T')[0],
    };
    setSpecials(prev => [...prev, newSpecial]);
    setShowTemplates(false);
  };

  const addCustom = () => {
    const now = new Date();
    const threeMonths = new Date(now);
    threeMonths.setMonth(threeMonths.getMonth() + 3);

    setSpecials(prev => [...prev, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: '',
      emoji: '🌟',
      tags: [],
      startDate: now.toISOString().split('T')[0],
      endDate: threeMonths.toISOString().split('T')[0],
    }]);
  };

  const updateSpecial = (id: string, field: keyof SeasonalSpecial, value: any) => {
    setSpecials(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSpecial = (id: string) => {
    setSpecials(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    // Validate
    const valid = specials.filter(s => s.title.trim());
    setSaving(true);
    try {
      const { error } = await supabase
        .from('venues')
        .update({ seasonal_specials: valid as any })
        .eq('id', venueId);

      if (error) throw error;
      toast({ title: 'Saisonale Specials gespeichert! 🌟' });
      onUpdated();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Saisonale Specials</h3>
          {activeSpecials.length > 0 && (
            <Badge variant="default" className="text-[10px]">
              {activeSpecials.length} aktiv
            </Badge>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Zeitlich begrenzte Highlights machen deine Empfehlungen frischer und relevanter. Aktive Specials boosten dein Venue im KI-Ranking.
      </p>

      {/* Active specials list */}
      <AnimatePresence mode="popLayout">
        {specials.map((special) => {
          const isActive = getActiveSpecials([special]).length > 0;
          return (
            <motion.div
              key={special.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className={`p-3 space-y-2 ${isActive ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{special.emoji}</span>
                  <Input
                    value={special.title}
                    onChange={(e) => updateSpecial(special.id, 'title', e.target.value)}
                    placeholder="Name des Specials"
                    className="h-8 text-sm flex-1"
                  />
                  {isActive && (
                    <Badge variant="default" className="text-[9px] shrink-0">Aktiv</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeSpecial(special.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Von</Label>
                    <Input
                      type="date"
                      value={special.startDate}
                      onChange={(e) => updateSpecial(special.id, 'startDate', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Bis</Label>
                    <Input
                      type="date"
                      value={special.endDate}
                      onChange={(e) => updateSpecial(special.id, 'endDate', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {special.tags && special.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {special.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[9px]">{tag}</Badge>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Add buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowTemplates(!showTemplates)}
          className="gap-1.5 text-xs flex-1"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Vorlage wählen
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={addCustom}
          className="gap-1.5 text-xs flex-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Eigenes Special
        </Button>
      </div>

      {/* Templates */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-1.5"
          >
            {SEASONAL_TEMPLATES.map((template) => {
              const alreadyAdded = specials.some(s => s.title === template.title);
              return (
                <button
                  key={template.title}
                  onClick={() => !alreadyAdded && addFromTemplate(template)}
                  disabled={alreadyAdded}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs text-left transition-all ${
                    alreadyAdded
                      ? 'opacity-40 cursor-not-allowed border-border'
                      : 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer'
                  }`}
                >
                  <span className="text-base">{template.emoji}</span>
                  <span>{template.title}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save */}
      {specials.length > 0 && (
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Speichert...' : 'Specials speichern'}
        </Button>
      )}
    </div>
  );
}
