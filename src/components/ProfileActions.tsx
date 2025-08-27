
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
      <Card className="mb-6 bg-white shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Users className="w-5 h-5" />
            Friends (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No friends added yet</p>
            <Button
              onClick={() => navigate('/my-friends')}
              variant="outline"
              className="mt-3 border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Add Friends
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={() => navigate('/preferences')}
          variant="outline"
          className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          Update Preferences
        </Button>
        <Button
          onClick={() => navigate('/home')}
          className="w-full bg-datespot-gradient text-white hover:opacity-90"
        >
          Find New Date Spots
        </Button>
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
        >
          Sign Out
        </Button>
      </div>
    </>
  );
};

export default ProfileActions;
