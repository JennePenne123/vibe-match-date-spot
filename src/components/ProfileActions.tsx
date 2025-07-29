
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface ProfileActionsProps {
  onLogout: () => void;
}

const ProfileActions = ({ onLogout }: ProfileActionsProps) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Friends List Placeholder */}
      <Card variant="elevated" className="mb-layout-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-component-xs text-foreground">
            <Users className="w-5 h-5" />
            Friends (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-layout-sm text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-component-xs opacity-50" />
            <p>No friends added yet</p>
            <Button
              onClick={() => navigate('/my-friends')}
              variant="outline"
              className="mt-component-md"
            >
              Add Friends
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-component-md">
        <Button
          onClick={() => navigate('/preferences')}
          variant="outline"
          className="w-full"
        >
          Update Preferences
        </Button>
        <Button
          onClick={() => navigate('/home')}
          variant="premium"
          className="w-full"
        >
          Find New Date Spots
        </Button>
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
        >
          Sign Out
        </Button>
      </div>
    </>
  );
};

export default ProfileActions;
