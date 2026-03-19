import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Plus, X, Sparkles, Tag } from 'lucide-react';

const CUISINE_OPTIONS = [
  'Italian', 'Japanese', 'Mexican', 'Indian', 'French', 'Thai',
  'Chinese', 'Mediterranean', 'American', 'Korean', 'Vietnamese',
  'Greek', 'Spanish', 'Turkish', 'German', 'Fusion', 'Other',
];

const PRICE_OPTIONS = [
  { value: '$', label: '$ – Günstig' },
  { value: '$$', label: '$$ – Mittel' },
  { value: '$$$', label: '$$$ – Gehoben' },
  { value: '$$$$', label: '$$$$ – Luxus' },
];

/** Suggested keywords grouped by category – these directly boost AI matching */
const KEYWORD_SUGGESTIONS: Record<string, string[]> = {
  'Atmosphäre': [
    'romantisch', 'gemütlich', 'trendy', 'elegant', 'lively', 'chill', 'intimate',
    'bohemian', 'rustic', 'modern', 'luxus', 'hip', 'cozy', 'upscale',
  ],
  'Location': [
    'rooftop', 'terrasse', 'outdoor', 'waterfront', 'garden', 'biergarten',
    'panorama', 'view', 'altstadt', 'downtown', 'lounge', 'cellar', 'gewölbe',
  ],
  'Angebot': [
    'cocktail', 'wine bar', 'craft beer', 'live music', 'jazz', 'brunch',
    'fine dining', 'tapas', 'sushi', 'vegan', 'organic', 'tasting',
    'happy hour', 'late night', 'seafood', 'gourmet',
  ],
  'Aktivitäten': [
    'karaoke', 'comedy', 'bowling', 'escape room', 'arcade', 'mini golf',
    'spa', 'wellness', 'gallery', 'theater', 'museum', 'live entertainment',
  ],
};

interface VenueInfoEditorProps {
  venueId: string;
  currentData: {
    description?: string | null;
    cuisine_type?: string | null;
    price_range?: string | null;
    website?: string | null;
    phone?: string | null;
    address?: string;
    tags?: string[] | null;
  };
  onUpdated: () => void;
}

export const VenueInfoEditor: React.FC<VenueInfoEditorProps> = ({
  venueId,
  currentData,
  onUpdated,
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setDescription(currentData?.description || '');
    setCuisineType(currentData?.cuisine_type || '');
    setPriceRange(currentData?.price_range || '');
    setWebsite(currentData?.website || '');
    setPhone(currentData?.phone || '');
    setAddress(currentData?.address || '');
    setTags(currentData?.tags || []);
  }, [currentData]);

  const availableSuggestions = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const [category, keywords] of Object.entries(KEYWORD_SUGGESTIONS)) {
      const filtered = keywords.filter(kw => !tags.includes(kw));
      if (filtered.length > 0) result[category] = filtered;
    }
    return result;
  }, [tags]);

  const addTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
      setNewTag('');
    }
  };

  const addSuggestedTag = (keyword: string) => {
    if (!tags.includes(keyword)) {
      setTags(prev => [...prev, keyword]);
    }
  };

  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('venues')
        .update({
          description: description || null,
          cuisine_type: cuisineType || null,
          price_range: priceRange || null,
          website: website || null,
          phone: phone || null,
          address,
          tags: tags.length > 0 ? tags : null,
        })
        .eq('id', venueId);

      if (error) throw error;

      toast({ title: 'Gespeichert', description: 'Venue-Informationen wurden aktualisiert.' });
      onUpdated();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="venue-desc" className="text-sm">Beschreibung</Label>
        <Textarea
          id="venue-desc"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Erzähle etwas über dein Venue..."
          rows={3}
          className="text-sm"
        />
      </div>

      {/* Cuisine & Price */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">Küche</Label>
          <Select value={cuisineType} onValueChange={setCuisineType}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Auswählen" />
            </SelectTrigger>
            <SelectContent>
              {CUISINE_OPTIONS.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Preisklasse</Label>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Auswählen" />
            </SelectTrigger>
            <SelectContent>
              {PRICE_OPTIONS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label htmlFor="venue-address" className="text-sm">Adresse</Label>
        <Input
          id="venue-address"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Musterstraße 1, 10115 Berlin"
          className="h-9 text-sm"
        />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="venue-phone" className="text-sm">Telefon</Label>
          <Input
            id="venue-phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+49 30 123456"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="venue-website" className="text-sm">Website</Label>
          <Input
            id="venue-website"
            type="url"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://..."
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Tags / Keywords */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            Tags & Keywords
          </Label>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="h-6 px-2 text-xs gap-1 text-primary"
          >
            <Sparkles className="w-3 h-3" />
            {showSuggestions ? 'Ausblenden' : 'Vorschläge'}
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            placeholder="z.B. romantisch, rooftop, live music..."
            className="h-8 text-sm"
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button size="sm" variant="outline" onClick={addTag} className="h-8 px-2">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Current tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="gap-1 pr-1">
                {tag}
                <button onClick={() => removeTag(index)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Keyword suggestions */}
        {showSuggestions && Object.keys(availableSuggestions).length > 0 && (
          <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
            <p className="text-xs text-muted-foreground">
              💡 Diese Keywords helfen der KI, dein Venue besser zu matchen:
            </p>
            {Object.entries(availableSuggestions).map(([category, keywords]) => (
              <div key={category} className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{category}</span>
                <div className="flex flex-wrap gap-1">
                  {keywords.map(kw => (
                    <button
                      key={kw}
                      onClick={() => addSuggestedTag(kw)}
                      className="text-xs px-2 py-0.5 rounded-full border border-border bg-background hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      + {kw}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Tags verbessern die KI-Empfehlungen – je passender die Keywords, desto öfter wird dein Venue vorgeschlagen.
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

export default VenueInfoEditor;