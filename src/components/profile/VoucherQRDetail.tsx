import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Clock, Sparkles, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface VoucherQRDetailProps {
  voucher: {
    id: string;
    title: string;
    code: string;
    discount_type: string;
    discount_value: number;
    venue_name: string;
    venue_id: string;
    valid_until: string;
    ai_match_score?: number;
  };
  userId: string;
  onClose: () => void;
}

export function VoucherQRDetail({ voucher, userId, onClose }: VoucherQRDetailProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const qrPayload = JSON.stringify({
    type: 'vybe_user_voucher',
    voucher_id: voucher.id,
    user_id: userId,
    venue_id: voucher.venue_id,
    code: voucher.code,
    ts: Date.now(),
  });

  const daysLeft = Math.ceil(
    (new Date(voucher.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    toast({ title: 'Code kopiert!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const discountText =
    voucher.discount_type === 'percentage'
      ? `${voucher.discount_value}% Rabatt`
      : voucher.discount_type === 'fixed'
        ? `€${voucher.discount_value} Rabatt`
        : 'Gratis-Artikel';

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border-border/50 p-0">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/60 to-accent" />

        <div className="max-h-[80vh] overflow-y-auto px-4 pb-4 pt-5">
          <DialogHeader className="space-y-2 pr-8 text-center">
            <div className="flex justify-center">
              <Badge className="bg-gradient-to-r from-primary to-primary/80 px-3 py-1 text-xs text-primary-foreground">
                {discountText}
              </Badge>
            </div>
            <DialogTitle className="text-base font-bold">{voucher.title}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {voucher.venue_name}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4 text-center">
            <div className="flex justify-center">
              <div className="relative rounded-2xl border border-border/50 bg-background p-3 shadow-sm">
                <QRCodeSVG value={qrPayload} size={144} level="H" includeMargin />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            <p className="mx-auto max-w-[18rem] text-xs text-muted-foreground">
              Zeige diesen QR-Code dem Venue-Partner zum Einlösen.
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopyCode}
              className="mx-auto flex h-10 rounded-lg px-4"
            >
              <code className="text-sm font-mono font-bold tracking-wider">{voucher.code}</code>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'} gültig
              </span>
              {voucher.ai_match_score && (
                <span className="flex items-center gap-1 text-primary">
                  <Sparkles className="h-3 w-3" />
                  {voucher.ai_match_score}% Match
                </span>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground/70">
              Einmalig gültig · Wird nach dem Scan endgültig eingelöst
            </p>

            <Button type="button" variant="secondary" className="w-full" onClick={onClose}>
              Fenster schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VoucherQRDetail;
