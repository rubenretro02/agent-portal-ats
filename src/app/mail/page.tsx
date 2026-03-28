'use client';
import { useState, useEffect, useRef } from 'react';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  MailX,
  Mail,
  ExternalLink,
  RefreshCw,
  Maximize2,
  Minimize2,
  Copy,
  Check
} from 'lucide-react';
interface MailAccount {
  has_mail: boolean;
  email: string | null;
  is_active: boolean;
}
export default function MailPage() {
  const [mailAccount, setMailAccount] = useState<MailAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const WEBMAIL_URL = 'https://mail.agent-mail.online';
  useEffect(() => {
    async function checkMailAccount() {
      try {
        const { createBrowserClient } = await import('@supabase/ssr');
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setLoading(false);
          return;
        }
        const response = await fetch('/api/mail/status', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setMailAccount(data);
        }
      } catch (error) {
        console.error('Error checking mail account:', error);
      } finally {
        setLoading(false);
      }
    }
    checkMailAccount();
  }, []);
  const refreshMail = () => {
    setIframeKey(prev => prev + 1);
  };
  const openInNewTab = () => {
    window.open(WEBMAIL_URL, '_blank');
  };
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  const copyEmail = () => {
    if (mailAccount?.email) {
      navigator.clipboard.writeText(mailAccount.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  if (loading) {
    return (
      <UnifiedLayout title="Agent Mail">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-teal-500 mx-auto mb-4" />
            <p className="text-zinc-500">Cargando tu correo...</p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }
  if (!mailAccount?.has_mail) {
    return (
      <UnifiedLayout title="Agent Mail">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
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
                  <li>• Enviar y recibir correos</li>
                  <li>• Gestionar tu bandeja de entrada</li>
                  <li>• Comunicarte con el equipo</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </UnifiedLayout>
    );
  }
  if (!mailAccount?.is_active) {
    return (
      <UnifiedLayout title="Agent Mail">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
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
  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-14 bg-gradient-to-r from-zinc-900 to-zinc-800 flex items-center justify-between px-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">Agent Mail</h1>
              <p className="text-zinc-400 text-xs">{mailAccount.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshMail}
              className="text-zinc-300 hover:text-white hover:bg-zinc-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openInNewTab}
              className="text-zinc-300 hover:text-white hover:bg-zinc-700"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-zinc-300 hover:text-white hover:bg-zinc-700"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={WEBMAIL_URL}
          className="w-full h-[calc(100vh-56px)] border-0"
          title="Agent Mail"
          allow="fullscreen"
        />
      </div>
    );
  }
  // Normal mode with embedded mail
  return (
    <UnifiedLayout title="Agent Mail">
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Header with user info and actions */}
        <div className="flex-none bg-gradient-to-r from-teal-500 to-cyan-500 rounded-t-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Agent Mail</h2>
                <div className="flex items-center gap-2">
                  <p className="text-teal-100 text-sm">{mailAccount.email}</p>
                  <button
                    onClick={copyEmail}
                    className="text-teal-200 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshMail}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={openInNewTab}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Nueva pestaña</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Maximize2 className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Expandir</span>
              </Button>
            </div>
          </div>
        </div>
        {/* Embedded webmail iframe */}
        <div className="flex-1 bg-white rounded-b-xl shadow-sm border border-t-0 border-zinc-200 overflow-hidden">
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={WEBMAIL_URL}
            className="w-full h-full border-0"
            title="Agent Mail"
            allow="fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </div>
    </UnifiedLayout>
  );
}
