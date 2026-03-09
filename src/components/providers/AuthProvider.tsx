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

// Timeout de seguridad para evitar loading infinito (10 segundos)
const AUTH_TIMEOUT_MS = 10000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs para control de flujo
  const isFetchingProfile = useRef(false);
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
      setAuth(null, null);
    }, AUTH_TIMEOUT_MS);
  }, [clearSafetyTimeout, setAuth]);

  const fetchProfileViaAPI = useCallback(async (): Promise<{ profile: Profile | null; agent: Agent | null }> => {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) {
        console.error('Profile API error:', res.status);
        return { profile: null, agent: null };
      }
      const data = await res.json();
      return {
        profile: data.profile as Profile | null,
        agent: data.agent as Agent | null,
      };
    } catch (error) {
      console.error('Profile API fetch error:', error);
      return { profile: null, agent: null };
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string): Promise<{ profile: Profile | null; agent: Agent | null }> => {
    // Prevenir múltiples llamadas simultáneas
    if (isFetchingProfile.current) {
      console.log('[AuthProvider] fetchProfile already in progress, skipping...');
      return { profile: null, agent: null };
    }

    isFetchingProfile.current = true;
    console.log('Fetching profile for user:', userId);

    try {
      // Try direct Supabase query first
      console.log('[AuthProvider] Attempting direct Supabase profile query...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('[AuthProvider] Profile query result:', profileData ? 'found' : 'null', 'error:', profileError?.code || 'none');

      if (profileError) {
        console.warn('Direct profile fetch failed (code: ' + profileError.code + '), falling back to API route...');
        // Fallback to API route which uses service role to bypass RLS
        const result = await fetchProfileViaAPI();
        isFetchingProfile.current = false;
        return result;
      }

      let agentData = null;
      if (profileData && profileData.role === 'agent') {
        console.log('[AuthProvider] Fetching agent data...');
        const { data, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', userId)
          .single();

        console.log('[AuthProvider] Agent query result:', data ? 'found' : 'null', 'error:', agentError?.code || 'none');

        if (agentError) {
          console.warn('Direct agent fetch failed, falling back to API route...');
          const result = await fetchProfileViaAPI();
          isFetchingProfile.current = false;
          return result;
        }

        agentData = data;
      }

      console.log('[AuthProvider] fetchProfile complete - profile:', !!profileData, 'agent:', !!agentData);
      isFetchingProfile.current = false;
      return {
        profile: profileData as Profile,
        agent: agentData as Agent | null
      };
    } catch (error) {
      console.error('Fetch profile error, falling back to API route...', error);
      isFetchingProfile.current = false;
      return await fetchProfileViaAPI();
    }
  }, [supabase, fetchProfileViaAPI]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const { profile: p, agent: a } = await fetchProfile(user.id);
      setProfile(p);
      setAgent(a);
      // Sync with store
      setAuth(p as never, a as never);
    }
  }, [user, fetchProfile, setAuth]);

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
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
            setAuth(null, null);
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
            console.log('[AuthProvider] getInitialSession complete, setting isLoading=false, profile:', !!p);
            clearSafetyTimeout();
            setIsLoading(false);
          }
        } else if (mounted) {
          console.log('[AuthProvider] No session found, setting isLoading=false');
          clearSafetyTimeout();
          setIsLoading(false);
          setAuth(null, null);
        }
      } catch (error) {
        console.error('[AuthProvider] Error getting session:', error);
        clearSafetyTimeout();
        if (mounted) {
          setIsLoading(false);
          setAuth(null, null);
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log('[AuthProvider] Auth state change:', event);

      if (event === 'SIGNED_IN' && s?.user && mounted) {
        setUser(s.user);
        setSession(s);

        // Reducido de 500ms a 100ms para evitar delays
        await new Promise(resolve => setTimeout(resolve, 100));

        const { profile: p, agent: a } = await fetchProfile(s.user.id);

        if (mounted) {
          setProfile(p);
          setAgent(a);
          setAuth(p as never, a as never);
          console.log('[AuthProvider] onAuthStateChange SIGNED_IN complete, setting isLoading=false, profile:', !!p);
          clearSafetyTimeout();
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT' && mounted) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setAgent(null);
        // Sync with store
        setAuth(null, null);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && s?.user && mounted) {
        // Actualizar sesión sin re-fetch de profile
        setSession(s);
      }
    });

    return () => {
      mounted = false;
      clearSafetyTimeout();
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, setAuth, setSafetyTimeout, clearSafetyTimeout]);

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

    // If signup successful, update the profiles table with the username
    if (!error && data.user) {
      // Wait a bit for the profile to be created by the trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the profile with the username via API to bypass RLS
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
    // Reset loading state y flag de inicialización para nuevo login
    isInitialized.current = false;
    isFetchingProfile.current = false;
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
    // Reset flags
    isInitialized.current = false;
    isFetchingProfile.current = false;
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
