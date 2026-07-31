import { supabase } from '@/integrations/supabase/client';

async function callRecovery<T>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('recovery-codes', { body: payload });
  if (error) {
    const message = (data as { error?: string } | null)?.error ?? error.message;
    throw new Error(message);
  }
  if ((data as { error?: string })?.error) {
    throw new Error((data as { error: string }).error);
  }
  return data as T;
}

/** Generates a fresh set of backup codes, invalidating any previous ones. */
export async function generateRecoveryCodes(): Promise<string[]> {
  const result = await callRecovery<{ codes: string[] }>({ action: 'generate' });
  return result.codes;
}

/** Signs the user in with a backup code and returns the number of remaining codes. */
export async function signInWithRecoveryCode(email: string, code: string): Promise<number> {
  const result = await callRecovery<{ token_hash: string; remaining: number }>({
    action: 'redeem',
    email,
    code,
  });

  const { error } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash: result.token_hash,
  });
  if (error) throw error;

  return result.remaining;
}

/** Returns how many unused backup codes the signed-in user has left. */
export async function getRecoveryCodeStatus(): Promise<{ total: number; unused: number }> {
  const { data } = await supabase.from('user_recovery_codes').select('id, used_at');
  const rows = data ?? [];
  return {
    total: rows.length,
    unused: rows.filter((r) => !r.used_at).length,
  };
}