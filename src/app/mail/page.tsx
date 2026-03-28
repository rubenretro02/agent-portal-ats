'use client';

import { useState, useEffect } from 'react';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MailX } from 'lucide-react';

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

  // Has mail - show Roundcube iframe
  return (
    <UnifiedLayout title="Agent Mail">
      <div className="h-[calc(100vh-140px)] bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <iframe
          src="http://172.86.89.39:8080"
          className="w-full h-full border-0"
          title="Agent Mail - Roundcube"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </UnifiedLayout>
  );
}
