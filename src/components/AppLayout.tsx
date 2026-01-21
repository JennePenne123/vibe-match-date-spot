import React from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { useBreakpoint } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Menu, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isMobile, isDesktop } = useBreakpoint()

  if (isMobile) {
    // Mobile layout - no sidebar, just content
    return (
      <div className="min-h-screen w-full bg-background">
        {children}
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={isDesktop}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
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
