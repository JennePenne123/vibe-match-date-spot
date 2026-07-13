import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_TIMES } from '@/config/queryConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { LifeBuoy, Inbox, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TicketRow {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  contact_email: string | null;
  created_at: string;
}

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;

const STATUS_STYLES: Record<string, string> = {
  open: 'text-amber-400 border-amber-400/40',
  in_progress: 'text-sky-400 border-sky-400/40',
  resolved: 'text-emerald-400 border-emerald-400/40',
  closed: 'text-muted-foreground border-border',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  resolved: 'Gelöst',
  closed: 'Geschlossen',
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Allgemein',
  bug: 'Bug',
  account: 'Konto',
  payment: 'Zahlung',
  partner: 'Partner',
  feature: 'Feature',
  other: 'Sonstiges',
};

const SupportTicketsWidget: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<TicketRow[]>({
    queryKey: ['admin-support-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('id, category, subject, message, status, contact_email, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as TicketRow[]) || [];
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  const openCount = useMemo(
    () => (data || []).filter((t) => t.status === 'open').length,
    [data],
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    return filter === 'all' ? data : data.filter((t) => t.status === filter);
  }, [data, filter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from('support_tickets')
      .update({ status })
      .eq('id', id);
    setUpdatingId(null);
    if (error) {
      toast.error('Status konnte nicht geändert werden');
      return;
    }
    toast.success('Status aktualisiert');
    refetch();
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border/40">
      <CardHeader className="flex flex-row items-start justify-between gap-3 flex-wrap">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-primary" />
            Support-Tickets
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{data?.length ?? 0} gesamt</Badge>
            <Badge variant="outline" className="text-amber-400 border-amber-400/40">
              {openCount} offen
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Inbox className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Keine Tickets</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[32rem] overflow-y-auto">
            {filtered.map((ticket) => (
              <div key={ticket.id} className="rounded-lg border border-border/40 p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">
                        {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[ticket.status] ?? ''}`}>
                        {STATUS_LABELS[ticket.status] ?? ticket.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground mt-1.5 truncate">{ticket.subject}</p>
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    {new Date(ticket.created_at).toLocaleDateString('de-DE', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{ticket.message}</p>
                <div className="flex items-center justify-between gap-3 pt-1">
                  {ticket.contact_email ? (
                    <a
                      href={`mailto:${ticket.contact_email}?subject=${encodeURIComponent('Re: ' + ticket.subject)}`}
                      className="text-xs text-primary hover:underline truncate"
                    >
                      {ticket.contact_email}
                    </a>
                  ) : <span />}
                  <div className="flex items-center gap-2 shrink-0">
                    {updatingId === ticket.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                    <Select value={ticket.status} onValueChange={(v) => updateStatus(ticket.id, v)}>
                      <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupportTicketsWidget;