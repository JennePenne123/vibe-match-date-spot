import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './i18n'
import './index.css'

// Defer heavy monitoring init so React can mount first
requestIdleCallback(
  () => {
    import('./services/sentryService').then(m => m.initSentry());
    import('./services/errorMonitoringService').then(m => m.initErrorMonitoring());
  },
  { timeout: 3000 }
);

createRoot(document.getElementById("root")!).render(<App />);
