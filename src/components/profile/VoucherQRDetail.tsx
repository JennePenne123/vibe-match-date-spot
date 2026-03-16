import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { X, Ticket, Clock, Sparkles, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

  // Generate signed QR payload
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-card rounded-2xl shadow-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto border border-border/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header accent */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-primary/60 to-accent" />

          {/* Close button */}
          <div className="flex justify-end p-3 pb-0">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="px-5 pb-5 text-center space-y-3">
            <div>
              <h3 className="text-base font-bold">{voucher.title}</h3>
              <p className="text-xs text-muted-foreground">{voucher.venue_name}</p>
            </div>

            {/* Discount badge */}
            <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-base px-4 py-1.5">
              {discountText}
            </Badge>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-2xl shadow-lg relative">
                <QRCodeSVG
                  value={qrPayload}
                  size={200}
                  level="H"
                  includeMargin
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Zeige diesen QR-Code dem Venue-Partner zum Einlösen
            </p>

            {/* Code + copy */}
            <button
              onClick={handleCopyCode}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
                'bg-muted/50 hover:bg-muted border-border/50'
              )}
            >
              <code className="text-sm font-mono font-bold tracking-wider">{voucher.code}</code>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>

            {/* Meta info */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'} gültig
              </span>
              {voucher.ai_match_score && (
                <span className="flex items-center gap-1 text-primary">
                  <Sparkles className="w-3 h-3" />
                  {voucher.ai_match_score}% Match
                </span>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground/70">
              Einmalig gültig · Wird nach dem Scan endgültig eingelöst
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default VoucherQRDetail;
