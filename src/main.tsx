import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './i18n'
import './index.css'
import { initErrorMonitoring } from './services/errorMonitoringService'
import { initSentry } from './services/sentryService'

// Initialize Sentry first, then error monitoring
initSentry();
initErrorMonitoring();

createRoot(document.getElementById("root")!).render(<App />);
