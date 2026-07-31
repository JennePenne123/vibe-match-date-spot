import React from 'react';
import { Check, Loader2, WifiOff, RefreshCw, ShieldCheck, KeyRound, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type InviteValidationStep = 'auth' | 'token' | 'group';
export type StepState = 'pending' | 'active' | 'done';

interface Props {
  steps: Record<InviteValidationStep, StepState>;
  online: boolean;
  attempt: number;
  networkError?: string | null;
  onRetry: () => void;
}

const META: { key: InviteValidationStep; label: string; icon: React.ElementType }[] = [
  { key: 'auth', label: 'Anmeldung prüfen', icon: ShieldCheck },
  { key: 'token', label: 'Einladungscode validieren', icon: KeyRound },
  { key: 'group', label: 'Gruppe laden', icon: Users },
];

const InviteValidationStatus: React.FC<Props> = ({ steps, online, attempt, networkError, onRetry }) => (
  <div className="space-y-4">
    <div className="text-center space-y-1">
      <h1 className="text-lg font-semibold">Einladung wird geprüft …</h1>
      <p className="text-sm text-muted-foreground">Das dauert nur einen Moment.</p>
    </div>

    <ul className="space-y-2">
      {META.map(({ key, label, icon: Icon }) => {
        const s = steps[key];
        return (
          <li
            key={key}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
              s === 'done' && 'border-primary/30 bg-primary/5',
              s === 'active' && 'border-border bg-muted/40',
              s === 'pending' && 'border-border/40 opacity-60'
            )}
          >
            <span className="flex h-6 w-6 items-center justify-center">
              {s === 'done' ? (
                <Check className="h-4 w-4 text-primary" />
              ) : s === 'active' ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Icon className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
            <span className={cn(s === 'done' && 'text-foreground', s !== 'done' && 'text-muted-foreground')}>
              {label}
            </span>
          </li>
        );
      })}
    </ul>

    {!online && (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-muted-foreground">
        <WifiOff className="h-4 w-4 shrink-0 text-destructive" />
        <span>Keine Internetverbindung – wir versuchen es automatisch erneut, sobald du wieder online bist.</span>
      </div>
    )}

    {networkError && (
      <div className="space-y-2">
        <p className="rounded-lg border border-border/50 bg-muted/40 p-3 text-xs text-muted-foreground">
          Netzwerkfehler: {networkError}
          {attempt > 1 && <> (Versuch {attempt})</>}
        </p>
        <Button variant="outline" className="w-full gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Erneut versuchen
        </Button>
      </div>
    )}
  </div>
);

export default InviteValidationStatus;
