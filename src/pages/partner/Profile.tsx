import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Building2, Globe, Phone, Mail, MapPin, FileText } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import { toast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface PartnerProfile {
  business_name: string;
  contact_person: string;
  business_email: string;
  phone: string;
  website: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  tax_id: string;
}

const emptyProfile: PartnerProfile = {
  business_name: '',
  contact_person: '',
  business_email: '',
  phone: '',
  website: '',
  description: '',
  address: '',
  city: '',
  postal_code: '',
  country: 'DE',
  tax_id: '',
};

export default function PartnerProfilePage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PartnerProfile>(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const isLoading = authLoading || roleLoading;

  useEffect(() => {
    if (!isLoading && user && role !== 'venue_partner' && role !== 'admin') {
      navigate('/home');
    }
  }, [role, isLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          business_name: data.business_name || '',
          contact_person: data.contact_person || '',
          business_email: data.business_email || '',
          phone: data.phone || '',
          website: data.website || '',
          description: data.description || '',
          address: data.address || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          country: data.country || 'DE',
          tax_id: data.tax_id || '',
        });
      } else if (!error) {
        // Pre-fill from auth
        setProfile(prev => ({
          ...prev,
          business_email: user.email || '',
          contact_person: user.name || '',
        }));
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('partner_profiles')
        .upsert({
          user_id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: t('partner.profile.saved', 'Profil gespeichert'),
        description: t('partner.profile.savedDesc', 'Deine Geschäftsdaten wurden aktualisiert.'),
      });
    } catch (err) {
      console.error('Error saving partner profile:', err);
      toast({
        title: t('partner.profile.error', 'Fehler'),
        description: t('partner.profile.errorDesc', 'Profil konnte nicht gespeichert werden.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof PartnerProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    navigate('/?auth=partner');
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/partner')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('partner.profile.title', 'Geschäftsprofil')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('partner.profile.subtitle', 'Verwalte deine Geschäftsdaten und Kontaktinformationen')}
          </p>
        </div>
      </div>

      {/* Business Info */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-primary" />
            {t('partner.profile.businessInfo', 'Geschäftsinformationen')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">{t('partner.profile.businessName', 'Firmenname')} *</Label>
            <Input
              id="business_name"
              value={profile.business_name}
              onChange={e => updateField('business_name', e.target.value)}
              placeholder="z.B. La Dolce Vita GmbH"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('partner.profile.description', 'Beschreibung')}</Label>
            <Textarea
              id="description"
              value={profile.description}
              onChange={e => updateField('description', e.target.value)}
              placeholder={t('partner.profile.descPlaceholder', 'Erzähle etwas über dein Geschäft...')}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_id" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('partner.profile.taxId', 'USt-IdNr. / Steuernummer')}
            </Label>
            <Input
              id="tax_id"
              value={profile.tax_id}
              onChange={e => updateField('tax_id', e.target.value)}
              placeholder="DE123456789"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5 text-primary" />
            {t('partner.profile.contact', 'Kontakt')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">{t('partner.profile.contactPerson', 'Ansprechpartner')} *</Label>
              <Input
                id="contact_person"
                value={profile.contact_person}
                onChange={e => updateField('contact_person', e.target.value)}
                placeholder="Max Mustermann"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_email">{t('partner.profile.email', 'Geschäfts-E-Mail')} *</Label>
              <Input
                id="business_email"
                type="email"
                value={profile.business_email}
                onChange={e => updateField('business_email', e.target.value)}
                placeholder="info@restaurant.de"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {t('partner.profile.phone', 'Telefon')}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={e => updateField('phone', e.target.value)}
                placeholder="+49 30 1234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('partner.profile.website', 'Website')}
              </Label>
              <Input
                id="website"
                type="url"
                value={profile.website}
                onChange={e => updateField('website', e.target.value)}
                placeholder="https://www.restaurant.de"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-primary" />
            {t('partner.profile.address', 'Adresse')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">{t('partner.profile.street', 'Straße & Hausnummer')}</Label>
            <Input
              id="address"
              value={profile.address}
              onChange={e => updateField('address', e.target.value)}
              placeholder="Musterstraße 1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">{t('partner.profile.postalCode', 'PLZ')}</Label>
              <Input
                id="postal_code"
                value={profile.postal_code}
                onChange={e => updateField('postal_code', e.target.value)}
                placeholder="10115"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t('partner.profile.city', 'Stadt')}</Label>
              <Input
                id="city"
                value={profile.city}
                onChange={e => updateField('city', e.target.value)}
                placeholder="Berlin"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">{t('partner.profile.country', 'Land')}</Label>
            <Input
              id="country"
              value={profile.country}
              onChange={e => updateField('country', e.target.value)}
              placeholder="DE"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving || !profile.business_name || !profile.contact_person || !profile.business_email}
        className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
        size="lg"
      >
        {saving ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            {t('partner.profile.save', 'Profil speichern')}
          </>
        )}
      </Button>
    </div>
  );
}
