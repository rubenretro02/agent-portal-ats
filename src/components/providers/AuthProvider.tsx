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
    console.log('Fetching profile for user:', userId);

    try {
      // Try direct Supabase query first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('Direct profile fetch failed (code: ' + profileError.code + '), falling back to API route...');
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
          console.warn('Direct agent fetch failed, falling back to API route...');
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

    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session: s }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          if (mounted) setIsLoading(false);
          return;
        }

        console.log('Session:', s ? 'Found' : 'None');

        if (s?.user && mounted) {
          setUser(s.user);
          setSession(s);

          const { profile: p, agent: a } = await fetchProfile(s.user.id);

          if (mounted) {
            setProfile(p);
            setAgent(a);
            // Sync with store
            setAuth(p as never, a as never);
            setIsLoading(false);
          }
        } else if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (mounted) setIsLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log('Auth state change:', event);

      if (event === 'SIGNED_IN' && s?.user && mounted) {
        setUser(s.user);
        setSession(s);

        await new Promise(resolve => setTimeout(resolve, 500));

        const { profile: p, agent: a } = await fetchProfile(s.user.id);

        if (mounted) {
          setProfile(p);
          setAgent(a);
          // Sync with store
          setAuth(p as never, a as never);
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
      }
    });

    return () => {
      mounted = false;
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

      // Update the profile with the username
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: metadata.username.toLowerCase() } as never)
        .eq('id', data.user.id);

      if (updateError) {
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
