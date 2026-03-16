import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Sparkles, User, MoreHorizontal, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useInvitations } from '@/hooks/useInvitations'
import BurgerMenu from '@/components/BurgerMenu'

export function MobileBottomNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const { invitations } = useInvitations()

  const pendingCount = React.useMemo(() => {
    return invitations.filter(inv => inv.direction === 'received' && inv.status === 'pending').length
  }, [invitations])

  const isActive = (path: string) => location.pathname === path

  // Order: Home • My Invitations • Plan Date • More • Profile
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
      {/* Home */}
      <NavItem icon={Home} label={t('nav.home')} path="/home" active={isActive('/home')} />

      {/* My Invitations */}
      <NavItem icon={Heart} label={t('menu.myInvitations')} path="/invitations" active={isActive('/invitations')} badge={pendingCount} />

      {/* Plan Date (center highlight) */}
      <NavItem icon={Sparkles} label={t('nav.planDate')} path="/plan-date" active={isActive('/plan-date')} highlight />

      {/* More */}
      <div className="relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 px-2">
        <BurgerMenu
          renderTrigger={(open) => (
            <button
              onClick={open}
              className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground transition-all duration-300"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium opacity-70">{t('common.more')}</span>
            </button>
          )}
        />
      </div>

      {/* Profile */}
      <NavItem icon={User} label={t('nav.profile')} path="/profile" active={isActive('/profile')} />
    </nav>
  )
}

interface NavItemProps {
  icon: React.ElementType
  label: string
  path: string
  active: boolean
  badge?: number
  highlight?: boolean
}

function NavItem({ icon: Icon, label, path, active, badge, highlight }: NavItemProps) {
  return (
    <NavLink
      to={path}
      className={cn(
        'relative flex flex-col items-center justify-center gap-0.5',
        'min-w-[56px] py-2 px-2',
        'transition-all duration-300',
        active ? 'text-primary' : 'text-muted-foreground',
        highlight && !active && 'text-primary/70'
      )}
    >
      <div className={cn('relative transition-transform duration-300', active && 'scale-110')}>
        <Icon className="w-5 h-5" />
        {active && (
          <div className="absolute inset-0 blur-md opacity-40">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        {badge != null && badge > 0 && (
          <Badge
            variant="default"
            className="absolute -top-2 -right-3 h-4 min-w-[16px] px-1 flex items-center justify-center text-[9px] font-bold"
          >
            {badge > 9 ? '9+' : badge}
          </Badge>
        )}
      </div>
      <span className={cn(
        'text-[10px] font-medium transition-opacity duration-300',
        active ? 'opacity-100' : 'opacity-70'
      )}>
        {label}
      </span>
      {active && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-primary to-primary/60 shadow-lg shadow-primary/40" />
      )}
    </NavLink>
  )
}

export default MobileBottomNav
