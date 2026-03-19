import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Store, Ticket, BarChart3, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PartnerMobileBottomNav() {
  const { t } = useTranslation()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/partner') return location.pathname === '/partner'
    return location.pathname.startsWith(path)
  }

  const items = [
    { icon: LayoutDashboard, label: t('partnerNav.dashboard', 'Dashboard'), path: '/partner' },
    { icon: Store, label: t('partnerNav.venues', 'Venues'), path: '/partner/venues' },
    { icon: Ticket, label: t('partnerNav.vouchers', 'Gutscheine'), path: '/partner/vouchers' },
    { icon: BarChart3, label: t('partnerNav.reports', 'Berichte'), path: '/partner/reports' },
    { icon: User, label: t('partnerNav.profile', 'Profil'), path: '/partner/profile' },
  ]

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'flex items-center justify-around',
        'bg-card/90 backdrop-blur-xl border-t border-border/40',
        'pb-[env(safe-area-inset-bottom)] pt-1'
      )}
      role="navigation"
      aria-label="Partner navigation"
    >
      {items.map((item) => {
        const active = isActive(item.path)
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5',
              'min-w-[56px] py-2 px-1',
              'transition-all duration-300',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <div className={cn('relative transition-transform duration-300', active && 'scale-110')}>
              <item.icon className="w-5 h-5" />
              {active && (
                <div className="absolute inset-0 blur-md opacity-40">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
              )}
            </div>
            <span className={cn(
              'text-[10px] font-medium transition-opacity duration-300',
              active ? 'opacity-100' : 'opacity-70'
            )}>
              {item.label}
            </span>
            {active && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-primary to-primary/60 shadow-lg shadow-primary/40" />
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

export default PartnerMobileBottomNav
