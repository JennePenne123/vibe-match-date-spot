import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Bell, Loader2, Smartphone, Apple, CheckCircle2, XCircle, Info } from 'lucide-react';

/**
 * Admin tool: send a Web-Push to your own user account, mainly to validate
 * iOS PWA push delivery (which requires the app to be installed to the
 * home screen and notifications to be granted from inside the installed PWA).
 */
export const PushTestWidget: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('Test-Push von H!Outz 🚀');
  const [body, setBody] = useState('Wenn du das siehst, funktioniert Web-Push auf diesem Gerät.');
  const [url, setUrl] = useState('/profile');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    sent?: number;
    failed?: number;
    expired?: number;
    message?: string;
    error?: string;
  } | null>(null);
  const [subCount, setSubCount] = useState<number | null>(null);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari proprietary
      window.navigator?.standalone === true);

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !/Windows/.test(ua);

  const checkSubscriptions = async () => {
    if (!user) return;
    setLoadingSubs(true);
    try {
      const { count } = await supabase
        .from('push_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setSubCount(count ?? 0);
    } catch {
      setSubCount(null);
    } finally {
      setLoadingSubs(false);
    }
  };

  const sendTest = async () => {
    if (!user) return;
    setSending(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          title,
          body,
          url,
          type: 'general',
        },
      });

      if (error) {
        setLastResult({ success: false, error: error.message });
        toast({ title: 'Push fehlgeschlagen', description: error.message, variant: 'destructive' });
        return;
      }

      setLastResult(data);
      if (data?.sent > 0) {
        toast({ title: `✅ ${data.sent} Push gesendet`, description: 'Prüfe dein Gerät.' });
      } else {
        toast({
          title: 'Keine aktive Push-Subscription',
          description: 'Aktiviere Push-Benachrichtigungen auf diesem Gerät zuerst.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      setLastResult({ success: false, error: err?.message || 'Unbekannter Fehler' });
      toast({ title: 'Push fehlgeschlagen', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="bg-card/80 border-border/40">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Web-Push-Test (iOS / Android / Desktop)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment chips */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <Smartphone className="w-3 h-3" />
            {isIOS ? 'iOS' : 'Non-iOS'}
          </Badge>
          <Badge variant={isStandalone ? 'default' : 'secondary'} className="gap-1">
            {isStandalone ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {isStandalone ? 'PWA installiert' : 'Im Browser-Tab'}
          </Badge>
          <Badge variant="outline" className="gap-1">
            Berechtigung: {typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'}
          </Badge>
        </div>

        {/* iOS hint */}
        {isIOS && !isStandalone && (
          <Alert className="border-amber-500/40 bg-amber-500/5">
            <Apple className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-xs">
              <strong>iOS-Hinweis:</strong> Web-Push funktioniert auf iPhone/iPad nur, wenn die App
              über „Teilen → Zum Home-Bildschirm" installiert wurde und die Benachrichtigungen
              <em> aus der installierten PWA heraus</em> aktiviert wurden (Profil → Push aktivieren).
              Im normalen Safari-Tab kommt nichts an.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription check */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={checkSubscriptions} disabled={loadingSubs}>
            {loadingSubs ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Info className="w-3 h-3 mr-1" />}
            Subscriptions prüfen
          </Button>
          {subCount !== null && (
            <span className="text-xs text-muted-foreground">
              {subCount} aktive Subscription{subCount === 1 ? '' : 's'} für dein Konto
            </span>
          )}
        </div>

        {/* Form */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Titel</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Body</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={200}
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Ziel-URL beim Tap</label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/profile" />
        </div>

        <Button onClick={sendTest} disabled={sending || !user} className="w-full gap-2">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          Test-Push an mein Konto senden
        </Button>

        {/* Result */}
        {lastResult && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-xs space-y-1">
            <div className="flex items-center gap-2 font-medium">
              {lastResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              {lastResult.success ? 'Function erreicht' : 'Function-Fehler'}
            </div>
            {lastResult.error && (
              <p className="text-red-400">Fehler: {lastResult.error}</p>
            )}
            {typeof lastResult.sent === 'number' && (
              <div className="text-muted-foreground">
                Gesendet: <span className="text-foreground font-semibold">{lastResult.sent}</span>{' '}
                · Fehlgeschlagen: <span className="text-foreground">{lastResult.failed ?? 0}</span>
                {(lastResult.expired ?? 0) > 0 && (
                  <> · Bereinigt (expired): <span className="text-foreground">{lastResult.expired}</span></>
                )}
              </div>
            )}
            {lastResult.message && (
              <p className="text-muted-foreground">{lastResult.message}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PushTestWidget;