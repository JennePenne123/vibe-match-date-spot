import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_PROJECT_REF = 'dfjwubatslzblagthbdw';
const PROD_DOMAIN = 'https://hioutz.app';

const REDIRECT_URLS = [
  `${PROD_DOMAIN}/home`,
  `${PROD_DOMAIN}/auth/callback`,
  `https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback`,
];

const JS_ORIGINS = [
  PROD_DOMAIN,
  `https://${SUPABASE_PROJECT_REF}.supabase.co`,
];

export const OAuthDiagnosticsWidget: React.FC = () => {
  const { toast } = useToast();
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const isProdOrigin = currentOrigin === PROD_DOMAIN;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Kopiert', description: text });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">OAuth Pre-Launch Status</CardTitle>
          <CardDescription>
            Code-Pfad ist fertig. Vor dem Launch nur noch Provider im Supabase &amp; Google/Apple Console konfigurieren.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm">Code: <code className="text-xs">signInWithOAuth</code> für Google &amp; Apple implementiert</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm">Redirect-Handler: <code className="text-xs">/home</code> mit <code className="text-xs">detectSessionInUrl</code></span>
          </div>
          <div className="flex items-center gap-2">
            {isProdOrigin ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            <span className="text-sm">
              Aktuelle Origin: <code className="text-xs">{currentOrigin || 'unknown'}</code>
              {!isProdOrigin && <span className="text-muted-foreground"> (nicht Production)</span>}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Google Cloud Console</CardTitle>
          <CardDescription>
            Authorized JavaScript origins &amp; Redirect URIs für OAuth Client ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Authorized JavaScript origins</div>
            {JS_ORIGINS.map(url => (
              <div key={url} className="flex items-center justify-between bg-muted/50 rounded px-3 py-2 mb-1">
                <code className="text-xs break-all">{url}</code>
                <Button size="sm" variant="ghost" onClick={() => copy(url)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Authorized Redirect URIs</div>
            {REDIRECT_URLS.map(url => (
              <div key={url} className="flex items-center justify-between bg-muted/50 rounded px-3 py-2 mb-1">
                <code className="text-xs break-all">{url}</code>
                <Button size="sm" variant="ghost" onClick={() => copy(url)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button asChild variant="outline" size="sm">
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">
              <ExternalLink className="h-3 w-3 mr-1" /> Google Cloud Console
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apple Sign In</CardTitle>
          <CardDescription>Apple Developer Program Mitgliedschaft erforderlich (99 USD/Jahr)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div>1. Services ID anlegen (z.B. <code className="text-xs">app.hioutz.signin</code>)</div>
            <div>2. Domain &amp; Return URL: <code className="text-xs break-all">https://{SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback</code></div>
            <div>3. Key (.p8) generieren — wird im Supabase Dashboard hinterlegt</div>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href="https://developer.apple.com/account/resources/identifiers/list/serviceId" target="_blank" rel="noopener">
              <ExternalLink className="h-3 w-3 mr-1" /> Apple Developer
            </a>
          </Button>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Site URL &amp; Redirect URLs in Supabase:</strong> Müssen in <em>Authentication → URL Configuration</em> auf <code>{PROD_DOMAIN}</code> gesetzt sein, sonst Login-Loop.
        </AlertDescription>
      </Alert>

      <Button asChild variant="outline" size="sm">
        <a href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/providers`} target="_blank" rel="noopener">
          <ExternalLink className="h-3 w-3 mr-1" /> Supabase Auth Providers
        </a>
      </Button>
    </div>
  );
};
