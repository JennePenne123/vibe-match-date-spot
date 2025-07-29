
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Save, X } from 'lucide-react';

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
  onCancel
}: ProfileHeaderProps) => {
  return (
    <div className="bg-card p-layout-sm pt-12 shadow-sm">
      <div className="flex items-center justify-between mb-layout-sm">
        <h1 className="text-heading-h2 font-heading-h2 text-foreground">Profile</h1>
        <Button
          onClick={onEditToggle}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-muted"
        >
          {isEditing ? <X className="w-6 h-6" /> : <Edit className="w-6 h-6" />}
        </Button>
      </div>

      {/* Profile Header */}
      <div className="text-center">
        <Avatar className="w-24 h-24 mx-auto mb-component-lg border-4 border-primary/20 shadow-elegant">
          <AvatarImage src={user.profile?.avatar_url} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-primary text-heading-h2 font-heading-h2">
            {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {isEditing ? (
          <div className="space-y-component-md max-w-xs mx-auto">
            <Input
              value={editedName}
              onChange={(e) => onEditedNameChange(e.target.value)}
              className="bg-card text-foreground text-center font-body-base border-border"
              placeholder="Your name"
            />
            <Input
              value={editedEmail}
              onChange={(e) => onEditedEmailChange(e.target.value)}
              className="bg-card text-foreground text-center border-border"
              placeholder="Your email"
              type="email"
            />
            <div className="flex gap-component-xs justify-center">
              <Button
                onClick={onSave}
                variant="premium"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                className="border-border text-muted-foreground hover:bg-muted"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-heading-h1 font-heading-h1 mb-1 text-foreground">{displayName}</h2>
            <p className="text-body-base text-muted-foreground">{displayEmail}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
