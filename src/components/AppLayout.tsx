import React, { lazy, Suspense, useRef, useEffect, useState } from 'react'
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
import { Menu } from 'lucide-react'
import hioutzLogo from '@/assets/hioutz-logo.png'
import { ThemeToggle } from '@/components/ThemeToggle'
const AIConcierge = lazy(() => import('@/components/AIConcierge'))

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

  const isHomePage = location.pathname === '/' || location.pathname === '/index' || location.pathname === '/home'

  const concierge = isHomePage ? (
    <Suspense fallback={null}>
      <AIConcierge />
    </Suspense>
  ) : null


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
      <div className={cn("min-h-screen w-full bg-background", isAdminRoute ? "overflow-x-hidden pb-20" : "pb-20")}>
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
              <img src={hioutzLogo} alt="H!Outz" className="h-7 w-auto cursor-pointer" onClick={() => navigate('/home')} />
              <span className="font-semibold text-sm text-foreground">Partner Portal</span>
            </div>
            <ThemeToggle />
          </header>
        )}

        <main
          id="main-content"
          style={getContentStyle()}
          className={cn("will-change-transform", isAdminRoute && "overflow-x-hidden")}
        >
          {children}
        </main>

        {isPartnerRoute ? (
          <PartnerMobileBottomNav />
        ) : isAdminRoute ? (
          <AdminMobileBottomNav />
        ) : (
          <>
            <MobileBottomNav />
            {concierge}
          </>
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
              <img src={hioutzLogo} alt="H!Outz" className="h-9 w-auto cursor-pointer" onClick={() => navigate('/home')} />
            </div>
            <ThemeToggle />
          </header>

          {/* Main content area */}
          <main id="main-content" className="flex-1 overflow-auto">
            <div className={cn(
              "h-full",
              isDesktop ? "p-6" : "p-4"
            )}>
              {children}
            </div>
          </main>
        </div>
        {!isPartnerRoute && !isAdminRoute && concierge}
      </div>
    </SidebarProvider>
  )
}
