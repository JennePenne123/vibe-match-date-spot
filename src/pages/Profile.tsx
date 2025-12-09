
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ProfileHeader from '@/components/ProfileHeader';
import ProfileStats from '@/components/ProfileStats';
import ProfileActions from '@/components/ProfileActions';
import { PointsCard } from '@/components/profile/PointsCard';
import { BadgesCard } from '@/components/profile/BadgesCard';
import { LeaderboardCard } from '@/components/profile/LeaderboardCard';
import ReferralCard from '@/components/profile/ReferralCard';
import AILearningCard from '@/components/profile/AILearningCard';
import { useUserPoints } from '@/hooks/useUserPoints';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout, loading, refreshProfile } = useAuth();
  const { points, loading: pointsLoading } = useUserPoints();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');

  // Refresh profile on mount to get latest avatar data
  React.useEffect(() => {
    if (user && !loading) {
      refreshProfile();
    }
  }, []);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }
    
    if (user) {
      setEditedName(user.name || '');
      setEditedEmail(user.email || '');
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
    setEditedName(user.name || '');
    setEditedEmail(user.email || '');
    setIsEditing(false);
  };

  const displayName = user.name || user.email?.split('@')[0] || 'User';
  const displayEmail = user.email || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <div className="bg-white p-4 pt-12 shadow-sm">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:bg-gray-100 mb-6"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </div>

        {/* Profile Header */}
        <ProfileHeader
          user={user}
          displayName={displayName}
          displayEmail={displayEmail}
          isEditing={isEditing}
          editedName={editedName}
          editedEmail={editedEmail}
          onEditedNameChange={setEditedName}
          onEditedEmailChange={setEditedEmail}
          onEditToggle={() => setIsEditing(!isEditing)}
          onSave={handleSave}
          onCancel={handleCancel}
          onAvatarUpdate={refreshProfile}
        />

        {/* Content */}
        <div className="p-4 -mt-8 space-y-4">
          {/* Stats */}
          <ProfileStats />

          {/* Points and Progress */}
          {!pointsLoading && points && (
            <PointsCard 
              totalPoints={points.total_points}
              level={points.level}
              streakCount={points.streak_count}
            />
          )}

          {/* Badges */}
          {!pointsLoading && points && (
            <BadgesCard badges={Array.isArray(points.badges) ? points.badges : []} />
          )}

          {/* Referral Program */}
          <ReferralCard />

          {/* AI Learning */}
          <AILearningCard />

          {/* Leaderboard */}
          <LeaderboardCard />

          {/* Actions */}
          <ProfileActions onLogout={logout} />
        </div>
      </div>
    </div>
  );
};

export default Profile;
