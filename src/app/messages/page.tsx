'use client';

import { useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { useNotificationStore } from '@/store';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, Bell, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default function MessagesPage() {
  const { messages, fetchMessages, markAsRead } = useNotificationStore();
  const { t, language } = useTranslation();
  const dateLocale = language === 'es' ? es : enUS;

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const unreadMessages = messages.filter(m => !m.read);

  return (
    <PortalLayout title={t('dashboard', 'recentMessages')}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-zinc-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{messages.length}</p>
                  <p className="text-xs text-zinc-500">{language === 'es' ? 'Total mensajes' : 'Total messages'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-600">{unreadMessages.length}</p>
                  <p className="text-xs text-zinc-500">{language === 'es' ? 'Sin leer' : 'Unread'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {messages.length === 0 ? (
            <Card className="border-zinc-200">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500">{language === 'es' ? 'No tienes mensajes' : 'No messages'}</p>
              </CardContent>
            </Card>
          ) : (
            messages.map((message) => (
              <Card
                key={message.id}
                className={`border transition-all cursor-pointer hover:shadow-md ${
                  message.read ? 'border-zinc-200 bg-white' : 'border-teal-200 bg-teal-50/50'
                }`}
                onClick={() => markAsRead(message.id, 'message')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      message.read ? 'bg-zinc-100' : 'bg-teal-500'
                    }`}>
                      <Mail className={`h-5 w-5 ${message.read ? 'text-zinc-500' : 'text-white'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${message.read ? 'text-zinc-700' : 'text-zinc-900'}`}>
                          {message.subject}
                        </h4>
                        {!message.read && (
                          <Badge className="bg-teal-500 text-xs">{language === 'es' ? 'Nuevo' : 'New'}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-600 line-clamp-2 mb-2">{message.content}</p>
                      <p className="text-xs text-zinc-400">
                        {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true, locale: dateLocale })}
                      </p>
                    </div>
                    {message.read && <Check className="h-5 w-5 text-zinc-400 shrink-0" />}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
