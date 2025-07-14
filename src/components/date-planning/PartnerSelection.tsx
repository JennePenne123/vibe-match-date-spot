
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {dateMode === 'single' ? 'Choose Your Date Partner' : 'Choose Your Group'}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Toggle 
              pressed={dateMode === 'group'} 
              onPressedChange={(pressed) => onDateModeChange(pressed ? 'group' : 'single')}
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {dateMode === 'single' ? (
                <>
                  <User className="h-4 w-4 mr-1" />
                  Single
                </>
              ) : (
                <>
                  <UsersIcon className="h-4 w-4 mr-1" />
                  Group
                </>
              )}
            </Toggle>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dateMode === 'single' ? (
          <Select value={selectedPartnerId} onValueChange={onPartnerChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a friend to plan a date with" />
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
            <div className="text-sm text-muted-foreground">
              Select friends for your group date ({selectedCount} selected)
            </div>
            <div className="grid gap-3 max-h-48 overflow-y-auto">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                  <Checkbox
                    id={friend.id}
                    checked={selectedPartnerIds.includes(friend.id)}
                    onCheckedChange={(checked) => handlePartnerToggle(friend.id, checked as boolean)}
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
          className="w-full"
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
