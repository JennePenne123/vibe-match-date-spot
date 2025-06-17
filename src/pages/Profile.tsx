
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Save, X, Settings, Heart, Users, MapPin } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');

  if (!user) {
    navigate('/');
    return null;
  }

  const handleSave = () => {
    updateUser({
      name: editedName,
      email: editedEmail
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(user.name);
    setEditedEmail(user.email);
    setIsEditing(false);
  };

  const stats = [
    { label: 'Dates Planned', value: '12', icon: Heart },
    { label: 'Friends Connected', value: user.friends.length.toString(), icon: Users },
    { label: 'Areas Explored', value: '5', icon: MapPin }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-datespot-gradient p-4 pt-12 text-white">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => navigate('/welcome')}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-semibold">Profile</h1>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            {isEditing ? <X className="w-6 h-6" /> : <Edit className="w-6 h-6" />}
          </Button>
        </div>

        {/* Profile Header */}
        <div className="text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white/30">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-white/20 text-white text-2xl">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          {isEditing ? (
            <div className="space-y-3 max-w-xs mx-auto">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="bg-white/90 text-gray-900 text-center font-semibold"
                placeholder="Your name"
              />
              <Input
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                className="bg-white/90 text-gray-900 text-center"
                placeholder="Your email"
              />
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleSave}
                  className="bg-white text-purple-600 hover:bg-white/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="border-white text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
              <p className="text-white/80">{user.email}</p>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 -mt-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="p-4">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Friends List */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Friends ({user.friends.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.friends.length > 0 ? (
              <div className="space-y-3">
                {user.friends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={friend.avatar} alt={friend.name} />
                      <AvatarFallback className="bg-purple-100 text-purple-700 text-sm">
                        {friend.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{friend.name}</div>
                      <div className="text-sm text-gray-500">
                        {friend.isInvited ? 'Recently invited' : 'Available'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No friends added yet</p>
                <Button
                  onClick={() => navigate('/friends')}
                  variant="outline"
                  className="mt-3"
                >
                  Add Friends
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferences */}
        {user.preferences && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Favorite Cuisines</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.preferences.cuisines?.map((cuisine) => (
                      <span
                        key={cuisine}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                      >
                        {cuisine}
                      </span>
                    )) || <span className="text-gray-500">Not set</span>}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Preferred Vibes</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.preferences.vibes?.map((vibe) => (
                      <span
                        key={vibe}
                        className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm"
                      >
                        {vibe}
                      </span>
                    )) || <span className="text-gray-500">Not set</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/preferences')}
            variant="outline"
            className="w-full"
          >
            Update Preferences
          </Button>
          <Button
            onClick={() => navigate('/welcome')}
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
  );
};

export default Profile;
