
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, ArrowRight, Loader2, User, UsersIcon } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
}

interface PartnerSelectionProps {
  friends: Friend[];
  selectedPartnerId: string;
  selectedPartnerIds: string[];
  dateMode: 'single' | 'group';
  loading: boolean;
  onPartnerChange: (partnerId: string) => void;
  onPartnerIdsChange: (partnerIds: string[]) => void;
  onDateModeChange: (mode: 'single' | 'group') => void;
  onContinue: () => void;
}

const PartnerSelection: React.FC<PartnerSelectionProps> = ({
  friends,
  selectedPartnerId,
  selectedPartnerIds,
  dateMode,
  loading,
  onPartnerChange,
  onPartnerIdsChange,
  onDateModeChange,
  onContinue
}) => {
  const handlePartnerToggle = (friendId: string, checked: boolean) => {
    if (checked) {
      onPartnerIdsChange([...selectedPartnerIds, friendId]);
    } else {
      onPartnerIdsChange(selectedPartnerIds.filter(id => id !== friendId));
    }
  };

  const isValidSelection = dateMode === 'single' 
    ? selectedPartnerId 
    : selectedPartnerIds.length > 0;

  const selectedCount = selectedPartnerIds.length;

  return (
    <Card variant="elegant" className="border-sage-200/40 dark:border-sage-800/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-sage-100 dark:bg-sage-900/20">
              <Users className="h-5 w-5 text-sage-600 dark:text-sage-400" />
            </div>
            <CardTitle className="text-xl font-semibold">
              {dateMode === 'single' ? 'Choose Your Date Partner' : 'Choose Your Group'}
            </CardTitle>
          </div>
          <Toggle 
            pressed={dateMode === 'group'} 
            onPressedChange={(pressed) => onDateModeChange(pressed ? 'group' : 'single')}
            className="rounded-full px-3 py-1.5 text-xs font-medium data-[state=on]:bg-sage-100 data-[state=on]:text-sage-700 dark:data-[state=on]:bg-sage-900/30 dark:data-[state=on]:text-sage-300 data-[state=off]:bg-muted data-[state=off]:text-muted-foreground hover:bg-sage-50 dark:hover:bg-sage-900/20"
          >
            {dateMode === 'single' ? (
              <>
                <User className="h-3.5 w-3.5 mr-1.5" />
                Single
              </>
            ) : (
              <>
                <UsersIcon className="h-3.5 w-3.5 mr-1.5" />
                Group
              </>
            )}
          </Toggle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="text-sm text-muted-foreground mb-3">
          {dateMode === 'single' 
            ? 'Select a friend to plan a date with' 
            : `Select friends for your group date (${selectedCount} selected)`}
        </div>
        {dateMode === 'single' ? (
          <Select value={selectedPartnerId} onValueChange={onPartnerChange}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Choose a friend..." />
            </SelectTrigger>
            <SelectContent>
              {friends.map((friend) => (
                <SelectItem key={friend.id} value={friend.id}>
                  {friend.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 max-h-48 overflow-y-auto pr-2">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-sage-50/50 dark:hover:bg-sage-900/10 transition-colors border border-transparent hover:border-sage-200/50 dark:hover:border-sage-800/30">
                  <Checkbox
                    id={friend.id}
                    checked={selectedPartnerIds.includes(friend.id)}
                    onCheckedChange={(checked) => handlePartnerToggle(friend.id, checked as boolean)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label 
                    htmlFor={friend.id} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {friend.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Button 
          onClick={onContinue}
          disabled={!isValidSelection || loading}
          variant="wellness"
          className="w-full h-12"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Planning Session...
            </>
          ) : (
            <>
              {dateMode === 'single' ? 'Continue' : `Plan Group Date (${selectedCount})`}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PartnerSelection;
