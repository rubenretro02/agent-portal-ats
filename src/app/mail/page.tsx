'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MailX, AlertTriangle } from 'lucide-react';
interface MailAccount {
  has_mail: boolean;
  email: string | null;
  is_active: boolean;
}
export default function MailPage() {
  const [mailAccount, setMailAccount] = useState<MailAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [ssoUrl, setSsoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Get session token and build SSO URL
  const initializeSSO = useCallback(async () => {
    try {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('No hay sesión activa');
        setLoading(false);
        return;
      }
      // Check mail account status
      const response = await fetch('/api/mail/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMailAccount(data);
        // If mail is active, build SSO URL
        if (data.has_mail && data.is_active) {
          const ssoEndpoint = `/api/mail/sso?token=${encodeURIComponent(session.access_token)}`;
          setSsoUrl(ssoEndpoint);
        }
      } else {
        setError('Error al verificar cuenta de correo');
      }
    } catch (err) {
      console.error('Error initializing SSO:', err);
      setError('Error al inicializar');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    initializeSSO();
  }, [initializeSSO]);
  // Loading state
  if (loading) {
    return (
      <UnifiedLayout title="Agent Mail">
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-teal-500 mx-auto mb-4" />
            <p className="text-zinc-500">Conectando con tu correo...</p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }
  // Error state
  if (error) {
    return (
      <UnifiedLayout title="Agent Mail">
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <Card className="max-w-md w-full border-zinc-200">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 mb-2">
                Error de conexión
              </h2>
              <p className="text-zinc-500 mb-6">{error}</p>
            </CardContent>
          </Card>
        </div>
      </UnifiedLayout>
    );
  }
  // No mail account
  if (!mailAccount?.has_mail) {
    return (
      <UnifiedLayout title="Agent Mail">
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <Card className="max-w-md w-full border-zinc-200">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center mx-auto mb-6">
                <MailX className="h-10 w-10 text-zinc-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 mb-2">
                Tu correo no está activado
              </h2>
              <p className="text-zinc-500 mb-6">
                Tu cuenta de Agent Mail aún no ha sido activada.
                Contacta a tu administrador para activar tu buzón de correo.
              </p>
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <p className="text-sm text-zinc-600">
                  Una vez activado, podrás:
                </p>
                <ul className="text-sm text-zinc-500 mt-2 space-y-1">
                  <li>Enviar y recibir correos</li>
                  <li>Gestionar tu bandeja de entrada</li>
                  <li>Comunicarte con el equipo</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </UnifiedLayout>
    );
  }
  // Mail inactive
  if (!mailAccount?.is_active) {
    return (
      <UnifiedLayout title="Agent Mail">
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <Card className="max-w-md w-full border-zinc-200">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mx-auto mb-6">
                <MailX className="h-10 w-10 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 mb-2">
                Tu buzón está desactivado
              </h2>
              <p className="text-zinc-500 mb-6">
                Tu buzón de correo ha sido desactivado temporalmente.
                Contacta a tu administrador si crees que esto es un error.
              </p>
            </CardContent>
          </Card>
        </div>
      </UnifiedLayout>
    );
  }
  // Active mail - show iframe with SSO
  return (
    <UnifiedLayout title="Agent Mail">
      <div className="h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        {ssoUrl ? (
          <iframe
            ref={iframeRef}
            src={ssoUrl}
            className="w-full h-full border-0"
            title="Agent Mail"
            allow="fullscreen"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          </div>
        )}
      </div>
    </UnifiedLayout>
  );
}
