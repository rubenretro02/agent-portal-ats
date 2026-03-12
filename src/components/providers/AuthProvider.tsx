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
  agent_id: string;
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

  const mountedRef = useRef(true);
  const initStartedRef = useRef(false);

  const supabase = useMemo(() => getSupabaseClient(), []);
  const setAuth = useAuthStore((state) => state.setAuth);

  // Fetch profile via API
  const fetchProfile = useCallback(async (userId: string): Promise<{ profile: Profile | null; agent: Agent | null }> => {
    console.log('[AuthProvider] Fetching profile for:', userId);

    try {
      // Try API route first
      const res = await fetch('/api/profile', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[AuthProvider] Profile loaded via API');
        return {
          profile: data.profile as Profile | null,
          agent: data.agent as Agent | null,
        };
      }

      console.log('[AuthProvider] API failed, trying direct query');

      // Fallback to direct query
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profileData) {
        console.error('[AuthProvider] Profile fetch failed');
        return { profile: null, agent: null };
      }

      let agentData = null;
      if (profileData.role === 'agent') {
        const { data } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', userId)
          .single();
        agentData = data;
      }

      return {
        profile: profileData as Profile,
        agent: agentData as Agent | null,
      };
    } catch (error) {
      console.error('[AuthProvider] Fetch error:', error);
      return { profile: null, agent: null };
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const { profile: p, agent: a } = await fetchProfile(user.id);
      if (mountedRef.current) {
        setProfile(p);
        setAgent(a);
        setAuth(p as never, a as never);
      }
    }
  }, [user, fetchProfile, setAuth]);

  // Main initialization effect - runs once
  useEffect(() => {
    mountedRef.current = true;

    const initialize = async () => {
      if (initStartedRef.current) return;
      initStartedRef.current = true;

      console.log('[AuthProvider] Initializing...');

      try {
        const { data: { session: s } } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (s?.user) {
          console.log('[AuthProvider] Session found');
          setUser(s.user);
          setSession(s);

          const { profile: p, agent: a } = await fetchProfile(s.user.id);

          if (mountedRef.current) {
            setProfile(p);
            setAgent(a);
            setAuth(p as never, a as never);
          }
        } else {
          console.log('[AuthProvider] No session');
        }
      } catch (error) {
        console.error('[AuthProvider] Init error:', error);
      } finally {
        if (mountedRef.current) {
          console.log('[AuthProvider] Init complete');
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log('[AuthProvider] Auth event:', event);

      if (!mountedRef.current) return;

      if (event === 'SIGNED_IN' && s?.user) {
        setUser(s.user);
        setSession(s);

        // Only fetch if we don't have a profile yet
        if (!profile) {
          const { profile: p, agent: a } = await fetchProfile(s.user.id);
          if (mountedRef.current) {
            setProfile(p);
            setAgent(a);
            setAuth(p as never, a as never);
            setIsLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setProfile(null);
        setAgent(null);
        setAuth(null, null);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && s) {
        setSession(s);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run once

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata: { username: string }
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
        await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: metadata.username.toLowerCase() }),
        });
      } catch (e) {
        console.error('Username update error:', e);
      }
    }

    return { error: error as Error | null };
  }, [supabase]);

  const signIn = useCallback(async (email: string, password: string) => {
    initStartedRef.current = false; // Allow re-init after sign in
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setIsLoading(false);
    }

    return { error: error as Error | null };
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuth(null, null);
    initStartedRef.current = false;
    window.location.href = '/';
  }, [supabase, setAuth]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    agent,
    isLoading,
    isAuthenticated: !!user && !!profile,
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
