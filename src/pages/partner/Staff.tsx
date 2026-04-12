import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { useVenueStaff, StaffMember } from '@/hooks/useVenueStaff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  Users,
  Shield,
  ShieldCheck,
  QrCode,
  Mail,
  MoreVertical,
  UserX,
  UserCheck,
  Trash2,
  Download,
  Copy,
  Check,
  ScanLine,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function PartnerStaff() {
  const { t } = useTranslation();
  const { role, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    staff,
    loading,
    inviteStaff,
    updateStaffRole,
    deactivateStaff,
    reactivateStaff,
    removeStaff,
    generateStaffInviteQR,
  } = useVenueStaff();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [staffQrOpen, setStaffQrOpen] = useState<StaffMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'staff'>('staff');
  const [inviting, setInviting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (role !== 'venue_partner' && role !== 'admin') {
    navigate('/home');
    return null;
  }

  const activeStaff = staff.filter((s) => s.status !== 'deactivated');
  const deactivatedStaff = staff.filter((s) => s.status === 'deactivated');

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    setInviting(true);
    const success = await inviteStaff(inviteEmail.trim(), inviteName.trim(), inviteRole);
    setInviting(false);
    if (success) {
      setInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('staff');
    }
  };

  const handleCopyToken = async (token: string) => {
    const inviteUrl = `${window.location.origin}/join-staff?token=${token}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    toast({ title: 'Einladungslink kopiert!' });
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDownloadStaffQR = (staffMember: StaffMember) => {
    const svg = document.getElementById(`staff-qr-${staffMember.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `staff-qr-${staffMember.name.replace(/\s+/g, '-')}.png`;
      link.href = pngFile;
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const getStatusBadge = (member: StaffMember) => {
    switch (member.status) {
      case 'invited':
        return <Badge variant="outline" className="text-xs gap-1"><Mail className="w-3 h-3" />Eingeladen</Badge>;
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs gap-1"><UserCheck className="w-3 h-3" />Aktiv</Badge>;
      case 'deactivated':
        return <Badge variant="secondary" className="text-xs gap-1"><UserX className="w-3 h-3" />Deaktiviert</Badge>;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'manager') {
      return <Badge className="bg-primary/10 text-primary border-primary/20 text-xs gap-1"><ShieldCheck className="w-3 h-3" />Manager</Badge>;
    }
    return <Badge variant="outline" className="text-xs gap-1"><Shield className="w-3 h-3" />Mitarbeiter</Badge>;
  };

  const staffQrPayload = (member: StaffMember) =>
    JSON.stringify({
      type: 'vybe_staff_scan',
      staff_id: member.id,
      partner_id: member.partner_id,
      qr_token: member.qr_code_token,
      name: member.name,
      ts: Date.now(),
    });

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-romantic bg-clip-text text-transparent">
            Mitarbeiter
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Verwalte dein Team und deren QR-Codes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setQrOpen(true)} className="gap-1">
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Einladungs-QR</span>
          </Button>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <UserPlus className="w-4 h-4" />
                Einladen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Mitarbeiter einladen</DialogTitle>
                <DialogDescription>
                  Sende eine Einladung per E-Mail an deinen Mitarbeiter.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="staff-name">Name</Label>
                  <Input
                    id="staff-name"
                    placeholder="Max Mustermann"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-email">E-Mail</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="mitarbeiter@email.de"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rolle</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'manager' | 'staff')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">
                        <span className="flex items-center gap-2"><Shield className="w-3 h-3" /> Mitarbeiter – Kann Voucher einlösen</span>
                      </SelectItem>
                      <SelectItem value="manager">
                        <span className="flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Manager – Kann auch Mitarbeiter verwalten</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim() || !inviteName.trim()} className="w-full">
                  {inviting ? 'Wird eingeladen...' : 'Einladung senden'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Staff Invite QR Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Staff-Einladungs-QR</DialogTitle>
            <DialogDescription>
              Mitarbeiter können diesen QR-Code mit ihrer Handy-Kamera scannen, um sich selbst anzumelden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center my-4">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <QRCodeSVG
                value={`${window.location.origin}/join-staff?partner=${user?.id}`}
                size={200}
                level="H"
                includeMargin
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Der Mitarbeiter wird nach dem Scan aufgefordert, sich zu registrieren und seine Daten einzugeben.
          </p>
        </DialogContent>
      </Dialog>

      {/* Individual Staff QR Dialog */}
      {staffQrOpen && (
        <Dialog open={!!staffQrOpen} onOpenChange={(open) => !open && setStaffQrOpen(null)}>
          <DialogContent className="max-w-sm text-center">
            <DialogHeader>
              <DialogTitle>QR-Code: {staffQrOpen.name}</DialogTitle>
              <DialogDescription>
                Persönlicher Einlöse-QR für {staffQrOpen.name}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center my-4">
              <div className="bg-white p-4 rounded-2xl shadow-lg">
                <QRCodeSVG
                  id={`staff-qr-${staffQrOpen.id}`}
                  value={staffQrPayload(staffQrOpen)}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              {getRoleBadge(staffQrOpen.staff_role)}
              <p className="text-xs text-muted-foreground">
                Dieser QR-Code identifiziert {staffQrOpen.name} bei jeder Voucher-Einlösung.
              </p>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => handleDownloadStaffQR(staffQrOpen)}>
                <Download className="w-4 h-4" />
                QR herunterladen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{activeStaff.length}</div>
            <p className="text-[11px] text-muted-foreground">Aktiv</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{staff.filter((s) => s.staff_role === 'manager').length}</div>
            <p className="text-[11px] text-muted-foreground">Manager</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <ScanLine className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{staff.filter((s) => s.last_scan_at).length}</div>
            <p className="text-[11px] text-muted-foreground">Aktive Scanner</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Staff */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Team ({activeStaff.length})</h2>
        {activeStaff.length === 0 ? (
          <Card variant="glass">
            <CardContent className="p-8 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">
                Noch keine Mitarbeiter. Lade dein Team per E-Mail oder QR-Code ein.
              </p>
            </CardContent>
          </Card>
        ) : (
          activeStaff.map((member) => (
            <Card key={member.id} variant="glass" className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">{member.name}</span>
                      {getRoleBadge(member.staff_role)}
                      {getStatusBadge(member)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{member.email}</p>
                    {member.last_scan_at && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        Letzter Scan: {format(new Date(member.last_scan_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setStaffQrOpen(member)}
                      title="QR-Code anzeigen"
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopyToken(member.qr_code_token)}
                      title="Einladungslink kopieren"
                    >
                      {copiedToken === member.qr_code_token ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            updateStaffRole(member.id, member.staff_role === 'manager' ? 'staff' : 'manager')
                          }
                        >
                          {member.staff_role === 'manager' ? (
                            <><Shield className="w-4 h-4 mr-2" />Zu Mitarbeiter ändern</>
                          ) : (
                            <><ShieldCheck className="w-4 h-4 mr-2" />Zum Manager befördern</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deactivateStaff(member.id)} className="text-destructive">
                          <UserX className="w-4 h-4 mr-2" />
                          Deaktivieren
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => removeStaff(member.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Endgültig entfernen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Deactivated Staff */}
      {deactivatedStaff.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Deaktiviert ({deactivatedStaff.length})</h2>
          {deactivatedStaff.map((member) => (
            <Card key={member.id} variant="glass" className="opacity-60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">{member.name}</span>
                      {getRoleBadge(member.staff_role)}
                      {getStatusBadge(member)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => reactivateStaff(member.id)} className="gap-1 text-xs">
                      <UserCheck className="w-3 h-3" />
                      Reaktivieren
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeStaff(member.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
