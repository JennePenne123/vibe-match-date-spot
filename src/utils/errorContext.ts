/**
 * Builds the diagnostic context attached to every captured exception:
 * route, user status, device info and app version.
 */

export interface ErrorContext {
  route: string;
  route_hash?: string;
  referrer?: string;
  user_status: 'anonymous' | 'authenticated' | 'unknown';
  user_id?: string;
  device: {
    user_agent: string;
    platform?: string;
    language: string;
    viewport: string;
    screen: string;
    dpr: number;
    touch: boolean;
    online: boolean;
    standalone: boolean;
    memory_gb?: number;
    connection?: string;
  };
  app: {
    version: string;
    build_time: string;
    environment: string;
    runtime: 'web' | 'pwa' | 'native';
  };
  timestamp: string;
}

declare const __APP_VERSION__: string | undefined;
declare const __APP_BUILD_TIME__: string | undefined;

export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown';
export const APP_BUILD_TIME =
  typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : 'unknown';

function isStandalone(): boolean {
  try {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches === true ||
      (window.navigator as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

function runtime(): 'web' | 'pwa' | 'native' {
  const isNative =
    typeof (window as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor?.isNativePlatform === 'function' &&
    (window as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor!.isNativePlatform!();
  if (isNative) return 'native';
  return isStandalone() ? 'pwa' : 'web';
}

export function buildErrorContext(
  user?: { id?: string } | null,
  userKnown = true,
): ErrorContext {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string };
  };

  return {
    route: window.location.pathname + window.location.search,
    route_hash: window.location.hash || undefined,
    referrer: document.referrer || undefined,
    user_status: !userKnown ? 'unknown' : user?.id ? 'authenticated' : 'anonymous',
    user_id: user?.id,
    device: {
      user_agent: navigator.userAgent,
      platform: (nav as Navigator & { userAgentData?: { platform?: string } })
        .userAgentData?.platform ?? navigator.platform,
      language: navigator.language,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}`,
      dpr: window.devicePixelRatio ?? 1,
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      online: navigator.onLine,
      standalone: isStandalone(),
      memory_gb: nav.deviceMemory,
      connection: nav.connection?.effectiveType,
    },
    app: {
      version: APP_VERSION,
      build_time: APP_BUILD_TIME,
      environment: import.meta.env.DEV ? 'development' : 'production',
      runtime: runtime(),
    },
    timestamp: new Date().toISOString(),
  };
}