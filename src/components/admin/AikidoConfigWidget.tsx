import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AikidoStatus {
  clientIdConfigured: boolean;
  clientSecretConfigured: boolean;
  scopes: string[];
  clientIdPreview: string | null;
  tokenUrl: string;
  test?: { ok: boolean; status?: number; details?: string; error?: string; expiresIn?: number | null };
}

const RECOMMENDED_SCOPES = ['read:findings', 'read:repositories', 'read:scans', 'read:teams'];

const AikidoConfigWidget: React.FC = () => {
  const [status, setStatus] = useState<AikidoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async (action: 'status' | 'test' = 'status') => {
    action === 'test' ? setTesting(true) : setLoading(true);
    const { data, error } = await supabase.functions.invoke('aikido-config', { body: { action } });
    if (error) {
      toast.error('Aikido-Status konnte nicht geladen werden');
    } else {
      setStatus(data as AikidoStatus);
      if (action === 'test') {
        const t = (data as AikidoStatus).test;
        t?.ok ? toast.success('Aikido-Verbindung erfolgreich') : toast.error('Aikido-Verbindung fehlgeschlagen');
      }
    }
    setTesting(false);
    setLoading(false);
  }, []);

  useEffect(() => { void load('status'); }, [load]);

  const configured = !!status?.clientIdConfigured && !!status?.clientSecretConfigured;

  return (
    <Card className="bg-card/80 backdrop-blur border-border/40">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Aikido Security API
        </CardTitle>
        <CardDescription>
          Client ID, Secret und Scopes werden serverseitig als Secrets gespeichert – niemals in der Datenbank oder im Browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Status wird geladen…
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>Client ID</span>
                {status?.clientIdConfigured ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {status.clientIdPreview}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> fehlt</Badge>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>Client Secret</span>
                {status?.clientSecretConfigured ? (
                  <Badge variant="secondary" className="gap-1"><CheckCircle2 className="w-3 h-3" /> gesetzt</Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> fehlt</Badge>
                )}
              </div>
              <div className="flex items-start justify-between gap-2 text-sm">
                <span>Scopes</span>
                <div className="flex flex-wrap justify-end gap-1">
                  {(status?.scopes?.length ? status.scopes : RECOMMENDED_SCOPES).map((s) => (
                    <Badge key={s} variant={status?.scopes?.length ? 'secondary' : 'outline'} className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {status?.test && (
              <Alert variant={status.test.ok ? 'default' : 'destructive'}>
                <AlertDescription className="text-xs break-all">
                  {status.test.ok
                    ? `Token erhalten${status.test.expiresIn ? ` (gültig ${status.test.expiresIn}s)` : ''}.`
                    : `Fehler${status.test.status ? ` [${status.test.status}]` : ''}: ${status.test.details ?? status.test.error}`}
                </AlertDescription>
              </Alert>
            )}

            {!configured && (
              <Alert>
                <AlertDescription className="text-xs">
                  Noch nicht konfiguriert. Lege im Aikido-Dashboard einen API-Client an und bitte den Assistenten,
                  die Secrets <code>AIKIDO_CLIENT_ID</code>, <code>AIKIDO_CLIENT_SECRET</code> und <code>AIKIDO_SCOPES</code> zu hinterlegen.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => load('test')} disabled={testing || !configured}>
                {testing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-1" />}
                Verbindung testen
              </Button>
              <Button size="sm" variant="outline" onClick={() => load('status')} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-1" /> Status aktualisieren
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <a href="https://app.aikido.dev/settings/integrations/api/aikido/rest" target="_blank" rel="noreferrer">
                  Aikido API-Client <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AikidoConfigWidget;
