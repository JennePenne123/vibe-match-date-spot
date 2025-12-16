import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, User, Users, MapPin, Heart, Sparkles, ChevronDown, MoreHorizontal } from 'lucide-react'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useInvitations } from '@/hooks/useInvitations'
import { getUserName, getUserAvatar } from '@/utils/typeHelpers'
import { getInitials } from '@/lib/utils'

const primaryNavItems = [
  {
    title: 'Home',
    url: '/home',
    icon: Home
  },
  {
    title: 'Plan Date',
    url: '/plan-date',
    icon: Sparkles
  },
  {
    title: 'Profile',
    url: '/profile',
    icon: User
  }
]

const secondaryNavItems = [
  {
    title: 'My Friends',
    url: '/my-friends',
    icon: Users
  },
  {
    title: 'Invitations',
    url: '/invitations',
    icon: Heart
  },
  {
    title: 'My Venues',
    url: '/my-venues',
    icon: MapPin
  }
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { invitations } = useInvitations()
  const currentPath = location.pathname

  const [isMoreOpen, setIsMoreOpen] = React.useState(false)

  const displayName = getUserName(user)
  const userAvatar = getUserAvatar(user)
  const isCollapsed = state === 'collapsed'

  // Calculate pending invitations count (only received, not sent)
  const pendingCount = React.useMemo(() => {
    return invitations.filter(
      inv => inv.direction === 'received' && inv.status === 'pending'
    ).length
  }, [invitations])

  const isActive = (path: string) => currentPath === path
  const getNavClasses = (active: boolean) =>
    active 
      ? 'bg-sidebar-accent text-sidebar-primary font-medium border-r-2 border-sidebar-primary' 
      : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'

  const isSecondaryActive = secondaryNavItems.some(item => isActive(item.url))

  React.useEffect(() => {
    if (isSecondaryActive) {
      setIsMoreOpen(true)
    }
  }, [isSecondaryActive])

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent className="flex flex-col h-full">
        {/* User Profile Section */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 border border-sidebar-border">
              <AvatarImage src={userAvatar} alt={displayName} referrerPolicy="no-referrer" />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                {getInitials(displayName)}
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
              {primaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${getNavClasses(isActive(item.url))}`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Secondary Navigation - Collapsible "More" Section */}
              <SidebarMenuItem>
                {isCollapsed ? (
                  <Collapsible open={isMoreOpen} onOpenChange={setIsMoreOpen}>
                    <CollapsibleTrigger asChild>
                      <button className={`flex items-center justify-center gap-3 px-3 py-2 rounded-md transition-colors w-full relative ${isSecondaryActive ? 'bg-sidebar-accent/30' : 'hover:bg-sidebar-accent/50'} text-sidebar-foreground`}>
                        <MoreHorizontal className="w-4 h-4 flex-shrink-0" />
                        {pendingCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            size="sm"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold"
                          >
                            {pendingCount > 9 ? '9+' : pendingCount}
                          </Badge>
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 space-y-1">
                      {secondaryNavItems.map((item) => (
                        <NavLink
                          key={item.title}
                          to={item.url}
                          className={`flex items-center justify-center gap-3 px-3 py-2 rounded-md transition-colors ${getNavClasses(isActive(item.url))}`}
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                        </NavLink>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Collapsible open={isMoreOpen} onOpenChange={setIsMoreOpen}>
                    <CollapsibleTrigger asChild>
                      <button className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full text-left mt-2 ${isSecondaryActive ? 'bg-sidebar-accent/30' : 'hover:bg-sidebar-accent/50'} text-sidebar-foreground`}>
                        <MoreHorizontal className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1">More</span>
                        {pendingCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            size="sm"
                            className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold"
                          >
                            {pendingCount > 9 ? '9+' : pendingCount}
                          </Badge>
                        )}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 space-y-1 pl-3">
                      {secondaryNavItems.map((item) => (
                        <NavLink
                          key={item.title}
                          to={item.url}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${getNavClasses(isActive(item.url))}`}
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium flex-1">{item.title}</span>
                          {item.title === 'Invitations' && pendingCount > 0 && (
                            <Badge 
                              variant="destructive" 
                              size="sm"
                              className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold"
                            >
                              {pendingCount > 9 ? '9+' : pendingCount}
                            </Badge>
                          )}
                        </NavLink>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </SidebarMenuItem>
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