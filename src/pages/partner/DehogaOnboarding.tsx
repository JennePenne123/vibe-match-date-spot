import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, KeyRound, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

const LANDESVERBAENDE = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
  'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen',
  'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
];

type Step = 1 | 2 | 3 | 4;
type Method = 'member_id' | 'invitation_code';

const DehogaOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { enabled, metadata, isLoading, isPreviewBypass } = useFeatureFlag('dehoga_onboarding_enabled');

  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<Method>('member_id');
  const [landesverband, setLandesverband] = useState<string>('');
  const [memberId, setMemberId] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><LoadingSpinner /></div>;
  }

  if (!enabled) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full bg-card/80 backdrop-blur border-border/40">
          <CardContent className="p-8 text-center space-y-4">
            <Sparkles className="w-12 h-12 mx-auto text-primary/60" />
            <h1 className="text-xl font-semibold">DEHOGA-Partnerschaft kommt bald</h1>
            <p className="text-sm text-muted-foreground">
              Wir bereiten gerade ein exklusives Mitglieder-Programm mit dem DEHOGA vor.
              Sobald die Partnerschaft offiziell ist, kannst du dich hier mit deiner Mitgliedsnummer
              oder einem Einladungscode anmelden und sofort von vergünstigten Konditionen profitieren.
            </p>
            <Button variant="outline" onClick={() => navigate('/partner/dashboard')}>
              Zurück zum Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const pricing = metadata.pricing as Record<string, number> | undefined;
  const standard = metadata.standard_pricing as Record<string, number> | undefined;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { method };
      if (method === 'invitation_code') {
        payload.invitation_code = invitationCode.trim().toUpperCase();
      } else {
        payload.member_id = memberId.trim();
        payload.landesverband = landesverband;
      }
      const { data, error } = await supabase.functions.invoke('validate-dehoga-membership', {
        body: payload,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Validierung fehlgeschlagen');
      setSuccess(true);
      setStep(4);
      toast({ title: 'DEHOGA-Mitgliedschaft bestätigt', description: 'Dein Trust-Badge ist jetzt aktiv.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast({ title: 'Validierung fehlgeschlagen', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = (): boolean => {
    if (step === 1) return Boolean(method);
    if (step === 2 && method === 'member_id') return Boolean(landesverband);
    if (step === 3) {
      return method === 'invitation_code' ? invitationCode.length >= 4 : memberId.length >= 4;
    }
    return true;
  };

  return (
    <main className="px-4 py-6 max-w-md mx-auto">
      {isPreviewBypass && (
        <Badge variant="outline" className="mb-3 text-[10px] border-accent text-accent">
          PREVIEW-MODUS
        </Badge>
      )}

      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => step > 1 && !success ? setStep((s) => (s - 1) as Step) : navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Zurück
        </Button>
        <span className="text-xs text-muted-foreground">Schritt {step}/4</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-card/80 backdrop-blur border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <Badge className="bg-primary/15 text-primary border-primary/30">DEHOGA-Mitglied</Badge>
            </div>
            <CardTitle className="text-lg">
              {step === 1 && 'Wie möchtest du dich verifizieren?'}
              {step === 2 && 'Dein Landesverband'}
              {step === 3 && (method === 'invitation_code' ? 'Einladungscode eingeben' : 'Mitgliedsnummer eingeben')}
              {step === 4 && 'Willkommen im DEHOGA-Programm'}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === 1 && (
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as Method)} className="space-y-3">
                <Label className="flex items-start gap-3 p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-muted/30">
                  <RadioGroupItem value="member_id" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><Building2 className="w-4 h-4" /><span className="font-medium">Mitgliedsnummer</span></div>
                    <p className="text-xs text-muted-foreground mt-1">Deine offizielle DEHOGA-Mitgliedsnummer + Landesverband.</p>
                  </div>
                </Label>
                <Label className="flex items-start gap-3 p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-muted/30">
                  <RadioGroupItem value="invitation_code" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><KeyRound className="w-4 h-4" /><span className="font-medium">Einladungscode</span></div>
                    <p className="text-xs text-muted-foreground mt-1">Den Code, den du vom DEHOGA per E-Mail erhalten hast.</p>
                  </div>
                </Label>
              </RadioGroup>
            )}

            {step === 2 && method === 'member_id' && (
              <div className="space-y-2">
                <Label htmlFor="lv">Landesverband</Label>
                <Select value={landesverband} onValueChange={setLandesverband}>
                  <SelectTrigger id="lv"><SelectValue placeholder="Wähle deinen Landesverband" /></SelectTrigger>
                  <SelectContent>
                    {LANDESVERBAENDE.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 2 && method === 'invitation_code' && (
              <p className="text-sm text-muted-foreground">Kein Landesverband erforderlich — wir lesen ihn aus deinem Code aus.</p>
            )}

            {step === 3 && method === 'member_id' && (
              <div className="space-y-2">
                <Label htmlFor="mid">Mitgliedsnummer</Label>
                <Input id="mid" value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="z.B. BY-12345" maxLength={30} />
                <p className="text-xs text-muted-foreground">4–30 Zeichen, Buchstaben/Zahlen/Bindestriche.</p>
              </div>
            )}

            {step === 3 && method === 'invitation_code' && (
              <div className="space-y-2">
                <Label htmlFor="code">Einladungscode</Label>
                <Input id="code" value={invitationCode} onChange={(e) => setInvitationCode(e.target.value.toUpperCase())} placeholder="z.B. DEHOGA-AB12CD" maxLength={32} className="font-mono uppercase" />
              </div>
            )}

            {step === 4 && success && (
              <div className="text-center space-y-3 py-2">
                <BadgeCheck className="w-14 h-14 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  Dein <strong className="text-foreground">DEHOGA-Trust-Badge</strong> ist ab sofort in deinem Profil sichtbar
                  und du erhältst vergünstigte Konditionen auf alle Pro-Pläne.
                </p>
                {pricing && standard && (
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-left text-xs space-y-1.5">
                    <div className="flex justify-between"><span>Pro</span><span><span className="line-through text-muted-foreground mr-2">€{standard.pro?.toFixed(2)}</span><strong className="text-primary">€{pricing.pro?.toFixed(2)}/Monat</strong></span></div>
                    <div className="flex justify-between"><span>Business</span><span><span className="line-through text-muted-foreground mr-2">€{standard.business?.toFixed(2)}</span><strong className="text-primary">€{pricing.business?.toFixed(2)}/Monat</strong></span></div>
                    <div className="flex justify-between"><span>Premium</span><span><span className="line-through text-muted-foreground mr-2">€{standard.premium?.toFixed(2)}</span><strong className="text-primary">€{pricing.premium?.toFixed(2)}/Monat</strong></span></div>
                  </div>
                )}
                <Button className="w-full" onClick={() => navigate('/partner/dashboard')}>Zum Dashboard</Button>
              </div>
            )}

            {step < 4 && (
              <div className="flex justify-end pt-2">
                {step < 3 ? (
                  <Button onClick={() => setStep((s) => (s + 1) as Step)} disabled={!canProceed()}>
                    Weiter <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={!canProceed() || submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-1" />}
                    Verifizieren
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
};

export default DehogaOnboarding;