import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, UtensilsCrossed, Loader2, Plus, X, Save } from 'lucide-react';

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

type WeekHours = Record<string, DayHours>;

const DAYS = [
  { key: 'monday', label: 'Mo' },
  { key: 'tuesday', label: 'Di' },
  { key: 'wednesday', label: 'Mi' },
  { key: 'thursday', label: 'Do' },
  { key: 'friday', label: 'Fr' },
  { key: 'saturday', label: 'Sa' },
  { key: 'sunday', label: 'So' },
];

const DEFAULT_HOURS: WeekHours = Object.fromEntries(
  DAYS.map(d => [d.key, { open: '10:00', close: '22:00', closed: false }])
);

interface VenueDetailsEditorProps {
  venueId: string;
  currentHours: any;
  currentMenuHighlights: string[] | null;
  onUpdated: () => void;
}

export const VenueDetailsEditor: React.FC<VenueDetailsEditorProps> = ({
  venueId,
  currentHours,
  currentMenuHighlights,
  onUpdated,
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [hours, setHours] = useState<WeekHours>(DEFAULT_HOURS);
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [newMenuItem, setNewMenuItem] = useState('');

  useEffect(() => {
    if (currentHours && typeof currentHours === 'object' && !Array.isArray(currentHours)) {
      setHours({ ...DEFAULT_HOURS, ...currentHours });
    }
    if (currentMenuHighlights && Array.isArray(currentMenuHighlights)) {
      setMenuItems(currentMenuHighlights);
    }
  }, [currentHours, currentMenuHighlights]);

  const updateDay = (day: string, field: keyof DayHours, value: string | boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const addMenuItem = () => {
    const trimmed = newMenuItem.trim();
    if (trimmed && !menuItems.includes(trimmed)) {
      setMenuItems(prev => [...prev, trimmed]);
      setNewMenuItem('');
    }
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('venues')
        .update({
          opening_hours: hours as any,
          menu_highlights: menuItems.length > 0 ? menuItems : null,
        })
        .eq('id', venueId);

      if (error) throw error;

      toast({ title: 'Gespeichert', description: 'Öffnungszeiten und Speisekarte wurden aktualisiert.' });
      onUpdated();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Opening Hours */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Öffnungszeiten
        </h3>
        <div className="space-y-2">
          {DAYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-8 text-xs font-medium text-muted-foreground">{label}</span>
              <Switch
                checked={!hours[key]?.closed}
                onCheckedChange={(checked) => updateDay(key, 'closed', !checked)}
              />
              {!hours[key]?.closed ? (
                <>
                  <Input
                    type="time"
                    value={hours[key]?.open || '10:00'}
                    onChange={(e) => updateDay(key, 'open', e.target.value)}
                    className="w-24 h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">–</span>
                  <Input
                    type="time"
                    value={hours[key]?.close || '22:00'}
                    onChange={(e) => updateDay(key, 'close', e.target.value)}
                    className="w-24 h-8 text-xs"
                  />
                </>
              ) : (
                <span className="text-xs text-muted-foreground italic">Geschlossen</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Menu Highlights */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4" />
          Speisekarte-Highlights
        </h3>
        <div className="flex gap-2">
          <Input
            value={newMenuItem}
            onChange={(e) => setNewMenuItem(e.target.value)}
            placeholder="z.B. Trüffel-Pasta, Tiramisu..."
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMenuItem())}
          />
          <Button size="sm" variant="outline" onClick={addMenuItem} className="h-8 px-2">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {menuItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {menuItems.map((item, index) => (
              <Badge key={index} variant="secondary" className="gap-1 pr-1">
                {item}
                <button onClick={() => removeMenuItem(index)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Zeigen Sie Ihren Gästen Ihre besten Gerichte – sichtbar bei der Date-Planung.
        </p>
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Speichert...' : 'Änderungen speichern'}
      </Button>
    </div>
  );
};

export default VenueDetailsEditor;
