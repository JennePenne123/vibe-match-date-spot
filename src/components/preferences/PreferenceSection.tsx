
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface PreferenceSectionProps {
  title: string;
  icon: React.ReactNode;
  options: string[];
  selectedItems: string[];
  partnerItems: string[];
  onToggle: (option: string) => void;
}

const PreferenceSection: React.FC<PreferenceSectionProps> = ({
  title,
  icon,
  options,
  selectedItems,
  partnerItems,
  onToggle
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-medium text-foreground">{title}</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {options.map((option) => {
          const isSelected = selectedItems.includes(option);
          const isPartnerSelected = partnerItems.includes(option);
          const isMatching = isSelected && isPartnerSelected;

          return (
            <div key={option} className="relative">
              <div
                className={`p-2 rounded-lg border cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? isMatching
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-card/50 border-border/50 hover:bg-white/10 hover:border-primary/30'
                }`}
                onClick={() => onToggle(option)}
              >
                <div className="flex items-center space-x-2">
                  <Checkbox checked={isSelected} />
                  <span className="text-sm">{option}</span>
                </div>
              </div>
              
              {isMatching && (
                <Badge className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs px-1 py-0">
                  Match!
                </Badge>
              )}
              {isPartnerSelected && !isSelected && (
                <Badge className="absolute -top-1 -right-1 bg-violet-500/80 text-white text-xs px-1 py-0">
                  Partner ♥
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PreferenceSection;
