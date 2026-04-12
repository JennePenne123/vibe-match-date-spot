import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Store, Ticket, Trophy, FileText, Map, User, QrCode, ScanLine, LogOut, ArrowLeft, Users } from 'lucide-react'
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

export function PartnerSidebar() {
  const { t } = useTranslation()
  const { state } = useSidebar()
  const location = useLocation()
  const { user, logout } = useAuth()
  const currentPath = location.pathname
  const isCollapsed = state === 'collapsed'

  const displayName = getUserName(user)
  const userAvatar = getUserAvatar(user)

  const mainNavItems = [
    { title: t('partnerNav.dashboard', 'Dashboard'), url: '/partner', icon: LayoutDashboard },
    { title: t('partnerNav.venues', 'Meine Venues'), url: '/partner/venues', icon: Store },
    { title: t('partnerNav.vouchers', 'Gutscheine'), url: '/partner/vouchers', icon: Ticket },
  ]

  const analyticsNavItems = [
    { title: t('partnerNav.cityRankings', 'City Rankings'), url: '/partner/city-rankings', icon: Trophy },
    { title: t('partnerNav.reports', 'Berichte'), url: '/partner/reports', icon: FileText },
    { title: t('partnerNav.networkMap', 'Netzwerk'), url: '/partner/network', icon: Map },
  ]

  const settingsNavItems = [
    { title: t('partnerNav.profile', 'Firmenprofil'), url: '/partner/profile', icon: User },
    { title: t('partnerNav.staff', 'Mitarbeiter'), url: '/partner/staff', icon: Users },
    { title: t('partnerNav.qrCode', 'Mein QR-Code'), url: '/partner/qr-code', icon: QrCode },
    { title: t('partnerNav.scanner', 'QR-Scanner'), url: '/partner/qr-scanner', icon: ScanLine },
  ]

  const isActive = (path: string) => {
    if (path === '/partner') return currentPath === '/partner'
    return currentPath.startsWith(path)
  }

  const getNavClasses = (active: boolean) =>
    active
      ? 'bg-primary/20 text-primary font-medium border-r-2 border-primary shadow-glow-primary/20'
      : 'hover:bg-white/10 text-sidebar-foreground'

  const renderNavItems = (items: typeof mainNavItems) =>
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
        {/* Partner profile header */}
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border-2 border-primary/30 ring-2 ring-primary/10">
              <AvatarImage src={userAvatar} alt={displayName} referrerPolicy="no-referrer" />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm truncate">{displayName}</h3>
                <p className="text-xs text-primary/70 truncate">
                  {t('partnerNav.partnerPortal', 'Partner Portal')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('partnerNav.mainLabel', 'Übersicht')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(mainNavItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-4 bg-border/40" />

        {/* Analytics navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('partnerNav.analyticsLabel', 'Analyse')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(analyticsNavItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-4 bg-border/40" />

        {/* Settings navigation */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('partnerNav.settingsLabel', 'Einstellungen')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(settingsNavItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="p-4 border-t border-border/40 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-white/10"
          >
            <NavLink to="/home">
              <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                <ArrowLeft className="w-4 h-4" />
                {!isCollapsed && <span className="text-sm">{t('partnerNav.backToApp', 'Zurück zur App')}</span>}
              </div>
            </NavLink>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
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
