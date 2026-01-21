import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BurgerMenu from '@/components/BurgerMenu';
import { PointsIndicator } from '@/components/profile/PointsIndicator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AppUser } from '@/types/app';
import { getUserAvatar, getFallbackAvatar } from '@/utils/typeHelpers';
import { getInitials } from '@/lib/utils';
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
  const avatarUrl = getUserAvatar(user);
  const [imgError, setImgError] = useState(false);
  const fallbackUrl = getFallbackAvatar(displayName);
  
  if (import.meta.env.DEV) {
    console.log('🏠 HEADER: Rendering HomeHeader');
    console.log('🏠 HEADER: User avatar_url:', user?.avatar_url);
    console.log('🏠 HEADER: getUserAvatar result:', avatarUrl);
    console.log('🏠 HEADER: Fallback URL:', fallbackUrl);
    console.log('🏠 HEADER: Full user object:', user);
  }
  
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex justify-between items-center p-4 pt-12 bg-card/80 backdrop-blur-lg border-b border-border/40 shadow-gentle-sm">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="w-10 h-10 border-2 border-primary/30 ring-2 ring-primary/10 shrink-0">
          <AvatarImage 
            src={imgError ? fallbackUrl : (avatarUrl || fallbackUrl)}
            alt={displayName}
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (import.meta.env.DEV) {
                console.error('❌ AVATAR: Image failed to load');
                console.error('❌ AVATAR: Failed URL:', avatarUrl);
                console.error('❌ AVATAR: Error event:', e);
              }
              setImgError(true);
            }}
            onLoad={() => {
              if (import.meta.env.DEV) {
                console.log('✅ AVATAR: Image loaded successfully');
                console.log('✅ AVATAR: Loaded URL:', imgError ? fallbackUrl : avatarUrl);
              }
            }}
          />
          <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <Heading size="h2" className="text-foreground text-sm sm:text-base truncate">
            {getTimeBasedGreeting()} {firstName}! 👋
          </Heading>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <PointsIndicator />
        <ThemeToggle />
        <BurgerMenu />
      </div>
    </div>
  );
};

export default HomeHeader;
