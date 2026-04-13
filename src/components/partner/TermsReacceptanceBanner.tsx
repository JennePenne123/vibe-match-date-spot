import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

// Bump these when AGB or Datenschutz content changes
export const CURRENT_TERMS_VERSION = '1.0';
export const CURRENT_PRIVACY_VERSION = '1.0';

export default function TermsReacceptanceBanner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [needsTerms, setNeedsTerms] = useState(false);
  const [needsPrivacy, setNeedsPrivacy] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase
        .from('partner_profiles')
        .select('terms_version, privacy_version')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setNeedsTerms(data.terms_version !== CURRENT_TERMS_VERSION);
        setNeedsPrivacy(data.privacy_version !== CURRENT_PRIVACY_VERSION);
      }
      setLoading(false);
    };
    check();
  }, [user]);

  if (loading || (!needsTerms && !needsPrivacy)) return null;

  const handleAccept = async () => {
    if (needsTerms && !termsAccepted) return;
    if (needsPrivacy && !privacyAccepted) return;
    if (!user) return;

    setSaving(true);
    try {
      const update: Record<string, string> = {};
      if (needsTerms) {
        update.terms_version = CURRENT_TERMS_VERSION;
        update.terms_accepted_at = new Date().toISOString();
      }
      if (needsPrivacy) {
        update.privacy_version = CURRENT_PRIVACY_VERSION;
        update.privacy_accepted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('partner_profiles')
        .update(update)
        .eq('user_id', user.id);

      if (error) throw error;

      setNeedsTerms(false);
      setNeedsPrivacy(false);
      toast.success(t('partner.termsReaccept.success', 'Zustimmung gespeichert'));
    } catch {
      toast.error(t('partner.termsReaccept.error', 'Fehler beim Speichern'));
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = (!needsTerms || termsAccepted) && (!needsPrivacy || privacyAccepted);

  return (
    <Card className="border-yellow-500/30 bg-yellow-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          {t('partner.termsReaccept.title', 'Aktualisierte Geschäftsbedingungen')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('partner.termsReaccept.description', 'Unsere Geschäftsbedingungen wurden aktualisiert. Bitte lies und akzeptiere die neuen Versionen, um das Partner Portal weiterhin nutzen zu können.')}
        </p>

        <div className="space-y-3">
          {needsTerms && (
            <div className="flex items-start gap-3">
              <Checkbox
                id="reaccept-terms"
                checked={termsAccepted}
                onCheckedChange={(c) => setTermsAccepted(c === true)}
              />
              <Label htmlFor="reaccept-terms" className="text-sm leading-tight">
                {t('partner.termsReaccept.agreeTerms', 'Ich habe die aktualisierte')}{' '}
                <Link to="/partner/terms" className="text-primary underline hover:text-primary/80" target="_blank">
                  {t('partner.termsReaccept.termsLink', 'Partner-AGB')}
                </Link>{' '}
                {t('partner.termsReaccept.agreeTermsSuffix', 'gelesen und stimme diesen zu.')}
              </Label>
            </div>
          )}

          {needsPrivacy && (
            <div className="flex items-start gap-3">
              <Checkbox
                id="reaccept-privacy"
                checked={privacyAccepted}
                onCheckedChange={(c) => setPrivacyAccepted(c === true)}
              />
              <Label htmlFor="reaccept-privacy" className="text-sm leading-tight">
                {t('partner.termsReaccept.agreePrivacy', 'Ich habe die aktualisierte')}{' '}
                <Link to="/partner/privacy" className="text-primary underline hover:text-primary/80" target="_blank">
                  {t('partner.termsReaccept.privacyLink', 'Datenschutzerklärung')}
                </Link>{' '}
                {t('partner.termsReaccept.agreePrivacySuffix', 'gelesen und stimme dieser zu.')}
              </Label>
            </div>
          )}
        </div>

        <Button onClick={handleAccept} disabled={!canSubmit || saving} size="sm" className="w-full">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {t('common.loading')}
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              {t('partner.termsReaccept.acceptButton', 'Zustimmen & fortfahren')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
