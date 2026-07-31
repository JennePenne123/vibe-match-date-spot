import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { buildGroupJoinLink } from '@/lib/groupInviteLink';

interface GroupInviteQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  inviteToken?: string | null;
}

const GroupInviteQRDialog: React.FC<GroupInviteQRDialogProps> = ({ open, onOpenChange, groupName, inviteToken }) => {
  const { toast } = useToast();
  const link = inviteToken ? buildGroupJoinLink(inviteToken) : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: 'Link kopiert' });
    } catch {
      toast({ title: 'Kopieren fehlgeschlagen', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <QrCode className="w-4 h-4 text-primary" />
            {groupName}
          </DialogTitle>
        </DialogHeader>
        {link ? (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl bg-white p-4">
              <QRCodeSVG value={link} size={192} level="M" />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Freunde scannen diesen Code und landen direkt in der Gruppe.
            </p>
            <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={copy}>
              <Copy className="w-3.5 h-3.5" />
              Einladungslink kopieren
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Für diese Gruppe ist noch kein Einladungscode verfügbar.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GroupInviteQRDialog;