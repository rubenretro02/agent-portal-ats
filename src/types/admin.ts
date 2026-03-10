// ============================================
// ADMIN TYPES - ROLES & PERMISSIONS
// ============================================

export type AdminRole = 'admin' | 'recruiter';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  avatar?: string;
  department?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  createdBy?: string;
}

export interface AdminPermissions {
  // Recruiter Management
  canManageRecruiters: boolean;
  canViewRecruiters: boolean;

  // Campaign Management
  canCreateCampaigns: boolean;
  canEditCampaigns: boolean;
  canDeleteCampaigns: boolean;
  canViewCampaigns: boolean;

  // Agent Management
  canViewAgents: boolean;
  canEditAgents: boolean;
  canMoveAgentStages: boolean;
  canApproveDocuments: boolean;
  canRejectAgents: boolean;

  // Settings
  canManageSettings: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
}

// Role-based permissions
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  admin: {
    canManageRecruiters: true,
    canViewRecruiters: true,
    canCreateCampaigns: true,
    canEditCampaigns: true,
    canDeleteCampaigns: true,
    canViewCampaigns: true,
    canViewAgents: true,
    canEditAgents: true,
    canMoveAgentStages: true,
    canApproveDocuments: true,
    canRejectAgents: true,
    canManageSettings: true,
    canViewAnalytics: true,
    canExportData: true,
  },
  recruiter: {
    canManageRecruiters: false,
    canViewRecruiters: false,
    canCreateCampaigns: true,
    canEditCampaigns: true,
    canDeleteCampaigns: false,
    canViewCampaigns: true,
    canViewAgents: true,
    canEditAgents: false,
    canMoveAgentStages: true,
    canApproveDocuments: true,
    canRejectAgents: true,
    canManageSettings: false,
    canViewAnalytics: true,
    canExportData: false,
  },
};

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface AdminSession {
  user: AdminUser;
  token: string;
  expiresAt: Date;
}
