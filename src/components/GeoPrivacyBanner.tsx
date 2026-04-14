import { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

type PrivacyRegion = 'eu' | 'us-ca' | 'us' | 'br' | 'uk' | 'other';

const STORAGE_KEY = 'hioutz-privacy-consent-v1';

interface ConsentState {
  region: PrivacyRegion;
  accepted: boolean;
  optOutDataSale?: boolean; // CCPA
  timestamp: string;
}

function detectRegion(timezone: string): PrivacyRegion {
  if (timezone.startsWith('Europe/London') || timezone.startsWith('Europe/Belfast')) return 'uk';
  if (timezone.startsWith('Europe/')) return 'eu';
  if (timezone.startsWith('America/Los_Angeles') || timezone.startsWith('America/San_Francisco') ||
      timezone === 'America/Boise' || timezone === 'America/Phoenix') return 'us-ca';
  if (timezone.startsWith('America/') && !timezone.includes('Sao_Paulo') && !timezone.includes('Fortaleza') &&
      !timezone.includes('Recife') && !timezone.includes('Bahia') && !timezone.includes('Manaus') &&
      !timezone.includes('Belem') && !timezone.includes('Cuiaba') && !timezone.includes('Porto_Velho') &&
      !timezone.includes('Boa_Vista') && !timezone.includes('Campo_Grande') && !timezone.includes('Araguaina') &&
      !timezone.includes('Maceio') && !timezone.includes('Argentina') && !timezone.includes('Santiago') &&
      !timezone.includes('Bogota') && !timezone.includes('Lima') && !timezone.includes('Mexico') &&
      !timezone.includes('Caracas')) return 'us';
  if (timezone.startsWith('America/Sao_Paulo') || timezone.startsWith('America/Fortaleza') ||
      timezone.startsWith('America/Recife') || timezone.startsWith('America/Bahia')) return 'br';
  return 'other';
}

export default function GeoPrivacyBanner() {
  const [visible, setVisible] = useState(false);
  const [region, setRegion] = useState<PrivacyRegion>('other');
  const { t } = useTranslation();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ConsentState = JSON.parse(stored);
        if (parsed.accepted) return; // Already consented
      }
    } catch { /* no stored consent */ }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const detected = detectRegion(tz);
    setRegion(detected);
    // Small delay so it doesn't flash on page load
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = (optOut = false) => {
    const consent: ConsentState = {
      region,
      accepted: true,
      optOutDataSale: optOut ? true : undefined,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl mx-auto bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-foreground">
                {region === 'eu' || region === 'uk' ? '🇪🇺 Datenschutz-Hinweis' :
                 region === 'us-ca' ? '🇺🇸 Privacy Notice (CCPA)' :
                 region === 'us' ? '🇺🇸 Privacy Notice' :
                 region === 'br' ? '🇧🇷 Aviso de Privacidade (LGPD)' :
                 '🔒 Privacy Notice'}
              </h3>
              <button onClick={() => handleAccept()} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* EU/UK GDPR */}
            {(region === 'eu' || region === 'uk') && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Wir verwenden keine Tracking-Cookies. Deine Daten werden gemäß der DSGVO verarbeitet. 
                Unsere KI-Empfehlungen basieren auf deinen Präferenzen – du kannst dies jederzeit in den{' '}
                <a href="/datenschutz" className="underline text-primary hover:text-primary/80">Einstellungen</a> anpassen.
              </p>
            )}

            {/* California CCPA */}
            {region === 'us-ca' && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                We do not sell your personal information. Under the California Consumer Privacy Act (CCPA), 
                you have the right to opt out of data sharing and request deletion of your data.{' '}
                <a href="/datenschutz" className="underline text-primary hover:text-primary/80">Privacy Policy</a>
              </p>
            )}

            {/* US general */}
            {region === 'us' && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                We respect your privacy. We don't use tracking cookies or sell your data. 
                Our AI recommendations are based on your preferences – you can adjust this anytime.{' '}
                <a href="/datenschutz" className="underline text-primary hover:text-primary/80">Privacy Policy</a>
              </p>
            )}

            {/* Brazil LGPD */}
            {region === 'br' && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Seus dados são tratados conforme a LGPD. Não usamos cookies de rastreamento. 
                Nossas recomendações de IA são baseadas em suas preferências.{' '}
                <a href="/datenschutz" className="underline text-primary hover:text-primary/80">Política de Privacidade</a>
              </p>
            )}

            {/* Other regions */}
            {region === 'other' && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                We respect your privacy. No tracking cookies are used. Our AI recommendations are based 
                on your preferences – you can adjust this anytime in your settings.{' '}
                <a href="/datenschutz" className="underline text-primary hover:text-primary/80">Privacy Policy</a>
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" onClick={() => handleAccept()} className="text-xs h-8">
                {region === 'eu' || region === 'uk' ? 'Verstanden' :
                 region === 'br' ? 'Entendi' : 'Got it'}
              </Button>

              {region === 'us-ca' && (
                <Button size="sm" variant="outline" onClick={() => handleAccept(true)} className="text-xs h-8">
                  Do Not Sell My Data
                </Button>
              )}

              <a href="/datenschutz" className="text-xs text-muted-foreground hover:text-foreground underline ml-1">
                {region === 'eu' || region === 'uk' ? 'Mehr erfahren' :
                 region === 'br' ? 'Saiba mais' : 'Learn more'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
