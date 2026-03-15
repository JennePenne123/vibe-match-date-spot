
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Settings } from 'lucide-react';

interface ProfileActionsProps {
  onLogout: () => void;
}

const ProfileActions = ({ onLogout }: ProfileActionsProps) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Friends List Placeholder */}
      <Card className="mb-6 bg-card shadow-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5" />
            Friends (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No friends added yet</p>
            <Button
              onClick={() => navigate('/my-friends')}
              variant="outline"
              className="mt-3 border-border text-foreground hover:bg-accent/50"
            >
              Add Friends
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={() => navigate('/settings')}
          variant="outline"
          className="w-full border-border text-foreground hover:bg-accent/50"
        >
          <Settings className="w-4 h-4 mr-2" />
          Account Settings
        </Button>
        <Button
          onClick={() => navigate('/preferences')}
          variant="outline"
          className="w-full border-border text-foreground hover:bg-accent/50"
        >
          Update Preferences
        </Button>
        <Button
          onClick={() => navigate('/home')}
          className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
        >
          Find New Date Spots
        </Button>
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          Sign Out
        </Button>
      </div>
    </>
  );
};

export default ProfileActions;
