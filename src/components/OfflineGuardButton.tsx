import React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useOfflineGuard } from '@/hooks/useOfflineGuard';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Drop-in replacement for <Button> for network-dependent actions. It disables
 * itself while offline and shows a small offline indicator icon.
 */
export const OfflineGuardButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, disabled, onClick, className, size, ...props }, ref) => {
    const { isOffline } = useOfflineGuard();
    const showIcon = isOffline && size !== 'icon';

    return (
      <Button
        ref={ref}
        onClick={onClick}
        disabled={disabled || isOffline}
        size={size}
        className={cn(className)}
        {...props}
      >
        {showIcon && <WifiOff className="w-4 h-4 mr-2 shrink-0" aria-hidden />}
        {children}
      </Button>
    );
  },
);

OfflineGuardButton.displayName = 'OfflineGuardButton';

export default OfflineGuardButton;
