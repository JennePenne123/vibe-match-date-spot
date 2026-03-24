import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, Award, Gift, Brain } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ProfileHeader from '@/components/ProfileHeader';
import ProfileStats from '@/components/ProfileStats';
import ProfileActions from '@/components/ProfileActions';
import { PointsCard } from '@/components/profile/PointsCard';
import { BadgesCard } from '@/components/profile/BadgesCard';
import { LeaderboardCard } from '@/components/profile/LeaderboardCard';
import ReferralCard from '@/components/profile/ReferralCard';
import AILearningCard from '@/components/profile/AILearningCard';
import AIProgressIndicator from '@/components/profile/AIProgressIndicator';
import { ThemeSettingsCard } from '@/components/profile/ThemeSettingsCard';
import { PremiumWalletCard } from '@/components/profile/PremiumWalletCard';
import ActivityFeed from '@/components/profile/ActivityFeed';
import { useUserPoints } from '@/hooks/useUserPoints';
import { checkAndAwardProfileComplete } from '@/services/profileCompletionService';

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, updateUser, logout, loading, refreshProfile } = useAuth();
  const { points, loading: pointsLoading } = useUserPoints();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');

  React.useEffect(() => { if (user && !loading) { refreshProfile(); checkAndAwardProfileComplete(); } }, []);
  React.useEffect(() => {
    if (!loading && !user) { navigate('/?auth=required', { replace: true }); return; }
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
        {/* Back button - floating over header */}
        <div className="absolute top-3 left-3 z-20">
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-card/80 text-foreground shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Premium Header */}
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
          level={points?.level}
          totalPoints={points?.total_points}
        />

        {/* Content cards */}
        <div className="px-4 pb-6 -mt-4 space-y-4 relative z-10">
          {/* AI Progress – shows how well AI knows the user */}
          <AIProgressIndicator variant="compact" />
          
          {/* Premium Wallet – first for immediate overview */}
          <PremiumWalletCard />
          
          <ProfileStats />
          
          {/* Activity Feed */}
          <ActivityFeed />

          {!pointsLoading && points && <PointsCard totalPoints={points.total_points} level={points.level} streakCount={points.streak_count} />}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-4 py-3 h-auto">
                <span className="flex items-center gap-2 font-semibold">
                  <Award className="h-5 w-5 text-primary" />
                  Achievements
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {!pointsLoading && points && <BadgesCard badges={Array.isArray(points.badges) ? points.badges : []} />}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-4 py-3 h-auto">
                <span className="flex items-center gap-2 font-semibold">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Learning
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <AILearningCard />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-4 py-3 h-auto">
                <span className="flex items-center gap-2 font-semibold">
                  <Gift className="h-5 w-5 text-primary" />
                  Referral Program
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ReferralCard />
            </CollapsibleContent>
          </Collapsible>

          <LeaderboardCard />

          <ProfileActions onLogout={logout} />
        </div>
      </div>
    </div>
  );
};

export default Profile;
