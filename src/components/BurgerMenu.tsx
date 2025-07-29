
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Menu, User, Users, MapPin, LogOut, X, Heart } from 'lucide-react';
import { getUserName, getUserAvatar } from '@/utils/typeHelpers';

const BurgerMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const displayName = getUserName(user);

  const menuItems = [
    {
      icon: User,
      label: 'Profile',
      path: '/profile',
      description: 'Manage your account'
    },
    {
      icon: Users,
      label: 'My Friends',
      path: '/my-friends',
      description: 'Your connections'
    },
    {
      icon: Heart,
      label: 'My Invitations',
      path: '/invitations',
      description: 'View all invitations'
    },
    {
      icon: MapPin,
      label: 'My Venues',
      path: '/my-venues',
      description: 'Favorite places'
    }
  ];

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-muted"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-w-md mx-auto">
        <div className="p-layout-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-layout-sm">
            <div className="flex items-center gap-component-md">
              <Avatar className="w-12 h-12 border-2 border-primary/20">
                <AvatarImage src={getUserAvatar(user)} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-heading-h4 text-heading-h4 text-foreground">{displayName}</h2>
                <p className="text-body-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Menu Items */}
          <div className="space-y-component-xs mb-layout-sm">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleMenuItemClick(item.path)}
                className="w-full flex items-center gap-component-lg p-component-lg rounded-lg hover:bg-muted transition-all duration-200 text-left group"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-body-base text-body-base text-foreground">{item.label}</div>
                  <div className="text-body-sm text-muted-foreground">{item.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Logout Button */}
          <div className="border-t border-border pt-component-lg">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-component-lg p-component-lg rounded-lg hover:bg-destructive/10 transition-all duration-200 text-left text-destructive group"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-destructive/10 rounded-lg group-hover:bg-destructive/20 transition-colors">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-body-base text-body-base">Sign Out</div>
                <div className="text-body-sm text-destructive/70">Log out of your account</div>
              </div>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BurgerMenu;
