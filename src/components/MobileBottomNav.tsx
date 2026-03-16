import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Sparkles, User, MoreHorizontal, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useInvitations } from '@/hooks/useInvitations'
import { useChatConversations } from '@/hooks/useChatConversations'
import BurgerMenu from '@/components/BurgerMenu'

export function MobileBottomNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const { invitations } = useInvitations()
  const { totalUnread } = useChatConversations()

  const pendingCount = React.useMemo(() => {
    return invitations.filter(inv => inv.direction === 'received' && inv.status === 'pending').length
  }, [invitations])

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { label: t('nav.home'), icon: Home, path: '/home' },
    { label: t('menu.myInvitations'), icon: MessageCircle, path: '/invitations', badge: totalUnread },
    { label: t('nav.planDate'), icon: Sparkles, path: '/plan-date', highlight: true },
    { label: t('nav.profile'), icon: User, path: '/profile' },
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
      aria-label="Main navigation"
    >
      {navItems.map((item) => {
        const active = isActive(item.path)
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5',
              'min-w-[56px] py-2 px-2',
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
              {item.badge && item.badge > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-2 -right-3 h-4 min-w-[16px] px-1 flex items-center justify-center text-[9px] font-bold"
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </Badge>
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

      {/* More button triggers the existing BurgerMenu drawer */}
      <div className="relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 px-2">
        <BurgerMenuTrigger pendingCount={pendingCount} />
      </div>
    </nav>
  )
}

function BurgerMenuTrigger({ pendingCount }: { pendingCount: number }) {
  const { t } = useTranslation()

  return (
    <div className="relative">
      <BurgerMenu
        renderTrigger={(open) => (
          <button
            onClick={open}
            className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground transition-all duration-300"
          >
            <div className="relative">
              <MoreHorizontal className="w-5 h-5" />
              {pendingCount > 0 && (
                <Badge
                  variant="accent"
                  size="sm"
                  className="absolute -top-2 -right-3 h-4 min-w-[16px] px-1 flex items-center justify-center text-[9px] font-bold"
                >
                  {pendingCount > 9 ? '9+' : pendingCount}
                </Badge>
              )}
            </div>
            <span className="text-[10px] font-medium opacity-70">{t('common.more')}</span>
          </button>
        )}
      />
    </div>
  )
}

export default MobileBottomNav
