'use client';

import { useState, useEffect } from 'react';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MailX, Mail, ExternalLink, Inbox, Send, Settings } from 'lucide-react';

interface MailAccount {
  has_mail: boolean;
  email: string | null;
  is_active: boolean;
}

export default function MailPage() {
  const [mailAccount, setMailAccount] = useState<MailAccount | null>(null);
  const [loading, setLoading] = useState(true);

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

  const openWebmail = () => {
    window.open('http://172.86.89.39:8080', '_blank');
  };

  if (loading) {
    return (
      <UnifiedLayout title="Agent Mail">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-teal-500 mx-auto mb-4" />
            <p className="text-zinc-500">Verificando tu cuenta de correo...</p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  if (!mailAccount?.has_mail || !mailAccount?.is_active) {
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

  // Has mail - show mail info and button to open webmail
  return (
    <UnifiedLayout title="Agent Mail">
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border-zinc-200 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Mail className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Agent Mail</h2>
                <p className="text-teal-100">{mailAccount.email}</p>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <Inbox className="h-6 w-6 mx-auto mb-2 text-teal-600" />
                <p className="text-sm text-zinc-600">Bandeja de entrada</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <Send className="h-6 w-6 mx-auto mb-2 text-cyan-600" />
                <p className="text-sm text-zinc-600">Enviar correo</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <Settings className="h-6 w-6 mx-auto mb-2 text-zinc-600" />
                <p className="text-sm text-zinc-600">Configuración</p>
              </div>
            </div>

            <Button 
              onClick={openWebmail}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white py-6 text-lg"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Abrir correo en nueva pestaña
            </Button>

            <p className="text-center text-sm text-zinc-500 mt-4">
              Tu correo se abrirá en Roundcube Webmail
            </p>

            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Credenciales de acceso:</strong>
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Usuario: <code className="bg-amber-100 px-1 rounded">{mailAccount.email}</code>
              </p>
              <p className="text-sm text-amber-700">
                Contraseña: La que te proporcionó tu administrador
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  );
}
