import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Agent, User, Opportunity, Message, Notification, OnboardingStep, PipelineStatus, Language, Application, ApplicationAnswer } from '@/types';

interface AuthState {
  user: User | null;
  agent: Agent | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: Language;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setLanguage: (lang: Language) => void;
  updateAgent: (agent: Partial<Agent>) => void;
  addApplication: (application: Application) => void;
}

interface OpportunityState {
  opportunities: Opportunity[];
  selectedOpportunity: Opportunity | null;
  isLoading: boolean;
  fetchOpportunities: () => Promise<void>;
  selectOpportunity: (id: string) => void;
  applyToOpportunity: (opportunityId: string, answers: ApplicationAnswer[]) => Promise<{ success: boolean; applicationId: string }>;
}

interface OnboardingState {
  steps: OnboardingStep[];
  currentStep: number;
  isLoading: boolean;
  fetchSteps: () => Promise<void>;
  completeStep: (stepId: string, data?: Record<string, unknown>) => Promise<boolean>;
  setCurrentStep: (step: number) => void;
}

interface NotificationState {
  messages: Message[];
  notifications: Notification[];
  unreadCount: number;
  fetchMessages: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string, type: 'message' | 'notification') => void;
}

// UUID Generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Mock data for demonstration
const mockAgent: Agent = {
  id: 'agent-001',
  userId: 'user-001',
  firstName: 'Maria',
  lastName: 'Garcia',
  email: 'maria.garcia@example.com',
  phone: '+1 (555) 123-4567',
  address: {
    street: '123 Main St',
    city: 'Miami',
    state: 'FL',
    zipCode: '33101',
    country: 'USA',
  },
  atsId: 'ATS-2024-001',
  pipelineStatus: 'training',
  pipelineStage: 4,
  applicationDate: new Date('2024-01-15'),
  lastStatusChange: new Date('2024-01-20'),
  languages: ['English', 'Spanish'],
  skills: ['Customer Service', 'Technical Support', 'Bilingual (English/Spanish)'],
  experience: [
    {
      id: 'exp-1',
      company: 'CallTech Solutions',
      position: 'Customer Service Representative',
      startDate: new Date('2022-06-01'),
      endDate: new Date('2024-01-01'),
      description: 'Handled inbound customer inquiries for telecommunications company',
      isCallCenter: true,
    },
  ],
  equipment: {
    hasComputer: true,
    computerType: 'laptop',
    operatingSystem: 'Windows 11',
    hasHeadset: true,
    internetSpeed: 100,
    hasQuietSpace: true,
    hasBackupInternet: true,
  },
  availability: {
    hoursPerWeek: 40,
    preferredShifts: ['morning', 'afternoon'],
    weekendsAvailable: true,
    holidaysAvailable: false,
    startDate: new Date('2024-02-01'),
  },
  scores: {
    overall: 85,
    communication: 90,
    technical: 80,
    reliability: 88,
    customerService: 92,
    typing: 65,
    assessment: 87,
  },
  evaluations: [],
  documents: [
    { id: 'doc-1', agentId: 'agent-001', type: 'w9', name: 'W-9 Form', url: '#', status: 'approved', uploadedAt: new Date('2024-01-16') },
    { id: 'doc-2', agentId: 'agent-001', type: 'nda', name: 'NDA Agreement', url: '#', status: 'approved', uploadedAt: new Date('2024-01-16') },
    { id: 'doc-3', agentId: 'agent-001', type: 'contract', name: 'Contractor Agreement', url: '#', status: 'pending', uploadedAt: new Date('2024-01-18') },
    { id: 'doc-4', agentId: 'agent-001', type: 'id_front', name: 'ID Front', url: '#', status: 'approved', uploadedAt: new Date('2024-01-16') },
  ],
  activeOpportunities: ['opportunity-001'],
  appliedOpportunities: ['opportunity-001', 'opportunity-002'],
  applications: [],
  metrics: {
    totalCalls: 1250,
    totalHours: 320,
    averageHandleTime: 4.5,
    customerSatisfaction: 4.8,
    firstCallResolution: 0.82,
    adherenceRate: 0.95,
    earnings: {
      thisWeek: 450,
      thisMonth: 1800,
      allTime: 12500,
    },
  },
  preferredLanguage: 'en',
  timezone: 'America/New_York',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date(),
};

const mockOpportunities: Opportunity[] = [
  {
    id: 'opportunity-001',
    name: 'TechCare Premium Support',
    description: 'Provide technical support for premium software customers. Handle escalated issues and ensure customer satisfaction.',
    client: 'TechCare Inc.',
    status: 'active',
    requirements: {
      minScore: 75,
      languages: ['English'],
      skills: ['Technical Support', 'Customer Service'],
      minExperience: 6,
      requiredDocuments: ['w9', 'nda', 'contract'],
      equipmentRequirements: { hasComputer: true, hasHeadset: true, internetSpeed: 50 },
      backgroundCheckRequired: true,
    },
    compensation: {
      type: 'hourly',
      baseRate: 18,
      bonusStructure: 'Performance bonus up to $200/month',
      currency: 'USD',
    },
    schedule: {
      startDate: new Date('2024-02-01'),
      shiftsAvailable: [],
    },
    capacity: {
      maxAgents: 50,
      currentAgents: 32,
      openPositions: 18,
    },
    training: {
      required: true,
      duration: 40,
      modules: [],
    },
    applicationQuestions: [
      {
        id: 'q1',
        question: 'Why are you interested in this technical support opportunity?',
        questionEs: '¿Por qué te interesa esta oportunidad de soporte técnico?',
        type: 'textarea',
        required: true,
        order: 1,
        placeholder: 'Share your motivation and relevant experience...',
        placeholderEs: 'Comparte tu motivación y experiencia relevante...',
      },
      {
        id: 'q2',
        question: 'How many years of technical support experience do you have?',
        questionEs: '¿Cuántos años de experiencia en soporte técnico tienes?',
        type: 'select',
        required: true,
        order: 2,
        options: [
          { value: '0-1', label: 'Less than 1 year', labelEs: 'Menos de 1 año' },
          { value: '1-2', label: '1-2 years', labelEs: '1-2 años' },
          { value: '3-5', label: '3-5 years', labelEs: '3-5 años' },
          { value: '5+', label: '5+ years', labelEs: '5+ años' },
        ],
      },
      {
        id: 'q3',
        question: 'What troubleshooting tools are you familiar with?',
        questionEs: '¿Con qué herramientas de diagnóstico estás familiarizado?',
        type: 'multiselect',
        required: true,
        order: 3,
        options: [
          { value: 'remote_desktop', label: 'Remote Desktop', labelEs: 'Escritorio Remoto' },
          { value: 'ticketing_systems', label: 'Ticketing Systems', labelEs: 'Sistemas de Tickets' },
          { value: 'crm', label: 'CRM Software', labelEs: 'Software CRM' },
          { value: 'network_diagnostics', label: 'Network Diagnostics', labelEs: 'Diagnóstico de Red' },
        ],
      },
      {
        id: 'q4',
        question: 'Are you comfortable working weekends if needed?',
        questionEs: '¿Estás cómodo trabajando fines de semana si es necesario?',
        type: 'radio',
        required: true,
        order: 4,
        options: [
          { value: 'yes', label: 'Yes', labelEs: 'Sí' },
          { value: 'no', label: 'No', labelEs: 'No' },
          { value: 'sometimes', label: 'Sometimes', labelEs: 'A veces' },
        ],
      },
    ],
    tags: ['Technical', 'Premium', 'Full-time'],
    category: 'Technical Support',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'opportunity-002',
    name: 'HealthLine Bilingual Support',
    description: 'Provide customer support for healthcare insurance inquiries in English and Spanish.',
    client: 'HealthLine Insurance',
    status: 'active',
    requirements: {
      minScore: 80,
      languages: ['English', 'Spanish'],
      skills: ['Healthcare', 'Bilingual (English/Spanish)'],
      minExperience: 12,
      requiredDocuments: ['w9', 'nda', 'contract', 'background_consent'],
      equipmentRequirements: { hasComputer: true, hasHeadset: true, hasQuietSpace: true },
      backgroundCheckRequired: true,
    },
    compensation: {
      type: 'hourly',
      baseRate: 22,
      bonusStructure: 'Quality bonus + $2/hour for bilingual',
      currency: 'USD',
    },
    schedule: {
      startDate: new Date('2024-02-15'),
      shiftsAvailable: [],
    },
    capacity: {
      maxAgents: 30,
      currentAgents: 12,
      openPositions: 18,
    },
    training: {
      required: true,
      duration: 60,
      modules: [],
    },
    applicationQuestions: [
      {
        id: 'hq1',
        question: 'Describe your experience in healthcare or insurance customer service.',
        questionEs: 'Describe tu experiencia en servicio al cliente de salud o seguros.',
        type: 'textarea',
        required: true,
        order: 1,
        placeholder: 'Include specific roles and responsibilities...',
        placeholderEs: 'Incluye roles y responsabilidades específicas...',
      },
      {
        id: 'hq2',
        question: 'Rate your Spanish language proficiency',
        questionEs: 'Califica tu nivel de español',
        type: 'select',
        required: true,
        order: 2,
        options: [
          { value: 'native', label: 'Native Speaker', labelEs: 'Hablante Nativo' },
          { value: 'fluent', label: 'Fluent', labelEs: 'Fluido' },
          { value: 'conversational', label: 'Conversational', labelEs: 'Conversacional' },
          { value: 'basic', label: 'Basic', labelEs: 'Básico' },
        ],
      },
      {
        id: 'hq3',
        question: 'Are you HIPAA certified or willing to get certified?',
        questionEs: '¿Tienes certificación HIPAA o estás dispuesto a obtenerla?',
        type: 'radio',
        required: true,
        order: 3,
        options: [
          { value: 'certified', label: 'Already certified', labelEs: 'Ya certificado' },
          { value: 'willing', label: 'Willing to get certified', labelEs: 'Dispuesto a certificarme' },
          { value: 'not_sure', label: 'Not sure', labelEs: 'No estoy seguro' },
        ],
      },
      {
        id: 'hq4',
        question: 'What is your preferred shift?',
        questionEs: '¿Cuál es tu turno preferido?',
        type: 'select',
        required: true,
        order: 4,
        options: [
          { value: 'morning', label: 'Morning (6AM - 2PM)', labelEs: 'Mañana (6AM - 2PM)' },
          { value: 'afternoon', label: 'Afternoon (2PM - 10PM)', labelEs: 'Tarde (2PM - 10PM)' },
          { value: 'evening', label: 'Evening (6PM - 12AM)', labelEs: 'Noche (6PM - 12AM)' },
          { value: 'flexible', label: 'Flexible', labelEs: 'Flexible' },
        ],
      },
      {
        id: 'hq5',
        question: 'When can you start?',
        questionEs: '¿Cuándo puedes comenzar?',
        type: 'date',
        required: true,
        order: 5,
      },
    ],
    tags: ['Healthcare', 'Bilingual', 'Premium Pay'],
    category: 'Healthcare',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'opportunity-003',
    name: 'ShopEasy Customer Care',
    description: 'Handle order inquiries, returns, and general customer support for e-commerce platform.',
    client: 'ShopEasy',
    status: 'active',
    requirements: {
      minScore: 70,
      languages: ['English'],
      skills: ['Customer Service', 'E-commerce'],
      minExperience: 3,
      requiredDocuments: ['w9', 'nda', 'contract'],
      equipmentRequirements: { hasComputer: true, hasHeadset: true },
      backgroundCheckRequired: false,
    },
    compensation: {
      type: 'hourly',
      baseRate: 15,
      bonusStructure: 'Sales commission on upsells',
      currency: 'USD',
    },
    schedule: {
      startDate: new Date('2024-01-20'),
      shiftsAvailable: [],
    },
    capacity: {
      maxAgents: 100,
      currentAgents: 67,
      openPositions: 33,
    },
    training: {
      required: true,
      duration: 20,
      modules: [],
    },
    applicationQuestions: [
      {
        id: 'sq1',
        question: 'Have you worked in e-commerce customer support before?',
        questionEs: '¿Has trabajado en soporte al cliente de e-commerce antes?',
        type: 'radio',
        required: true,
        order: 1,
        options: [
          { value: 'yes', label: 'Yes', labelEs: 'Sí' },
          { value: 'no', label: 'No', labelEs: 'No' },
        ],
      },
      {
        id: 'sq2',
        question: 'What e-commerce platforms are you familiar with?',
        questionEs: '¿Con qué plataformas de e-commerce estás familiarizado?',
        type: 'multiselect',
        required: false,
        order: 2,
        options: [
          { value: 'shopify', label: 'Shopify', labelEs: 'Shopify' },
          { value: 'woocommerce', label: 'WooCommerce', labelEs: 'WooCommerce' },
          { value: 'magento', label: 'Magento', labelEs: 'Magento' },
          { value: 'amazon', label: 'Amazon Seller Central', labelEs: 'Amazon Seller Central' },
          { value: 'other', label: 'Other', labelEs: 'Otro' },
        ],
      },
      {
        id: 'sq3',
        question: 'How many hours per week can you commit?',
        questionEs: '¿Cuántas horas por semana puedes comprometer?',
        type: 'number',
        required: true,
        order: 3,
        placeholder: 'Enter hours (e.g., 40)',
        placeholderEs: 'Ingresa horas (ej: 40)',
        validation: {
          min: 10,
          max: 60,
          message: 'Must be between 10 and 60 hours',
        },
      },
      {
        id: 'sq4',
        question: 'Tell us about a time you turned an unhappy customer into a satisfied one.',
        questionEs: 'Cuéntanos sobre una vez que convertiste un cliente insatisfecho en uno satisfecho.',
        type: 'textarea',
        required: true,
        order: 4,
        placeholder: 'Describe the situation and how you handled it...',
        placeholderEs: 'Describe la situación y cómo la manejaste...',
      },
    ],
    tags: ['E-commerce', 'Entry Level', 'Flexible'],
    category: 'Customer Service',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockOnboardingSteps: OnboardingStep[] = [
  { id: 'step-1', name: 'Profile Information', description: 'Complete your personal and contact information', order: 1, requiredPipelineStatus: ['applied'], isRequired: true, type: 'info', completed: true, completedAt: new Date('2024-01-15') },
  { id: 'step-2', name: 'Upload Documents', description: 'Submit required documents (W-9, ID, etc.)', order: 2, requiredPipelineStatus: ['applied', 'screening'], isRequired: true, type: 'document', completed: true, completedAt: new Date('2024-01-16') },
  { id: 'step-3', name: 'Skills Assessment', description: 'Complete the typing test and skills evaluation', order: 3, requiredPipelineStatus: ['screening'], isRequired: true, type: 'assessment', completed: true, completedAt: new Date('2024-01-17') },
  { id: 'step-4', name: 'Background Check', description: 'Authorize and complete background verification', order: 4, requiredPipelineStatus: ['background_check'], isRequired: true, type: 'verification', completed: true, completedAt: new Date('2024-01-18') },
  { id: 'step-5', name: 'Sign Contract', description: 'Review and sign the Independent Contractor Agreement', order: 5, requiredPipelineStatus: ['approved'], isRequired: true, type: 'document', completed: false },
  { id: 'step-6', name: 'Complete Training', description: 'Finish required opportunity training modules', order: 6, requiredPipelineStatus: ['training'], isRequired: true, type: 'training', completed: false },
];

const mockMessages: Message[] = [
  { id: 'msg-1', agentId: 'agent-001', type: 'in_app', subject: 'Welcome to the Platform!', content: 'Congratulations on joining! Complete your onboarding to start working on opportunities.', read: true, sentAt: new Date('2024-01-15') },
  { id: 'msg-2', agentId: 'agent-001', type: 'in_app', subject: 'Documents Approved', content: 'Your W-9 and ID documents have been approved. You can now proceed to the next step.', read: true, sentAt: new Date('2024-01-17') },
  { id: 'msg-3', agentId: 'agent-001', type: 'in_app', subject: 'New Opportunity Available', content: 'HealthLine Bilingual Support opportunity is now open for applications. Apply today!', read: false, sentAt: new Date('2024-01-20') },
];

const mockNotifications: Notification[] = [
  { id: 'notif-1', agentId: 'agent-001', type: 'status_change', title: 'Status Updated', message: 'Your application has moved to Training stage', read: false, createdAt: new Date('2024-01-20') },
  { id: 'notif-2', agentId: 'agent-001', type: 'opportunity_available', title: 'New Opportunity', message: 'A new bilingual opportunity matching your skills is available', read: false, actionUrl: '/opportunities', createdAt: new Date('2024-01-19') },
  { id: 'notif-3', agentId: 'agent-001', type: 'reminder', title: 'Complete Training', message: 'Reminder: Complete your training to start working', read: true, actionUrl: '/onboarding', createdAt: new Date('2024-01-18') },
];

// Auth Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      agent: null,
      isAuthenticated: false,
      isLoading: false,
      language: 'en',

      login: async (email: string, _password: string) => {
        set({ isLoading: true });
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock successful login
        const user: User = {
          id: 'user-001',
          email,
          role: 'agent',
          createdAt: new Date('2024-01-15'),
          lastLogin: new Date(),
        };

        set({
          user,
          agent: mockAgent,
          isAuthenticated: true,
          isLoading: false,
        });

        return true;
      },

      logout: () => {
        set({
          user: null,
          agent: null,
          isAuthenticated: false,
        });
      },

      setLanguage: (lang: Language) => {
        set({ language: lang });
        if (get().agent) {
          set({
            agent: { ...get().agent!, preferredLanguage: lang },
          });
        }
      },

      updateAgent: (agentData: Partial<Agent>) => {
        const currentAgent = get().agent;
        if (currentAgent) {
          set({
            agent: { ...currentAgent, ...agentData, updatedAt: new Date() },
          });
        }
      },

      addApplication: (application: Application) => {
        const currentAgent = get().agent;
        if (currentAgent) {
          set({
            agent: {
              ...currentAgent,
              applications: [...(currentAgent.applications || []), application],
              appliedOpportunities: [...currentAgent.appliedOpportunities, application.opportunityId],
              updatedAt: new Date(),
            },
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        language: state.language,
      }),
    }
  )
);

// Opportunity Store
export const useOpportunityStore = create<OpportunityState>((set, get) => ({
  opportunities: [],
  selectedOpportunity: null,
  isLoading: false,

  fetchOpportunities: async () => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    set({ opportunities: mockOpportunities, isLoading: false });
  },

  selectOpportunity: (id: string) => {
    const opportunity = get().opportunities.find(c => c.id === id) || null;
    set({ selectedOpportunity: opportunity });
  },

  applyToOpportunity: async (opportunityId: string, answers: ApplicationAnswer[]) => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate UUID for the application
    const applicationId = generateUUID();

    // Create application record
    const application: Application = {
      id: applicationId,
      agentId: 'agent-001', // Would come from auth store in real app
      opportunityId,
      status: 'pending',
      answers,
      submittedAt: new Date(),
    };

    // Add to agent's applications via auth store
    useAuthStore.getState().addApplication(application);

    set({ isLoading: false });
    return { success: true, applicationId };
  },
}));

// Onboarding Store
export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  steps: [],
  currentStep: 0,
  isLoading: false,

  fetchSteps: async () => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    const completedCount = mockOnboardingSteps.filter(s => s.completed).length;
    set({ steps: mockOnboardingSteps, currentStep: completedCount, isLoading: false });
  },

  completeStep: async (stepId: string, data?: Record<string, unknown>) => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const steps = get().steps.map(step =>
      step.id === stepId
        ? { ...step, completed: true, completedAt: new Date(), data }
        : step
    );

    const completedCount = steps.filter(s => s.completed).length;
    set({ steps, currentStep: completedCount, isLoading: false });
    return true;
  },

  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },
}));

// Notification Store
export const useNotificationStore = create<NotificationState>((set, get) => ({
  messages: [],
  notifications: [],
  unreadCount: 0,

  fetchMessages: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    set({ messages: mockMessages });
  },

  fetchNotifications: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const unreadCount = mockNotifications.filter(n => !n.read).length;
    set({ notifications: mockNotifications, unreadCount });
  },

  markAsRead: (id: string, type: 'message' | 'notification') => {
    if (type === 'message') {
      const messages = get().messages.map(m =>
        m.id === id ? { ...m, read: true, readAt: new Date() } : m
      );
      set({ messages });
    } else {
      const notifications = get().notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter(n => !n.read).length;
      set({ notifications, unreadCount });
    }
  },
}));
