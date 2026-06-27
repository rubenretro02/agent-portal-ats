'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuthStore } from '@/store/supabaseStore';
import { useTranslation } from '@/hooks/useTranslation';
import { WingMark } from '@/components/BrandMark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, Globe, ArrowRight, AlertCircle, AtSign } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getRoleHomePath } from '@/lib/auth/roles';
import { SSO_ENABLED, signInWithSSO } from '@/lib/auth/sso';

/**
 * Unified WingCX login — the single sign-in surface for every role
 * (agent, recruiter, admin). On success the user is routed to the home
 * that matches their role (see `getRoleHomePath`). The password form is
 * the active method today; the SSO entry point is scaffolded for the
 * upcoming admin single sign-on and stays hidden until enabled.
 */
export function LoginForm() {
  const router = useRouter();
  const { signIn, isLoading: authLoading, isAuthenticated, profile } = useAuthContext();
  const { language, setLanguage } = useAuthStore();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = getSupabaseClient();

  // Role-aware redirect once the session + profile resolve.
  useEffect(() => {
    if (!authLoading && isAuthenticated && profile) {
      router.replace(getRoleHomePath(profile.role));
    }
  }, [authLoading, isAuthenticated, profile, router]);

  const resolveEmail = async (id: string): Promise<string | null> => {
    if (id.includes('@')) return id;

    // Username → email. Direct query first, API fallback (bypasses RLS recursion).
    const { data, error: lookupError } = await supabase
      .from('profiles')
      .select('email')
      .ilike('username', id)
      .single();

    if (!lookupError && data) return data.email;

    try {
      const res = await fetch('/api/lookup-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: id }),
      });
      if (res.ok) return (await res.json()).email;
    } catch (e) {
      console.error('Username API lookup error:', e);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError(language === 'es' ? 'Por favor complete todos los campos' : 'Please fill in all fields');
      return;
    }

    setIsLoading(true);

    const email = await resolveEmail(identifier);
    if (!email) {
      setError(language === 'es'
        ? 'Usuario no encontrado. Intente con su correo electrónico.'
        : 'Username not found. Try using your email address.');
      setIsLoading(false);
      return;
    }

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? (language === 'es' ? 'Credenciales inválidas' : 'Invalid username/email or password')
          : signInError.message
      );
      setIsLoading(false);
    }
    // On success the redirect effect above takes over once profile loads.
  };

  const handleSSO = async () => {
    setError('');
    const domain = identifier.includes('@') ? identifier.split('@')[1] : '';
    const { url, error: ssoError } = await signInWithSSO(domain);
    if (ssoError) {
      setError(ssoError.message);
    } else if (url) {
      window.location.href = url;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel — branded gradient */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden gradient-brand">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-32 right-16 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 grid-noise opacity-20" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <WingMark className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-[-0.025em]">WingCX</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              {language === 'es' ? 'Trabaja desde cualquier lugar' : 'Work from anywhere'}
            </h2>
            <p className="text-lg text-white/80 leading-relaxed">
              {language === 'es'
                ? 'Una sola plataforma para agentes, reclutadores y administradores. Inicia sesión para continuar.'
                : 'One platform for agents, recruiters, and admins. Sign in to continue.'}
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <p className="text-3xl font-bold">10K+</p>
              <p className="text-sm text-white/60">{language === 'es' ? 'Agentes activos' : 'Active Agents'}</p>
            </div>
            <div>
              <p className="text-3xl font-bold">120+</p>
              <p className="text-sm text-white/60">{language === 'es' ? 'Oportunidades' : 'Opportunities'}</p>
            </div>
            <div>
              <p className="text-3xl font-bold">$25/hr</p>
              <p className="text-sm text-white/60">{language === 'es' ? 'Promedio' : 'Average'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — login form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
        <div className="absolute top-6 right-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Globe className="w-4 h-4 mr-2" />
            {language === 'en' ? 'ES' : 'EN'}
          </Button>
        </div>

        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <WingMark className="w-8 h-8" />
            <span className="text-xl font-bold tracking-[-0.025em]">
              <span className="text-foreground">Wing</span>
              <span className="gradient-text">CX</span>
            </span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('auth', 'welcomeBack')}</h1>
            <p className="text-muted-foreground">{t('auth', 'loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier">
                {language === 'es' ? 'Usuario o Email' : 'Username or Email'}
              </Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder={language === 'es' ? 'usuario o email' : 'username or email'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 h-12"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth', 'password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm text-[var(--brand-blue)] hover:underline font-medium">
                {t('auth', 'forgotPassword')}
              </Link>
            </div>

            <Button type="submit" disabled={isLoading} className="btn-brand w-full h-12 text-base">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{language === 'es' ? 'Ingresando...' : 'Signing in...'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{t('auth', 'login')}</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </form>

          {/* SSO entry point — reserved for admin single sign-on (hidden until enabled) */}
          {SSO_ENABLED && (
            <div className="mt-4">
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">
                    {language === 'es' ? 'o' : 'or'}
                  </span>
                </div>
              </div>
              <Button type="button" variant="outline" onClick={handleSSO} className="w-full h-12">
                {language === 'es' ? 'Continuar con SSO' : 'Continue with SSO'}
              </Button>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              {t('auth', 'noAccount')}{' '}
              <Link href="/register" className="text-[var(--brand-blue)] hover:underline font-medium">
                {t('auth', 'signup')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
