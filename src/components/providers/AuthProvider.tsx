'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/supabaseStore';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string | null;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  sex: string | null;
  date_of_birth: string | null;
  phone: string | null;
  role: 'agent' | 'admin' | 'recruiter';
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Agent {
  id: string;
  user_id: string;
  ats_id: string;
  pipeline_status: string;
  pipeline_stage: number;
  scores?: Record<string, number> | null;
  equipment?: Record<string, unknown> | null;
  languages?: string[] | null;
  address?: Record<string, unknown> | null;
  availability?: Record<string, unknown> | null;
  timezone?: string | null;
  onboarding_completed?: boolean;
  system_check?: Record<string, unknown> | null;
  system_check_date?: string | null;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  agent: Agent | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, metadata: {
    username: string;
  }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Timeout de seguridad reducido a 15 segundos
const AUTH_TIMEOUT_MS = 15000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs para control de flujo
  const isInitialized = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = useMemo(() => getSupabaseClient(), []);
  const setAuth = useAuthStore((state) => state.setAuth);

  // Limpiar timeout de seguridad
  const clearSafetyTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Establecer timeout de seguridad
  const setSafetyTimeout = useCallback(() => {
    clearSafetyTimeout();
    timeoutRef.current = setTimeout(() => {
      console.warn('[AuthProvider] Safety timeout reached, forcing isLoading to false');
      setIsLoading(false);
      // No limpiamos el auth aquí, solo el loading
    }, AUTH_TIMEOUT_MS);
  }, [clearSafetyTimeout]);

  // Fetch profile usando la API route (más confiable, evita problemas de RLS)
  const fetchProfileViaAPI = useCallback(async (): Promise<{ profile: Profile | null; agent: Agent | null }> => {
    console.log('[AuthProvider] Fetching profile via API route...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for API call

      const res = await fetch('/api/profile', {
        signal: controller.signal,
        credentials: 'include',
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.error('[AuthProvider] Profile API error:', res.status);
        return { profile: null, agent: null };
      }
      const data = await res.json();
      console.log('[AuthProvider] Profile API success:', !!data.profile);
      return {
        profile: data.profile as Profile | null,
        agent: data.agent as Agent | null,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[AuthProvider] Profile API timeout');
      } else {
        console.error('[AuthProvider] Profile API fetch error:', error);
      }
      return { profile: null, agent: null };
    }
  }, []);

  // Fetch profile - Usar API primero (evita problemas de RLS)
  const fetchProfile = useCallback(async (userId: string): Promise<{ profile: Profile | null; agent: Agent | null }> => {
    console.log('[AuthProvider] Fetching profile for user:', userId);

    // Usar API route primero (más confiable)
    const apiResult = await fetchProfileViaAPI();
    if (apiResult.profile) {
      console.log('[AuthProvider] Got profile from API');
      return apiResult;
    }

    // Fallback: intentar consulta directa a Supabase
    console.log('[AuthProvider] API failed, trying direct Supabase query...');
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('[AuthProvider] Direct Supabase query failed:', profileError.code);
        return { profile: null, agent: null };
      }

      let agentData = null;
      if (profileData && profileData.role === 'agent') {
        const { data, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!agentError) {
          agentData = data;
        }
      }

      console.log('[AuthProvider] Direct query success');
      return {
        profile: profileData as Profile,
        agent: agentData as Agent | null
      };
    } catch (error) {
      console.error('[AuthProvider] Direct query error:', error);
      return { profile: null, agent: null };
    }
  }, [supabase, fetchProfileViaAPI]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const { profile: p, agent: a } = await fetchProfile(user.id);
      setProfile(p);
      setAgent(a);
      setAuth(p as never, a as never);
    }
  }, [user, fetchProfile, setAuth]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // Prevenir múltiples inicializaciones
      if (isInitialized.current) {
        console.log('[AuthProvider] Already initialized, skipping...');
        return;
      }
      isInitialized.current = true;

      // Establecer timeout de seguridad
      setSafetyTimeout();

      try {
        console.log('[AuthProvider] Getting initial session...');
        const { data: { session: s }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthProvider] Session error:', error);
          clearSafetyTimeout();
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        console.log('[AuthProvider] Session:', s ? 'Found' : 'None');

        if (s?.user && mounted) {
          setUser(s.user);
          setSession(s);

          const { profile: p, agent: a } = await fetchProfile(s.user.id);

          if (mounted) {
            setProfile(p);
            setAgent(a);
            setAuth(p as never, a as never);
            console.log('[AuthProvider] Initial load complete, profile:', !!p);
            clearSafetyTimeout();
            setIsLoading(false);
          }
        } else if (mounted) {
          console.log('[AuthProvider] No session found');
          clearSafetyTimeout();
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[AuthProvider] Init error:', error);
        clearSafetyTimeout();
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log('[AuthProvider] Auth state change:', event);

      // Solo procesar si ya estamos inicializados y es un cambio real
      if (event === 'SIGNED_IN' && s?.user && mounted) {
        // Si ya tenemos el mismo usuario, no re-fetch
        if (user?.id === s.user.id && profile) {
          console.log('[AuthProvider] Same user, skipping re-fetch');
          return;
        }

        setUser(s.user);
        setSession(s);

        const { profile: p, agent: a } = await fetchProfile(s.user.id);

        if (mounted) {
          setProfile(p);
          setAgent(a);
          setAuth(p as never, a as never);
          console.log('[AuthProvider] SIGNED_IN complete, profile:', !!p);
          clearSafetyTimeout();
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT' && mounted) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setAgent(null);
        setAuth(null, null);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && s?.user && mounted) {
        setSession(s);
      }
    });

    return () => {
      mounted = false;
      clearSafetyTimeout();
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, setAuth, setSafetyTimeout, clearSafetyTimeout, user, profile]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata: {
      username: string;
    }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: metadata.username.toLowerCase(),
          role: 'agent',
        },
      },
    });

    if (!error && data.user) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const res = await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: metadata.username.toLowerCase() }),
        });
        if (!res.ok) {
          console.error('Error updating username in profile via API');
        }
      } catch (updateError) {
        console.error('Error updating username in profile:', updateError);
      }
    }

    return { error: error as Error | null };
  }, [supabase]);

  const signIn = useCallback(async (email: string, password: string) => {
    // Reset para nuevo login
    isInitialized.current = false;
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
    }

    return { error: error as Error | null };
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuth(null, null);
    isInitialized.current = false;
    window.location.href = '/';
  }, [supabase, setAuth]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    agent,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }), [user, session, profile, agent, isLoading, signUp, signIn, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
