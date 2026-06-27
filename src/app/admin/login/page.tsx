import { redirect } from 'next/navigation';

/**
 * Legacy admin-login route. Admins now sign in through the single
 * unified login at `/`, which routes them by role afterwards.
 */
export default function LegacyAdminLoginPage() {
  redirect('/');
}
