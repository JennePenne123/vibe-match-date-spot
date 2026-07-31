import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LifeBuoy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithRecoveryCode } from '@/lib/recoveryCodes';

interface RecoveryCodeLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

export function RecoveryCodeLoginDialog({
  open,
  onOpenChange,
  defaultEmail = '',
}: RecoveryCodeLoginDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const remaining = await signInWithRecoveryCode(email.trim(), code);
      onOpenChange(false);
      setCode('');
      toast({
        title: t('recoveryCodes.loginSuccess'),
        description: t('recoveryCodes.loginSuccessDesc', { count: remaining }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message === 'invalid_code' ? t('recoveryCodes.invalidCode') : t('recoveryCodes.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-primary" />
            {t('recoveryCodes.loginTitle')}
          </DialogTitle>
          <DialogDescription>{t('recoveryCodes.loginDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recovery-email">{t('auth.email')}</Label>
            <Input
              id="recovery-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recovery-code">{t('recoveryCodes.codeLabel')}</Label>
            <Input
              id="recovery-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="XXXXX-XXXXX"
              className="font-mono tracking-wide"
              required
            />
          </div>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('recoveryCodes.loginSubmit')}
          </Button>
          <p className="text-xs text-muted-foreground">{t('recoveryCodes.loginHint')}</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RecoveryCodeLoginDialog;