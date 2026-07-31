import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScanLine, AlertCircle } from 'lucide-react';
import { extractGroupToken, storeGroupToken } from '@/lib/groupInviteLink';

interface GroupQRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ELEMENT_ID = 'hioutz-group-qr-reader';

/** Extract a group invite token from a scanned QR payload. */
export const extractInviteToken = extractGroupToken;

const GroupQRScanner: React.FC<GroupQRScannerProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);

    const start = async () => {
      try {
        const scanner = new Html5Qrcode(ELEMENT_ID);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            if (cancelled) return;
            const token = extractGroupToken(decoded);
            if (!token) {
              setError('Dieser QR-Code gehört nicht zu einer H!Outz-Gruppe.');
              return;
            }
            cancelled = true;
            storeGroupToken(token);
            onOpenChange(false);
            navigate(`/join-group?token=${encodeURIComponent(token)}`);
          },
          () => { /* ignore per-frame decode errors */ }
        );
      } catch {
        if (!cancelled) setError('Kamera konnte nicht gestartet werden. Bitte Kamerazugriff erlauben.');
      }
    };

    const timer = setTimeout(start, 50);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner.stop().catch(() => undefined).finally(() => {
          try { scanner.clear(); } catch { /* noop */ }
        });
      }
    };
  }, [open, navigate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ScanLine className="w-4 h-4 text-primary" />
            QR-Code scannen
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div id={ELEMENT_ID} className="overflow-hidden rounded-xl bg-muted/40" />
          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Richte die Kamera auf den Gruppen-QR-Code, um direkt beizutreten.
            </p>
          )}
          <Button variant="outline" size="sm" className="w-full" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupQRScanner;