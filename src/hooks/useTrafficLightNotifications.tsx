import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useNavigate } from 'react-router-dom';
import { getServiceWorkerRegistration } from '@/pwa/registerServiceWorker';
import type { TrafficLightPhase } from '@/components/date-planning/preferences/TrafficLightWaitingRoom';

/**
 * Feuert eine Push-/System-Benachrichtigung, sobald die Ampel im Warteraum
 * von rot -> orange bzw. orange -> grün wechselt.
 * Fallback: In-App-Toast, wenn keine Berechtigung / kein Service Worker.
 */
export function useTrafficLightNotifications(
  phase: TrafficLightPhase,
  options?: { enabled?: boolean; scopeKey?: string; resultsUrl?: string },
) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const prevPhase = useRef<TrafficLightPhase | null>(null);
  const enabled = options?.enabled !== false;
  const scopeKey = options?.scopeKey ?? 'default';
  const resultsUrl = options?.resultsUrl ?? '/results';

  // Bei Session-Wechsel Verlauf zurücksetzen
  useEffect(() => {
    prevPhase.current = null;
  }, [scopeKey]);

  useEffect(() => {
    if (!enabled) return;

    const prev = prevPhase.current;
    prevPhase.current = phase;
    if (!prev || prev === phase) return;

    const isRedToOrange = prev === 'red' && phase === 'orange';
    const isOrangeToGreen = prev === 'orange' && phase === 'green';
    const isRedToGreen = prev === 'red' && phase === 'green';
    if (!isRedToOrange && !isOrangeToGreen && !isRedToGreen) return;

    const goingGreen = phase === 'green';
    const title = goingGreen
      ? t('datePlanning.waitingRoom.notifyGreenTitle', '🟢 Alle sind bereit!')
      : t('datePlanning.waitingRoom.notifyOrangeTitle', '🟠 Fast vollständig');
    const body = goingGreen
      ? t('datePlanning.waitingRoom.notifyGreenBody', 'Eure gemeinsame Venue-Suche startet jetzt.')
      : t('datePlanning.waitingRoom.notifyOrangeBody', 'Nur noch eine Person fehlt – gleich geht es los.');

    const notify = async () => {
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const registration = await getServiceWorkerRegistration();
          if (registration) {
            await registration.showNotification(title, {
              body,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: `hioutz-trafficlight-${scopeKey}`,
              renotify: true,
              // Bei Grün direkt zur Ergebnisliste springen
              data: {
                url: goingGreen ? resultsUrl : window.location.pathname + window.location.search,
                type: goingGreen ? 'traffic_light_green' : 'traffic_light_orange',
              },
              actions: goingGreen
                ? [
                    {
                      action: 'view-results',
                      title: t('datePlanning.waitingRoom.notifyGreenAction', 'Ergebnisse ansehen'),
                    },
                  ]
                : [],
            } as NotificationOptions);
            return;
          }
          const n = new Notification(title, { body, icon: '/icon-192.png' });
          if (goingGreen) {
            n.onclick = () => {
              window.focus();
              navigate(resultsUrl);
              n.close();
            };
          }
          return;
        }
      } catch (error) {
        console.warn('Traffic light notification failed:', error);
      }
      toast({
        title,
        description: body,
        action: goingGreen
          ? (
              <ToastAction
                altText={t('datePlanning.waitingRoom.notifyGreenAction', 'Ergebnisse ansehen')}
                onClick={() => navigate(resultsUrl)}
              >
                {t('datePlanning.waitingRoom.notifyGreenAction', 'Ergebnisse ansehen')}
              </ToastAction>
            )
          : undefined,
      });
    };

    void notify();
  }, [phase, enabled, scopeKey, resultsUrl, navigate, t, toast]);
}
