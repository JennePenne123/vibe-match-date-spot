
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
    <Card variant="elegant" className="border-pink-200/40 dark:border-pink-900/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/20">
              <Users className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <CardTitle className="text-xl font-semibold">
              {dateMode === 'single' ? 'Choose Your Date Partner' : 'Choose Your Group'}
            </CardTitle>
          </div>
          <Toggle 
            pressed={dateMode === 'group'} 
            onPressedChange={(pressed) => onDateModeChange(pressed ? 'group' : 'single')}
            className="rounded-full px-3 py-1.5 text-xs font-medium data-[state=on]:bg-pink-100 data-[state=on]:text-pink-700 dark:data-[state=on]:bg-pink-900/30 dark:data-[state=on]:text-pink-300 data-[state=off]:bg-muted data-[state=off]:text-muted-foreground hover:bg-pink-50 dark:hover:bg-pink-900/20"
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
                <div key={friend.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-pink-50/50 dark:hover:bg-pink-900/10 transition-colors border border-transparent hover:border-pink-200/50 dark:hover:border-pink-800/30">
                  <Checkbox
                    id={friend.id}
                    checked={selectedPartnerIds.includes(friend.id)}
                    onCheckedChange={(checked) => handlePartnerToggle(friend.id, checked as boolean)}
                    className="data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
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
          className="w-full h-12 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
