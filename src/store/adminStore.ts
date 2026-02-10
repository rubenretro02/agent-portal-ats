import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { AdminUser, AdminPermissions } from '@/types/admin';
import { ROLE_PERMISSIONS } from '@/types/admin';

interface AdminAuthState {
  currentUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: AdminPermissions | null;
  recruiters: AdminUser[];

  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;

  // Recruiter management (admin only)
  fetchRecruiters: () => Promise<void>;
  addRecruiter: (recruiter: Omit<AdminUser, 'id' | 'createdAt' | 'createdBy'>) => Promise<boolean>;
  updateRecruiter: (id: string, data: Partial<AdminUser>) => Promise<boolean>;
  toggleRecruiterStatus: (id: string) => Promise<boolean>;
  deleteRecruiter: (id: string) => Promise<boolean>;

  // Permission check
  hasPermission: (permission: keyof AdminPermissions) => boolean;
}

export const useAdminStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      permissions: null,
      recruiters: [],

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        const supabase = getSupabaseClient();

        try {
          // Sign in with Supabase
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) {
            set({ isLoading: false });
            return { success: false, error: authError.message };
          }

          if (!authData.user) {
            set({ isLoading: false });
            return { success: false, error: 'No user returned from authentication' };
          }

          // Fetch the profile to verify role - try direct query first, fallback to API
          let profile: Record<string, unknown> | null = null;

          const { data: directProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileError) {
            // Fallback to API route to bypass RLS recursion
            try {
              const res = await fetch('/api/profile');
              if (res.ok) {
                const apiData = await res.json();
                profile = apiData.profile;
              }
            } catch (e) {
              console.error('API fallback error:', e);
            }
          } else {
            profile = directProfile;
          }

          if (!profile) {
            // Sign out if profile not found
            await supabase.auth.signOut();
            set({ isLoading: false });
            return { success: false, error: 'Profile not found. Please contact support.' };
          }

          // Check if user has admin or recruiter role
          const role = profile.role as string;
          if (role !== 'admin' && role !== 'recruiter') {
            await supabase.auth.signOut();
            set({ isLoading: false });
            return { success: false, error: 'Access denied. This portal is for admins and recruiters only.' };
          }

          // Check if account is active
          if (!profile.is_active) {
            await supabase.auth.signOut();
            set({ isLoading: false });
            return { success: false, error: 'Account is inactive. Please contact support.' };
          }

          // Build AdminUser object
          const adminUser: AdminUser = {
            id: profile.id as string,
            email: profile.email as string,
            firstName: profile.first_name as string,
            lastName: profile.last_name as string,
            role: role as 'admin' | 'recruiter',
            isActive: profile.is_active as boolean,
            lastLogin: new Date(),
            createdAt: new Date(profile.created_at as string),
          };

          // Get permissions based on role
          const permissions = ROLE_PERMISSIONS[adminUser.role];

          set({
            currentUser: adminUser,
            isAuthenticated: true,
            isLoading: false,
            permissions,
          });

          return { success: true };
        } catch (error) {
          console.error('Admin login error:', error);
          set({ isLoading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      logout: async () => {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
        set({
          currentUser: null,
          isAuthenticated: false,
          permissions: null,
          recruiters: [],
        });
      },

      checkSession: async () => {
        set({ isLoading: true });
        const supabase = getSupabaseClient();

        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error || !session?.user) {
            // Clear any stale persisted state
            set({
              isLoading: false,
              isAuthenticated: false,
              currentUser: null,
              permissions: null,
              recruiters: [],
            });
            return;
          }

          // Fetch profile - try direct query first, fallback to API
          let profile: Record<string, unknown> | null = null;

          const { data: directProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            try {
              const res = await fetch('/api/profile');
              if (res.ok) {
                const apiData = await res.json();
                profile = apiData.profile;
              }
            } catch (e) {
              console.error('API fallback error in checkSession:', e);
            }
          } else {
            profile = directProfile;
          }

          if (!profile) {
            set({ isLoading: false, isAuthenticated: false, currentUser: null });
            return;
          }

          // Verify admin/recruiter role
          const sessionRole = profile.role as string;
          if (sessionRole !== 'admin' && sessionRole !== 'recruiter') {
            set({ isLoading: false, isAuthenticated: false, currentUser: null });
            return;
          }

          // Build AdminUser object
          const adminUser: AdminUser = {
            id: profile.id as string,
            email: profile.email as string,
            firstName: profile.first_name as string,
            lastName: profile.last_name as string,
            role: sessionRole as 'admin' | 'recruiter',
            isActive: profile.is_active as boolean,
            lastLogin: new Date(),
            createdAt: new Date(profile.created_at as string),
          };

          const permissions = ROLE_PERMISSIONS[adminUser.role];

          set({
            currentUser: adminUser,
            isAuthenticated: true,
            isLoading: false,
            permissions,
          });
        } catch (error) {
          console.error('Check session error:', error);
          set({ isLoading: false, isAuthenticated: false, currentUser: null });
        }
      },

      fetchRecruiters: async () => {
        const { hasPermission } = get();
        if (!hasPermission('canViewRecruiters')) return;

        set({ isLoading: true });

        try {
          const { adminDb } = await import('@/lib/adminDb');
          const { data, error } = await adminDb<Record<string, unknown>[]>({
            action: 'select',
            table: 'profiles',
            filters: { role: 'recruiter' },
            order: { column: 'created_at', ascending: false },
          });

          if (!error && data) {
            const recruiters: AdminUser[] = data.map((profile: Record<string, unknown>) => ({
              id: profile.id as string,
              email: profile.email as string,
              firstName: profile.first_name as string,
              lastName: profile.last_name as string,
              role: 'recruiter' as const,
              isActive: profile.is_active as boolean,
              createdAt: new Date(profile.created_at as string),
            }));
            set({ recruiters, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Fetch recruiters error:', error);
          set({ isLoading: false });
        }
      },

      addRecruiter: async (recruiterData) => {
        const { hasPermission } = get();
        if (!hasPermission('canManageRecruiters')) {
          return false;
        }

        // Note: Creating a new user requires Supabase Admin API
        // For now, this is a placeholder - in production, use an Edge Function
        console.log('Add recruiter:', recruiterData);
        return false;
      },

      updateRecruiter: async (id, data) => {
        const { hasPermission } = get();
        if (!hasPermission('canManageRecruiters')) {
          return false;
        }

        set({ isLoading: true });

        try {
          const updateData: Record<string, unknown> = {};
          if (data.firstName) updateData.first_name = data.firstName;
          if (data.lastName) updateData.last_name = data.lastName;
          if (data.isActive !== undefined) updateData.is_active = data.isActive;

          const { adminDb } = await import('@/lib/adminDb');
          const result = await adminDb({
            action: 'update',
            table: 'profiles',
            data: updateData,
            match: { id },
          });

          if (result.error) {
            console.error('Update recruiter error:', result.error);
            set({ isLoading: false });
            return false;
          }

          // Refresh recruiters list
          await get().fetchRecruiters();
          return true;
        } catch (error) {
          console.error('Update recruiter error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      toggleRecruiterStatus: async (id) => {
        const { hasPermission, recruiters } = get();
        if (!hasPermission('canManageRecruiters')) {
          return false;
        }

        const recruiter = recruiters.find(r => r.id === id);
        if (!recruiter) return false;

        return get().updateRecruiter(id, { isActive: !recruiter.isActive });
      },

      deleteRecruiter: async (id) => {
        const { hasPermission } = get();
        if (!hasPermission('canManageRecruiters')) {
          return false;
        }

        // Soft delete - just deactivate the account
        return get().updateRecruiter(id, { isActive: false });
      },

      hasPermission: (permission) => {
        const { permissions } = get();
        return permissions?.[permission] ?? false;
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
      }),
    }
  )
);
