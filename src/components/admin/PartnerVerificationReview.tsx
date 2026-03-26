import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/config/queryConfig';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, ShieldAlert, Clock, CheckCircle2, XCircle, Building2, MapPin, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface PartnerProfile {
  id: string;
  user_id: string;
  business_name: string;
  contact_person: string;
  business_email: string;
  address: string | null;
  city: string | null;
  country: string | null;
  tax_id: string | null;
  tax_id_type: string | null;
  tax_id_verified: boolean;
  address_verified: boolean;
  verification_status: string;
  verification_method: string | null;
  verification_notes: string | null;
  verification_deadline: string | null;
  verified_at: string | null;
  created_at: string;
}

const PartnerVerificationReview: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: partners, isLoading } = useQuery({
    queryKey: ['admin-partner-verification'],
    queryFn: async () => {
      const { data } = await supabase
        .from('partner_profiles')
        .select('*')
        .in('verification_status', ['pending_review', 'unverified', 'failed'])
        .order('created_at', { ascending: false });
      return (data || []) as PartnerProfile[];
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-verification-stats'],
    queryFn: async () => {
      const { data: all } = await supabase
        .from('partner_profiles')
        .select('verification_status, verification_deadline');

      if (!all) return { verified: 0, pending: 0, unverified: 0, expired: 0, failed: 0 };

      const now = new Date();
      return {
        verified: all.filter(p => p.verification_status === 'verified').length,
        pending: all.filter(p => p.verification_status === 'pending_review').length,
        unverified: all.filter(p => p.verification_status === 'unverified').length,
        expired: all.filter(p =>
          p.verification_status === 'unverified' &&
          p.verification_deadline &&
          new Date(p.verification_deadline) < now
        ).length,
        failed: all.filter(p => p.verification_status === 'failed').length,
      };
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ partnerId, status, notes }: { partnerId: string; status: string; notes: string }) => {
      const updateData: Record<string, unknown> = {
        verification_status: status,
        verification_notes: notes,
        updated_at: new Date().toISOString(),
      };
      if (status === 'verified') {
        updateData.verified_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('partner_profiles')
        .update(updateData)
        .eq('id', partnerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partner-verification'] });
      queryClient.invalidateQueries({ queryKey: ['admin-verification-stats'] });
      toast.success('Partner-Status aktualisiert');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'unverified': return 'bg-muted text-muted-foreground';
      case 'failed': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-2 flex-wrap">
        <Badge className="gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> {stats?.verified || 0} verifiziert
        </Badge>
        <Badge className="gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
          <Clock className="w-3.5 h-3.5" /> {stats?.pending || 0} ausstehend
        </Badge>
        <Badge className="gap-1 px-3 py-1.5 bg-muted text-muted-foreground">
          {stats?.unverified || 0} unverifiziert
        </Badge>
        {(stats?.expired || 0) > 0 && (
          <Badge className="gap-1 px-3 py-1.5 bg-destructive/20 text-destructive border-destructive/30">
            <ShieldAlert className="w-3.5 h-3.5" /> {stats.expired} Frist abgelaufen
          </Badge>
        )}
      </div>

      {!partners || partners.length === 0 ? (
        <Card className="bg-card/80 border-border/40">
          <CardContent className="py-12 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500/40 mb-3" />
            <p className="text-muted-foreground">Keine Partner zur Überprüfung</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {partners.map(partner => {
              const isDeadlineExpired = partner.verification_deadline && new Date(partner.verification_deadline) < new Date();
              return (
                <Card key={partner.id} className="bg-card/80 border-border/40">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-semibold text-foreground">{partner.business_name || 'Kein Name'}</span>
                          <Badge className={`text-xs ${statusColor(partner.verification_status)}`}>
                            {partner.verification_status}
                          </Badge>
                          {isDeadlineExpired && (
                            <Badge variant="destructive" className="text-[10px]">Frist abgelaufen</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{partner.contact_person} · {partner.business_email}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {partner.country || 'DE'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {partner.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{partner.address}, {partner.city}</span>
                        </div>
                      )}
                      {partner.tax_id && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span className="font-mono">{partner.tax_id}</span>
                          {partner.tax_id_verified && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        </div>
                      )}
                      {partner.address_verified && (
                        <div className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle2 className="w-3 h-3" /> Adresse verifiziert
                        </div>
                      )}
                      {partner.verification_deadline && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Frist: {new Date(partner.verification_deadline).toLocaleDateString('de-DE')}
                        </div>
                      )}
                    </div>

                    {partner.verification_notes && (
                      <p className="text-xs bg-muted/50 rounded p-2 text-muted-foreground">{partner.verification_notes}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="gap-1.5 flex-1"
                        onClick={() => updateMutation.mutate({
                          partnerId: partner.id,
                          status: 'verified',
                          notes: 'Manuell von Admin verifiziert',
                        })}
                        disabled={updateMutation.isPending}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verifizieren
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1.5 flex-1"
                        onClick={() => updateMutation.mutate({
                          partnerId: partner.id,
                          status: 'failed',
                          notes: 'Von Admin abgelehnt',
                        })}
                        disabled={updateMutation.isPending}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Ablehnen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default PartnerVerificationReview;
