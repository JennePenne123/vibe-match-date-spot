import React, { useRef, useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { PartnerSidebar } from './PartnerSidebar'
import { AdminSidebar } from './AdminSidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { useBreakpoint } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Menu, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

// Tab order for directional slide
const NAV_ORDER = ['/home', '/preferences', '/chats', '/profile']

// Routes where swipe navigation should be disabled (complex touch interactions)
const SWIPE_DISABLED_ROUTES = ['/preferences', '/plan-date']

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

  // Swipe state
  const touchStartX = useRef(0)
  const touchCurrentX = useRef(0)
  const [dragOffset, setDragOffset] = useState(0)
  const isDragging = useRef(false)
  const contentRef = useRef<HTMLDivElement>(null)

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

  const isSwipeDisabled = SWIPE_DISABLED_ROUTES.some(r => location.pathname.startsWith(r))

  // Swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isSwipeDisabled) return
    touchStartX.current = e.touches[0].clientX
    touchCurrentX.current = e.touches[0].clientX
    isDragging.current = true
  }, [isSwipeDisabled])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || isSwipeDisabled) return
    touchCurrentX.current = e.touches[0].clientX
    const diff = touchCurrentX.current - touchStartX.current
    const currentIdx = getNavIndex(location.pathname)

    // Dampen at edges
    if (currentIdx <= 0 && diff > 0) {
      setDragOffset(diff * 0.15)
    } else if (currentIdx >= NAV_ORDER.length - 1 && diff < 0) {
      setDragOffset(diff * 0.15)
    } else {
      setDragOffset(diff * 0.4)
    }
  }, [location.pathname, isSwipeDisabled])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || isSwipeDisabled) return
    isDragging.current = false

    const diff = touchCurrentX.current - touchStartX.current
    const currentIdx = getNavIndex(location.pathname)
    const THRESHOLD = 80

    if (Math.abs(diff) > THRESHOLD && currentIdx >= 0) {
      if (diff < -THRESHOLD && currentIdx < NAV_ORDER.length - 1) {
        navigate(NAV_ORDER[currentIdx + 1])
      } else if (diff > THRESHOLD && currentIdx > 0) {
        navigate(NAV_ORDER[currentIdx - 1])
      }
    }

    setDragOffset(0)
  }, [location.pathname, navigate, isSwipeDisabled])

  // Slide animation style
  const getContentStyle = (): React.CSSProperties => {
    if (dragOffset !== 0) {
      return {
        transform: `translateX(${dragOffset}px)`,
        transition: 'none',
      }
    }
    if (isAnimating && slideDirection) {
      return {
        animation: `nav-slide-${slideDirection} 280ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
      }
    }
    return {}
  }

  if (isMobile) {
    return (
      <div className="min-h-screen w-full bg-background pb-16">
        <style>{`
          @keyframes nav-slide-left {
            0% { transform: translateX(30%); opacity: 0.4; }
            100% { transform: translateX(0); opacity: 1; }
          }
          @keyframes nav-slide-right {
            0% { transform: translateX(-30%); opacity: 0.4; }
            100% { transform: translateX(0); opacity: 1; }
          }
        `}</style>
        <div
          ref={contentRef}
          style={getContentStyle()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="will-change-transform"
        >
          {children}
        </div>
        {!isPartnerRoute && !isAdminRoute && <MobileBottomNav />}
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
