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
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Lock, Globe, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle, AtSign } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, isLoading: authLoading, isAuthenticated } = useAuthContext();
  const { language, setLanguage } = useAuthStore();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(language === 'es' ? 'Por favor complete todos los campos' : 'Please fill in all fields');
      return false;
    }
    if (formData.username.length < 3) {
      setError(language === 'es' ? 'El usuario debe tener al menos 3 caracteres' : 'Username must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      setError(language === 'es' ? 'El usuario solo puede contener letras y números' : 'Username can only contain letters and numbers');
      return false;
    }
    if (formData.password.length < 6) {
      setError(language === 'es' ? 'La contraseña debe tener al menos 6 caracteres' : 'Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match');
      return false;
    }
    if (!formData.acceptTerms) {
      setError(language === 'es' ? 'Debe aceptar los términos y condiciones' : 'You must accept the terms and conditions');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    const { error: signUpError } = await signUp(
      formData.email,
      formData.password,
      {
        username: formData.username,
      }
    );

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
    }
  };

  const updateForm = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">
            {language === 'es' ? '¡Registro Exitoso!' : 'Registration Successful!'}
          </h1>
          <p className="text-zinc-600 mb-6">
            {language === 'es'
              ? 'Te hemos enviado un correo de confirmación. Por favor verifica tu email para activar tu cuenta.'
              : 'We have sent you a confirmation email. Please verify your email to activate your account.'}
          </p>
          <Link href="/login">
            <Button className="bg-teal-500 hover:bg-teal-600">
              {language === 'es' ? 'Ir al inicio de sesión' : 'Go to login'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-teal-900 to-cyan-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />

        <div className="absolute top-20 left-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
              AP
            </div>
            <span className="text-2xl font-bold">AgentHub</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-4">
              {language === 'es' ? 'Comienza tu carrera como agente' : 'Start your agent career'}
            </h2>
            <p className="text-lg text-white/80 leading-relaxed mb-8">
              {language === 'es'
                ? 'Regístrate en segundos y completa tu perfil después.'
                : 'Register in seconds and complete your profile later.'}
            </p>
            <div className="space-y-4">
              {[
                language === 'es' ? 'Registro rápido' : 'Quick registration',
                language === 'es' ? 'Completa tu perfil después' : 'Complete profile later',
                language === 'es' ? 'Accede a oportunidades' : 'Access opportunities',
                language === 'es' ? 'Trabajo 100% remoto' : '100% remote work',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div />
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
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
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-white">
              AP
            </div>
            <span className="text-xl font-bold text-zinc-900">AgentHub</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">{t('auth', 'signup')}</h1>
            <p className="text-zinc-500">
              {language === 'es' ? 'Crea tu cuenta en segundos' : 'Create your account in seconds'}
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
              <Label htmlFor="username">{language === 'es' ? 'Usuario' : 'Username'} *</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-5 w-5" />
                <Input
                  id="username"
                  type="text"
                  placeholder={language === 'es' ? 'juanperez123' : 'johndoe123'}
                  value={formData.username}
                  onChange={(e) => updateForm('username', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  className="pl-10 h-12"
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-zinc-500">
                {language === 'es' ? 'Solo letras y números, mínimo 3 caracteres' : 'Only letters and numbers, minimum 3 characters'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth', 'email')} *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder={language === 'es' ? 'tu@email.com' : 'you@email.com'}
                  value={formData.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  className="pl-10 h-12"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth', 'password')} *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-5 w-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                {language === 'es' ? 'Mínimo 6 caracteres' : 'Minimum 6 characters'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth', 'confirmPassword')} *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-5 w-5" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateForm('confirmPassword', e.target.value)}
                  className="pl-10 h-12"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-lg">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(v) => updateForm('acceptTerms', v as boolean)}
                disabled={isLoading}
              />
              <label htmlFor="terms" className="text-sm text-zinc-600">
                {language === 'es'
                  ? 'Acepto los Términos de Servicio y la Política de Privacidad'
                  : 'I agree to the Terms of Service and Privacy Policy'}
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth', 'signup')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-zinc-500">
              {t('auth', 'hasAccount')}{' '}
              <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
                {t('auth', 'login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
