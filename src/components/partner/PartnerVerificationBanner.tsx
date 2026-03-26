import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, ShieldAlert, Clock, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePartnerVerification } from '@/hooks/usePartnerVerification';
import { toast } from '@/hooks/use-toast';

export default function PartnerVerificationBanner() {
  const { t } = useTranslation();
  const { verification, loading, submitVerification, daysRemaining, isExpired } = usePartnerVerification();
  const [taxId, setTaxId] = useState('');
  const [taxIdType, setTaxIdType] = useState<'ust_id' | 'steuernummer'>('ust_id');
  const [verifying, setVerifying] = useState(false);
  const [showForm, setShowForm] = useState(false);

  if (loading || !verification) return null;

  // Already verified
  if (verification.verification_status === 'verified') {
    return (
      <Alert className="border-green-500/30 bg-green-500/5">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center gap-2">
          <span className="font-medium text-green-700">
            {t('partner.verification.verified', 'Verifiziert')}
          </span>
          <Badge variant="outline" className="border-green-500/50 text-green-700 text-xs">
            {verification.verification_method === 'ust_id' ? 'USt-IdNr.' : 'Steuernummer'}
          </Badge>
        </AlertDescription>
      </Alert>
    );
  }

  // Pending admin review
  if (verification.verification_status === 'pending_review') {
    return (
      <Alert className="border-yellow-500/30 bg-yellow-500/5">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-700">
          {t('partner.verification.pendingReview', 'Deine Verifizierung wird geprüft. Dies dauert in der Regel 24 Stunden.')}
        </AlertDescription>
      </Alert>
    );
  }

  const handleSubmit = async () => {
    if (!taxId.trim()) return;
    setVerifying(true);
    try {
      const result = await submitVerification(taxId.trim(), taxIdType);
      if (result?.status === 'verified') {
        toast({
          title: t('partner.verification.success', 'Verifizierung erfolgreich! ✅'),
          description: t('partner.verification.successDesc', 'Dein Geschäftsprofil ist jetzt verifiziert.'),
        });
      } else if (result?.status === 'pending_review') {
        toast({
          title: t('partner.verification.pendingTitle', 'Prüfung eingeleitet'),
          description: t('partner.verification.pendingDesc', 'Deine Daten werden innerhalb von 24h geprüft.'),
        });
      } else {
        toast({
          title: t('partner.verification.failed', 'Verifizierung fehlgeschlagen'),
          description: result?.notes || t('partner.verification.failedDesc', 'Bitte überprüfe deine Angaben.'),
          variant: 'destructive',
        });
      }
      setShowForm(false);
    } catch (err: any) {
      toast({
        title: t('partner.verification.error', 'Fehler'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  // Unverified or failed - show banner
  const urgencyColor = isExpired ? 'destructive' : daysRemaining !== null && daysRemaining <= 3 ? 'destructive' : 'secondary';

  return (
    <Card className={`border ${isExpired ? 'border-destructive/50 bg-destructive/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {isExpired ? (
            <ShieldAlert className="w-5 h-5 text-destructive" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-yellow-600" />
          )}
          {t('partner.verification.title', 'Geschäftsverifizierung')}
          {daysRemaining !== null && !isExpired && (
            <Badge variant={urgencyColor} className="text-xs ml-auto">
              {t('partner.verification.daysLeft', '{{days}} Tage übrig', { days: daysRemaining })}
            </Badge>
          )}
          {isExpired && (
            <Badge variant="destructive" className="text-xs ml-auto">
              {t('partner.verification.expired', 'Frist abgelaufen')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {isExpired
            ? t('partner.verification.expiredDesc', 'Bitte verifiziere dein Geschäft, um weiterhin alle Funktionen nutzen zu können.')
            : t('partner.verification.desc', 'Verifiziere dein Geschäft für ein Trust-Badge und vollen Zugang. Dauert nur 2 Minuten.')}
        </p>

        {verification.verification_status === 'failed' && verification.verification_notes && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">{verification.verification_notes}</AlertDescription>
          </Alert>
        )}

        {!showForm ? (
          <Button onClick={() => setShowForm(true)} size="sm" className="w-full">
            <ShieldCheck className="w-4 h-4 mr-2" />
            {t('partner.verification.startBtn', 'Jetzt verifizieren')}
          </Button>
        ) : (
          <div className="space-y-3 pt-1">
            {/* Tax ID Type Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={taxIdType === 'ust_id' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTaxIdType('ust_id')}
                className="text-xs"
              >
                USt-IdNr.
              </Button>
              <Button
                variant={taxIdType === 'steuernummer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTaxIdType('steuernummer')}
                className="text-xs"
              >
                Steuernummer
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {taxIdType === 'ust_id'
                ? t('partner.verification.ustHint', 'Wird automatisch über die EU VIES-Datenbank geprüft.')
                : t('partner.verification.stHint', 'Wird mit Adressabgleich verifiziert. Bei Bedarf kurze Admin-Prüfung.')}
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs">
                {taxIdType === 'ust_id' ? 'USt-IdNr. (z.B. DE123456789)' : 'Steuernummer (z.B. 12/345/67890)'}
              </Label>
              <Input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder={taxIdType === 'ust_id' ? 'DE123456789' : '12/345/67890'}
                className="text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="flex-1">
                {t('common.cancel', 'Abbrechen')}
              </Button>
              <Button onClick={handleSubmit} disabled={verifying || !taxId.trim()} size="sm" className="flex-1">
                {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ShieldCheck className="w-4 h-4 mr-1" />}
                {t('partner.verification.verify', 'Prüfen')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
