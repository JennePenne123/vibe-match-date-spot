import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, Trash2, Shield, Mail, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { COMPANY } from '@/config/companyInfo';
import { SEO } from '@/components/SEO';

export default function DsgvoRequests() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);

  const deleteWord = t('settings.deleteConfirmWord', 'LÖSCHEN');

  const handleDataExport = async () => {
    if (!user) {
      toast({
        title: t('dsgvoRequests.authRequired', 'Anmeldung erforderlich'),
        description: t('dsgvoRequests.authRequiredDesc', 'Bitte melde dich an, um deine Daten zu exportieren.'),
        variant: 'destructive',
      });
      return;
    }
    setExportLoading(true);
    try {
      const [profileRes, prefsRes, invitationsRes, feedbackRes, friendsRes, pointsRes, favoritesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('date_invitations').select('*').or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`),
        supabase.from('date_feedback').select('*').eq('user_id', user.id),
        supabase.from('friendships').select('*').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
        supabase.from('user_points').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_favorites').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        gdpr_article: 'Art. 15 & Art. 20 DSGVO',
        profile: profileRes.data,
        preferences: prefsRes.data,
        invitations: invitationsRes.data || [],
        feedback: feedbackRes.data || [],
        friendships: friendsRes.data || [],
        points: pointsRes.data,
        favorites: favoritesRes.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hioutz-dsgvo-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: t('dsgvoRequests.exportSuccess', 'Datenexport erstellt'),
        description: t('dsgvoRequests.exportSuccessDesc', 'Deine Datei wurde heruntergeladen.'),
      });
    } catch (error: any) {
      toast({
        title: t('dsgvoRequests.exportFailed', 'Export fehlgeschlagen'),
        description: error?.message || t('common.somethingWrong', 'Etwas ist schiefgelaufen.'),
        variant: 'destructive',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== deleteWord || !deleteConfirmChecked) return;
    setDeleteLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast({
        title: t('dsgvoRequests.deleteSuccess', 'Löschung eingeleitet'),
        description: t('dsgvoRequests.deleteSuccessDesc', 'Alle deine Daten werden gemäß Art. 17 DSGVO gelöscht.'),
      });
      await logout();
      navigate('/', { replace: true });
    } catch (error: any) {
      toast({
        title: t('common.error', 'Fehler'),
        description: error?.message || t('common.somethingWrong', 'Etwas ist schiefgelaufen.'),
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t('dsgvoRequests.metaTitle', 'DSGVO-Anfragen – Daten exportieren & löschen | H!Outz')}
        description={t('dsgvoRequests.metaDescription', 'Übe deine DSGVO-Rechte aus: Datenexport (Art. 20), Löschung (Art. 17) und Auskunft (Art. 15) bei H!Outz.')}
        path="/dsgvo-anfragen"
      />
      <div className="max-w-2xl mx-auto pb-16">
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full" aria-label={t('common.back', 'Zurück')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {t('dsgvoRequests.title', 'DSGVO-Anfragen')}
            </h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            {t(
              'dsgvoRequests.intro',
              'Hier kannst du jederzeit deine Rechte aus der Datenschutz-Grundverordnung (DSGVO) ausüben – ohne Umwege, direkt in der App.',
            )}
          </p>

          {/* Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="w-5 h-5 text-primary" />
                {t('dsgvoRequests.exportTitle', 'Datenexport (Art. 15 & 20 DSGVO)')}
              </CardTitle>
              <CardDescription>
                {t(
                  'dsgvoRequests.exportDesc',
                  'Lade eine maschinenlesbare Kopie aller Daten herunter, die wir zu deinem Konto gespeichert haben – als JSON-Datei.',
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDataExport} disabled={exportLoading || !user} className="w-full sm:w-auto">
                {exportLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('dsgvoRequests.exporting', 'Export wird erstellt…')}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    {t('dsgvoRequests.exportButton', 'Daten exportieren')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Rectification / Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-5 h-5 text-primary" />
                {t('dsgvoRequests.rectificationTitle', 'Auskunft & Berichtigung (Art. 15, 16 DSGVO)')}
              </CardTitle>
              <CardDescription>
                {t(
                  'dsgvoRequests.rectificationDesc',
                  'Für weitergehende Auskünfte oder Berichtigungen einzelner Datenpunkte schreibe uns bitte per E-Mail. Wir antworten innerhalb von 30 Tagen gemäß Art. 12 DSGVO.',
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <a href={`mailto:${COMPANY.privacyEmail}?subject=${encodeURIComponent('DSGVO-Anfrage')}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  {COMPANY.privacyEmail}
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Deletion */}
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <Trash2 className="w-5 h-5" />
                {t('dsgvoRequests.deleteTitle', 'Konto & Daten löschen (Art. 17 DSGVO)')}
              </CardTitle>
              <CardDescription>
                {t(
                  'dsgvoRequests.deleteDesc',
                  'Dein Konto und sämtliche personenbezogenen Daten werden innerhalb von 30 Tagen unwiderruflich gelöscht. Gesetzliche Aufbewahrungspflichten (z. B. Rechnungsdaten) bleiben unberührt.',
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {t(
                    'dsgvoRequests.deleteWarning',
                    'Diese Aktion kann nicht rückgängig gemacht werden. Punkte, Freundschaften und Verlauf gehen dauerhaft verloren.',
                  )}
                </span>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={!user}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('dsgvoRequests.deleteButton', 'Konto endgültig löschen')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('dsgvoRequests.deleteDialogTitle', 'Konto wirklich löschen?')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t(
                        'dsgvoRequests.deleteDialogDesc',
                        'Gib zur Bestätigung "{{word}}" ein und aktiviere die Checkbox.',
                        { word: deleteWord },
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-3">
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={deleteWord}
                      autoComplete="off"
                    />
                    <label className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        checked={deleteConfirmChecked}
                        onCheckedChange={(v) => setDeleteConfirmChecked(v === true)}
                        className="mt-0.5"
                      />
                      <span>
                        {t(
                          'dsgvoRequests.deleteAcknowledge',
                          'Ich habe verstanden, dass alle meine Daten unwiderruflich gelöscht werden.',
                        )}
                      </span>
                    </label>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteLoading}>{t('common.cancel', 'Abbrechen')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== deleteWord || !deleteConfirmChecked || deleteLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('dsgvoRequests.deleting', 'Löschung läuft…')}
                        </>
                      ) : (
                        t('dsgvoRequests.confirmDelete', 'Endgültig löschen')
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            {t(
              'dsgvoRequests.complaintNotice',
              'Du hast außerdem das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO).',
            )}
          </p>
        </div>
      </div>
    </div>
  );
}