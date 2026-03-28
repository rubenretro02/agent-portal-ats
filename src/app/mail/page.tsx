'use client';

import { useState, useEffect } from 'react';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  Inbox,
  Send,
  FileEdit,
  AlertOctagon,
  Trash2,
  Star,
  Plus,
  Search,
  RefreshCw,
  Mail,
  MailOpen,
  Paperclip,
  Reply,
  Forward,
  X,
  Loader2,
  MailX,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type MailFolder = 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'starred';

interface Email {
  id: string;
  from: { name: string; email: string };
  to: { name: string; email: string }[];
  subject: string;
  preview: string;
  body: string;
  date: Date;
  read: boolean;
  starred: boolean;
  labels: string[];
  attachments: { name: string; size: number; type: string }[];
  folder: string;
}

interface MailAccount {
  has_mail: boolean;
  email: string | null;
  is_active: boolean;
}

const folders: { key: MailFolder; label: string; icon: typeof Inbox }[] = [
  { key: 'inbox', label: 'Inbox', icon: Inbox },
  { key: 'starred', label: 'Starred', icon: Star },
  { key: 'sent', label: 'Sent', icon: Send },
  { key: 'drafts', label: 'Drafts', icon: FileEdit },
  { key: 'spam', label: 'Spam', icon: AlertOctagon },
  { key: 'trash', label: 'Trash', icon: Trash2 },
];

const labels = [
  { name: 'Important', color: 'bg-red-500' },
  { name: 'Work', color: 'bg-blue-500' },
  { name: 'Personal', color: 'bg-green-500' },
  { name: 'Onboarding', color: 'bg-amber-500' },
];

export default function MailPage() {
  const { profile } = useAuthContext();
  const [mailAccount, setMailAccount] = useState<MailAccount | null>(null);
  const [checkingMail, setCheckingMail] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<MailFolder>('inbox');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  // Check if user has mail account
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
          setCheckingMail(false);
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

          // If has mail, fetch emails
          if (data.has_mail && data.is_active) {
            fetchEmails('inbox');
          }
        }
      } catch (error) {
        console.error('Error checking mail account:', error);
      } finally {
        setCheckingMail(false);
      }
    }

    checkMailAccount();
  }, []);

  // Fetch emails from server
  async function fetchEmails(folder: MailFolder) {
    setIsLoading(true);
    try {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/mail/fetch?folder=${folder}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Send email
  async function handleSendEmail() {
    if (!to || !subject) return;

    setSending(true);
    try {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ to, subject, body }),
      });

      if (response.ok) {
        setComposeOpen(false);
        setTo('');
        setSubject('');
        setBody('');
        // Refresh sent folder
        if (currentFolder === 'sent') {
          fetchEmails('sent');
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setSending(false);
    }
  }

  const folderCounts = {
    inbox: emails.filter(e => e.folder === 'inbox' && !e.read).length,
    starred: emails.filter(e => e.starred).length,
    sent: 0,
    drafts: 0,
    spam: 0,
    trash: 0,
  };

  const filteredEmails = emails.filter(email => {
    if (currentFolder === 'starred') return email.starred;
    return email.folder === currentFolder;
  }).filter(email => {
    if (!searchQuery) return true;
    return (
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Loading state
  if (checkingMail) {
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

  // No mail account
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

  // Has mail account - show mail interface
  return (
    <UnifiedLayout title="Agent Mail">
      <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-zinc-200 flex flex-col">
          {/* Compose Button */}
          <div className="p-4">
            <Button
              onClick={() => setComposeOpen(true)}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Compose
            </Button>
          </div>

          {/* Folders */}
          <ScrollArea className="flex-1">
            <div className="px-2">
              {folders.map(folder => {
                const Icon = folder.icon;
                const count = folderCounts[folder.key];
                return (
                  <button
                    key={folder.key}
                    onClick={() => {
                      setCurrentFolder(folder.key);
                      setSelectedEmail(null);
                      fetchEmails(folder.key);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      currentFolder === folder.key
                        ? "bg-teal-50 text-teal-700 font-medium"
                        : "text-zinc-600 hover:bg-zinc-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{folder.label}</span>
                    {count > 0 && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-5 min-w-[20px] px-1.5 text-xs",
                          currentFolder === folder.key
                            ? "bg-teal-100 text-teal-700"
                            : "bg-zinc-200 text-zinc-600"
                        )}
                      >
                        {count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Labels */}
            <div className="px-4 mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Labels</span>
                <button className="text-zinc-400 hover:text-zinc-600">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {labels.map(label => (
                <button
                  key={label.name}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  <span className={cn("w-2.5 h-2.5 rounded-full", label.color)} />
                  <span>{label.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Storage Info */}
          <div className="p-4 border-t border-zinc-200">
            <div className="text-xs text-zinc-500 mb-1">Storage</div>
            <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div className="h-full w-1/4 bg-gradient-to-r from-teal-500 to-cyan-500" />
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              {mailAccount.email}
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="w-96 border-r border-zinc-200 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-zinc-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search mail..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-50 border-zinc-200"
              />
            </div>
          </div>

          {/* Email List Header */}
          <div className="px-4 py-2 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm text-zinc-500">{filteredEmails.length} messages</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchEmails(currentFolder)}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>

          {/* Email List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-400">
                <Mail className="h-8 w-8 mb-2" />
                <p className="text-sm">No hay correos</p>
              </div>
            ) : (
              filteredEmails.map(email => (
                <button
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={cn(
                    "w-full text-left p-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors",
                    selectedEmail?.id === email.id && "bg-teal-50",
                    !email.read && "bg-white"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        // Toggle star
                      }}
                      className="mt-0.5"
                    >
                      <Star className={cn(
                        "h-4 w-4",
                        email.starred ? "fill-amber-400 text-amber-400" : "text-zinc-300"
                      )} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "text-sm truncate",
                          !email.read ? "font-semibold text-zinc-900" : "text-zinc-600"
                        )}>
                          {email.from.name}
                        </span>
                        <span className="text-xs text-zinc-400 ml-2 flex-shrink-0">
                          {formatDistanceToNow(new Date(email.date), { addSuffix: true })}
                        </span>
                      </div>
                      <div className={cn(
                        "text-sm truncate mb-1",
                        !email.read ? "font-medium text-zinc-800" : "text-zinc-600"
                      )}>
                        {email.subject}
                      </div>
                      <div className="text-xs text-zinc-400 truncate">
                        {email.preview}
                      </div>
                      {email.attachments?.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Paperclip className="h-3 w-3 text-zinc-400" />
                          <span className="text-xs text-zinc-400">
                            {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Email View */}
        <div className="flex-1 flex flex-col">
          {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className="p-6 border-b border-zinc-200">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-semibold text-zinc-900">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Reply className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Forward className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-400 text-white">
                      {selectedEmail.from.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-zinc-900">{selectedEmail.from.name}</div>
                    <div className="text-sm text-zinc-500">{selectedEmail.from.email}</div>
                  </div>
                  <div className="ml-auto text-sm text-zinc-400">
                    {formatDistanceToNow(new Date(selectedEmail.date), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <ScrollArea className="flex-1 p-6">
                <div
                  className="prose prose-zinc max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                />
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-400">
              <div className="text-center">
                <MailOpen className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
                <p className="text-lg">Selecciona un correo para leer</p>
              </div>
            </div>
          )}
        </div>

        {/* Compose Modal */}
        {composeOpen && (
          <div className="fixed bottom-4 right-4 w-[500px] bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden z-50">
            <div className="bg-zinc-800 text-white px-4 py-3 flex items-center justify-between">
              <span className="font-medium">Nuevo mensaje</span>
              <button onClick={() => setComposeOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <Input
                placeholder="Para"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="border-0 border-b border-zinc-200 rounded-none px-0 focus-visible:ring-0"
              />
              <Input
                placeholder="Asunto"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="border-0 border-b border-zinc-200 rounded-none px-0 focus-visible:ring-0"
              />
              <Textarea
                placeholder="Escribe tu mensaje..."
                value={body}
                onChange={e => setBody(e.target.value)}
                className="min-h-[200px] border-0 resize-none focus-visible:ring-0"
              />
            </div>
            <div className="px-4 py-3 border-t border-zinc-200 flex items-center justify-between">
              <Button
                onClick={handleSendEmail}
                disabled={sending || !to || !subject}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar
              </Button>
              <Button variant="ghost" onClick={() => setComposeOpen(false)}>
                Descartar
              </Button>
            </div>
          </div>
        )}
      </div>
    </UnifiedLayout>
  );
}
