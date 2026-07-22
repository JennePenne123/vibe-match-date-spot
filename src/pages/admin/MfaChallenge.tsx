import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const MfaChallenge: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error || !data?.totp?.length) {
        toast.error('Kein TOTP-Faktor gefunden');
        navigate('/admin/mfa-setup', { replace: true });
        return;
      }
      const first = data.totp.find((f) => f.status === 'verified') ?? data.totp[0];
      setFactorId(first.id);
      const { data: ch, error: cErr } = await supabase.auth.mfa.challenge({ factorId: first.id });
      if (cErr) {
        toast.error(cErr.message);
        return;
      }
      setChallengeId(ch.id);
    })();
  }, [navigate]);

  const verify = async () => {
    if (!factorId || !challengeId || code.length < 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
      if (error) throw error;
      const back = (location.state as any)?.from ?? '/admin';
      navigate(back, { replace: true });
    } catch (e: any) {
      toast.error(e.message || 'Code ungültig');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold">2FA-Code eingeben</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Öffne deine Authenticator-App und gib den aktuellen 6-stelligen Code ein.
        </p>
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="text-center text-lg tracking-widest"
        />
        <Button className="w-full" onClick={verify} disabled={loading || code.length < 6}>
          {loading ? 'Prüfe …' : 'Freischalten'}
        </Button>
      </Card>
    </div>
  );
};

export default MfaChallenge;