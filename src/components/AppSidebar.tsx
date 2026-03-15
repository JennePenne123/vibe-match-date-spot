import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, User, Users, MapPin, Heart, Sparkles, ChevronDown, MoreHorizontal, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useInvitations } from '@/hooks/useInvitations'
import { getUserName, getUserAvatar } from '@/utils/typeHelpers'
import { getInitials } from '@/lib/utils'

export function AppSidebar() {
  const { t } = useTranslation()
  const { state } = useSidebar()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { invitations } = useInvitations()
  const currentPath = location.pathname
  const [isMoreOpen, setIsMoreOpen] = React.useState(false)

  const displayName = getUserName(user)
  const userAvatar = getUserAvatar(user)
  const isCollapsed = state === 'collapsed'

  const primaryNavItems = [
    { title: t('nav.home'), url: '/home', icon: Home },
    { title: t('nav.planDate'), url: '/plan-date', icon: Sparkles },
    { title: t('nav.profile'), url: '/profile', icon: User },
  ]

  const secondaryNavItems = [
    { title: t('nav.myFriends'), url: '/my-friends', icon: Users },
    { title: t('nav.invitations'), url: '/invitations', icon: Heart },
    { title: t('nav.myVenues'), url: '/my-venues', icon: MapPin },
  ]

  const pendingCount = React.useMemo(() => {
    return invitations.filter(inv => inv.direction === 'received' && inv.status === 'pending').length
  }, [invitations])

  const isActive = (path: string) => currentPath === path
  const getNavClasses = (active: boolean) =>
    active 
      ? 'bg-primary/20 text-primary font-medium border-r-2 border-primary shadow-glow-primary/20' 
      : 'hover:bg-white/10 text-sidebar-foreground'

  const isSecondaryActive = secondaryNavItems.some(item => isActive(item.url))

  React.useEffect(() => {
    if (isSecondaryActive) setIsMoreOpen(true)
  }, [isSecondaryActive])

  return (
    <Sidebar className="border-r border-border/40 bg-sidebar/80 backdrop-blur-lg">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border-2 border-primary/30 ring-2 ring-primary/10">
              <AvatarImage src={userAvatar} alt={displayName} referrerPolicy="no-referrer" />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm truncate">{displayName}</h3>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wide">{t('nav.navigation')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${getNavClasses(isActive(item.url))}`}>
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                {isCollapsed ? (
                  <Collapsible open={isMoreOpen} onOpenChange={setIsMoreOpen}>
                    <CollapsibleTrigger asChild>
                      <button className={`flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 w-full relative ${isSecondaryActive ? 'bg-primary/10' : 'hover:bg-white/10'} text-sidebar-foreground`}>
                        <MoreHorizontal className="w-4 h-4 flex-shrink-0" />
                        {pendingCount > 0 && (
                          <Badge variant="accent" size="sm" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold">
                            {pendingCount > 9 ? '9+' : pendingCount}
                          </Badge>
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 space-y-1">
                      {secondaryNavItems.map((item) => (
                        <NavLink key={item.url} to={item.url} className={`flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${getNavClasses(isActive(item.url))}`}>
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                        </NavLink>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Collapsible open={isMoreOpen} onOpenChange={setIsMoreOpen}>
                    <CollapsibleTrigger asChild>
                      <button className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 w-full text-left mt-2 ${isSecondaryActive ? 'bg-primary/10' : 'hover:bg-white/10'} text-sidebar-foreground`}>
                        <MoreHorizontal className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1">{t('common.more')}</span>
                        {pendingCount > 0 && (
                          <Badge variant="accent" size="sm" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold">
                            {pendingCount > 9 ? '9+' : pendingCount}
                          </Badge>
                        )}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isMoreOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 space-y-1 pl-3">
                      {secondaryNavItems.map((item) => (
                        <NavLink key={item.url} to={item.url} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${getNavClasses(isActive(item.url))}`}>
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium flex-1">{item.title}</span>
                          {item.url === '/invitations' && pendingCount > 0 && (
                            <Badge variant="accent" size="sm" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold">
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

        <div className="p-4 border-t border-border/40">
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-error-500 hover:text-error-500 hover:bg-error-500/10">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <LogOut className="w-4 h-4" />
              {!isCollapsed && <span className="text-sm">{t('common.signOut')}</span>}
            </div>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
