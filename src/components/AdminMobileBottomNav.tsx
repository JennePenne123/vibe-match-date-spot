import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { BarChart3, Users, Shield, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ADMIN_TABS = [
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Users, label: 'Nutzer', path: '/admin/users' },
  { icon: Shield, label: 'Tickets', path: '/admin/moderation' },
  { icon: AlertTriangle, label: 'Errors', path: '/admin/errors' },
]

export function AdminMobileBottomNav() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'flex items-center justify-around',
        'bg-card/90 backdrop-blur-xl border-t border-border/40',
        'pb-[env(safe-area-inset-bottom)] pt-1'
      )}
      role="navigation"
      aria-label="Admin navigation"
    >
      {ADMIN_TABS.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={cn(
            'relative flex flex-col items-center justify-center gap-0.5',
            'min-w-[56px] py-2 px-2',
            'transition-all duration-300',
            isActive(tab.path) ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <div className={cn('relative transition-transform duration-300', isActive(tab.path) && 'scale-110')}>
            <tab.icon className="w-5 h-5" />
            {isActive(tab.path) && (
              <div className="absolute inset-0 blur-md opacity-40">
                <tab.icon className="w-5 h-5 text-primary" />
              </div>
            )}
          </div>
          <span className={cn(
            'text-[10px] font-medium transition-opacity duration-300',
            isActive(tab.path) ? 'opacity-100' : 'opacity-70'
          )}>
            {tab.label}
          </span>
          {isActive(tab.path) && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-primary to-primary/60 shadow-lg shadow-primary/40" />
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default AdminMobileBottomNav
