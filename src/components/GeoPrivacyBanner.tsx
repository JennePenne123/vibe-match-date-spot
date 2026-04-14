import { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation, Trans } from 'react-i18next';

type PrivacyRegion = 'eu' | 'us-ca' | 'us' | 'br' | 'uk' | 'other';

const STORAGE_KEY = 'hioutz-privacy-consent-v1';

interface ConsentState {
  region: PrivacyRegion;
  accepted: boolean;
  optOutDataSale?: boolean;
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

const regionTitleKey: Record<PrivacyRegion, string> = {
  eu: 'privacyBanner.titleGdpr',
  uk: 'privacyBanner.titleGdpr',
  'us-ca': 'privacyBanner.titleCcpa',
  us: 'privacyBanner.titleUs',
  br: 'privacyBanner.titleLgpd',
  other: 'privacyBanner.titleOther',
};

const regionTextKey: Record<PrivacyRegion, string> = {
  eu: 'privacyBanner.textGdpr',
  uk: 'privacyBanner.textGdpr',
  'us-ca': 'privacyBanner.textCcpa',
  us: 'privacyBanner.textUs',
  br: 'privacyBanner.textLgpd',
  other: 'privacyBanner.textOther',
};

export default function GeoPrivacyBanner() {
  const [visible, setVisible] = useState(false);
  const [region, setRegion] = useState<PrivacyRegion>('other');
  const { t } = useTranslation();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ConsentState = JSON.parse(stored);
        if (parsed.accepted) return;
      }
    } catch { /* no stored consent */ }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const detected = detectRegion(tz);
    setRegion(detected);
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
                {t(regionTitleKey[region])}
              </h3>
              <button onClick={() => handleAccept()} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              <Trans
                i18nKey={regionTextKey[region]}
                components={{
                  link: <a href="/datenschutz" className="underline text-primary hover:text-primary/80" />,
                }}
              />
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" onClick={() => handleAccept()} className="text-xs h-8">
                {t('privacyBanner.accept')}
              </Button>

              {region === 'us-ca' && (
                <Button size="sm" variant="outline" onClick={() => handleAccept(true)} className="text-xs h-8">
                  {t('privacyBanner.doNotSell')}
                </Button>
              )}

              <a href="/datenschutz" className="text-xs text-muted-foreground hover:text-foreground underline ml-1">
                {t('privacyBanner.learnMore')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
