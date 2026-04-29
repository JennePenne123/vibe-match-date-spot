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
      const { data, error } = await supabase
        .from('feature_flags')
        .select('enabled, metadata')
        .eq('flag_key', flagKey)
        .maybeSingle();
      if (error) throw error;
      return data ?? { enabled: false, metadata: {} as Record<string, unknown> };
    },
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