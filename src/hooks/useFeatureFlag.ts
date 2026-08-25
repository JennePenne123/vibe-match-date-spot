import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Reads a feature flag from public.feature_flags.
 * Supports a "preview" bypass via URL param `?preview=<token>` matching metadata.preview_token.
 */
export function useFeatureFlag(flagKey: string) {
  const query = useQuery({
    queryKey: ['feature-flag', flagKey],
    queryFn: async () => {
      // Anonymous visitors have no privileges on feature_flags (RLS is
      // authenticated-only) – treat that as "flag disabled" instead of an error.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { enabled: false, metadata: {} as Record<string, unknown> };

      const { data, error } = await supabase
        .from('feature_flags')
        .select('enabled, metadata')
        .eq('flag_key', flagKey)
        .maybeSingle();
      if (error) return { enabled: false, metadata: {} as Record<string, unknown> };
      return data ?? { enabled: false, metadata: {} as Record<string, unknown> };
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5min
    gcTime: 30 * 60 * 1000,
  });

  // Preview bypass: ?preview=<token>
  let previewBypass = false;
  if (typeof window !== 'undefined') {
    const previewToken = new URLSearchParams(window.location.search).get('preview');
    const expected = (query.data?.metadata as Record<string, unknown> | undefined)?.preview_token;
    if (previewToken && expected && previewToken === expected) {
      previewBypass = true;
    }
  }

  return {
    enabled: Boolean(query.data?.enabled) || previewBypass,
    metadata: (query.data?.metadata ?? {}) as Record<string, unknown>,
    isLoading: query.isLoading,
    isPreviewBypass: previewBypass,
  };
}