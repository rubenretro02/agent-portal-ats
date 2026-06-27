import { LoginForm } from '@/components/auth/LoginForm';

/**
 * Root route = the single, unified WingCX sign-in.
 * The public marketing landing lives on the WingCX website; this portal
 * opens straight into authentication and routes by role afterwards.
 */
export default function Home() {
  return <LoginForm />;
}
