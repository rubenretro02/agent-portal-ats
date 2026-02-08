// ============================================
// AGENT PORTAL + ATS - TYPE DEFINITIONS
// ============================================

// Pipeline Status Types
export type PipelineStatus =
  | 'applied'
  | 'screening'
  | 'background_check'
  | 'training'
  | 'approved'
  | 'hired'
  | 'active'
  | 'inactive'
  | 'rejected';

export type DocumentStatus = 'pending' | 'uploaded' | 'approved' | 'rejected';
export type OpportunityStatus = 'draft' | 'active' | 'paused' | 'closed';

// User & Authentication
export interface User {
  id: string;
  email: string;
  role: 'agent' | 'admin' | 'recruiter';
  createdAt: Date;
  lastLogin?: Date;
}

// Agent Profile (synced with ATS)
export interface Agent {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: Address;
  ssn?: string; // Encrypted, for W9
  dateOfBirth?: Date;

  // ATS Sync Fields
  atsId: string; // ID in the ATS system
  pipelineStatus: PipelineStatus;
  pipelineStage: number;
  applicationDate: Date;
  lastStatusChange: Date;

  // Profile & Skills
  languages: string[];
  skills: string[];
  experience: WorkExperience[];
  equipment: EquipmentInfo;
  availability: Availability;

  // Scores & Evaluations
  scores: AgentScores;
  evaluations: Evaluation[];

  // Documents
  documents: Document[];

  // Opportunities
  activeOpportunities: string[];
  appliedOpportunities: string[];

  // Applications
  applications: Application[];

  // Metrics
  metrics?: AgentMetrics;

  // Preferences
  preferredLanguage: 'en' | 'es';
  timezone: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  isCallCenter: boolean;
}

export interface EquipmentInfo {
  hasComputer: boolean;
  computerType?: 'desktop' | 'laptop';
  operatingSystem?: string;
  hasHeadset: boolean;
  internetSpeed?: number; // Mbps
  hasQuietSpace: boolean;
  hasBackupInternet: boolean;
}

export interface Availability {
  hoursPerWeek: number;
  preferredShifts: ('morning' | 'afternoon' | 'evening' | 'overnight')[];
  weekendsAvailable: boolean;
  holidaysAvailable: boolean;
  startDate: Date;
}

export interface AgentScores {
  overall: number;
  communication: number;
  technical: number;
  reliability: number;
  customerService: number;
  typing: number; // WPM
  assessment?: number;
}

export interface Evaluation {
  id: string;
  type: 'assessment' | 'interview' | 'training' | 'performance';
  evaluatorId: string;
  score: number;
  maxScore: number;
  notes: string;
  date: Date;
}

// Documents
export interface Document {
  id: string;
  agentId: string;
  type: DocumentType;
  name: string;
  url: string;
  status: DocumentStatus;
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  expiresAt?: Date;
  notes?: string;
}

export type DocumentType =
  | 'w9'
  | 'nda'
  | 'contract'
  | 'id_front'
  | 'id_back'
  | 'background_consent'
  | 'tax_form'
  | 'other';

// Application Question Types
export type QuestionType = 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'file' | 'date' | 'number';

export interface ApplicationQuestion {
  id: string;
  question: string;
  questionEs?: string; // Spanish translation
  type: QuestionType;
  required: boolean;
  order: number;
  options?: { value: string; label: string; labelEs?: string }[]; // For select, multiselect, radio
  placeholder?: string;
  placeholderEs?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface ApplicationAnswer {
  questionId: string;
  value: string | string[] | boolean | number | null;
}

// Application (with UUID)
export interface Application {
  id: string; // UUID
  agentId: string;
  opportunityId: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'withdrawn';
  answers: ApplicationAnswer[];
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
}

// Opportunities (formerly Campaigns)
export interface Opportunity {
  id: string;
  name: string;
  description: string;
  client: string;
  status: OpportunityStatus;

  // Requirements
  requirements: OpportunityRequirements;

  // Compensation
  compensation: {
    type: 'hourly' | 'per_call' | 'per_sale' | 'hybrid';
    baseRate: number;
    bonusStructure?: string;
    currency: string;
  };

  // Schedule
  schedule: {
    startDate: Date;
    endDate?: Date;
    shiftsAvailable: ShiftTemplate[];
  };

  // Capacity
  capacity: {
    maxAgents: number;
    currentAgents: number;
    openPositions: number;
  };

  // Training
  training: {
    required: boolean;
    duration: number; // hours
    modules: TrainingModule[];
  };

  // Custom Application Questions
  applicationQuestions: ApplicationQuestion[];

  // Tags & Categories
  tags: string[];
  category: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface OpportunityRequirements {
  minScore: number;
  languages: string[];
  skills: string[];
  minExperience: number; // months
  requiredDocuments: DocumentType[];
  equipmentRequirements: Partial<EquipmentInfo>;
  backgroundCheckRequired: boolean;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  dayOfWeek: number; // 0-6
  startTime: string; // HH:MM
  endTime: string;
  timezone: string;
  spotsAvailable: number;
}

export interface TrainingModule {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  type: 'video' | 'document' | 'quiz' | 'live';
  url?: string;
  passingScore?: number;
}

// Onboarding
export interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  order: number;
  requiredPipelineStatus: PipelineStatus[];
  isRequired: boolean;
  type: 'document' | 'assessment' | 'training' | 'verification' | 'info';
  completed: boolean;
  completedAt?: Date;
  data?: Record<string, unknown>;
}

// Messages & Notifications
export interface Message {
  id: string;
  agentId: string;
  type: 'email' | 'sms' | 'in_app';
  subject: string;
  content: string;
  read: boolean;
  sentAt: Date;
  readAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  agentId: string;
  type: 'status_change' | 'document_approved' | 'opportunity_available' | 'message' | 'reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

// Agent Metrics
export interface AgentMetrics {
  totalCalls: number;
  totalHours: number;
  averageHandleTime: number;
  customerSatisfaction: number;
  firstCallResolution: number;
  adherenceRate: number;
  earnings: {
    thisWeek: number;
    thisMonth: number;
    allTime: number;
  };
}

// ATS Specific Types
export interface ATSPipeline {
  id: string;
  name: string;
  stages: ATSPipelineStage[];
  isDefault: boolean;
  createdAt: Date;
}

export interface ATSPipelineStage {
  id: string;
  name: string;
  order: number;
  status: PipelineStatus;
  color: string;
  automations: ATSAutomation[];
}

export interface ATSAutomation {
  id: string;
  name: string;
  trigger: 'stage_enter' | 'stage_exit' | 'document_uploaded' | 'score_threshold' | 'time_in_stage';
  conditions: ATSCondition[];
  actions: ATSAction[];
  isActive: boolean;
}

export interface ATSCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: string | number | boolean;
}

export interface ATSAction {
  type: 'move_stage' | 'send_email' | 'send_sms' | 'assign_opportunity' | 'create_task' | 'update_field';
  params: Record<string, unknown>;
}

// Webhook Events
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  agentId: string;
  data: Record<string, unknown>;
  timestamp: Date;
  processed: boolean;
}

export type WebhookEventType =
  | 'agent.created'
  | 'agent.updated'
  | 'agent.status_changed'
  | 'document.uploaded'
  | 'document.approved'
  | 'document.rejected'
  | 'opportunity.assigned'
  | 'opportunity.completed'
  | 'application.submitted'
  | 'evaluation.completed';

// API Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface SyncResult {
  success: boolean;
  syncedAt: Date;
  changes: {
    created: number;
    updated: number;
    deleted: number;
  };
  errors?: string[];
}

// Dashboard Metrics
export interface DashboardMetrics {
  totalAgents: number;
  activeAgents: number;
  pendingApplications: number;
  approvalRate: number;
  averageTimeToHire: number;
  activeOpportunities: number;
  documentsToReview: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  agentId?: string;
  agentName?: string;
  timestamp: Date;
}

// Form Types
export interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  preferredLanguage: 'en' | 'es';
  acceptTerms: boolean;
}

export interface ApplicationFormData {
  opportunityId: string;
  experience: WorkExperience[];
  equipment: EquipmentInfo;
  availability: Availability;
  resume?: File;
  answers: ApplicationAnswer[];
}

// Language type
export type Language = 'en' | 'es';

// Utility function to generate UUID
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
