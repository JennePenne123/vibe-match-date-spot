import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

/**
 * Enrolls a TOTP factor for the current admin.
 * Shows QR + secret, verifies the first code, and redirects to /admin.
 */
const MfaSetup: React.FC = () => {
  const navigate = useNavigate();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Clean up any unverified factors first
        const { data: existing } = await supabase.auth.mfa.listFactors();
        for (const f of existing?.all ?? []) {
          if (f.status !== 'verified') {
            await supabase.auth.mfa.unenroll({ factorId: f.id });
          }
        }
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: `H!Outz Admin (${new Date().toISOString().slice(0, 10)})`,
        });
        if (error) throw error;
        setFactorId(data.id);
        setQr(data.totp.qr_code);
        setSecret(data.totp.secret);
      } catch (e: any) {
        toast.error(e.message || 'MFA-Enrollment fehlgeschlagen');
      } finally {
        setEnrolling(false);
      }
    })();
  }, []);

  const verify = async () => {
    if (!factorId || code.length < 6) return;
    setLoading(true);
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (vErr) throw vErr;
      try {
        await (supabase.rpc as any)('log_admin_action', {
          _action: 'admin.mfa_enrolled',
          _resource_type: 'auth.mfa_factor',
          _resource_id: factorId,
        });
      } catch {}
      toast.success('MFA aktiviert');
      navigate('/admin', { replace: true });
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
          <h1 className="text-xl font-semibold">2-Faktor-Authentifizierung einrichten</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Scanne den QR-Code mit einer Authenticator-App (Google Authenticator, 1Password,
          Authy, …) und gib den 6-stelligen Code ein, um den Admin-Bereich freizuschalten.
        </p>

        {enrolling && <p className="text-sm">Erzeuge Schlüssel …</p>}

        {qr && (
          <div className="space-y-3">
            <img src={qr} alt="TOTP QR-Code" className="mx-auto w-48 h-48 bg-white p-2 rounded" />
            {secret && (
              <p className="text-xs text-center break-all text-muted-foreground">
                Manueller Schlüssel: <code>{secret}</code>
              </p>
            )}
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
              {loading ? 'Prüfe …' : 'Bestätigen'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MfaSetup;