import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, User, Users, MapPin, Heart, Sparkles } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { getUserName, getUserAvatar } from '@/utils/typeHelpers'

const navigationItems = [
  {
    title: 'Home',
    url: '/home',
    icon: Home,
    description: 'Dashboard and overview'
  },
  {
    title: 'Plan Date',
    url: '/plan-date',
    icon: Sparkles,
    description: 'Smart date planning'
  },
  {
    title: 'Profile',
    url: '/profile',
    icon: User,
    description: 'Manage your account'
  },
  {
    title: 'My Friends',
    url: '/my-friends',
    icon: Users,
    description: 'Your connections'
  },
  {
    title: 'Invitations',
    url: '/invitations',
    icon: Heart,
    description: 'View all invitations'
  },
  {
    title: 'My Venues',
    url: '/my-venues',
    icon: MapPin,
    description: 'Favorite places'
  }
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const { user, logout } = useAuth()
  const currentPath = location.pathname

  const displayName = getUserName(user)
  const userAvatar = getUserAvatar(user)
  const isCollapsed = state === 'collapsed'

  const isActive = (path: string) => currentPath === path
  const getNavClasses = (active: boolean) =>
    active 
      ? 'bg-sidebar-accent text-sidebar-primary font-medium border-r-2 border-sidebar-primary' 
      : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent className="flex flex-col h-full">
        {/* User Profile Section */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 border border-sidebar-border">
              <AvatarImage src={userAvatar} alt={displayName} />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sidebar-foreground text-sm truncate">
                  {displayName}
                </h3>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={getNavClasses(isActive(item.url))}>
                    <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors">
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{item.title}</span>
                          <p className="text-xs opacity-60 truncate">{item.description}</p>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout Button */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!isCollapsed && <span className="text-sm">Sign Out</span>}
            </div>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}