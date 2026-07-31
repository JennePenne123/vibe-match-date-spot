import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, LogIn } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { clearGroupToken, readGroupToken, storeGroupToken } from '@/lib/groupInviteLink';
import InviteErrorState, { type InviteErrorKind } from '@/components/group-date/InviteErrorState';

interface Preview {
  found: boolean;
  group_id?: string;
  name?: string;
  status?: string;
  max_members?: number;
  member_count?: number;
  already_member?: boolean;
}

export default function JoinGroup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const token = searchParams.get('token') || readGroupToken();

  const [state, setState] = useState<'loading' | 'auth_required' | 'preview' | 'success' | 'error'>('loading');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [errorKind, setErrorKind] = useState<InviteErrorKind>('invalid');
  const [errorDetail, setErrorDetail] = useState<string | undefined>(undefined);
  const [joining, setJoining] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const fail = (kind: InviteErrorKind, detail?: string) => {
    setErrorKind(kind);
    setErrorDetail(detail);
    setState('error');
  };

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      clearGroupToken();
      fail('missing');
      return;
    }
    if (!user) {
      storeGroupToken(token);
      setState('auth_required');
      return;
    }
    storeGroupToken(token);
    setState('loading');

    const load = async () => {
      const { data, error } = await supabase.rpc('get_group_invite_preview' as never, { _token: token } as never);
      if (error) {
        fail('failed', error.message);
        return;
      }
      const result = data as unknown as Preview & { reason?: string };
      if (!result?.found) {
        clearGroupToken();
        fail(result?.reason === 'expired' ? 'expired' : 'invalid');
        return;
      }
      if (result.status && ['completed', 'cancelled', 'closed'].includes(result.status)) {
        fail('closed');
        return;
      }
      setPreview(result);
      setState('preview');
    };
    load();
  }, [token, user, authLoading, reloadKey]);

  const handleJoin = useCallback(async () => {
    if (!token) return;
    setJoining(true);
    const { data, error } = await supabase.rpc('join_group_via_invite' as never, { _token: token } as never);
    setJoining(false);

    const result = data as unknown as { success?: boolean; reason?: string } | null;
    if (error || !result?.success) {
      const reason = result?.reason;
      if (reason === 'full') fail('full');
      else if (reason === 'closed') fail('closed');
      else if (reason === 'expired' || reason === 'not_found') {
        clearGroupToken();
        fail(reason === 'expired' ? 'expired' : 'invalid');
      } else fail('failed', error?.message);
      return;
    }
    clearGroupToken();
    setState('success');
    setTimeout(() => navigate('/group-dates'), 1200);
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 space-y-4">
          {state === 'loading' && (
            <div className="flex justify-center py-6"><LoadingSpinner /></div>
          )}

          {state === 'auth_required' && (
            <div className="text-center space-y-3">
              <LogIn className="w-8 h-8 mx-auto text-primary" />
              <h1 className="text-lg font-semibold">Anmeldung nötig</h1>
              <p className="text-sm text-muted-foreground">
                Melde dich an, um der Gruppe beizutreten.
              </p>
              <Button className="w-full" onClick={() => navigate('/?auth=required')}>Jetzt anmelden</Button>
            </div>
          )}

          {state === 'preview' && preview && (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-lg font-semibold">{preview.name}</h1>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {preview.member_count}/{preview.max_members} Personen
                </Badge>
                {preview.already_member && (
                  <Badge variant="outline" className="text-xs">Du bist eingeladen</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Tritt der Gruppe bei und gib danach deine Präferenzen ein.
              </p>
              <Button className="w-full" onClick={handleJoin} disabled={joining}>
                {joining ? 'Trete bei …' : 'Gruppe beitreten'}
              </Button>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => { clearGroupToken(); navigate('/home'); }}>
                Abbrechen
              </Button>
            </div>
          )}

          {state === 'success' && (
            <div className="text-center space-y-3">
              <CheckCircle className="w-10 h-10 mx-auto text-green-500" />
              <h1 className="text-lg font-semibold">Du bist dabei!</h1>
              <p className="text-sm text-muted-foreground">Wir bringen dich zur Gruppe …</p>
            </div>
          )}

          {state === 'error' && (
            <InviteErrorState
              kind={errorKind}
              detail={errorDetail}
              onRetry={errorKind === 'failed' ? () => setReloadKey(k => k + 1) : undefined}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}