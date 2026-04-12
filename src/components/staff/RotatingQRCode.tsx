import { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Progress } from '@/components/ui/progress';

interface RotatingQRCodeProps {
  staffId: string;
  partnerId: string;
  qrToken: string;
  staffName: string;
  voucherId?: string;
  /** Rotation interval in seconds (default 30) */
  interval?: number;
  size?: number;
}

/**
 * Simple hash function to create a time-based verification code.
 * Combines token + time-window to produce a code that changes every interval.
 */
function generateTimeCode(token: string, timeWindow: number): string {
  const input = `${token}:${timeWindow}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Convert to positive hex string, pad to 8 chars
  return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8).toUpperCase();
}

export function RotatingQRCode({
  staffId,
  partnerId,
  qrToken,
  staffName,
  voucherId,
  interval = 30,
  size = 180,
}: RotatingQRCodeProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeWindow = Math.floor(now / (interval * 1000));
  const timeCode = generateTimeCode(qrToken, timeWindow);
  const secondsLeft = interval - Math.floor((now / 1000) % interval);
  const progress = (secondsLeft / interval) * 100;

  const qrPayload = useMemo(
    () =>
      JSON.stringify({
        type: 'vybe_staff_network',
        staff_id: staffId,
        partner_id: partnerId,
        name: staffName,
        voucher_id: voucherId || null,
        tc: timeCode,
        tw: timeWindow,
      }),
    [staffId, partnerId, staffName, voucherId, timeCode, timeWindow]
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-3 rounded-2xl shadow-lg relative">
        <QRCodeSVG value={qrPayload} size={size} level="H" includeMargin />
      </div>
      <div className="w-full max-w-[200px] space-y-1">
        <Progress value={progress} className="h-1.5" />
        <p className="text-[10px] text-muted-foreground text-center">
          Neuer Code in {secondsLeft}s
        </p>
      </div>
    </div>
  );
}
