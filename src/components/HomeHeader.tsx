import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BurgerMenu from '@/components/BurgerMenu';
import { PointsIndicator } from '@/components/profile/PointsIndicator';
import { AppUser } from '@/types/app';
import { getUserAvatar } from '@/utils/typeHelpers';
import { Heading } from '@/design-system/components';
interface HomeHeaderProps {
  user: AppUser;
  displayName: string;
  firstName: string;
}
const HomeHeader = ({
  user,
  displayName,
  firstName
}: HomeHeaderProps) => {
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return <div className="flex justify-between items-center p-4 pt-12 bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 border-2 border-pink-200">
          <AvatarImage src={getUserAvatar(user)} alt={displayName} />
          <AvatarFallback className="bg-pink-100 text-pink-600 text-sm">
            {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <Heading size="h2" className="text-foreground">{getTimeBasedGreeting()} {firstName}! 👋</Heading>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <PointsIndicator />
        <BurgerMenu />
      </div>
    </div>;
};
export default HomeHeader;