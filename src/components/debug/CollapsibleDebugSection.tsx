import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';

interface CollapsibleDebugSectionProps {
  children: React.ReactNode;
  title?: string;
  defaultOpen?: boolean;
}

const CollapsibleDebugSection: React.FC<CollapsibleDebugSectionProps> = ({
  children,
  title = "Debug Tools",
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {title}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs opacity-70">
                  {isOpen ? 'Hide' : 'Show'}
                </span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default CollapsibleDebugSection;