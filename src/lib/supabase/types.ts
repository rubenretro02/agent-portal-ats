export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          role?: 'agent' | 'admin' | 'recruiter';
          is_active?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          role?: 'agent' | 'admin' | 'recruiter';
          is_active?: boolean;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      agents: {
        Row: {
          id: string;
          user_id: string;
          ats_id: string;
          pipeline_status: string;
          pipeline_stage: number;
          application_date: string;
          last_status_change: string;
          address: Json | null;
          languages: Json | null;
          skills: Json | null;
          experience: Json | null;
          equipment: Json | null;
          availability: Json | null;
          scores: Json | null;
          preferred_language: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ats_id?: string;
          pipeline_status?: string;
          pipeline_stage?: number;
          application_date?: string;
          last_status_change?: string;
          address?: Json | null;
          languages?: Json | null;
          skills?: Json | null;
          experience?: Json | null;
          equipment?: Json | null;
          availability?: Json | null;
          scores?: Json | null;
          preferred_language?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          pipeline_status?: string;
          pipeline_stage?: number;
          last_status_change?: string;
          address?: Json | null;
          languages?: Json | null;
          skills?: Json | null;
          experience?: Json | null;
          equipment?: Json | null;
          availability?: Json | null;
          scores?: Json | null;
          preferred_language?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      opportunities: {
        Row: {
          id: string;
          name: string;
          description: string;
          client: string;
          status: string;
          category: string | null;
          requirements: Json | null;
          compensation: Json | null;
          schedule: Json | null;
          max_agents: number;
          current_agents: number;
          open_positions: number;
          training: Json | null;
          tags: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          client: string;
          status?: string;
          category?: string | null;
          requirements?: Json | null;
          compensation?: Json | null;
          schedule?: Json | null;
          max_agents?: number;
          current_agents?: number;
          open_positions?: number;
          training?: Json | null;
          tags?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          client?: string;
          status?: string;
          category?: string | null;
          requirements?: Json | null;
          compensation?: Json | null;
          schedule?: Json | null;
          max_agents?: number;
          current_agents?: number;
          open_positions?: number;
          training?: Json | null;
          tags?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      application_questions: {
        Row: {
          id: string;
          opportunity_id: string;
          question: string;
          question_es: string | null;
          type: string;
          required: boolean;
          order: number;
          options: Json | null;
          placeholder: string | null;
          placeholder_es: string | null;
          validation: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          opportunity_id: string;
          question: string;
          question_es?: string | null;
          type?: string;
          required?: boolean;
          order?: number;
          options?: Json | null;
          placeholder?: string | null;
          placeholder_es?: string | null;
          validation?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          question?: string;
          question_es?: string | null;
          type?: string;
          required?: boolean;
          order?: number;
          options?: Json | null;
          placeholder?: string | null;
          placeholder_es?: string | null;
          validation?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          agent_id: string;
          opportunity_id: string;
          status: string;
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          notes: string | null;
          confirmation_email_sent: boolean;
          confirmation_email_sent_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          opportunity_id: string;
          status?: string;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          notes?: string | null;
          confirmation_email_sent?: boolean;
          confirmation_email_sent_at?: string | null;
        };
        Update: {
          status?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          notes?: string | null;
          confirmation_email_sent?: boolean;
          confirmation_email_sent_at?: string | null;
        };
        Relationships: [];
      };
      application_answers: {
        Row: {
          id: string;
          application_id: string;
          question_id: string;
          value: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          question_id: string;
          value: Json;
          created_at?: string;
        };
        Update: {
          value?: Json;
        };
        Relationships: [];
      };
      documents: {
        Row: {
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
        };
        Insert: {
          id?: string;
          agent_id: string;
          type: string;
          name: string;
          url: string;
          status?: string;
          uploaded_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          expires_at?: string | null;
          notes?: string | null;
        };
        Update: {
          type?: string;
          name?: string;
          url?: string;
          status?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          expires_at?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          agent_id: string;
          type: string;
          title: string;
          message: string;
          read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          type: string;
          title: string;
          message: string;
          read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          agent_id: string;
          type: string;
          subject: string;
          content: string;
          read: boolean;
          sent_at: string;
          read_at: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          type: string;
          subject: string;
          content: string;
          read?: boolean;
          sent_at?: string;
          read_at?: string | null;
          metadata?: Json | null;
        };
        Update: {
          read?: boolean;
          read_at?: string | null;
        };
        Relationships: [];
      };
      onboarding_steps: {
        Row: {
          id: string;
          agent_id: string;
          step_key: string;
          name: string;
          description: string;
          order: number;
          required_pipeline_status: Json | null;
          is_required: boolean;
          type: string;
          completed: boolean;
          completed_at: string | null;
          data: Json | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          step_key: string;
          name: string;
          description: string;
          order?: number;
          required_pipeline_status?: Json | null;
          is_required?: boolean;
          type: string;
          completed?: boolean;
          completed_at?: string | null;
          data?: Json | null;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          data?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
