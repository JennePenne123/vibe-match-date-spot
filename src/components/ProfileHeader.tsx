import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Save, X, Camera, Loader2 } from 'lucide-react';
import { getUserAvatar, getFallbackAvatar } from '@/utils/typeHelpers';
import { uploadAvatar, deleteAvatar } from '@/utils/avatarUpload';
import { updateUserProfile } from '@/utils/userProfileHelpers';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';

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
}

const ProfileHeader = ({
  user,
  displayName,
  displayEmail,
  isEditing,
  editedName,
  editedEmail,
  onEditedNameChange,
  onEditedEmailChange,
  onEditToggle,
  onSave,
  onCancel,
  onAvatarUpdate
}: ProfileHeaderProps) => {
  const avatarUrl = getUserAvatar(user);
  const [imgError, setImgError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fallbackUrl = getFallbackAvatar(displayName);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  console.log('👤 PROFILE HEADER: Avatar URL:', avatarUrl);
  console.log('👤 PROFILE HEADER: Fallback URL:', fallbackUrl);

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploading(true);
    try {
      // Delete old avatar if it exists and is from storage
      if (avatarUrl && avatarUrl.includes('/avatars/')) {
        await deleteAvatar(avatarUrl);
      }

      // Upload new avatar
      const newAvatarUrl = await uploadAvatar(file, user.id);

      // Update profile with new avatar URL
      await updateUserProfile(user.id, { avatar_url: newAvatarUrl });

      toast({
        title: "Avatar updated!",
        description: "Your profile picture has been updated successfully.",
      });

      // Trigger refresh if callback provided
      if (onAvatarUpdate) {
        onAvatarUpdate();
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  return (
    <div className="bg-white p-4 pt-12 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        <Button
          onClick={onEditToggle}
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:bg-gray-100"
        >
          {isEditing ? <X className="w-6 h-6" /> : <Edit className="w-6 h-6" />}
        </Button>
      </div>

      {/* Profile Header */}
      <div className="text-center">
        <div className="relative inline-block mb-4">
          <Avatar className="w-24 h-24 border-4 border-primary/20">
            <AvatarImage 
              src={imgError ? fallbackUrl : (avatarUrl || fallbackUrl)}
              alt={displayName}
              referrerPolicy="no-referrer"
              onError={(e) => {
                console.error('❌ PROFILE AVATAR: Image failed to load');
                console.error('❌ PROFILE AVATAR: Failed URL:', avatarUrl);
                setImgError(true);
              }}
              onLoad={() => {
                console.log('✅ PROFILE AVATAR: Image loaded successfully');
                console.log('✅ PROFILE AVATAR: Loaded URL:', imgError ? fallbackUrl : avatarUrl);
              }}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          
          {isEditing && (
            <>
              <Button
                onClick={handleAvatarClick}
                disabled={isUploading}
                size="icon"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-3 max-w-xs mx-auto">
            <Input
              value={editedName}
              onChange={(e) => onEditedNameChange(e.target.value)}
              className="bg-white text-gray-900 text-center font-semibold border-gray-200"
              placeholder="Your name"
            />
            <Input
              value={editedEmail}
              onChange={(e) => onEditedEmailChange(e.target.value)}
              className="bg-white text-gray-900 text-center border-gray-200"
              placeholder="Your email"
              type="email"
            />
            <div className="flex gap-2 justify-center">
              <Button
                onClick={onSave}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                onClick={onCancel}
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
  );
};

export default ProfileHeader;
