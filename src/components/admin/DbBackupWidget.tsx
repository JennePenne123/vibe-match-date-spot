import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Database, Download, Loader2, RefreshCw, Trash2 } from 'lucide-react';

type BackupFolder = { name: string; created_at: string };

const BUCKET = 'db-backups';

export const DbBackupWidget: React.FC = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);

  const { data: folders, isLoading } = useQuery({
    queryKey: ['admin-db-backups'],
    queryFn: async (): Promise<BackupFolder[]> => {
      const { data, error } = await supabase.storage.from(BUCKET).list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'desc' },
      });
      if (error) throw error;
      return (data ?? [])
        .filter((f) => f.name.startsWith('backup-'))
        .map((f) => ({
          name: f.name,
          created_at: f.created_at ?? f.updated_at ?? '',
        }));
    },
    staleTime: 60_000,
  });

  const runBackup = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('weekly-db-backup', {});
      if (error) throw error;
      toast({
        title: 'Backup erstellt',
        description: `${data?.total_rows ?? 0} Zeilen · ${((data?.total_bytes ?? 0) / 1024).toFixed(0)} KB`,
      });
      qc.invalidateQueries({ queryKey: ['admin-db-backups'] });
    } catch (e) {
      toast({
        title: 'Backup fehlgeschlagen',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  };

  const downloadManifest = async (folder: string) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${folder}/_manifest.json`, 300);
    if (error || !data) {
      toast({ title: 'Download fehlgeschlagen', description: error?.message, variant: 'destructive' });
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const downloadAll = async (folder: string) => {
    const { data: files, error } = await supabase.storage.from(BUCKET).list(folder, { limit: 100 });
    if (error || !files) {
      toast({ title: 'Fehler', description: error?.message, variant: 'destructive' });
      return;
    }
    for (const f of files) {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(`${folder}/${f.name}`, 300);
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    }
  };

  const deleteBackup = async (folder: string) => {
    if (!confirm(`Backup ${folder} wirklich löschen?`)) return;
    const { data: files } = await supabase.storage.from(BUCKET).list(folder, { limit: 100 });
    const paths = (files ?? []).map((f) => `${folder}/${f.name}`);
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    qc.invalidateQueries({ queryKey: ['admin-db-backups'] });
    toast({ title: 'Backup gelöscht' });
  };

  return (
    <Card className="bg-card/80 border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" /> Datenbank-Backups
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline"
            onClick={() => qc.invalidateQueries({ queryKey: ['admin-db-backups'] })}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={runBackup} disabled={running}>
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
            Jetzt sichern
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Automatisches Backup: Jeden Sonntag 03:30 UTC · Aufbewahrung: 8 Wochen · Speicher: privater Bucket <code>db-backups</code>
        </p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Lade…</p>
        ) : !folders?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Noch keine Backups. Klicke „Jetzt sichern" für den ersten Lauf.
          </p>
        ) : (
          <ScrollArea className="h-[360px]">
            <div className="space-y-2">
              {folders.map((f) => (
                <div key={f.name} className="p-3 rounded-lg bg-muted/30 border border-border/20 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    {f.created_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(f.created_at).toLocaleString('de-DE')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">JSON</Badge>
                    <Button size="sm" variant="ghost" onClick={() => downloadManifest(f.name)} title="Manifest">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => downloadAll(f.name)} title="Alle Dateien">
                      <Download className="w-4 h-4" /> All
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteBackup(f.name)} title="Löschen">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};