import { redirect } from 'next/navigation';

/**
 * Legacy agent-login route. The unified login now lives at `/`,
 * so this permanently forwards there to keep old links working.
 */
export default function LegacyLoginPage() {
  redirect('/');
}
