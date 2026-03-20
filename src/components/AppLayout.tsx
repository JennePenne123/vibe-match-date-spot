import React, { useRef, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { PartnerSidebar } from './PartnerSidebar'
import { AdminSidebar } from './AdminSidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { AdminMobileBottomNav } from './AdminMobileBottomNav'
import { PartnerMobileBottomNav } from './PartnerMobileBottomNav'
import { useBreakpoint } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Menu, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

// Tab order for directional slide
const NAV_ORDER = ['/home', '/preferences', '/chats', '/profile']


function getNavIndex(path: string) {
  const idx = NAV_ORDER.indexOf(path)
  return idx >= 0 ? idx : -1
}

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isMobile, isDesktop } = useBreakpoint()
  const location = useLocation()
  const navigate = useNavigate()
  const isPartnerRoute = location.pathname.startsWith('/partner')
  const isAdminRoute = location.pathname.startsWith('/admin')

  // Track previous path for slide direction
  const prevPath = useRef(location.pathname)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)


  // Determine slide direction on route change
  useEffect(() => {
    if (prevPath.current === location.pathname) return

    const prevIdx = getNavIndex(prevPath.current)
    const currIdx = getNavIndex(location.pathname)

    if (prevIdx >= 0 && currIdx >= 0) {
      setSlideDirection(currIdx > prevIdx ? 'left' : 'right')
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setSlideDirection(null)
      }, 280)
      prevPath.current = location.pathname
      return () => clearTimeout(timer)
    }

    prevPath.current = location.pathname
  }, [location.pathname])

  // Slide animation style (only for route change transitions, no drag)
  const getContentStyle = (): React.CSSProperties => {
    if (isAnimating && slideDirection) {
      return {
        animation: `nav-slide-${slideDirection} 280ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
      }
    }
    return {}
  }

  if (isMobile) {
    return (
      <div className={cn("min-h-screen w-full bg-background", isAdminRoute ? "overflow-x-hidden pb-16" : "pb-16")}>
        <style>{`
          @keyframes nav-slide-left {
            0% { transform: translateX(18%); opacity: 0.6; }
            100% { transform: translateX(0); opacity: 1; }
          }
          @keyframes nav-slide-right {
            0% { transform: translateX(-18%); opacity: 0.6; }
            100% { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* Partner mobile header */}
        {isPartnerRoute && (
          <header className="sticky top-0 z-40 flex items-center justify-between h-12 px-4 border-b border-border/40 bg-card/90 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-sm text-foreground">Partner Portal</span>
            </div>
            <ThemeToggle />
          </header>
        )}

        <div
          style={getContentStyle()}
          className={cn("will-change-transform", isAdminRoute && "overflow-x-hidden")}
        >
          {children}
        </div>

        {isPartnerRoute ? (
          <PartnerMobileBottomNav />
        ) : isAdminRoute ? (
          <AdminMobileBottomNav />
        ) : (
          <MobileBottomNav />
        )}
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={isDesktop}>
      <div className="min-h-screen flex w-full bg-background">
        {isAdminRoute ? <AdminSidebar /> : isPartnerRoute ? <PartnerSidebar /> : <AppSidebar />}
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with sidebar trigger */}
          <header className="h-14 flex items-center justify-between border-b border-border/40 bg-card/80 backdrop-blur-lg px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg p-2 transition-colors">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-primary/30">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h1 className="font-semibold text-foreground text-lg">VybePulse</h1>
              </div>
            </div>
            <ThemeToggle />
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-auto">
            <div className={cn(
              "h-full",
              isDesktop ? "p-6" : "p-4"
            )}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
