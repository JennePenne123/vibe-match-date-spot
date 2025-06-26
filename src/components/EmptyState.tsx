
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  primaryAction, 
  secondaryAction 
}: EmptyStateProps) => {
  return (
    <Card className="bg-white shadow-sm border-gray-200">
      <CardContent className="p-8 text-center">
        <div className="text-gray-300 mb-4">
          <Icon className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        
        {(primaryAction || secondaryAction) && (
          <div className="space-y-2">
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                className="w-full bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600"
                aria-label={primaryAction.label}
              >
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="outline"
                className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                aria-label={secondaryAction.label}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;
