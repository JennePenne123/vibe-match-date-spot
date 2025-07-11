
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BurgerMenu from '@/components/BurgerMenu';
import { AppUser } from '@/types/app';
import { getUserAvatar } from '@/utils/typeHelpers';

interface HomeHeaderProps {
  user: AppUser;
  displayName: string;
  firstName: string;
}

const HomeHeader = ({ user, displayName, firstName }: HomeHeaderProps) => {
  return (
    <div className="flex justify-between items-center p-4 pt-12 bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 border-2 border-datespot-light-coral">
          <AvatarImage src={getUserAvatar(user)} alt={displayName} />
          <AvatarFallback className="bg-datespot-light-coral text-datespot-dark-coral text-sm">
            {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Hey {firstName}! 👋</h1>
          <p className="text-sm text-gray-600">Ready for your next adventure?</p>
        </div>
      </div>
      <BurgerMenu />
    </div>
  );
};

export default HomeHeader;
