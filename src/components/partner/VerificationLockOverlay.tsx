import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VerificationLockOverlayProps {
  feature: string;
}

export default function VerificationLockOverlay({ feature }: VerificationLockOverlayProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="py-8 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t('partner.lock.title', 'Funktion gesperrt')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('partner.lock.description', 'Deine Verifizierungsfrist ist abgelaufen. Bitte verifiziere dein Geschäft, um {{feature}} weiterhin nutzen zu können.', { feature })}
          </p>
        </div>
        <Button onClick={() => navigate('/partner/profile')} className="gap-2">
          <ShieldAlert className="w-4 h-4" />
          {t('partner.lock.verifyNow', 'Jetzt verifizieren')}
        </Button>
      </CardContent>
    </Card>
  );
}
