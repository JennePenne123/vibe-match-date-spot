import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyRound, Loader2, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { passkeysSupported, registerPasskey } from '@/lib/passkey';

interface PasskeyRow {
  id: string;
  device_name: string;
  created_at: string;
  last_used_at: string | null;
}

export function PasskeyManager() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const supported = passkeysSupported();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('user_passkeys')
      .select('id, device_name, created_at, last_used_at')
      .order('created_at', { ascending: false });
    setPasskeys((data as PasskeyRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await registerPasskey();
      toast({ title: t('passkey.added'), description: t('passkey.addedDesc') });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('NotAllowed') || message.includes('AbortError')) {
        // user cancelled — stay quiet
      } else {
        toast({
          title: t('passkey.addFailed'),
          description: message === 'already_registered' ? t('passkey.alreadyRegistered') : message,
          variant: 'destructive',
        });
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('user_passkeys').delete().eq('id', id);
    if (error) {
      toast({ title: t('passkey.deleteFailed'), variant: 'destructive' });
      return;
    }
    setPasskeys((prev) => prev.filter((p) => p.id !== id));
    toast({ title: t('passkey.deleted') });
  };

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(i18n.language) : '—';

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-foreground">
          <KeyRound className="w-4 h-4 text-primary" />
          {t('passkey.title')}
        </CardTitle>
        <CardDescription className="text-xs">{t('passkey.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!supported ? (
          <p className="text-sm text-muted-foreground">{t('passkey.notSupported')}</p>
        ) : loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {passkeys.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('passkey.empty')}</p>
            ) : (
              <ul className="space-y-2">
                {passkeys.map((pk) => (
                  <li
                    key={pk.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{pk.device_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('passkey.createdAt', { date: formatDate(pk.created_at) })}
                        {pk.last_used_at
                          ? ` · ${t('passkey.lastUsed', { date: formatDate(pk.last_used_at) })}`
                          : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={t('passkey.delete')}
                      onClick={() => handleDelete(pk.id)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <Button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {adding ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {t('passkey.add')}
            </Button>
            <p className="text-xs text-muted-foreground">{t('passkey.privacyHint')}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PasskeyManager;
