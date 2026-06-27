export type AppRole = 'agent' | 'admin' | 'recruiter';

/**
 * Single source of truth for where a user lands after authenticating.
 *
 * Today every role shares the unified `/dashboard`, which renders the
 * correct surface (AgentDashboard / AdminDashboard) based on the role.
 * This is kept as a function so role-specific homes can diverge later
 * (e.g. an SSO-gated admin area) without touching the login UI.
 */
export function getRoleHomePath(role?: AppRole | string | null): string {
  switch (role) {
    case 'admin':
    case 'recruiter':
    case 'agent':
    default:
      return '/dashboard';
  }
}
