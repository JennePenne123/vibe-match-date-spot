import { Ticket, Gift, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VoucherBadge as VoucherBadgeType } from '@/hooks/useVenueVouchers';

interface VoucherBadgeProps {
  voucher: VoucherBadgeType;
  className?: string;
  compact?: boolean;
}

export const VoucherBadge = ({ voucher, className, compact = false }: VoucherBadgeProps) => {
  const getIcon = () => {
    switch (voucher.discount_type) {
      case 'percentage':
        return <Percent className="w-3 h-3" />;
      case 'free_item':
        return <Gift className="w-3 h-3" />;
      default:
        return <Ticket className="w-3 h-3" />;
    }
  };

  const getDisplayText = () => {
    switch (voucher.discount_type) {
      case 'percentage':
        return `${voucher.discount_value}% OFF`;
      case 'fixed':
        return `$${voucher.discount_value} OFF`;
      case 'free_item':
        return compact ? 'FREE ITEM' : voucher.title;
      default:
        return voucher.title;
    }
  };

  return (
    <Badge
      variant="default"
      className={cn(
        'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-lg hover:shadow-xl transition-all',
        compact ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
        className
      )}
      title={`${voucher.title} - Code: ${voucher.code}`}
    >
      <span className="flex items-center gap-1">
        {getIcon()}
        {getDisplayText()}
      </span>
    </Badge>
  );
};
