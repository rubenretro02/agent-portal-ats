import type { PipelineStatus, DocumentType } from '@/types';

// Pipeline Stage Configurations
export const PIPELINE_STAGES: { status: PipelineStatus; label: { en: string; es: string }; color: string; order: number }[] = [
  { status: 'applied', label: { en: 'Applied', es: 'Aplicado' }, color: '#3B82F6', order: 1 },
  { status: 'screening', label: { en: 'Screening', es: 'Revisión' }, color: '#8B5CF6', order: 2 },
  { status: 'background_check', label: { en: 'Background Check', es: 'Verificación' }, color: '#F59E0B', order: 3 },
  { status: 'training', label: { en: 'Training', es: 'Entrenamiento' }, color: '#10B981', order: 4 },
  { status: 'approved', label: { en: 'Approved', es: 'Aprobado' }, color: '#22C55E', order: 5 },
  { status: 'hired', label: { en: 'Hired', es: 'Contratado' }, color: '#14B8A6', order: 6 },
  { status: 'active', label: { en: 'Active', es: 'Activo' }, color: '#06B6D4', order: 7 },
  { status: 'inactive', label: { en: 'Inactive', es: 'Inactivo' }, color: '#6B7280', order: 8 },
  { status: 'rejected', label: { en: 'Rejected', es: 'Rechazado' }, color: '#EF4444', order: 9 },
];

export const DOCUMENT_TYPES: { type: DocumentType; label: { en: string; es: string }; required: boolean }[] = [
  { type: 'w9', label: { en: 'W-9 Tax Form', es: 'Formulario W-9' }, required: true },
  { type: 'nda', label: { en: 'Non-Disclosure Agreement', es: 'Acuerdo de Confidencialidad' }, required: true },
  { type: 'contract', label: { en: 'Independent Contractor Agreement', es: 'Contrato de Contratista' }, required: true },
  { type: 'id_front', label: { en: 'ID (Front)', es: 'Identificación (Frente)' }, required: true },
  { type: 'id_back', label: { en: 'ID (Back)', es: 'Identificación (Reverso)' }, required: true },
  { type: 'background_consent', label: { en: 'Background Check Consent', es: 'Consentimiento de Verificación' }, required: true },
  { type: 'tax_form', label: { en: 'Additional Tax Forms', es: 'Formularios Fiscales Adicionales' }, required: false },
  { type: 'other', label: { en: 'Other Documents', es: 'Otros Documentos' }, required: false },
];

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

export const SKILLS = [
  'Customer Service',
  'Technical Support',
  'Sales',
  'Bilingual (English/Spanish)',
  'Healthcare',
  'Financial Services',
  'Insurance',
  'Telecommunications',
  'E-commerce',
  'Travel & Hospitality',
];

export const SHIFTS = {
  morning: { en: 'Morning (6AM - 2PM)', es: 'Mañana (6AM - 2PM)' },
  afternoon: { en: 'Afternoon (2PM - 10PM)', es: 'Tarde (2PM - 10PM)' },
  evening: { en: 'Evening (6PM - 12AM)', es: 'Noche (6PM - 12AM)' },
  overnight: { en: 'Overnight (10PM - 6AM)', es: 'Madrugada (10PM - 6AM)' },
};

// UI Translations
export const UI_TRANSLATIONS = {
  en: {
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      opportunities: 'Opportunities',
      onboarding: 'Onboarding',
      documents: 'Documents',
      messages: 'Messages',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Log Out',
    },
    // Auth
    auth: {
      login: 'Log In',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      welcome: 'Welcome',
      welcomeBack: 'Welcome Back',
      loginSubtitle: 'Log in to your Agent Portal',
      signupSubtitle: 'Create your account to get started',
    },
    // Dashboard
    dashboard: {
      title: 'Dashboard',
      applicationStatus: 'Application Status',
      pendingRequirements: 'Pending Requirements',
      activeOpportunities: 'Active Opportunities',
      recentMessages: 'Recent Messages',
      quickActions: 'Quick Actions',
      viewAll: 'View All',
      noNotifications: 'No new notifications',
    },
    // Opportunities
    opportunities: {
      title: 'Available Opportunities',
      apply: 'Apply Now',
      applied: 'Applied',
      requirements: 'Requirements',
      compensation: 'Compensation',
      schedule: 'Schedule',
      noAvailable: 'No opportunities available at this time',
      applicationForm: 'Application Form',
      submitApplication: 'Submit Application',
      applicationSubmitted: 'Application Submitted',
      applicationId: 'Application ID',
    },
    // Onboarding
    onboarding: {
      title: 'Onboarding Progress',
      step: 'Step',
      completed: 'Completed',
      pending: 'Pending',
      inProgress: 'In Progress',
      startStep: 'Start',
      continueStep: 'Continue',
    },
    // Documents
    documents: {
      title: 'My Documents',
      upload: 'Upload Document',
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      sign: 'Sign Document',
      view: 'View',
      download: 'Download',
    },
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      submit: 'Submit',
      next: 'Next',
      back: 'Back',
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success',
      required: 'Required',
      optional: 'Optional',
    },
  },
  es: {
    // Navigation
    nav: {
      dashboard: 'Panel',
      opportunities: 'Oportunidades',
      onboarding: 'Incorporación',
      documents: 'Documentos',
      messages: 'Mensajes',
      profile: 'Perfil',
      settings: 'Configuración',
      logout: 'Cerrar Sesión',
    },
    // Auth
    auth: {
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      noAccount: '¿No tienes una cuenta?',
      hasAccount: '¿Ya tienes una cuenta?',
      welcome: 'Bienvenido',
      welcomeBack: 'Bienvenido de Nuevo',
      loginSubtitle: 'Inicia sesión en tu Portal de Agente',
      signupSubtitle: 'Crea tu cuenta para comenzar',
    },
    // Dashboard
    dashboard: {
      title: 'Panel',
      applicationStatus: 'Estado de Aplicación',
      pendingRequirements: 'Requisitos Pendientes',
      activeOpportunities: 'Oportunidades Activas',
      recentMessages: 'Mensajes Recientes',
      quickActions: 'Acciones Rápidas',
      viewAll: 'Ver Todo',
      noNotifications: 'Sin notificaciones nuevas',
    },
    // Opportunities
    opportunities: {
      title: 'Oportunidades Disponibles',
      apply: 'Aplicar Ahora',
      applied: 'Aplicado',
      requirements: 'Requisitos',
      compensation: 'Compensación',
      schedule: 'Horario',
      noAvailable: 'No hay oportunidades disponibles en este momento',
      applicationForm: 'Formulario de Aplicación',
      submitApplication: 'Enviar Aplicación',
      applicationSubmitted: 'Aplicación Enviada',
      applicationId: 'ID de Aplicación',
    },
    // Onboarding
    onboarding: {
      title: 'Progreso de Incorporación',
      step: 'Paso',
      completed: 'Completado',
      pending: 'Pendiente',
      inProgress: 'En Progreso',
      startStep: 'Iniciar',
      continueStep: 'Continuar',
    },
    // Documents
    documents: {
      title: 'Mis Documentos',
      upload: 'Subir Documento',
      pending: 'Pendiente de Revisión',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      sign: 'Firmar Documento',
      view: 'Ver',
      download: 'Descargar',
    },
    // Common
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      submit: 'Enviar',
      next: 'Siguiente',
      back: 'Atrás',
      loading: 'Cargando...',
      error: 'Ocurrió un error',
      success: 'Éxito',
      required: 'Requerido',
      optional: 'Opcional',
    },
  },
};

export type TranslationKey = keyof typeof UI_TRANSLATIONS.en;
