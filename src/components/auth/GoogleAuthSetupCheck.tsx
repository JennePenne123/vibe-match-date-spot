import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  runGoogleAuthSetupCheck,
  overallStatus,
  SUPABASE_CALLBACK_URL,
  SUPABASE_PROJECT_REF,
  getExpectedRedirectUri,
  type SetupCheckResult,
  type SetupCheckStatus,
} from '@/utils/googleAuthCheck';

interface Props {
  /** When true, the check runs and expands automatically on mount. */
  autoRun?: boolean;
  /** Optional label shown next to the trigger. */
  className?: string;
}

const StatusIcon: React.FC<{ status: SetupCheckStatus }> = ({ status }) => {
  if (status === 'pass') return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (status === 'warn') return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
  if (status === 'fail') return <AlertCircle className="h-4 w-4 text-destructive shrink-0" />;
  return <Loader2 className="h-4 w-4 text-muted-foreground shrink-0 animate-spin" />;
};

const LABEL_KEY: Record<SetupCheckResult['id'], string> = {
  origin: 'auth.setupCheck.origin',
  callbackRoute: 'auth.setupCheck.callbackRoute',
  supabaseAuth: 'auth.setupCheck.supabaseAuth',
  googleProvider: 'auth.setupCheck.googleProvider',
  thirdPartyCookies: 'auth.setupCheck.thirdPartyCookies',
};

export const GoogleAuthSetupCheck: React.FC<Props> = ({ autoRun = false, className }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(autoRun);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SetupCheckResult[] | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    try {
      const r = await runGoogleAuthSetupCheck(controller.signal);
      if (!controller.signal.aborted) setResults(r);
    } finally {
      if (!controller.signal.aborted) setRunning(false);
    }
  }, []);

  useEffect(() => {
    if (autoRun) {
      setOpen(true);
      void run();
    }
    return () => abortRef.current?.abort();
  }, [autoRun, run]);

  const copy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: t('auth.oauthError.copied'), description: value });
  };

  const status: SetupCheckStatus = results ? overallStatus(results) : running ? 'pending' : 'pending';

  return (
    <div className={`rounded-lg border border-border/60 bg-muted/30 ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => {
          setOpen(o => {
            const next = !o;
            if (next && !results && !running) void run();
            return next;
          });
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        aria-expanded={open}
      >
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium flex-1 min-w-0 truncate">
          {t('auth.setupCheck.title')}
        </span>
        {results && <StatusIcon status={status} />}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 text-xs"
              onClick={run}
              disabled={running}
            >
              {running ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  {t('auth.setupCheck.running')}
                </>
              ) : (
                t('auth.setupCheck.run')
              )}
            </Button>
            <span className="text-[11px] text-muted-foreground truncate">
              {t('auth.setupCheck.description')}
            </span>
          </div>

          {results && (
            <ul className="space-y-2">
              {results.map(r => (
                <li
                  key={r.id}
                  className="rounded-md bg-background/70 border border-border/50 p-2.5 space-y-1"
                >
                  <div className="flex items-start gap-2">
                    <StatusIcon status={r.status} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium">{t(LABEL_KEY[r.id])}</div>
                      <code className="block text-[11px] text-muted-foreground break-all">
                        {r.message}
                      </code>
                    </div>
                  </div>
                  {r.detail && (
                    <p className="text-[11px] text-foreground/80 leading-relaxed pl-6">
                      {r.detail}
                    </p>
                  )}
                  {r.fix && (
                    <div className="pl-6 flex items-start gap-1.5">
                      <code className="flex-1 min-w-0 text-[11px] break-all bg-muted/60 px-2 py-1 rounded whitespace-pre-line">
                        {r.fix}
                      </code>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        onClick={() => copy(r.fix!)}
                        aria-label={t('auth.oauthError.copy')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-md bg-background/70 border border-border/50 p-2.5 space-y-1.5 text-[11px]">
            <div className="font-medium text-foreground">{t('auth.setupCheck.expected')}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground shrink-0">App-Redirect:</span>
              <code className="flex-1 min-w-0 break-all">{getExpectedRedirectUri()}</code>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                onClick={() => copy(getExpectedRedirectUri())}
                aria-label={t('auth.oauthError.copy')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground shrink-0">Google Callback:</span>
              <code className="flex-1 min-w-0 break-all">{SUPABASE_CALLBACK_URL}</code>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                onClick={() => copy(SUPABASE_CALLBACK_URL)}
                aria-label={t('auth.oauthError.copy')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <a
                href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/providers`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {t('auth.setupCheck.openSupabase')}
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {t('auth.setupCheck.openGoogle')}
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthSetupCheck;
