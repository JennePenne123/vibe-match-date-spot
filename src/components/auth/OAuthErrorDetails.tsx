import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_PROJECT_REF = 'dfjwubatslzblagthbdw';
const SUPABASE_CALLBACK_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback`;

export interface OAuthErrorInfo {
  provider: 'google' | 'apple';
  message: string;
  raw?: unknown;
}

interface Props {
  info: OAuthErrorInfo;
}

export const OAuthErrorDetails: React.FC<Props> = ({ info }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const expectedRedirect = `${origin}/home`;

  const copy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: t('auth.oauthError.copied'), description: value });
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-destructive/10 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <code className="block text-xs break-all text-foreground/90">{value}</code>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0"
        onClick={() => copy(value)}
        aria-label={t('auth.oauthError.copy')}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-left space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-destructive">
            {t('auth.oauthError.title', { provider: info.provider === 'google' ? 'Google' : 'Apple' })}
          </p>
          <p className="text-xs text-destructive/90 break-words mt-0.5">{info.message}</p>
        </div>
      </div>

      <div className="rounded-md bg-background/60 px-3 py-2">
        <Row label={t('auth.oauthError.provider')} value={info.provider} />
        <Row label={t('auth.oauthError.currentOrigin')} value={origin || '—'} />
        <Row label={t('auth.oauthError.redirectUri')} value={expectedRedirect} />
        <Row label={t('auth.oauthError.callbackUrl')} value={SUPABASE_CALLBACK_URL} />
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {t('auth.oauthError.hint')}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <a
            href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/url-configuration`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {t('auth.oauthError.supabaseUrlConfig')}
          </a>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {t('auth.oauthError.googleConsole')}
          </a>
        </Button>
      </div>
    </div>
  );
};

export default OAuthErrorDetails;