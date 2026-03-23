/**
 * Route Preloading Utility
 * Prefetches lazy-loaded route chunks so navigation feels instant.
 */

const routeImports: Record<string, () => Promise<unknown>> = {
  '/home': () => import('@/pages/Home'),
  '/preferences': () => import('@/pages/Preferences'),
  '/chats': () => import('@/pages/Chats'),
  '/profile': () => import('@/pages/Profile'),
  '/settings': () => import('@/pages/Settings'),
  '/results': () => import('@/pages/Results'),
  '/invitations': () => import('@/pages/Invitations'),
  '/rewards': () => import('@/pages/Rewards'),
  '/ai-recommendations': () => import('@/pages/AIRecommendations'),
  '/plan-date': () => import('@/pages/SmartDatePlanning'),
};

// Core routes to prefetch after login
const POST_LOGIN_ROUTES = ['/home', '/preferences', '/chats', '/profile'];

const preloaded = new Set<string>();

/**
 * Preload a single route chunk. No-op if already loaded.
 */
export function preloadRoute(path: string): void {
  const normalizedPath = '/' + path.replace(/^\/+/, '').split('?')[0].split('#')[0];
  if (preloaded.has(normalizedPath)) return;

  const loader = routeImports[normalizedPath];
  if (loader) {
    preloaded.add(normalizedPath);
    loader().catch(() => {
      preloaded.delete(normalizedPath); // allow retry on failure
    });
  }
}

/**
 * Preload all core routes (call after successful login).
 */
export function preloadCoreRoutes(): void {
  // Small delay to avoid competing with initial render
  typeof requestIdleCallback === 'function'
    ? requestIdleCallback(() => POST_LOGIN_ROUTES.forEach(preloadRoute))
    : setTimeout(() => POST_LOGIN_ROUTES.forEach(preloadRoute), 1500);
}

/**
 * Preload on hover/focus — attach to links for instant navigation.
 * Usage: <Link {...preloadOnHover('/profile')} to="/profile">
 */
export function preloadOnHover(path: string) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    onMouseEnter: () => {
      timer = setTimeout(() => preloadRoute(path), 80);
    },
    onMouseLeave: () => {
      if (timer) clearTimeout(timer);
    },
    onFocus: () => preloadRoute(path),
  };
}
