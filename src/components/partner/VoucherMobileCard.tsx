import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import VoucherActionsMenu from './VoucherActionsMenu';

interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string;
  max_redemptions: number;
  min_booking_value: number;
  current_redemptions: number;
  status: string;
  applicable_days: string[];
  applicable_times: string[];
  terms_conditions: string;
}

interface VoucherMobileCardProps {
  voucher: Voucher;
  onEdit: () => void;
  onViewAnalytics: () => void;
}

export default function VoucherMobileCard({ voucher, onEdit, onViewAnalytics }: VoucherMobileCardProps) {
  const isExpired = new Date(voucher.valid_until) < new Date();

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') return `${value}%`;
    if (type === 'fixed') return `${value}€`;
    return 'Free Item';
  };

  const statusBadge = isExpired ? (
    <Badge variant="destructive" className="text-[10px]">Abgelaufen</Badge>
  ) : voucher.status === 'active' ? (
    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-[10px]">Aktiv</Badge>
  ) : (
    <Badge variant="secondary" className="text-[10px]">Inaktiv</Badge>
  );

  const redemptionPercent = voucher.max_redemptions
    ? Math.min((voucher.current_redemptions / voucher.max_redemptions) * 100, 100)
    : 0;

  return (
    <Card variant="glass" className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">{voucher.title}</h3>
            {statusBadge}
          </div>
          <code className="text-[11px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
            {voucher.code}
          </code>
        </div>
        <VoucherActionsMenu
          voucherId={voucher.id}
          voucherTitle={voucher.title}
          currentStatus={voucher.status}
          currentRedemptions={voucher.current_redemptions}
          validUntil={voucher.valid_until}
          onEdit={onEdit}
          onViewAnalytics={onViewAnalytics}
          onSuccess={() => {}}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-foreground text-xs">Rabatt</span>
          <p className="font-bold text-primary">{formatDiscount(voucher.discount_type, voucher.discount_value)}</p>
        </div>
        <div className="text-right">
          <span className="text-muted-foreground text-xs">Gültig bis</span>
          <p className="text-xs">{format(new Date(voucher.valid_until), 'dd.MM.yyyy')}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Einlösungen</span>
          <span>
            {voucher.current_redemptions}
            {voucher.max_redemptions ? ` / ${voucher.max_redemptions}` : ' / ∞'}
          </span>
        </div>
        {voucher.max_redemptions > 0 && (
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all rounded-full"
              style={{ width: `${redemptionPercent}%` }}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
