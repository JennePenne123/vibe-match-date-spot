
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Save, X, Heart, Users, MapPin } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }
    
    if (user?.profile) {
      setEditedName(user.profile.name || '');
      setEditedEmail(user.profile.email || '');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSave = async () => {
    await updateUser({
      name: editedName,
      email: editedEmail
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(user.profile?.name || '');
    setEditedEmail(user.profile?.email || '');
    setIsEditing(false);
  };

  const displayName = user.profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  const displayEmail = user.profile?.email || user.email || '';

  const stats = [
    { label: 'Dates Planned', value: '0', icon: Heart },
    { label: 'Friends Connected', value: '0', icon: Users },
    { label: 'Areas Explored', value: '0', icon: MapPin }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white p-4 pt-12 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={() => navigate('/home')}
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:bg-gray-100"
            >
              {isEditing ? <X className="w-6 h-6" /> : <Edit className="w-6 h-6" />}
            </Button>
          </div>

          {/* Profile Header */}
          <div className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-datespot-light-pink">
              <AvatarImage src={user.profile?.avatar_url} alt={displayName} />
              <AvatarFallback className="bg-datespot-light-pink text-datespot-dark-pink text-2xl">
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {isEditing ? (
              <div className="space-y-3 max-w-xs mx-auto">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-white text-gray-900 text-center font-semibold border-gray-200"
                  placeholder="Your name"
                />
                <Input
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className="bg-white text-gray-900 text-center border-gray-200"
                  placeholder="Your email"
                  type="email"
                />
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleSave}
                    className="bg-datespot-gradient text-white hover:opacity-90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-1 text-gray-900">{displayName}</h2>
                <p className="text-gray-600">{displayEmail}</p>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 -mt-8">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="text-center bg-white shadow-sm border-gray-100">
                <CardContent className="p-4">
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-datespot-pink" />
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

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
              onClick={logout}
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
