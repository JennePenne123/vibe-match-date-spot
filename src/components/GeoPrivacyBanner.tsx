import { useState, useEffect } from 'react';
import { Shield, Settings2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTranslation, Trans } from 'react-i18next';
import {
  ConsentCategory,
  CONSENT_EVENT,
  DEFAULT_CATEGORIES,
  OPEN_SETTINGS_EVENT,
  getStoredConsent,
  saveConsent,
} from '@/lib/cookieConsent';
import { LEGAL_VERSIONS, formatLegalDate } from '@/config/legalVersions';

type PrivacyRegion = 'eu' | 'us-ca' | 'us' | 'br' | 'uk' | 'other';

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
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [region, setRegion] = useState<PrivacyRegion>('other');
  const [choices, setChoices] = useState<Record<ConsentCategory, boolean>>(DEFAULT_CATEGORIES);

  useEffect(() => {
    const stored = getStoredConsent();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    setRegion(detectRegion(tz));
    if (stored) {
      setChoices(stored.categories);
    } else {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Allow other parts of the app (Settings page, footer link) to re-open the banner.
  useEffect(() => {
    const openHandler = () => {
      const stored = getStoredConsent();
      if (stored) setChoices(stored.categories);
      setSettingsOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, openHandler);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, openHandler);
  }, []);

  const persist = (cats: Record<ConsentCategory, boolean>) => {
    saveConsent(cats, region);
    setChoices(cats);
    setVisible(false);
    setSettingsOpen(false);
  };

  const acceptAll = () =>
    persist({ necessary: true, preferences: true, analytics: true, marketing: true });
  const rejectAll = () =>
    persist({ necessary: true, preferences: false, analytics: false, marketing: false });
  const saveSelection = () => persist(choices);

  const categories: Array<{ key: ConsentCategory; required?: boolean }> = [
    { key: 'necessary', required: true },
    { key: 'preferences' },
    { key: 'analytics' },
    { key: 'marketing' },
  ];

  return (
    <>
      {visible && !settingsOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="max-w-2xl mx-auto bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-2xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 space-y-3">
                <h3 className="font-semibold text-sm text-foreground">
                  {t(regionTitleKey[region])}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <Trans
                    i18nKey={regionTextKey[region]}
                    components={{
                      link: <a href="/datenschutz" className="underline text-primary hover:text-primary/80" />,
                    }}
                  />
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={acceptAll} className="text-xs h-8">
                    {t('privacyBanner.acceptAll', 'Alle akzeptieren')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={rejectAll} className="text-xs h-8">
                    {t('privacyBanner.rejectAll', 'Nur notwendige')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSettingsOpen(true)}
                    className="text-xs h-8 gap-1"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    {t('privacyBanner.settings', 'Einstellungen')}
                  </Button>
                  <a
                    href="/datenschutz"
                    className="text-xs text-muted-foreground hover:text-foreground underline ml-auto"
                  >
                    {t('privacyBanner.learnMore')}
                  </a>
                </div>
                <p className="text-[10px] text-muted-foreground/70 pt-1">
                  {t('privacyBanner.version', 'Consent-Version')} {LEGAL_VERSIONS.cookieConsent.version} · {formatLegalDate(LEGAL_VERSIONS.cookieConsent.date)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {t('privacyBanner.settingsTitle', 'Cookie-Einstellungen')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'privacyBanner.settingsDesc',
                'Wähle, welche Kategorien du zulässt. Du kannst deine Auswahl jederzeit ändern.',
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {categories.map(({ key, required }) => (
              <div
                key={key}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card/50 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {t(`privacyBanner.categories.${key}.title`)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t(`privacyBanner.categories.${key}.desc`)}
                  </p>
                </div>
                {required ? (
                  <div className="flex items-center gap-1 text-[11px] text-primary shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                    {t('privacyBanner.required', 'Erforderlich')}
                  </div>
                ) : (
                  <Switch
                    checked={choices[key]}
                    onCheckedChange={(v) => setChoices((c) => ({ ...c, [key]: v }))}
                  />
                )}
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={rejectAll} className="sm:mr-auto">
              {t('privacyBanner.rejectAll', 'Nur notwendige')}
            </Button>
            <Button variant="outline" onClick={saveSelection}>
              {t('privacyBanner.saveSelection', 'Auswahl speichern')}
            </Button>
            <Button onClick={acceptAll}>
              {t('privacyBanner.acceptAll', 'Alle akzeptieren')}
            </Button>
          </DialogFooter>
          <p className="text-[10px] text-muted-foreground/70 text-center pt-2">
            {t('privacyBanner.version', 'Consent-Version')} {LEGAL_VERSIONS.cookieConsent.version} · {formatLegalDate(LEGAL_VERSIONS.cookieConsent.date)}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
