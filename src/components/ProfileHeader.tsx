import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Save, X, Camera, Loader2, MapPin, Calendar } from 'lucide-react';
import PremiumBadge from '@/components/PremiumBadge';
import { getUserAvatar, getFallbackAvatar } from '@/utils/typeHelpers';
import { uploadAvatar, deleteAvatar } from '@/utils/avatarUpload';
import { updateUserProfile } from '@/utils/userProfileHelpers';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ProfileHeaderProps {
  user: any;
  displayName: string;
  displayEmail: string;
  isEditing: boolean;
  editedName: string;
  editedEmail: string;
  onEditedNameChange: (name: string) => void;
  onEditedEmailChange: (email: string) => void;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
  onAvatarUpdate?: () => void;
  level?: number;
  totalPoints?: number;
  premiumUntil?: string | null;
}

const ProfileHeader = ({
  user, displayName, displayEmail, isEditing, editedName, editedEmail,
  onEditedNameChange, onEditedEmailChange, onEditToggle, onSave, onCancel, onAvatarUpdate,
  level = 1, totalPoints = 0, premiumUntil
}: ProfileHeaderProps) => {
  const { t } = useTranslation();
  const avatarUrl = getUserAvatar(user);
  const [imgError, setImgError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fallbackUrl = getFallbackAvatar(displayName);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAvatarClick = () => { if (isEditing && fileInputRef.current) fileInputRef.current.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setIsUploading(true);
    try {
      if (avatarUrl && avatarUrl.includes('/avatars/')) await deleteAvatar(avatarUrl);
      const newAvatarUrl = await uploadAvatar(file, user.id);
      await updateUserProfile(user.id, { avatar_url: newAvatarUrl });
      toast({ title: t('profile.avatarUpdated'), description: t('profile.avatarUpdatedDesc') });
      if (onAvatarUpdate) onAvatarUpdate();
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({ title: t('profile.uploadFailed'), description: error.message || t('profile.uploadFailedDesc'), variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 animate-gradient-shift" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      
      {/* Floating orbs */}
      <div className="absolute top-4 right-8 w-24 h-24 rounded-full bg-primary/10 blur-2xl animate-pulse" />
      <div className="absolute bottom-8 left-4 w-32 h-32 rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 px-4 pt-6 pb-8">
        {/* Top bar */}
        <div className="flex items-center justify-end mb-8">
          <Button 
            onClick={onEditToggle} 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-card/80 transition-all duration-300"
          >
            {isEditing ? <X className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
          </Button>
        </div>

        {/* Avatar + Info */}
        <div className="flex flex-col items-center">
          <div className="relative mb-4 group">
            {/* Glow ring */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-secondary rounded-full opacity-60 blur-sm group-hover:opacity-80 transition-opacity duration-500" />
            <Avatar className="w-28 h-28 border-4 border-card relative z-10 shadow-xl">
              <AvatarImage 
                src={imgError ? fallbackUrl : (avatarUrl || fallbackUrl)} 
                alt={displayName} 
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
              <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <>
                <Button 
                  onClick={handleAvatarClick} 
                  disabled={isUploading} 
                  size="icon" 
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-20 transition-transform duration-200 hover:scale-110"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </Button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} className="hidden" />
              </>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3 w-full max-w-xs">
              <Input value={editedName} onChange={(e) => onEditedNameChange(e.target.value)} className="bg-card/60 backdrop-blur-sm text-foreground text-center font-semibold border-border/50" placeholder={t('profile.yourName')} />
              <Input value={editedEmail} onChange={(e) => onEditedEmailChange(e.target.value)} className="bg-card/60 backdrop-blur-sm text-foreground text-center border-border/50" placeholder={t('profile.yourEmail')} type="email" />
              <div className="flex gap-2 justify-center">
                <Button onClick={onSave} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25">
                  <Save className="w-4 h-4 mr-2" />{t('profile.save')}
                </Button>
                <Button onClick={onCancel} variant="outline" className="border-border/50 backdrop-blur-sm">{t('profile.cancel')}</Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-1">{displayName}</h2>
              <div className="flex justify-center mb-3">
                <PremiumBadge premiumUntil={premiumUntil} size="md" />
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20 px-3 py-1 text-xs font-semibold">
                  Level {level}
                </Badge>
                <Badge variant="secondary" className="bg-accent/15 text-accent border-accent/20 px-3 py-1 text-xs">
                  {totalPoints.toLocaleString()} pts
                </Badge>
                {memberSince && (
                  <Badge variant="outline" className="border-border/50 text-muted-foreground px-3 py-1 text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {memberSince}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
