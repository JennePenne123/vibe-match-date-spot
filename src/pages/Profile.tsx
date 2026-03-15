import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { ThemeSettingsCard } from '@/components/profile/ThemeSettingsCard';
import { useUserPoints } from '@/hooks/useUserPoints';

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, updateUser, logout, loading, refreshProfile } = useAuth();
  const { points, loading: pointsLoading } = useUserPoints();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');

  React.useEffect(() => { if (user && !loading) refreshProfile(); }, []);
  React.useEffect(() => {
    if (!loading && !user) { navigate('/'); return; }
    if (user) { setEditedName(user.name || ''); setEditedEmail(user.email || ''); }
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground">{t('common.loading')}</div></div>;
  if (!user) return null;

  const handleSave = async () => { await updateUser({ name: editedName, email: editedEmail }); setIsEditing(false); };
  const handleCancel = () => { setEditedName(user.name || ''); setEditedEmail(user.email || ''); setIsEditing(false); };

  const displayName = user.name || user.email?.split('@')[0] || 'User';
  const displayEmail = user.email || '';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        <div className="bg-card p-4 pt-12 shadow-sm">
          <Button onClick={() => navigate(-1)} variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted mb-6"><ArrowLeft className="w-6 h-6" /></Button>
        </div>
        <ProfileHeader user={user} displayName={displayName} displayEmail={displayEmail} isEditing={isEditing} editedName={editedName} editedEmail={editedEmail} onEditedNameChange={setEditedName} onEditedEmailChange={setEditedEmail} onEditToggle={() => setIsEditing(!isEditing)} onSave={handleSave} onCancel={handleCancel} onAvatarUpdate={refreshProfile} />
        <div className="p-4 -mt-8 space-y-4">
          <ProfileStats />
          {!pointsLoading && points && <PointsCard totalPoints={points.total_points} level={points.level} streakCount={points.streak_count} />}
          {!pointsLoading && points && <BadgesCard badges={Array.isArray(points.badges) ? points.badges : []} />}
          <ReferralCard />
          <AILearningCard />
          <ThemeSettingsCard />
          <LeaderboardCard />
          <ProfileActions onLogout={logout} />
        </div>
      </div>
    </div>
  );
};

export default Profile;
