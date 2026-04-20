import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, BarChart3, Shield, Users, Flag, Activity, LogOut, ArrowLeft, Bug, UserCog, Sparkles, DollarSign } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { getUserName, getUserAvatar } from '@/utils/typeHelpers'
import { getInitials } from '@/lib/utils'

export function AdminSidebar() {
  const { t } = useTranslation()
  const { state } = useSidebar()
  const location = useLocation()
  const { user, logout } = useAuth()
  const currentPath = location.pathname
  const isCollapsed = state === 'collapsed'

  const displayName = getUserName(user)
  const userAvatar = getUserAvatar(user)

  const overviewItems = [
    { title: t('adminNav.dashboard', 'Dashboard'), url: '/admin', icon: LayoutDashboard },
    { title: t('adminNav.analytics', 'Analytics'), url: '/admin/analytics', icon: BarChart3 },
    { title: t('adminNav.users', 'Nutzer'), url: '/admin/users', icon: Users },
    { title: t('adminNav.team', 'Team'), url: '/admin/team', icon: UserCog },
  ]

  const moderationItems = [
    { title: t('adminNav.moderation', 'Moderation'), url: '/admin/moderation', icon: Shield },
    { title: t('adminNav.errorMonitoring', 'Error Monitoring'), url: '/admin/errors', icon: Bug },
    { title: t('adminNav.reports', 'Reports'), url: '/admin/reports', icon: Flag },
    { title: t('adminNav.systemHealth', 'System Health'), url: '/admin/health', icon: Activity },
    { title: t('adminNav.apiCosts', 'API Costs'), url: '/admin/costs', icon: DollarSign },
    { title: t('adminNav.venueDiscovery', 'Venue Discovery'), url: '/admin/venue-discovery', icon: Sparkles },
  ]

  const isActive = (path: string) => {
    if (path === '/admin') return currentPath === '/admin'
    return currentPath.startsWith(path)
  }

  const getNavClasses = (active: boolean) =>
    active
      ? 'bg-primary/20 text-primary font-medium border-r-2 border-primary shadow-glow-primary/20'
      : 'hover:bg-white/10 text-sidebar-foreground'

  const renderNavItems = (items: typeof overviewItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${getNavClasses(isActive(item.url))}`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ))

  return (
    <Sidebar className="border-r border-border/40 bg-sidebar/80 backdrop-blur-lg">
      <SidebarContent className="flex flex-col h-full">
        {/* Admin header */}
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border-2 border-destructive/30 ring-2 ring-destructive/10">
              <AvatarImage src={userAvatar} alt={displayName} referrerPolicy="no-referrer" />
              <AvatarFallback className="bg-destructive/20 text-destructive text-xs font-medium">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm truncate">{displayName}</h3>
                <p className="text-xs text-destructive/70 truncate">
                  {t('adminNav.adminPortal', 'Admin Portal')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('adminNav.overviewLabel', 'Übersicht')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(overviewItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-4 bg-border/40" />

        {/* Moderation */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('adminNav.moderationLabel', 'Moderation & System')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(moderationItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="p-4 border-t border-border/40 space-y-2">
          <Button variant="ghost" size="sm" asChild
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-white/10">
            <NavLink to="/home">
              <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                <ArrowLeft className="w-4 h-4" />
                {!isCollapsed && <span className="text-sm">{t('adminNav.backToApp', 'Zurück zur App')}</span>}
              </div>
            </NavLink>
          </Button>
          <Button variant="ghost" size="sm" onClick={logout}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
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
