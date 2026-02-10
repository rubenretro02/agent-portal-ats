'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => getSupabaseClient(), []);
  const setAuth = useAuthStore((state) => state.setAuth);

  const fetchProfileViaAPI = useCallback(async (): Promise<{ profile: Profile | null; agent: Agent | null }> => {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) {
        return { profile: null, agent: null };
      }
      const data = await res.json();
      return {
        profile: data.profile as Profile | null,
        agent: data.agent as Agent | null,
      };
    } catch (error) {
      console.error('[v0] Profile API fetch error:', error);
      return { profile: null, agent: null };
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string): Promise<{ profile: Profile | null; agent: Agent | null }> => {
    try {
      // Try direct Supabase query first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        // Fallback to API route which uses service role to bypass RLS
        return await fetchProfileViaAPI();
      }

      let agentData = null;
      if (profileData && profileData.role === 'agent') {
        const { data, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (agentError) {
          return await fetchProfileViaAPI();
        }

        agentData = data;
      }

      return {
        profile: profileData as Profile,
        agent: agentData as Agent | null
      };
    } catch (error) {
      console.error('Fetch profile error, falling back to API route...', error);
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
    let profileLoaded = false;

    // Helper: fetch profile and update state
    const loadProfile = async (userId: string) => {
      if (profileLoaded || !mounted) return;
      const { profile: p, agent: a } = await fetchProfile(userId);
      if (mounted) {
        profileLoaded = true;
        setProfile(p);
        setAgent(a);
        setAuth(p as never, a as never);
        setIsLoading(false);
      }
    };

    // Helper: retry getSession with exponential backoff for AbortErrors
    const getSessionWithRetry = async (retries = 3): Promise<{ session: Session | null; error: Error | null }> => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) return { session: null, error };
          return { session, error: null };
        } catch (err) {
          const isAbortError = err instanceof Error && err.name === 'AbortError';
          if (isAbortError && attempt < retries - 1) {
            // Wait before retrying: 200ms, 500ms
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 250));
            continue;
          }
          // Not an AbortError or last retry -- don't give up yet,
          // let onAuthStateChange handle it
          return { session: null, error: err as Error };
        }
      }
      return { session: null, error: new Error('Max retries reached') };
    };

    const getInitialSession = async () => {
      const { session: s, error } = await getSessionWithRetry(3);

      if (!mounted) return;

      if (error) {
        // Don't set isLoading=false here -- let onAuthStateChange handle it.
        // The AbortError means the session fetch was interrupted, but
        // onAuthStateChange will still fire with the correct session.
        console.warn('[v0] getSession failed, deferring to onAuthStateChange:', error.message);
        return;
      }

      if (s?.user) {
        setUser(s.user);
        setSession(s);
        await loadProfile(s.user.id);
      } else {
        // Genuinely no session
        setIsLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mounted) return;

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && s?.user) {
        setUser(s.user);
        setSession(s);
        // loadProfile is a no-op if already loaded
        await loadProfile(s.user.id);
      } else if (event === 'TOKEN_REFRESHED' && s?.user) {
        setSession(s);
      } else if (event === 'SIGNED_OUT') {
        profileLoaded = false;
        setUser(null);
        setSession(null);
        setProfile(null);
        setAgent(null);
        setAuth(null, null);
        setIsLoading(false);
      }
    });

    // Safety timeout: if isLoading is still true after 8s, force it off
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setIsLoading(prev => {
          if (prev) {
            console.warn('[v0] Auth loading safety timeout triggered');
            return false;
          }
          return prev;
        });
      }
    }, 8000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, setAuth]);

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuth(null, null);
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
