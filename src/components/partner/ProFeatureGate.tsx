import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProFeatureGateProps {
  featureName: string;
  description?: string;
  children: React.ReactNode;
  hasAccess: boolean;
}

/**
 * Wraps a feature that requires Pro membership.
 * Shows an upgrade prompt if the partner doesn't have access.
 */
const ProFeatureGate: React.FC<ProFeatureGateProps> = ({
  featureName,
  description,
  children,
  hasAccess,
}) => {
  const navigate = useNavigate();

  if (hasAccess) return <>{children}</>;

  return (
    <Card variant="glass" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="text-center p-6 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="font-semibold text-lg mb-1">{featureName}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {description || 'Dieses Feature ist exklusiv für Pro-Mitglieder verfügbar.'}
          </p>
          <Button
            className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 gap-2"
            onClick={() => navigate('/partner/profile')}
          >
            <Crown className="w-4 h-4" />
            Upgrade auf Pro
          </Button>
        </div>
      </div>
      <CardContent className="p-6 opacity-30 pointer-events-none">
        {children}
      </CardContent>
    </Card>
  );
};

export default ProFeatureGate;
