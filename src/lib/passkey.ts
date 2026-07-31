import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import { supabase } from '@/integrations/supabase/client';

export const passkeysSupported = () => browserSupportsWebAuthn();

async function callPasskey<T>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('passkey', { body: payload });
  if (error) {
    // Try to surface a structured error from the function response
    const message = (data as { error?: string } | null)?.error ?? error.message;
    throw new Error(message);
  }
  if ((data as { error?: string })?.error) {
    throw new Error((data as { error: string }).error);
  }
  return data as T;
}

function defaultDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iPhone / iPad';
  if (/Android/.test(ua)) return 'Android-Gerät';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows-PC';
  return 'Dieses Gerät';
}

/** Registers a new passkey for the currently signed-in user. */
export async function registerPasskey(deviceName?: string): Promise<void> {
  const { options } = await callPasskey<{ options: Parameters<typeof startRegistration>[0]['optionsJSON'] }>({
    action: 'register-options',
  });

  const attestation = await startRegistration({ optionsJSON: options });

  await callPasskey({
    action: 'register-verify',
    response: attestation,
    deviceName: deviceName?.trim() || defaultDeviceName(),
  });
}

/** Signs the user in with an existing passkey. */
export async function signInWithPasskey(): Promise<void> {
  const { options } = await callPasskey<{ options: Parameters<typeof startAuthentication>[0]['optionsJSON'] }>({
    action: 'auth-options',
  });

  const assertion = await startAuthentication({ optionsJSON: options });

  const result = await callPasskey<{ email: string; token_hash: string }>({
    action: 'auth-verify',
    response: assertion,
  });

  const { error } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash: result.token_hash,
  });
  if (error) throw error;
}
