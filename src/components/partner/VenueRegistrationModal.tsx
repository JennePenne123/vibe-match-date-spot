import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MapPin, Store, Loader2, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface VenueRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ExistingVenue {
  id: string;
  name: string;
  address: string;
  cuisine_type: string | null;
}

export default function VenueRegistrationModal({ open, onOpenChange, onSuccess }: VenueRegistrationModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExistingVenue[]>([]);
  const [searching, setSearching] = useState(false);

  // Create form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [priceRange, setPriceRange] = useState('$$');

  const resetForm = () => {
    setName(''); setAddress(''); setCuisineType(''); setDescription('');
    setPhone(''); setWebsite(''); setPriceRange('$$');
    setSearchQuery(''); setSearchResults([]); setMode('search');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, address, cuisine_type')
        .ilike('name', `%${searchQuery}%`)
        .eq('is_active', true)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleClaimVenue = async (venueId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if partnership already exists
      const { data: existing } = await supabase
        .from('venue_partnerships')
        .select('id, status')
        .eq('partner_id', user.id)
        .eq('venue_id', venueId)
        .maybeSingle();

      if (existing) {
        toast({
          title: t('partner.venues.alreadyClaimed', 'Bereits beantragt'),
          description: t('partner.venues.alreadyClaimedDesc', `Status: ${existing.status}`),
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('venue_partnerships').insert({
        partner_id: user.id,
        venue_id: venueId,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: t('partner.venues.requested', 'Partnerschaft beantragt'),
        description: t('partner.venues.requestedDesc', 'Deine Anfrage wird geprüft.'),
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVenue = async () => {
    if (!name.trim() || !address.trim()) {
      toast({ title: 'Pflichtfelder', description: 'Name und Adresse sind erforderlich.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create venue
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert({
          name: name.trim(),
          address: address.trim(),
          cuisine_type: cuisineType || null,
          description: description || null,
          phone: phone || null,
          website: website || null,
          price_range: priceRange,
          is_active: true,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (venueError) throw venueError;

      // Create partnership
      const { error: partnerError } = await supabase.from('venue_partnerships').insert({
        partner_id: user.id,
        venue_id: venue.id,
        status: 'approved', // Auto-approve self-created venues
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      });

      if (partnerError) throw partnerError;

      toast({
        title: t('partner.venues.created', 'Venue erstellt'),
        description: t('partner.venues.createdDesc', 'Dein neuer Standort wurde hinzugefügt.'),
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            {t('partner.venues.addVenue', 'Standort hinzufügen')}
          </DialogTitle>
          <DialogDescription>
            {t('partner.venues.addVenueDesc', 'Bestehendes Venue beanspruchen oder neues erstellen')}
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === 'search' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => setMode('search')}
          >
            <Search className="w-4 h-4 mr-1" />
            {t('partner.venues.searchExisting', 'Bestehendes suchen')}
          </Button>
          <Button
            variant={mode === 'create' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => setMode('create')}
          >
            <Store className="w-4 h-4 mr-1" />
            {t('partner.venues.createNew', 'Neu erstellen')}
          </Button>
        </div>

        {mode === 'search' ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={t('partner.venues.searchPlaceholder', 'Venue-Name suchen...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching} size="icon" variant="outline">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((venue) => (
                  <Card key={venue.id} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleClaimVenue(venue.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{venue.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{venue.address}</span>
                        </p>
                        {venue.cuisine_type && (
                          <p className="text-xs text-primary/70 mt-0.5">{venue.cuisine_type}</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" disabled={loading} className="flex-shrink-0 text-xs">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : t('partner.venues.claim', 'Beanspruchen')}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : searchQuery && !searching ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <p>{t('partner.venues.noResults', 'Kein Venue gefunden.')}</p>
                <Button variant="link" size="sm" onClick={() => { setMode('create'); setName(searchQuery); }}>
                  {t('partner.venues.createInstead', 'Stattdessen neues Venue erstellen →')}
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>{t('partner.venues.name', 'Name')} *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Restaurant La Dolce Vita" />
            </div>
            <div>
              <Label>{t('partner.venues.address', 'Adresse')} *</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Musterstraße 1, 10115 Berlin" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('partner.venues.cuisine', 'Küche')}</Label>
                <Input value={cuisineType} onChange={(e) => setCuisineType(e.target.value)} placeholder="Italienisch" />
              </div>
              <div>
                <Label>{t('partner.venues.priceRange', 'Preisklasse')}</Label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$ – Günstig</SelectItem>
                    <SelectItem value="$$">$$ – Mittel</SelectItem>
                    <SelectItem value="$$$">$$$ – Gehoben</SelectItem>
                    <SelectItem value="$$$$">$$$$ – Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('partner.venues.phone', 'Telefon')}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 30 12345678" />
              </div>
              <div>
                <Label>{t('partner.venues.website', 'Website')}</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div>
              <Label>{t('partner.venues.description', 'Beschreibung')}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kurze Beschreibung deines Venues..." className="resize-none" rows={3} />
            </div>
            <Button onClick={handleCreateVenue} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Store className="w-4 h-4 mr-2" />}
              {t('partner.venues.createVenue', 'Venue erstellen')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
