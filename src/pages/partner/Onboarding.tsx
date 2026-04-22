import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Store, FileCheck, Shield, CheckCircle2, ArrowRight, ArrowLeft,
  Upload, Building2, Phone, Mail, Globe, MapPin, Sparkles, PartyPopper
} from 'lucide-react';

type OnboardingStep = 'profile' | 'verification' | 'venue' | 'complete';

interface ProfileData {
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
  tax_id_type: string;
}

export default function PartnerOnboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingProfile, setExistingProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    business_name: '', contact_person: '', business_email: '',
    phone: '', website: '', description: '', address: '',
    city: '', postal_code: '', country: 'DE', tax_id: '', tax_id_type: 'vat_de',
  });

  const isLoading = authLoading || roleLoading;

  const steps: { key: OnboardingStep; icon: typeof User; label: string }[] = [
    { key: 'profile', icon: User, label: 'Firmenprofil' },
    { key: 'verification', icon: Shield, label: 'Verifizierung' },
    { key: 'venue', icon: Store, label: 'Venue hinzufügen' },
    { key: 'complete', icon: CheckCircle2, label: 'Fertig' },
  ];

  const currentIdx = steps.findIndex(s => s.key === currentStep);
  const progress = Math.round(((currentIdx + 1) / steps.length) * 100);

  useEffect(() => {
    if (!isLoading && user && role !== 'venue_partner' && role !== 'admin') {
      navigate('/home');
    }
  }, [role, isLoading, user, navigate]);

  useEffect(() => {
    if (user) loadExistingProfile();
  }, [user]);

  const loadExistingProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('partner_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setExistingProfile(true);
      setProfileData({
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
        tax_id_type: data.tax_id_type || 'vat_de',
      });
      // If profile exists and verified, skip to venue
      if (data.verification_status === 'verified') {
        setCurrentStep('venue');
      } else if (data.business_name) {
        setCurrentStep('verification');
      }
    }
  };

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    if (!user) return;
    if (!profileData.business_name || !profileData.contact_person || !profileData.business_email) {
      toast.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }
    if (!termsAccepted || !privacyAccepted) {
      toast.error('Bitte akzeptiere die AGB und Datenschutzerklärung');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        ...profileData,
        terms_accepted_at: new Date().toISOString(),
        terms_version: '1.0',
        privacy_accepted_at: new Date().toISOString(),
        privacy_version: '1.0',
        verification_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (existingProfile) {
        await supabase.from('partner_profiles').update(payload).eq('user_id', user.id);
      } else {
        await supabase.from('partner_profiles').insert(payload);
        setExistingProfile(true);
      }
      toast.success('Profil gespeichert!');
      setCurrentStep('verification');
    } catch {
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const submitVerification = async () => {
    if (!user) return;
    if (!profileData.tax_id) {
      toast.error('Bitte gib deine Steuernummer ein');
      return;
    }
    setSaving(true);
    try {
      await supabase.from('partner_profiles').update({
        tax_id: profileData.tax_id,
        tax_id_type: profileData.tax_id_type,
        verification_status: 'pending',
        verification_method: 'document_upload',
      }).eq('user_id', user.id);
      toast.success('Verifizierung eingereicht! Wir prüfen deine Angaben.');
      setCurrentStep('venue');
    } catch {
      toast.error('Fehler bei der Verifizierung');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6 pb-28 md:pb-6">
      {/* Sticky Header with progress */}
      <div className="sticky top-0 z-30 -mx-4 md:mx-0 px-4 md:px-0 pt-2 pb-3 md:pb-4 bg-background/85 backdrop-blur-md border-b border-border/40 md:border-0 md:bg-transparent md:backdrop-blur-none space-y-3">
        <div className="text-center space-y-1">
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-romantic bg-clip-text text-transparent">
            Partner-Setup
          </h1>
          <p className="hidden md:block text-sm text-muted-foreground">
            Richte dein Partner-Konto in wenigen Minuten ein
          </p>
        </div>

        {/* Step indicator – mobile-first with connectors */}
        <div className="flex items-center justify-between gap-1">
          {steps.map((step, idx) => (
            <div key={step.key} className="flex items-center flex-1 last:flex-initial">
              <div
                className={`w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center text-sm font-semibold transition-all flex-shrink-0 ${
                  idx < currentIdx ? 'bg-primary text-primary-foreground shadow-sm' :
                  idx === currentIdx ? 'bg-primary/15 text-primary border-2 border-primary ring-4 ring-primary/10' :
                  'bg-muted text-muted-foreground'
                }`}
                aria-current={idx === currentIdx ? 'step' : undefined}
                aria-label={`Schritt ${idx + 1}: ${step.label}`}
              >
                {idx < currentIdx ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 transition-colors ${idx < currentIdx ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <Progress value={progress} className="h-1" aria-label={`Fortschritt: ${progress}%`} />
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Schritt {currentIdx + 1}/{steps.length}: <span className="text-foreground font-medium">{steps[currentIdx]?.label}</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-muted-foreground">
            <Shield className="w-3 h-3" /> Vorbereitet für DEHOGA-Mitglieder
          </span>
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 'profile' && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Firmenprofil
                </CardTitle>
                <CardDescription>Grunddaten deines Unternehmens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Firmenname *</Label>
                    <Input value={profileData.business_name} onChange={e => updateField('business_name', e.target.value)} placeholder="z.B. Restaurant Bella Vista" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ansprechpartner *</Label>
                    <Input value={profileData.contact_person} onChange={e => updateField('contact_person', e.target.value)} placeholder="Max Mustermann" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> E-Mail *</Label>
                    <Input type="email" value={profileData.business_email} onChange={e => updateField('business_email', e.target.value)} placeholder="info@restaurant.de" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Telefon</Label>
                    <Input value={profileData.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+49 123 456789" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Website</Label>
                    <Input value={profileData.website} onChange={e => updateField('website', e.target.value)} placeholder="https://www.restaurant.de" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Beschreibung</Label>
                  <Textarea value={profileData.description} onChange={e => updateField('description', e.target.value)} placeholder="Kurze Beschreibung deines Unternehmens..." rows={3} />
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Adresse
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Straße & Nr.</Label>
                      <Input value={profileData.address} onChange={e => updateField('address', e.target.value)} placeholder="Musterstr. 1" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>PLZ</Label>
                      <Input value={profileData.postal_code} onChange={e => updateField('postal_code', e.target.value)} placeholder="10115" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Stadt</Label>
                      <Input value={profileData.city} onChange={e => updateField('city', e.target.value)} placeholder="Berlin" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Land</Label>
                      <Select value={profileData.country} onValueChange={v => updateField('country', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DE">Deutschland</SelectItem>
                          <SelectItem value="AT">Österreich</SelectItem>
                          <SelectItem value="CH">Schweiz</SelectItem>
                          <SelectItem value="NL">Niederlande</SelectItem>
                          <SelectItem value="BE">Belgien</SelectItem>
                          <SelectItem value="FR">Frankreich</SelectItem>
                          <SelectItem value="IT">Italien</SelectItem>
                          <SelectItem value="ES">Spanien</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Legal Acceptance */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="text-sm font-medium">Rechtliche Zustimmung</h4>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(c) => setTermsAccepted(c === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug">
                      Ich akzeptiere die{' '}
                      <Link to="/partner/terms" className="text-primary underline underline-offset-2" target="_blank">
                        Allgemeinen Geschäftsbedingungen
                      </Link>{' '}
                      für Venue-Partner. *
                    </label>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="privacy"
                      checked={privacyAccepted}
                      onCheckedChange={(c) => setPrivacyAccepted(c === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="privacy" className="text-sm text-muted-foreground leading-snug">
                      Ich habe die{' '}
                      <Link to="/partner/privacy" className="text-primary underline underline-offset-2" target="_blank">
                        Datenschutzerklärung
                      </Link>{' '}
                      gelesen und stimme der Datenverarbeitung zu. *
                    </label>
                  </div>
                </div>

                <div className="hidden md:flex justify-end pt-2">
                  <Button onClick={saveProfile} disabled={saving || !termsAccepted || !privacyAccepted} className="gap-2 min-h-[44px]">
                    {saving ? <LoadingSpinner size="sm" /> : <ArrowRight className="w-4 h-4" />}
                    Weiter zur Verifizierung
                  </Button>
                </div>

                {/* Sticky bottom CTA on mobile */}
                <div className="md:hidden fixed left-0 right-0 z-[60] px-4 py-3 bg-background/95 backdrop-blur-md border-t border-border/40 bottom-[calc(64px+env(safe-area-inset-bottom))]">
                  <Button
                    onClick={saveProfile}
                    disabled={saving || !termsAccepted || !privacyAccepted}
                    className="w-full gap-2 min-h-[48px] text-base"
                  >
                    {saving ? <LoadingSpinner size="sm" /> : <>Weiter zur Verifizierung <ArrowRight className="w-4 h-4" /></>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'verification' && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Verifizierung
                </CardTitle>
                <CardDescription>
                  Bestätige deine Identität für maximales Vertrauen bei Nutzern
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Warum Verifizierung?</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Verifizierte Partner erhalten ein Trust-Badge</li>
                    <li>Höheres Ranking in den Suchergebnissen</li>
                    <li>Voller Zugriff auf Voucher- und Venue-Management</li>
                    <li>DSGVO-konforme Datenverarbeitung</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Steuernummer-Typ</Label>
                    <Select value={profileData.tax_id_type} onValueChange={v => updateField('tax_id_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vat_de">USt-IdNr. (Deutschland)</SelectItem>
                        <SelectItem value="vat_at">UID-Nummer (Österreich)</SelectItem>
                        <SelectItem value="vat_ch">MWST-Nr. (Schweiz)</SelectItem>
                        <SelectItem value="vat_eu">EU-USt-IdNr.</SelectItem>
                        <SelectItem value="tax_number">Steuernummer</SelectItem>
                        <SelectItem value="trade_register">Handelsregisternummer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Steuernummer / ID *</Label>
                    <Input
                      value={profileData.tax_id}
                      onChange={e => updateField('tax_id', e.target.value)}
                      placeholder={profileData.tax_id_type === 'vat_de' ? 'DE123456789' : 'Nummer eingeben'}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" /> Dokument hochladen (optional)
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Gewerbeschein, Handelsregisterauszug oder ähnliches
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        PDF, JPG oder PNG · max. 5 MB
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={() => toast.info('Dokument-Upload wird in Kürze unterstützt')}
                      />
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setCurrentStep('profile')} className="gap-2 min-h-[44px]">
                    <ArrowLeft className="w-4 h-4" /> Zurück
                  </Button>
                  <Button onClick={submitVerification} disabled={saving} className="gap-2 min-h-[44px]">
                    {saving ? <LoadingSpinner size="sm" /> : <FileCheck className="w-4 h-4" />}
                    Verifizierung einreichen
                  </Button>
                </div>

                {/* Sticky bottom CTA on mobile */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/95 backdrop-blur-md border-t border-border/40 flex gap-2">
                  <Button variant="outline" onClick={() => setCurrentStep('profile')} className="gap-2 min-h-[48px] flex-shrink-0" aria-label="Zurück">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button onClick={submitVerification} disabled={saving} className="flex-1 gap-2 min-h-[48px] text-base">
                    {saving ? <LoadingSpinner size="sm" /> : <><FileCheck className="w-4 h-4" /> Verifizierung einreichen</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'venue' && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  Venue hinzufügen
                </CardTitle>
                <CardDescription>
                  Füge dein erstes Venue hinzu oder überspringe diesen Schritt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Card
                    variant="glass"
                    className="cursor-pointer hover:border-primary/40 transition-all group"
                    onClick={() => navigate('/partner/venues')}
                  >
                    <CardContent className="p-5 text-center space-y-2">
                      <Store className="w-8 h-8 text-primary mx-auto group-hover:scale-110 transition-transform" />
                      <h4 className="font-medium text-sm">Venue registrieren</h4>
                      <p className="text-xs text-muted-foreground">
                        Neues Venue anlegen oder bestehendes beanspruchen
                      </p>
                    </CardContent>
                  </Card>
                  <Card
                    variant="glass"
                    className="cursor-pointer hover:border-primary/40 transition-all group"
                    onClick={() => setCurrentStep('complete')}
                  >
                    <CardContent className="p-5 text-center space-y-2">
                      <ArrowRight className="w-8 h-8 text-muted-foreground mx-auto group-hover:scale-110 transition-transform" />
                      <h4 className="font-medium text-sm">Später hinzufügen</h4>
                      <p className="text-xs text-muted-foreground">
                        Du kannst jederzeit Venues im Dashboard hinzufügen
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="hidden md:flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setCurrentStep('verification')} className="gap-2 min-h-[44px]">
                    <ArrowLeft className="w-4 h-4" /> Zurück
                  </Button>
                  <Button variant="ghost" onClick={() => setCurrentStep('complete')} className="gap-2 min-h-[44px] text-muted-foreground">
                    Überspringen <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Sticky bottom CTA on mobile */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/95 backdrop-blur-md border-t border-border/40 flex gap-2">
                  <Button variant="outline" onClick={() => setCurrentStep('verification')} className="gap-2 min-h-[48px] flex-shrink-0" aria-label="Zurück">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => setCurrentStep('complete')} className="flex-1 gap-2 min-h-[48px] text-base text-muted-foreground">
                    Überspringen <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'complete' && (
            <Card variant="glass" className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-8 text-center space-y-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                  <PartyPopper className="w-16 h-16 text-primary mx-auto" />
                </motion.div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Willkommen im Partner-Netzwerk! 🎉</h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Dein Konto ist eingerichtet. Sobald die Verifizierung abgeschlossen ist,
                    hast du vollen Zugriff auf alle Partner-Funktionen.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button onClick={() => navigate('/partner')} className="gap-2">
                    <Sparkles className="w-4 h-4" /> Zum Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/partner/vouchers')} className="gap-2">
                    Ersten Gutschein erstellen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
