import { type ReactNode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './i18n'
import './index.css' // boot

const normalizeInitialPath = () => {
  if (typeof window === 'undefined') {
    return
  }

  const { pathname, search, hash } = window.location

  if (pathname === '/index' || pathname === '/index.html') {
    window.history.replaceState(window.history.state, '', `/${search}${hash}`)
  }
}

function AppBootSignal({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.getElementById('app-loading')?.remove()
  }, [])

  return <>{children}</>
}

normalizeInitialPath()

// Polyfill requestIdleCallback for Safari
const ric = typeof requestIdleCallback === 'function'
  ? requestIdleCallback
  : (cb: () => void, _opts?: any) => setTimeout(cb, 1)

// Defer heavy monitoring init so React can mount first
ric(
  () => {
    import('./services/sentryService').then(m => m.initSentry())
    import('./services/errorMonitoringService').then(m => m.initErrorMonitoring())
  },
  { timeout: 3000 }
)

createRoot(document.getElementById('root')!).render(
  <AppBootSignal>
    <App />
  </AppBootSignal>
)
