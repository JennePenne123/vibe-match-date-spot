import React from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { useBreakpoint } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
          <header className="h-12 flex items-center border-b border-border bg-card px-4">
            <SidebarTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="w-4 h-4" />
              </Button>
            </SidebarTrigger>
            <h1 className="font-semibold text-foreground">VybePulse</h1>
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