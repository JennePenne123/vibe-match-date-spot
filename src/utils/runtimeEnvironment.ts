export const isLovablePreviewEnvironment = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const { hostname } = window.location;

  return (
    hostname.endsWith('.lovableproject.com') ||
    (hostname.endsWith('.lovable.app') && hostname.includes('--preview--')) ||
    (hostname.endsWith('.lovable.app') && hostname.startsWith('id-preview--'))
  );
};
