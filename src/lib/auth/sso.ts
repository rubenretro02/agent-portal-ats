import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * SSO scaffold — reserved for the upcoming admin single sign-on.
 *
 * Admins/recruiters will authenticate through an external IdP
 * (SAML/OIDC via Supabase SSO). The login UI already renders a hook for
 * this path; flip `SSO_ENABLED` to `true` and register the identity
 * provider in Supabase to turn it on. Until then the password form is
 * the only active method, so nothing here is wired into the live flow.
 */
export const SSO_ENABLED = false;

export interface SsoResult {
  url?: string | null;
  error: Error | null;
}

/**
 * Kicks off an SSO redirect for the given email domain. No-op until an
 * identity provider is configured — returns a descriptive error so the
 * caller can fall back to the password form.
 */
export async function signInWithSSO(domain: string): Promise<SsoResult> {
  if (!SSO_ENABLED) {
    return { error: new Error('SSO is not enabled yet.') };
  }

  const supabase = getSupabaseClient();
  // Supabase exposes auth.signInWithSSO once a provider is registered.
  const authWithSso = supabase.auth as unknown as {
    signInWithSSO?: (opts: { domain: string }) => Promise<{
      data: { url: string | null };
      error: Error | null;
    }>;
  };

  if (!authWithSso.signInWithSSO) {
    return { error: new Error('SSO provider is not configured.') };
  }

  const { data, error } = await authWithSso.signInWithSSO({ domain });
  return { url: data?.url, error };
}
