import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LifeBuoy, Loader2, RefreshCw, Copy, Download, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRecoveryCodes, getRecoveryCodeStatus } from '@/lib/recoveryCodes';

export function RecoveryCodesManager() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [status, setStatus] = useState<{ total: number; unused: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    setStatus(await getRecoveryCodeStatus());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const fresh = await generateRecoveryCodes();
      setCodes(fresh);
      await load();
      toast({ title: t('recoveryCodes.generated'), description: t('recoveryCodes.generatedDesc') });
    } catch (err) {
      toast({
        title: t('recoveryCodes.generateFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!codes) return;
    await navigator.clipboard.writeText(codes.join('\n'));
    toast({ title: t('recoveryCodes.copied') });
  };

  const handleDownload = () => {
    if (!codes) return;
    const content = `${t('recoveryCodes.fileHeader')}\n\n${codes.join('\n')}\n`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hioutz-backup-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-foreground">
          <LifeBuoy className="w-4 h-4 text-primary" />
          {t('recoveryCodes.title')}
        </CardTitle>
        <CardDescription className="text-xs">{t('recoveryCodes.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {status && status.total > 0
                ? t('recoveryCodes.remaining', { count: status.unused, total: status.total })
                : t('recoveryCodes.empty')}
            </p>

            {status && status.total > 0 && status.unused <= 2 && (
              <Alert variant="destructive" className="py-2">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {t('recoveryCodes.lowWarning')}
                </AlertDescription>
              </Alert>
            )}

            {codes && (
              <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">{t('recoveryCodes.showOnce')}</p>
                <ul className="grid grid-cols-2 gap-1.5 font-mono text-sm text-foreground">
                  {codes.map((code) => (
                    <li key={code} className="tracking-wide">
                      {code}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="flex-1">
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    {t('recoveryCodes.copy')}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={handleDownload} className="flex-1">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    {t('recoveryCodes.download')}
                  </Button>
                </div>
              </div>
            )}

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              variant={status && status.total > 0 ? 'outline' : 'default'}
              className="w-full"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {status && status.total > 0 ? t('recoveryCodes.regenerate') : t('recoveryCodes.generate')}
            </Button>
            <p className="text-xs text-muted-foreground">{t('recoveryCodes.hint')}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default RecoveryCodesManager;