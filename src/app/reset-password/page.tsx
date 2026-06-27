'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/supabaseStore';
import { WingMark } from '@/components/BrandMark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Lock, Eye, EyeOff, Globe, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Password recovery — step 2. Reached from the email link, which carries
 * a recovery session. Sets the new password via `auth.updateUser`.
 * Shares the WingCX auth design with the login/register surfaces.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { language, setLanguage } = useAuthStore();
  const supabase = getSupabaseClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // The email link establishes a recovery session; confirm it's present.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setHasSession((prev) => prev ?? !!data.session);
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError(language === 'es' ? 'Por favor complete todos los campos' : 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError(language === 'es' ? 'La contraseña debe tener al menos 6 caracteres' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError(language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    setDone(true);
    setIsLoading(false);
    setTimeout(() => router.replace('/dashboard'), 1800);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {language === 'es' ? 'Contraseña actualizada' : 'Password updated'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'es' ? 'Redirigiéndote a tu panel...' : 'Redirecting you to your dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-8 bg-background relative">
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
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <WingMark className="w-8 h-8" />
          <span className="text-xl font-bold tracking-[-0.025em]">
            <span className="text-foreground">Wing</span>
            <span className="gradient-text">CX</span>
          </span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {language === 'es' ? 'Nueva contraseña' : 'New password'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'es' ? 'Elige una contraseña segura para tu cuenta.' : 'Choose a secure password for your account.'}
          </p>
        </div>

        {hasSession === false && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm mb-6">
            {language === 'es'
              ? 'Este enlace no es válido o ya expiró. Solicita uno nuevo desde "Olvidé mi contraseña".'
              : 'This link is invalid or has expired. Request a new one from "Forgot password".'}
            <div className="mt-3">
              <Link href="/forgot-password" className="text-[var(--brand-blue)] hover:underline font-medium">
                {language === 'es' ? 'Solicitar enlace nuevo' : 'Request a new link'}
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">{language === 'es' ? 'Nueva contraseña' : 'New password'}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Mínimo 6 caracteres' : 'Minimum 6 characters'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{language === 'es' ? 'Confirmar contraseña' : 'Confirm password'}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-12"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="btn-brand w-full h-12 text-base">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{language === 'es' ? 'Guardando...' : 'Saving...'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{language === 'es' ? 'Actualizar contraseña' : 'Update password'}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
