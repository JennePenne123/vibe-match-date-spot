import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion';
import { 
  ArrowLeft, Lock, Trash2, Shield, Loader2, Check, PauseCircle, 
  Bell, Mail, Download, ExternalLink, FileText, Scale, HelpCircle, MessageCircle, Brain
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import LanguageSelector from '@/components/LanguageSelector';

const TRACKING_OPT_OUT_KEY = 'vybepulse_tracking_opt_out';

const Settings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading, logout } = useAuth();
  const { toast } = useToast();
  const pushNotifications = usePushNotifications();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [pauseInitialLoad, setPauseInitialLoad] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [trackingOptOut, setTrackingOptOut] = useState(() => localStorage.getItem(TRACKING_OPT_OUT_KEY) === 'true');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/?auth=required', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchPauseStatus = async () => {
      if (!user) return;
      try {
        const { data } = await supabase.from('profiles').select('is_paused').eq('id', user.id).single();
        if (data) setIsPaused(data.is_paused ?? false);
      } catch (error) {
        console.error('Failed to fetch pause status:', error);
      } finally {
        setPauseInitialLoad(false);
      }
    };
    fetchPauseStatus();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const deleteWord = t('settings.deleteConfirmWord');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(false);
    if (newPassword.length < 6) {
      toast({ title: t('settings.passwordTooShort'), description: t('settings.passwordTooShortDesc'), variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('settings.passwordMismatch'), description: t('settings.passwordMismatchDesc'), variant: 'destructive' });
      return;
    }
    setPasswordLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email || '', password: currentPassword });
      if (signInError) {
        toast({ title: t('settings.wrongPassword'), description: t('settings.wrongPasswordDesc'), variant: 'destructive' });
        setPasswordLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      } else {
        setPasswordSuccess(true);
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        toast({ title: t('settings.passwordChanged'), description: t('settings.passwordChangedDesc') });
      }
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message || t('settings.somethingWrong'), variant: 'destructive' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || newEmail === user.email) return;
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) {
        toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('settings.confirmationSent'), description: t('settings.confirmationSentDesc', { email: newEmail }) });
        setNewEmail('');
      }
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message || t('settings.somethingWrong'), variant: 'destructive' });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleTogglePause = async (paused: boolean) => {
    setPauseLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ is_paused: paused, paused_at: paused ? new Date().toISOString() : null }).eq('id', user.id);
      if (error) throw error;
      setIsPaused(paused);
      toast({
        title: paused ? t('settings.pausedToast') : t('settings.reactivatedToast'),
        description: paused ? t('settings.pausedToastDesc') : t('settings.reactivatedToastDesc'),
      });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message || t('settings.somethingWrong'), variant: 'destructive' });
    } finally {
      setPauseLoading(false);
    }
  };

  const handleDataExport = async () => {
    setExportLoading(true);
    try {
      const [profileRes, prefsRes, invitationsRes, feedbackRes, friendsRes, pointsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
        supabase.from('date_invitations').select('*').or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`),
        supabase.from('date_feedback').select('*').eq('user_id', user.id),
        supabase.from('friendships').select('*').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
        supabase.from('user_points').select('*').eq('user_id', user.id).single(),
      ]);
      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profileRes.data, preferences: prefsRes.data,
        invitations: invitationsRes.data || [], feedback: feedbackRes.data || [],
        friendships: friendsRes.data || [], points: pointsRes.data,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vybepulse-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: t('settings.dataExported'), description: t('settings.dataExportedDesc') });
    } catch (error: any) {
      toast({ title: t('settings.exportFailed'), description: error.message || t('settings.exportFailedDesc'), variant: 'destructive' });
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== deleteWord) return;
    setDeleteLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: t('settings.deleteRequested'), description: t('settings.deleteRequestedDesc') });
      await logout();
      navigate('/', { replace: true });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message || t('settings.somethingWrong'), variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-24">
        {/* Header */}
        <div className="bg-card p-4 pt-12 shadow-sm border-b border-border">
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate(-1)} variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">{t('settings.title')}</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Language Selector */}
          <LanguageSelector />

          {/* Account Info */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <Shield className="w-4 h-4 text-primary" />
                {t('settings.accountInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('settings.email')}</span>
                <span className="text-sm font-medium text-foreground truncate ml-4 max-w-[200px]">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('settings.name')}</span>
                <span className="text-sm font-medium text-foreground">{user.name || '–'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('settings.status')}</span>
                <span className={`text-sm font-medium ${isPaused ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {pauseInitialLoad ? '...' : isPaused ? t('settings.statusPaused') : t('settings.statusActive')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Email Change */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <Mail className="w-4 h-4 text-primary" />
                {t('settings.changeEmail')}
              </CardTitle>
              <CardDescription className="text-xs">{t('settings.changeEmailDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailChange} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-email" className="text-sm text-foreground">{t('settings.newEmail')}</Label>
                  <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" placeholder={user.email || 'new@email.com'} required className="bg-background/50 border-border/50" />
                </div>
                <Button type="submit" disabled={emailLoading || !newEmail || newEmail === user.email} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {emailLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t('settings.requestChange')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <Lock className="w-4 h-4 text-primary" />
                {t('settings.changePassword')}
              </CardTitle>
              <CardDescription className="text-xs">{t('settings.changePasswordDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="current-password" className="text-sm text-foreground">{t('settings.currentPassword')}</Label>
                  <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" required className="bg-background/50 border-border/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-sm text-foreground">{t('settings.newPassword')}</Label>
                  <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" placeholder="••••••••" required minLength={6} className="bg-background/50 border-border/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-sm text-foreground">{t('settings.confirmPassword')}</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="••••••••" required minLength={6} className="bg-background/50 border-border/50" />
                </div>
                <Button type="submit" disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {passwordLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : passwordSuccess ? <Check className="w-4 h-4 mr-2" /> : null}
                  {passwordSuccess ? t('settings.passwordChangedBtn') : t('settings.changePasswordBtn')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <Bell className="w-4 h-4 text-primary" />
                {t('settings.notifications')}
              </CardTitle>
              <CardDescription className="text-xs">{t('settings.notificationsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">{t('settings.pushNotifications')}</p>
                  <p className="text-xs text-muted-foreground">
                    {!pushNotifications.isSupported ? t('settings.pushNotSupported') : pushNotifications.isSubscribed ? t('settings.pushActive') : t('settings.pushInactive')}
                  </p>
                </div>
                <Switch checked={pushNotifications.isSubscribed} onCheckedChange={() => pushNotifications.toggleSubscription()} disabled={pushNotifications.isLoading || !pushNotifications.isSupported} />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Tracking */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <Shield className="w-4 h-4 text-primary" />
                {t('settings.privacyTracking', 'Datenschutz & Tracking')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('settings.privacyTrackingDesc', 'Kontrolliere, welche Daten zur Verbesserung der Empfehlungen erfasst werden')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {t('settings.implicitTracking', 'Implizite Signale')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trackingOptOut
                      ? t('settings.trackingDisabled', 'Verweildauer, Scrolltiefe und Klickmuster werden nicht erfasst')
                      : t('settings.trackingEnabled', 'Nutzungsverhalten wird zur Verbesserung der AI-Empfehlungen analysiert')
                    }
                  </p>
                </div>
                <Switch
                  checked={!trackingOptOut}
                  onCheckedChange={(checked) => {
                    const optOut = !checked;
                    setTrackingOptOut(optOut);
                    localStorage.setItem(TRACKING_OPT_OUT_KEY, String(optOut));
                    toast({
                      title: optOut
                        ? t('settings.trackingDeactivated', 'Tracking deaktiviert')
                        : t('settings.trackingActivated', 'Tracking aktiviert'),
                      description: optOut
                        ? t('settings.trackingDeactivatedDesc', 'Implizite Signale werden nicht mehr erfasst')
                        : t('settings.trackingActivatedDesc', 'Implizite Signale verbessern deine Empfehlungen'),
                    });
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('settings.trackingInfo', 'Mehr dazu in unserer')}{' '}
                <button onClick={() => navigate('/datenschutz')} className="text-primary underline underline-offset-2 hover:text-primary/80">
                  {t('settings.privacyPolicy', 'Datenschutzerklärung')}
                </button>
              </p>
            </CardContent>
          </Card>

          {/* AI Profiling Notice (GDPR Art. 22) */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <Brain className="w-4 h-4 text-primary" />
                {t('settings.aiProfiling', 'KI-gestützte Empfehlungen')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('settings.aiProfilingDesc', 'Informationen zur automatisierten Verarbeitung deiner Daten (DSGVO Art. 22).')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('settings.aiProfilingExplanation', 'Wir nutzen Künstliche Intelligenz, um dir passende Date-Locations vorzuschlagen. Dazu analysieren wir deine Präferenzen, vergangene Bewertungen und dein Nutzungsverhalten (z. B. welche Orte du favorisierst).')}
              </p>
              <p className="text-sm font-medium text-foreground">
                {t('settings.aiProfilingRight', 'Du hast das Recht, einer solchen automatisierten Verarbeitung jederzeit zu widersprechen.')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('settings.aiProfilingLearnMore', 'Mehr dazu in unserer Datenschutzerklärung')}{' '}
                <button onClick={() => navigate('/datenschutz')} className="text-primary underline underline-offset-2 hover:text-primary/80">
                  →
                </button>
              </p>
            </CardContent>
          </Card>

          {/* Pause Account */}
          <Card className={`bg-card ${isPaused ? 'border-amber-500/40' : 'border-border'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <PauseCircle className={`w-4 h-4 ${isPaused ? 'text-amber-500' : 'text-primary'}`} />
                {t('settings.pauseAccount')}
              </CardTitle>
              <CardDescription className="text-xs">
                {isPaused ? t('settings.pauseDescPaused') : t('settings.pauseDescActive')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">{isPaused ? t('settings.accountPaused') : t('settings.accountActive')}</p>
                  <p className="text-xs text-muted-foreground">{isPaused ? t('settings.reactivateHint') : t('settings.pauseHint')}</p>
                </div>
                <Switch checked={isPaused} onCheckedChange={handleTogglePause} disabled={pauseLoading || pauseInitialLoad} className="data-[state=checked]:bg-amber-500" />
              </div>
            </CardContent>
          </Card>

          {/* Support & Hilfe */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <HelpCircle className="w-4 h-4 text-primary" />
                {t('settings.support', 'Hilfe & Support')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('settings.supportDesc', 'Häufige Fragen und Kontaktmöglichkeiten')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1" className="border-border/50">
                  <AccordionTrigger className="text-sm text-foreground hover:no-underline py-2">
                    {t('settings.faq1Question', 'Wie funktioniert das AI-Matching?')}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {t('settings.faq1Answer', 'HiOutz analysiert deine Präferenzen (Küche, Vibe, Preis, Zeiten) und vergleicht sie mit deinem Date-Partner. Je mehr ihr übereinstimmt, desto höher der Match-Score. Die AI lernt auch aus deinem Feedback und wird immer besser.')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-2" className="border-border/50">
                  <AccordionTrigger className="text-sm text-foreground hover:no-underline py-2">
                    {t('settings.faq2Question', 'Was sind Vouchers und wie löse ich sie ein?')}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {t('settings.faq2Answer', 'Vouchers sind Rabattgutscheine von Partner-Venues. Du findest sie in deinem Wallet (Profil). Zeige den QR-Code einfach im Restaurant vor – der Partner scannt ihn und der Rabatt wird automatisch angewendet.')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-3" className="border-border/50">
                  <AccordionTrigger className="text-sm text-foreground hover:no-underline py-2">
                    {t('settings.faq3Question', 'Kann ich mein Konto pausieren?')}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {t('settings.faq3Answer', 'Ja! Aktiviere einfach den Pause-Schalter oben in den Einstellungen. Dein Konto bleibt bestehen, du erhältst aber keine Benachrichtigungen und bist für andere nicht sichtbar. Du kannst jederzeit wieder aktivieren.')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-4" className="border-border/50">
                  <AccordionTrigger className="text-sm text-foreground hover:no-underline py-2">
                    {t('settings.faq4Question', 'Wie kann ich meine Daten exportieren oder löschen?')}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {t('settings.faq4Answer', 'Unter "Daten exportieren" kannst du all deine Daten als JSON herunterladen. Wenn du dein Konto komplett löschen möchtest, findest du die Option ganz unten auf dieser Seite im Bereich "Gefahrenzone".')}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Separator className="bg-border/50" />

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t('settings.supportEmailHint', 'Keine passende Antwort gefunden? Schreib uns direkt:')}
                </p>
                <Button
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-accent/50"
                  onClick={() => {
                    const subject = encodeURIComponent('HiOutz Support');
                    const body = encodeURIComponent(`Hallo HiOutz-Team,\n\n[Beschreibe dein Anliegen hier]\n\n---\nUser-ID: ${user.id}\nApp-Version: 1.0\n`);
                    window.open(`mailto:support@vybepulse.de?subject=${subject}&body=${body}`, '_blank');
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t('settings.contactSupport', 'Support kontaktieren')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator className="bg-border/50" />

          {/* Data Export */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <Download className="w-4 h-4 text-primary" />
                {t('settings.dataExport')}
              </CardTitle>
              <CardDescription className="text-xs">{t('settings.dataExportDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDataExport} disabled={exportLoading} variant="outline" className="w-full border-border text-foreground hover:bg-accent/50">
                {exportLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {t('settings.downloadData')}
              </Button>
            </CardContent>
          </Card>

          {/* Legal Links */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <Scale className="w-4 h-4 text-primary" />
                {t('settings.legal')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: '/datenschutz', label: t('settings.privacy') },
                { href: '/agb', label: t('settings.terms') },
                { href: '/impressum', label: t('settings.imprint') },
              ].map(({ href, label }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-2 px-1 rounded-md hover:bg-accent/50 transition-colors group">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{label}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </a>
              ))}
            </CardContent>
          </Card>

          <Separator className="bg-border/50" />

          {/* Danger Zone */}
          <Card className="bg-card border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <Trash2 className="w-4 h-4" />
                {t('settings.dangerZone')}
              </CardTitle>
              <CardDescription className="text-xs">{t('settings.dangerZoneDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">{t('settings.deleteAccount')}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">{t('settings.deleteConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settings.deleteConfirmDesc')}{' '}
                      <span className="font-bold text-destructive">{t('settings.deleteConfirmInput', { word: deleteWord })}</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={t('settings.deleteConfirmInput', { word: deleteWord })} className="bg-background/50 border-border/50" />
                  <div className="flex items-start gap-2 mt-2">
                    <Checkbox 
                      id="delete-confirm-checkbox" 
                      checked={deleteConfirmChecked} 
                      onCheckedChange={(checked) => setDeleteConfirmChecked(checked === true)} 
                    />
                    <Label htmlFor="delete-confirm-checkbox" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                      {t('settings.deleteCheckboxLabel', 'Ich verstehe, dass alle meine Daten (Profil, Einladungen, Bewertungen, Freundschaften, Punkte) unwiderruflich gelöscht werden.')}
                    </Label>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-border text-foreground" onClick={() => { setDeleteConfirmChecked(false); setDeleteConfirmText(''); }}>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} disabled={deleteConfirmText !== deleteWord || !deleteConfirmChecked || deleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {deleteLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {t('settings.deleteForever')}
                      {t('settings.deleteForever')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
