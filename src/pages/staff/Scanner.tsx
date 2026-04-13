import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffAccess } from '@/hooks/useStaffAccess';
import { useStaffNetworkVouchers } from '@/hooks/useStaffNetworkVouchers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRCodeSVG } from 'qrcode.react';
import { RotatingQRCode } from '@/components/staff/RotatingQRCode';
import { ScanLine, Shield, ShieldCheck, LogOut, User, Ticket, Network } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function StaffScanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isStaff, staffRecord, partnerName, loading } = useStaffAccess();
  const { vouchers, loading: vouchersLoading } = useStaffNetworkVouchers(staffRecord?.partner_id);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isStaff) {
      navigate('/home');
    }
  }, [loading, isStaff, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!staffRecord) return null;

  const qrPayload = JSON.stringify({
    type: 'vybe_staff_scan',
    staff_id: staffRecord.id,
    partner_id: staffRecord.partner_id,
    qr_token: staffRecord.qr_code_token,
    name: staffRecord.name,
    ts: Date.now(),
  });

  const selectedVoucher = vouchers.find((v) => v.id === selectedVoucherId);

  const formatDiscount = (v: typeof vouchers[0]) =>
    v.discount_type === 'percentage'
      ? `${v.discount_value}%`
      : v.discount_type === 'fixed'
        ? `€${v.discount_value}`
        : 'Gratis';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <ScanLine className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">{partnerName || 'HiOutz'}</p>
            <p className="text-[11px] text-muted-foreground">Staff Scanner</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 text-xs">
          {staffRecord.staff_role === 'manager' ? (
            <><ShieldCheck className="w-3 h-3" />Manager</>
          ) : (
            <><Shield className="w-3 h-3" />Mitarbeiter</>
          )}
        </Badge>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="scan" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-3 grid grid-cols-2">
          <TabsTrigger value="scan" className="gap-1.5 text-xs">
            <ScanLine className="w-3.5 h-3.5" />
            Kunden-Scan
          </TabsTrigger>
          <TabsTrigger value="network" className="gap-1.5 text-xs">
            <Network className="w-3.5 h-3.5" />
            Netzwerk
            {vouchers.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {vouchers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Kunden-Scan Tab */}
        <TabsContent value="scan" className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Hallo, {staffRecord.name}!</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Zeige diesen QR-Code beim Einlösen eines Vouchers
            </p>
          </div>

          <Card variant="glass" className="w-full max-w-xs">
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-lg">
                <QRCodeSVG value={qrPayload} size={200} level="H" includeMargin />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Dein persönlicher Einlöse-QR-Code</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                  {staffRecord.qr_code_token}
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Kunden scannen den Voucher-QR-Code. Dein QR-Code identifiziert dich als einlösenden Mitarbeiter.
          </p>
        </TabsContent>

        {/* Netzwerk Tab */}
        <TabsContent value="network" className="flex-1 flex flex-col p-4 gap-4">
          {selectedVoucher ? (
            /* Show rotating QR for selected voucher */
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="text-center">
                <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs px-3 py-1">
                  {formatDiscount(selectedVoucher)} Rabatt
                </Badge>
                <h2 className="text-lg font-bold mt-2">{selectedVoucher.title}</h2>
                {selectedVoucher.description && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedVoucher.description}</p>
                )}
              </div>

              <Card variant="glass" className="w-full max-w-xs">
                <CardContent className="p-5 flex flex-col items-center gap-3">
                  <RotatingQRCode
                    staffId={staffRecord.id}
                    partnerId={staffRecord.partner_id}
                    qrToken={staffRecord.qr_code_token}
                    staffName={staffRecord.name}
                    voucherId={selectedVoucher.id}
                    interval={30}
                    size={180}
                  />
                  <p className="text-[10px] text-muted-foreground text-center">
                    Der Code erneuert sich automatisch und kann nicht per Screenshot weitergegeben werden.
                  </p>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVoucherId(null)}
                className="mt-2"
              >
                Zurück zur Übersicht
              </Button>
            </div>
          ) : (
            /* Voucher list */
            <>
              <div className="text-center">
                <h2 className="text-lg font-bold">Partner-Netzwerk</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Nutze exklusive Rabatte bei anderen Venues im Netzwerk
                </p>
              </div>

              {vouchersLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : vouchers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                  <Network className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Noch keine Netzwerk-Vouchers verfügbar
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Dein Venue-Partner hat noch keine Netzwerk-Rabatte erhalten.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto flex-1">
                  {vouchers.map((v) => {
                    const daysLeft = Math.ceil(
                      (new Date(v.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <Card
                        key={v.id}
                        className="cursor-pointer hover:border-primary/40 transition-colors"
                        onClick={() => setSelectedVoucherId(v.id)}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Ticket className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{v.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDiscount(v)} · Noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {formatDiscount(v)}
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <footer className="p-4 border-t border-border/50 flex justify-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/profile')}>
          <User className="w-4 h-4" />
          Profil
        </Button>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/')}>
          <LogOut className="w-4 h-4" />
          Zurück
        </Button>
      </footer>
    </div>
  );
}
