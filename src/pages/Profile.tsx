
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Save, X, Settings, Heart, Users, MapPin, Sparkles } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');

  React.useEffect(() => {
    if (!isDemoMode && !loading && !user) {
      navigate('/');
      return;
    }
    
    if (user?.profile) {
      setEditedName(user.profile.name || '');
      setEditedEmail(user.profile.email || '');
    }
  }, [user, loading, navigate, isDemoMode]);

  if (!isDemoMode && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vyy-soft to-vyy-glow flex items-center justify-center">
        <div className="text-gray-600 flex items-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!isDemoMode && !user) {
    return null;
  }

  const handleSave = async () => {
    if (!isDemoMode) {
      await updateUser({
        name: editedName,
        email: editedEmail
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (isDemoMode) {
      setEditedName('Demo User');
      setEditedEmail('demo@vyybmtch.com');
    } else {
      setEditedName(user.profile?.name || '');
      setEditedEmail(user.profile?.email || '');
    }
    setIsEditing(false);
  };

  const displayName = isDemoMode 
    ? 'Demo User' 
    : (user?.profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User');
  const displayEmail = isDemoMode 
    ? 'demo@vyybmtch.com' 
    : (user?.profile?.email || user?.email || '');

  const stats = [
    { label: 'Dates Planned', value: '0', icon: Heart },
    { label: 'Friends Connected', value: '0', icon: Users },
    { label: 'Areas Explored', value: '0', icon: MapPin }
  ];

  const handleLogout = () => {
    if (isDemoMode) {
      navigate('/');
    } else {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vyy-soft via-vyy-glow to-vyy-warm">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-sm p-4 pt-12 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={() => navigate(isDemoMode ? '/welcome?demo=true' : '/welcome')}
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:bg-white/50 rounded-2xl"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900 text-organic">Profile</h1>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:bg-white/50 rounded-2xl"
            >
              {isEditing ? <X className="w-6 h-6" /> : <Edit className="w-6 h-6" />}
            </Button>
          </div>

          {/* Profile Header */}
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="w-28 h-28 mx-auto border-4 border-white shadow-2xl animate-float">
                <AvatarImage src={isDemoMode ? undefined : user?.profile?.avatar_url} alt={displayName} />
                <AvatarFallback className="bg-vyy-primary text-white text-3xl">
                  {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-vyy-sunset rounded-full flex items-center justify-center animate-pulse-glow">
                ✨
              </div>
            </div>
            
            {isEditing ? (
              <div className="space-y-4 max-w-xs mx-auto">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-white/80 backdrop-blur-sm text-gray-900 text-center font-bold border-0 rounded-2xl shadow-lg"
                  placeholder="Your name"
                />
                <Input
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className="bg-white/80 backdrop-blur-sm text-gray-900 text-center border-0 rounded-2xl shadow-lg"
                  placeholder="Your email"
                  type="email"
                />
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleSave}
                    className="bg-vyy-primary text-white hover:opacity-90 rounded-2xl px-6"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-gray-200 text-gray-700 hover:bg-white/50 rounded-2xl px-6"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-2 text-gray-900 text-expressive text-organic">{displayName}</h2>
                <p className="text-gray-600 text-lg">{displayEmail}</p>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 -mt-8">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="organic-card text-center bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <stat.icon className="w-8 h-8 mx-auto mb-3 text-vyy-coral animate-float" />
                  <div className="text-3xl font-bold text-gray-900 text-organic">{stat.value}</div>
                  <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Friends List Placeholder */}
          <Card className="organic-card mb-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900 text-organic">
                <Users className="w-6 h-6 text-vyy-coral" />
                Friends (0)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-4 animate-float">👥</div>
                <p className="text-lg font-medium mb-2">No friends added yet</p>
                <p className="text-sm text-gray-400 mb-4">Connect with friends to plan amazing dates together</p>
                <Button
                  onClick={() => navigate(isDemoMode ? '/friends?demo=true' : '/friends')}
                  variant="outline"
                  className="border-gray-200 text-gray-700 hover:bg-white/50 rounded-2xl"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Friends
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-4">
            <Button
              onClick={() => navigate(isDemoMode ? '/preferences?demo=true' : '/preferences')}
              variant="outline"
              className="w-full h-12 border-gray-200 text-gray-700 hover:bg-white/50 rounded-2xl"
            >
              <Settings className="w-4 h-4 mr-2" />
              Update Preferences
            </Button>
            <Button
              onClick={() => navigate(isDemoMode ? '/welcome?demo=true' : '/welcome')}
              className="w-full h-12 bg-vyy-primary hover:opacity-90 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Find New Date Spots
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50 rounded-2xl"
            >
              {isDemoMode ? 'Exit Demo' : 'Sign Out'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
