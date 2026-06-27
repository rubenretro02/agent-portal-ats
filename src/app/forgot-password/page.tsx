'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/supabaseStore';
import { WingMark } from '@/components/BrandMark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Mail, Globe, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Password recovery — step 1. Sends a Supabase reset email whose link
 * returns to `/reset-password` to set a new password. Shares the WingCX
 * auth design with the login/register surfaces.
 */
export default function ForgotPasswordPage() {
  const { language, setLanguage } = useAuthStore();
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(language === 'es' ? 'Por favor ingrese su correo' : 'Please enter your email');
      return;
    }

    setIsLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setIsLoading(false);
      return;
    }

    setSent(true);
    setIsLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {language === 'es' ? 'Revisa tu correo' : 'Check your email'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {language === 'es'
              ? `Si existe una cuenta para ${email}, te enviamos un enlace para restablecer tu contraseña.`
              : `If an account exists for ${email}, we've sent a link to reset your password.`}
          </p>
          <Link href="/">
            <Button className="btn-brand">
              {language === 'es' ? 'Volver al inicio de sesión' : 'Back to login'}
            </Button>
          </Link>
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
            {language === 'es' ? 'Recuperar contraseña' : 'Reset password'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'es'
              ? 'Ingresa tu correo y te enviaremos un enlace para restablecerla.'
              : "Enter your email and we'll send you a reset link."}
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
            <Label htmlFor="email">{language === 'es' ? 'Correo electrónico' : 'Email'}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                id="email"
                type="email"
                placeholder={language === 'es' ? 'tu@email.com' : 'you@email.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="btn-brand w-full h-12 text-base">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{language === 'es' ? 'Enviando...' : 'Sending...'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{language === 'es' ? 'Enviar enlace' : 'Send reset link'}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium">
            <ArrowLeft className="w-4 h-4" />
            {language === 'es' ? 'Volver al inicio de sesión' : 'Back to login'}
          </Link>
        </div>
      </div>
    </div>
  );
}
