import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollText } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format } from 'date-fns';

interface AuditRow {
  id: string;
  actor_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const AuditLog: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_log' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as AuditRow[];
    },
    staleTime: 30_000,
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-5xl mx-auto">
      <header className="flex items-center gap-2 mb-4">
        <ScrollText className="w-6 h-6 text-primary" />
        <h1 className="text-xl md:text-2xl font-semibold">Admin Audit-Log</h1>
      </header>
      <p className="text-sm text-muted-foreground mb-4">
        Letzte 200 sensiblen Admin-Aktionen (Rollenänderungen, Team, Feature-Flags, manuelle Aktionen).
      </p>

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      <div className="space-y-2">
        {data?.map((row) => (
          <Card key={row.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="font-mono text-xs">{row.action}</Badge>
                  {row.resource_type && (
                    <span className="text-xs text-muted-foreground">
                      {row.resource_type}
                      {row.resource_id ? `#${row.resource_id.slice(0, 8)}` : ''}
                    </span>
                  )}
                </div>
                <div className="text-sm mt-1 truncate">
                  {row.actor_email ?? 'system'}
                </div>
              </div>
              <time className="text-xs text-muted-foreground shrink-0">
                {format(new Date(row.created_at), 'yyyy-MM-dd HH:mm:ss')}
              </time>
            </div>
            {row.metadata && Object.keys(row.metadata).length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer">Metadaten</summary>
                <pre className="text-xs mt-1 overflow-x-auto bg-muted/50 p-2 rounded">
                  {JSON.stringify(row.metadata, null, 2)}
                </pre>
              </details>
            )}
          </Card>
        ))}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Keine Audit-Einträge vorhanden.
          </p>
        )}
      </div>
    </div>
  );
};

export default AuditLog;