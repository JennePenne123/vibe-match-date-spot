import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_TIMES } from '@/config/queryConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Mail, Download, Inbox } from 'lucide-react';
import { toast } from 'sonner';

interface WaitlistRow {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

const WaitlistSignupsWidget: React.FC = () => {
  const { data, isLoading, refetch } = useQuery<WaitlistRow[]>({
    queryKey: ['admin-waitlist-signups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waitlist_signups')
        .select('id, name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as WaitlistRow[]) || [];
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  const total = data?.length ?? 0;
  const last24h = useMemo(() => {
    if (!data) return 0;
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return data.filter((r) => new Date(r.created_at).getTime() >= cutoff).length;
  }, [data]);

  const exportCsv = () => {
    if (!data || data.length === 0) {
      toast.error('Keine Einträge zum Exportieren');
      return;
    }
    const header = 'name,email,created_at\n';
    const rows = data
      .map((r) => {
        const name = `"${(r.name || '').replace(/"/g, '""')}"`;
        const email = `"${(r.email || '').replace(/"/g, '""')}"`;
        return `${name},${email},${r.created_at}`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hioutz-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${data.length} Einträge exportiert`);
  };

  const copyEmails = async () => {
    if (!data || data.length === 0) return;
    const emails = data.map((r) => r.email).join(', ');
    await navigator.clipboard.writeText(emails);
    toast.success(`${data.length} E-Mails kopiert`);
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border/40">
      <CardHeader className="flex flex-row items-start justify-between gap-3 flex-wrap">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Waitlist Anmeldungen
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{total} gesamt</Badge>
            <Badge variant="outline" className="text-emerald-400 border-emerald-400/40">
              +{last24h} letzte 24h
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            Aktualisieren
          </Button>
          <Button variant="outline" size="sm" onClick={copyEmails} disabled={!total}>
            E-Mails kopieren
          </Button>
          <Button size="sm" onClick={exportCsv} disabled={!total}>
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Inbox className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Noch keine Anmeldungen</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-lg border border-border/40 divide-y divide-border/40">
            {data!.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 p-3 hover:bg-muted/30">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{row.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{row.email}</p>
                </div>
                <p className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                  {new Date(row.created_at).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WaitlistSignupsWidget;