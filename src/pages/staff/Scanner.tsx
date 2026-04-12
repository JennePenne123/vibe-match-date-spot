import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffAccess } from '@/hooks/useStaffAccess';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { ScanLine, Shield, ShieldCheck, LogOut, User } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function StaffScanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isStaff, staffRecord, partnerName, loading } = useStaffAccess();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <ScanLine className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">{partnerName || 'VybePulse'}</p>
            <p className="text-[11px] text-muted-foreground">Staff Scanner</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            {staffRecord.staff_role === 'manager' ? (
              <><ShieldCheck className="w-3 h-3" />Manager</>
            ) : (
              <><Shield className="w-3 h-3" />Mitarbeiter</>
            )}
          </Badge>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Hallo, {staffRecord.name}!</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Zeige diesen QR-Code beim Einlösen eines Vouchers
          </p>
        </div>

        <Card variant="glass" className="w-full max-w-xs">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <QRCodeSVG
                value={qrPayload}
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Dein persönlicher Einlöse-QR-Code
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                {staffRecord.qr_code_token}
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Kunden scannen den Voucher-QR-Code. Dein QR-Code identifiziert dich als einlösenden Mitarbeiter.
        </p>
      </div>

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
