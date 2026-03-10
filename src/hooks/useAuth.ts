'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
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
  [key: string]: unknown;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  agent: Agent | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface UseAuthReturn extends AuthState {
  signUp: (email: string, password: string, metadata: { firstName: string; lastName: string; phone?: string; role?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    agent: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const supabase = getSupabaseClient();

  const fetchProfile = useCallback(async (userId: string) => {
    // Try direct Supabase query first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      // Fallback to API route to bypass RLS infinite recursion
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          return { profile: data.profile as Profile | null, agent: data.agent as Agent | null };
        }
      } catch (e) {
        console.error('Profile API fallback error:', e);
      }
      return { profile: null, agent: null };
    }

    let agent = null;
    if (profile && (profile as Profile).role === 'agent') {
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .single();
      agent = agentData;
    }

    return { profile: profile as Profile | null, agent: agent as Agent | null };
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (state.user) {
      const { profile, agent } = await fetchProfile(state.user.id);
      setState(prev => ({ ...prev, profile, agent }));
    }
  }, [state.user, fetchProfile]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { profile, agent } = await fetchProfile(session.user.id);
        setState({
          user: session.user,
          session,
          profile,
          agent,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          agent: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { profile, agent } = await fetchProfile(session.user.id);
        setState({
          user: session.user,
          session,
          profile,
          agent,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          agent: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signUp = async (
    email: string,
    password: string,
    metadata: { firstName: string; lastName: string; phone?: string; role?: string }
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata.firstName,
          last_name: metadata.lastName,
          phone: metadata.phone,
          role: metadata.role || 'agent',
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };
}
