import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface DehogaBadgeProps {
  isMember: boolean;
  landesverband?: string | null;
  size?: 'sm' | 'md';
}

/**
 * Trust-Badge für verifizierte DEHOGA-Mitglieder.
 * Wird nur angezeigt wenn:
 *  - Feature-Flag `dehoga_onboarding_enabled` aktiv ist UND
 *  - der Partner als DEHOGA-Mitglied verifiziert ist.
 */
export const DehogaBadge: React.FC<DehogaBadgeProps> = ({ isMember, landesverband, size = 'sm' }) => {
  const { enabled } = useFeatureFlag('dehoga_onboarding_enabled');
  if (!enabled || !isMember) return null;

  return (
    <Badge
      variant="outline"
      className={`gap-1 border-primary/40 bg-primary/10 text-primary ${size === 'sm' ? 'text-[10px] px-1.5 py-0 h-4' : 'text-xs px-2 py-0.5'}`}
      title={landesverband ? `DEHOGA ${landesverband}` : 'DEHOGA-Mitglied'}
    >
      <ShieldCheck className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      DEHOGA{landesverband && size === 'md' ? ` · ${landesverband}` : ''}
    </Badge>
  );
};

export default DehogaBadge;