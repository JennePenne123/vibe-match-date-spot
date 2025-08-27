
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
        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/20">
          <AvatarImage src={user.profile?.avatar_url} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
            {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
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
                className="bg-gradient-primary text-white hover:opacity-90"
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
