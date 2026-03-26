import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, ShieldAlert, Clock, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePartnerVerification, COUNTRY_TAX_CONFIG } from '@/hooks/usePartnerVerification';
import { toast } from '@/hooks/use-toast';

export default function PartnerVerificationBanner() {
  const { t } = useTranslation();
  const { verification, loading, submitVerification, daysRemaining, isExpired } = usePartnerVerification();
  const [taxId, setTaxId] = useState('');
  const [taxIdType, setTaxIdType] = useState<'vat_id' | 'local_tax_number'>('vat_id');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showForm, setShowForm] = useState(false);

  if (loading || !verification) return null;

  const country = selectedCountry || verification.country || 'DE';
  const countryConfig = COUNTRY_TAX_CONFIG[country] || COUNTRY_TAX_CONFIG['DE'];

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
            {verification.verification_method === 'vat_id' ? countryConfig.vatLabel : countryConfig.localLabel}
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
      const result = await submitVerification(taxId.trim(), taxIdType, country);
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
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

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
            {/* Country Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs">{t('partner.verification.country', 'Land')}</Label>
              <Select value={country} onValueChange={setSelectedCountry}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Object.entries(COUNTRY_TAX_CONFIG)
                    .sort((a, b) => a[1].name.localeCompare(b[1].name))
                    .map(([code, config]) => (
                      <SelectItem key={code} value={code} className="text-sm">
                        {config.flag} {config.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tax ID Type Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={taxIdType === 'vat_id' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTaxIdType('vat_id')}
                className="text-xs"
              >
                {countryConfig.vatLabel}
              </Button>
              <Button
                variant={taxIdType === 'local_tax_number' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTaxIdType('local_tax_number')}
                className="text-xs"
              >
                {countryConfig.localLabel}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {taxIdType === 'vat_id' && countryConfig.isEu
                ? t('partner.verification.vatEuHint', 'Wird automatisch über die EU VIES-Datenbank geprüft.')
                : taxIdType === 'vat_id'
                  ? t('partner.verification.vatNonEuHint', 'Format-Prüfung + Adressabgleich via Google Places.')
                  : t('partner.verification.localHint', 'Wird mit Adressabgleich verifiziert. Bei Bedarf kurze Admin-Prüfung.')}
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs">
                {taxIdType === 'vat_id' ? countryConfig.vatLabel : countryConfig.localLabel}
              </Label>
              <Input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder={taxIdType === 'vat_id' ? countryConfig.vatPlaceholder : countryConfig.localPlaceholder}
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
