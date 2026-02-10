'use client';

import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Language, ApplicationAnswer, ApplicationQuestion } from '@/types';

// =====================================================
// TYPES
// =====================================================

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
  pipeline_stage: number;
  application_date: string;
  last_status_change: string;
  address: unknown;
  languages: unknown;
  skills: unknown;
  experience: unknown;
  equipment: unknown;
  availability: unknown;
  scores: unknown;
  preferred_language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  agent_id: string;
  type: string;
  subject: string;
  content: string;
  read: boolean;
  sent_at: string;
  read_at: string | null;
  metadata: unknown;
}

interface Notification {
  id: string;
  agent_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

interface OnboardingStep {
  id: string;
  agent_id: string;
  step_key: string;
  name: string;
  description: string;
  order: number;
  required_pipeline_status: unknown;
  is_required: boolean;
  type: string;
  completed: boolean;
  completed_at: string | null;
  data: unknown;
}

interface Document {
  id: string;
  agent_id: string;
  type: string;
  name: string;
  url: string;
  status: string;
  uploaded_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  expires_at: string | null;
  notes: string | null;
}

// =====================================================
// AUTH STORE
// =====================================================

interface AuthState {
  profile: Profile | null;
  agent: Agent | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: Language;
  setAuth: (profile: Profile | null, agent: Agent | null) => void;
  setLanguage: (lang: Language) => void;
  updateAgent: (updates: Partial<Agent>) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  agent: null,
  isAuthenticated: false,
  isLoading: true,
  language: 'en',

  setAuth: (profile, agent) => {
    set({
      profile,
      agent,
      isAuthenticated: !!profile,
      isLoading: false,
      language: (agent?.preferred_language as Language) || 'en',
    });
  },

  setLanguage: async (lang) => {
    const { agent } = get();
    if (agent) {
      const { adminDb } = await import('@/lib/adminDb');
      await adminDb({
        action: 'update', table: 'agents',
        data: { preferred_language: lang },
        match: { id: agent.id },
      });
    }
    set({ language: lang });
  },

  updateAgent: async (updates) => {
    const { agent } = get();
    if (!agent) return;

    const { adminDb } = await import('@/lib/adminDb');
    const { data, error } = await adminDb<Agent[]>({
      action: 'update', table: 'agents',
      data: updates as Record<string, unknown>,
      match: { id: agent.id },
    });

    if (!error && data && data.length > 0) {
      set({ agent: data[0] });
    }
  },

  logout: () => {
    set({
      profile: null,
      agent: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));

// =====================================================
// OPPORTUNITIES STORE
// =====================================================

interface OpportunityWithQuestions {
  id: string;
  name: string;
  description: string;
  client: string;
  status: string;
  category: string | null;
  requirements: Record<string, unknown> | null;
  compensation: Record<string, unknown> | null;
  schedule: Record<string, unknown> | null;
  max_agents: number;
  current_agents: number;
  open_positions: number;
  training: Record<string, unknown> | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  applicationQuestions: ApplicationQuestion[];
  capacity: {
    maxAgents: number;
    currentAgents: number;
    openPositions: number;
  };
}

interface CreateOpportunityData {
  name: string;
  description: string;
  client: string;
  category?: string;
  baseRate: number;
  trainingHours: number;
  maxAgents: number;
  languages: string[];
  minScore?: number;
  status?: string;
  tags?: string[];
}

interface OpportunityState {
  opportunities: OpportunityWithQuestions[];
  selectedOpportunity: OpportunityWithQuestions | null;
  isLoading: boolean;
  appliedOpportunityIds: string[];
  fetchOpportunities: (includeAll?: boolean) => Promise<void>;
  selectOpportunity: (id: string) => void;
  applyToOpportunity: (opportunityId: string, answers: ApplicationAnswer[]) => Promise<{ success: boolean; applicationId: string }>;
  fetchAppliedOpportunities: () => Promise<void>;
  createOpportunity: (data: CreateOpportunityData) => Promise<{ success: boolean; id?: string; error?: string }>;
  updateOpportunity: (id: string, data: Partial<CreateOpportunityData & { status: string }>) => Promise<boolean>;
  deleteOpportunity: (id: string) => Promise<boolean>;
}

export const useOpportunityStore = create<OpportunityState>((set, get) => ({
  opportunities: [],
  selectedOpportunity: null,
  isLoading: false,
  appliedOpportunityIds: [],

  fetchOpportunities: async (includeAll = false) => {
    set({ isLoading: true });

    // For admin (includeAll=true), use admin API to bypass RLS that references profiles
    if (includeAll) {
      try {
        const { adminDb } = await import('@/lib/adminDb');
        const result = await adminDb<OpportunityWithQuestions[]>({
          action: 'select',
          table: 'opportunities',
          select: '*, application_questions (*)',
          order: { column: 'created_at', ascending: false },
        });

        if (!result.error && result.data) {
          set({ opportunities: result.data, isLoading: false });
          return;
        }
      } catch (e) {
        console.error('Admin fetch opportunities error:', e);
      }
    }

    const supabase = getSupabaseClient();

    let query = supabase
      .from('opportunities')
      .select(`
        *,
        application_questions (*)
      `)
      .order('created_at', { ascending: false });

    // Only filter by active status if not fetching all (for admin)
    if (!includeAll) {
      query = query.eq('status', 'active');
    }

    const { data: opportunities, error } = await query;

    if (!error && opportunities) {
      const formattedOpportunities: OpportunityWithQuestions[] = (opportunities as unknown as Record<string, unknown>[]).map((opp) => ({
        id: opp.id as string,
        name: opp.name as string,
        description: opp.description as string,
        client: opp.client as string,
        status: opp.status as string,
        category: opp.category as string | null,
        requirements: opp.requirements as Record<string, unknown> | null,
        compensation: opp.compensation as Record<string, unknown> | null,
        schedule: opp.schedule as Record<string, unknown> | null,
        max_agents: opp.max_agents as number,
        current_agents: opp.current_agents as number,
        open_positions: opp.open_positions as number,
        training: opp.training as Record<string, unknown> | null,
        tags: (opp.tags as string[]) || [],
        created_at: opp.created_at as string,
        updated_at: opp.updated_at as string,
        capacity: {
          maxAgents: opp.max_agents as number,
          currentAgents: opp.current_agents as number,
          openPositions: opp.open_positions as number,
        },
        applicationQuestions: ((opp.application_questions as Record<string, unknown>[]) || [])
          .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.order as number) - (b.order as number))
          .map((q: Record<string, unknown>) => ({
            id: q.id as string,
            question: q.question as string,
            questionEs: q.question_es as string | undefined,
            type: q.type as ApplicationQuestion['type'],
            required: q.required as boolean,
            order: q.order as number,
            options: q.options as { value: string; label: string; labelEs?: string }[] | undefined,
            placeholder: q.placeholder as string | undefined,
            placeholderEs: q.placeholder_es as string | undefined,
            validation: q.validation as { min?: number; max?: number; pattern?: string; message?: string } | undefined,
          })),
      }));

      set({ opportunities: formattedOpportunities, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  selectOpportunity: (id) => {
    const opportunity = get().opportunities.find(o => o.id === id) || null;
    set({ selectedOpportunity: opportunity });
  },

  applyToOpportunity: async (opportunityId, answers) => {
    const { agent } = useAuthStore.getState();

    if (!agent) {
      return { success: false, applicationId: '' };
    }

    // Create application using admin API to bypass RLS
    const { adminDb } = await import('@/lib/adminDb');
    const { data: appResult, error: appError } = await adminDb<{ id: string }[]>({
      action: 'insert',
      table: 'applications',
      data: {
        agent_id: agent.id,
        opportunity_id: opportunityId,
        status: 'pending',
      },
    });

    if (appError || !appResult || appResult.length === 0) {
      console.error('Error creating application:', appError);
      return { success: false, applicationId: '' };
    }

    const appId = appResult[0].id;

    // Create answers
    if (answers.length > 0) {
      const answersToInsert = answers.map(answer => ({
        application_id: appId,
        question_id: answer.questionId,
        value: answer.value,
      }));

      const { error: answersError } = await adminDb({
        action: 'insert',
        table: 'application_answers',
        data: answersToInsert,
        select: false,
      });

      if (answersError) {
        console.error('Error creating answers:', answersError);
      }
    }

    // Update applied opportunities
    set(state => ({
      appliedOpportunityIds: [...state.appliedOpportunityIds, opportunityId],
    }));

    return { success: true, applicationId: appId };
  },

  fetchAppliedOpportunities: async () => {
    const supabase = getSupabaseClient();
    const { agent } = useAuthStore.getState();

    if (!agent) return;

    const { data: applications } = await supabase
      .from('applications')
      .select('opportunity_id')
      .eq('agent_id', agent.id);

    if (applications) {
      set({
        appliedOpportunityIds: (applications as unknown as { opportunity_id: string }[]).map(a => a.opportunity_id),
      });
    }
  },

  createOpportunity: async (data) => {
    try {
      const opportunityData = {
        name: data.name,
        description: data.description,
        client: data.client,
        category: data.category || null,
        status: data.status || 'draft',
        max_agents: data.maxAgents,
        current_agents: 0,
        open_positions: data.maxAgents,
        tags: data.tags || [],
        compensation: {
          baseRate: data.baseRate,
          currency: 'USD',
          paymentFrequency: 'hourly',
        },
        training: {
          duration: data.trainingHours,
          required: true,
          paid: true,
        },
        requirements: {
          minScore: data.minScore || 0,
          languages: data.languages,
          minExperience: 0,
        },
        schedule: {
          type: 'flexible',
          timezone: 'America/New_York',
        },
      };

      // Use admin API to bypass RLS that references profiles table
      const { adminDb } = await import('@/lib/adminDb');
      const result = await adminDb<{ id: string }[]>({
        action: 'insert',
        table: 'opportunities',
        data: opportunityData,
      });

      if (result.error || !result.data) {
        console.error('Error creating opportunity:', result.error);
        return { success: false, error: result.error || 'Failed to create opportunity' };
      }

      // Refresh opportunities list
      await get().fetchOpportunities(true);

      const newOpp = Array.isArray(result.data) ? result.data[0] : result.data;
      return { success: true, id: newOpp.id };
    } catch (error) {
      console.error('Create opportunity error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  updateOpportunity: async (id, data) => {
    try {
      const updateData: Record<string, unknown> = {};

      if (data.name) updateData.name = data.name;
      if (data.description) updateData.description = data.description;
      if (data.client) updateData.client = data.client;
      if (data.category) updateData.category = data.category;
      if (data.status) updateData.status = data.status;
      if (data.maxAgents) {
        updateData.max_agents = data.maxAgents;
        updateData.open_positions = data.maxAgents;
      }
      if (data.tags) updateData.tags = data.tags;
      if (data.baseRate) {
        updateData.compensation = {
          baseRate: data.baseRate,
          currency: 'USD',
          paymentFrequency: 'hourly',
        };
      }
      if (data.trainingHours) {
        updateData.training = {
          duration: data.trainingHours,
          required: true,
          paid: true,
        };
      }
      if (data.languages || data.minScore !== undefined) {
        updateData.requirements = {
          minScore: data.minScore || 0,
          languages: data.languages || ['English'],
          minExperience: 0,
        };
      }

      const { adminDb } = await import('@/lib/adminDb');
      const result = await adminDb({
        action: 'update',
        table: 'opportunities',
        data: updateData,
        match: { id },
      });

      if (result.error) {
        console.error('Error updating opportunity:', result.error);
        return false;
      }

      // Refresh opportunities list
      await get().fetchOpportunities(true);
      return true;
    } catch (error) {
      console.error('Update opportunity error:', error);
      return false;
    }
  },

  deleteOpportunity: async (id) => {
    try {
      // Soft delete - just set status to 'closed'
      const { adminDb } = await import('@/lib/adminDb');
      const result = await adminDb({
        action: 'update',
        table: 'opportunities',
        data: { status: 'closed' },
        match: { id },
      });

      if (result.error) {
        console.error('Error deleting opportunity:', result.error);
        return false;
      }

      // Refresh opportunities list
      await get().fetchOpportunities(true);
      return true;
    } catch (error) {
      console.error('Delete opportunity error:', error);
      return false;
    }
  },
}));

// =====================================================
// ONBOARDING STORE
// =====================================================

interface OnboardingState {
  steps: OnboardingStep[];
  currentStep: number;
  isLoading: boolean;
  fetchSteps: () => Promise<void>;
  completeStep: (stepKey: string, data?: Record<string, unknown>) => Promise<boolean>;
  setCurrentStep: (step: number) => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  steps: [],
  currentStep: 0,
  isLoading: false,

  fetchSteps: async () => {
    set({ isLoading: true });
    const supabase = getSupabaseClient();
    const { agent } = useAuthStore.getState();

    if (!agent) {
      set({ isLoading: false });
      return;
    }

    const { data: steps } = await supabase
      .from('onboarding_steps')
      .select('*')
      .eq('agent_id', agent.id)
      .order('order', { ascending: true });

    if (steps) {
      const typedSteps = steps as unknown as OnboardingStep[];
      const completedCount = typedSteps.filter(s => s.completed).length;
      set({ steps: typedSteps, currentStep: completedCount, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  completeStep: async (stepKey, data) => {
    const supabase = getSupabaseClient();
    const { agent } = useAuthStore.getState();

    if (!agent) return false;

    const { error } = await supabase
      .from('onboarding_steps')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        data: data || null,
      } as never)
      .eq('agent_id', agent.id)
      .eq('step_key', stepKey);

    if (!error) {
      await get().fetchSteps();
      return true;
    }

    return false;
  },

  setCurrentStep: (step) => {
    set({ currentStep: step });
  },
}));

// =====================================================
// NOTIFICATIONS STORE
// =====================================================

interface NotificationState {
  messages: Message[];
  notifications: Notification[];
  unreadCount: number;
  fetchMessages: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string, type: 'message' | 'notification') => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  messages: [],
  notifications: [],
  unreadCount: 0,

  fetchMessages: async () => {
    const supabase = getSupabaseClient();
    const { agent } = useAuthStore.getState();

    if (!agent) return;

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('agent_id', agent.id)
      .order('sent_at', { ascending: false });

    if (messages) {
      set({ messages: messages as unknown as Message[] });
    }
  },

  fetchNotifications: async () => {
    const supabase = getSupabaseClient();
    const { agent } = useAuthStore.getState();

    if (!agent) return;

    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false });

    if (notifications) {
      const typedNotifications = notifications as unknown as Notification[];
      const unreadCount = typedNotifications.filter(n => !n.read).length;
      set({ notifications: typedNotifications, unreadCount });
    }
  },

  markAsRead: async (id, type) => {
    const supabase = getSupabaseClient();

    if (type === 'message') {
      await supabase
        .from('messages')
        .update({ read: true, read_at: new Date().toISOString() } as never)
        .eq('id', id);

      set(state => ({
        messages: state.messages.map(m =>
          m.id === id ? { ...m, read: true, read_at: new Date().toISOString() } : m
        ),
      }));
    } else {
      await supabase
        .from('notifications')
        .update({ read: true } as never)
        .eq('id', id);

      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    }
  },
}));

// =====================================================
// DOCUMENTS STORE
// =====================================================

interface DocumentState {
  documents: Document[];
  isLoading: boolean;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File, type: string, name: string) => Promise<boolean>;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  isLoading: false,

  fetchDocuments: async () => {
    set({ isLoading: true });
    const { agent } = useAuthStore.getState();

    if (!agent) {
      set({ isLoading: false });
      return;
    }

    const { adminDb } = await import('@/lib/adminDb');
    const { data: documents } = await adminDb<Document[]>({
      action: 'select',
      table: 'documents',
      filters: { agent_id: agent.id },
      order: { column: 'uploaded_at', ascending: false },
    });

    if (documents) {
      set({ documents, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  uploadDocument: async (file, type, name) => {
    const supabase = getSupabaseClient();
    const { agent } = useAuthStore.getState();

    if (!agent) return false;

    // Upload to storage (storage operations don't have RLS recursion issue)
    const filePath = `${agent.id}/${type}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return false;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Create document record via admin API to bypass RLS
    const { adminDb } = await import('@/lib/adminDb');
    const { error: dbError } = await adminDb({
      action: 'insert',
      table: 'documents',
      data: {
        agent_id: agent.id,
        type,
        name,
        url: urlData.publicUrl,
        status: 'pending',
      },
    });

    if (dbError) {
      console.error('DB error:', dbError);
      return false;
    }

    return true;
  },
}));
