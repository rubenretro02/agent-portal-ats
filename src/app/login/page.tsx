'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuthStore } from '@/store/supabaseStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, Globe, ArrowRight, AlertCircle, AtSign } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isLoading: authLoading, isAuthenticated, profile } = useAuthContext();
  const { language, setLanguage } = useAuthStore();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState(''); // Can be email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = getSupabaseClient();

  useEffect(() => {
    // Only redirect if fully authenticated AND profile is loaded
    // Avoid redirecting if still loading to prevent loops
    if (!authLoading && isAuthenticated && profile) {
      if (profile.role === 'agent') {
        router.replace('/dashboard');
      } else {
        router.replace('/admin');
      }
    }
  }, [authLoading, isAuthenticated, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError(language === 'es' ? 'Por favor complete todos los campos' : 'Please fill in all fields');
      return;
    }

    setIsLoading(true);

    let email = identifier;

    // Check if identifier is a username (not an email)
    if (!identifier.includes('@')) {
      // Look up email by username - try direct query first, fallback to API
      let foundEmail: string | null = null;

      const { data: profileData, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .ilike('username', identifier)
        .single();

      if (!lookupError && profileData) {
        foundEmail = profileData.email;
      } else {
        // Fallback to API route to bypass RLS recursion
        try {
          const res = await fetch('/api/lookup-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: identifier }),
          });
          if (res.ok) {
            const data = await res.json();
            foundEmail = data.email;
          }
        } catch (e) {
          console.error('Username API lookup error:', e);
        }
      }

      if (!foundEmail) {
        setError(language === 'es' ? 'Usuario no encontrado. Intente con su correo electrónico.' : 'Username not found. Try using your email address.');
        setIsLoading(false);
        return;
      }

      email = foundEmail;
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
    // If successful, the auth state change will redirect
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d9488 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/80 via-transparent to-teal-900/60" />

        {/* Decorative Elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
              AP
            </div>
            <span className="text-2xl font-bold">AgentHub</span>
          </div>

          {/* Main Content */}
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-4">
              {language === 'es'
                ? 'Trabaja desde cualquier lugar'
                : 'Work from anywhere'}
            </h2>
            <p className="text-lg text-white/80 leading-relaxed">
              {language === 'es'
                ? 'Únete a la red de agentes 1099 más grande. Elige tus horarios, trabaja desde casa y maximiza tus ingresos.'
                : 'Join the largest 1099 agent network. Choose your hours, work from home, and maximize your earnings.'}
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-12">
            <div>
              <p className="text-3xl font-bold text-teal-400">10K+</p>
              <p className="text-sm text-white/60">
                {language === 'es' ? 'Agentes activos' : 'Active Agents'}
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-teal-400">50+</p>
              <p className="text-sm text-white/60">
                {language === 'es' ? 'Oportunidades' : 'Opportunities'}
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-teal-400">$25/hr</p>
              <p className="text-sm text-white/60">
                {language === 'es' ? 'Promedio' : 'Average'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
        {/* Language Toggle */}
        <div className="absolute top-6 right-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="text-zinc-500 hover:text-zinc-900"
          >
            <Globe className="w-4 h-4 mr-2" />
            {language === 'en' ? 'ES' : 'EN'}
          </Button>
        </div>

        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-white">
              AP
            </div>
            <span className="text-xl font-bold text-zinc-900">AgentHub</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">
              {t('auth', 'welcomeBack')}
            </h1>
            <p className="text-zinc-500">
              {t('auth', 'loginSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-zinc-700">
                {language === 'es' ? 'Usuario o Email' : 'Username or Email'}
              </Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-5 w-5" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder={language === 'es' ? 'usuario o email' : 'username or email'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 h-12 bg-zinc-50 border-zinc-200 focus:bg-white"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-700">
                {t('auth', 'password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-5 w-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-zinc-50 border-zinc-200 focus:bg-white"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                {t('auth', 'forgotPassword')}
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-teal-500/25"
            >
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

          <div className="mt-8 text-center">
            <p className="text-zinc-500">
              {t('auth', 'noAccount')}{' '}
              <Link
                href="/register"
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                {t('auth', 'signup')}
              </Link>
            </p>
          </div>

          {/* Admin Login Link */}
          <div className="mt-6 text-center">
            <Link
              href="/admin/login"
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              {language === 'es' ? '¿Eres administrador?' : 'Are you an admin?'}{' '}
              <span className="text-cyan-600 font-medium">
                {language === 'es' ? 'Iniciar sesión aquí' : 'Login here'}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
