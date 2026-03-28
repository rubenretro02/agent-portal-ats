'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Server,
  Clock,
  Copy,
  Check
} from 'lucide-react';

interface AgentMailSectionProps {
  agentId: string;
  agentFirstName: string;
  agentLastName: string;
  agentNumericId: string;
}

interface MailStatus {
  has_mail: boolean;
  email: string | null;
  is_active: boolean;
  created_at?: string;
  last_sync_at?: string;
  sync_error?: string;
  imap_host?: string;
  smtp_host?: string;
}

export function AgentMailSection({
  agentId,
  agentFirstName,
  agentLastName,
  agentNumericId
}: AgentMailSectionProps) {
  const [mailStatus, setMailStatus] = useState<MailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get auth token helper
  const getAuthToken = async () => {
    const { createBrowserClient } = await import('@supabase/ssr');
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  // Fetch mail status
  const fetchMailStatus = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/mail/status?agentId=${agentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMailStatus(data);
      }
    } catch (err) {
      console.error('Error fetching mail status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMailStatus();
  }, [agentId]);

  // Activate mail
  const handleActivateMail = async () => {
    setActivating(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/mail/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ agentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to activate mail');
        return;
      }

      // Refresh status
      await fetchMailStatus();
    } catch (err) {
      console.error('Error activating mail:', err);
      setError('Failed to activate mail');
    } finally {
      setActivating(false);
    }
  };

  // Toggle mail active status
  const handleToggleActive = async (checked: boolean) => {
    setToggling(true);

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch('/api/mail/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ agentId, is_active: checked }),
      });

      if (response.ok) {
        setMailStatus(prev => prev ? { ...prev, is_active: checked } : null);
      }
    } catch (err) {
      console.error('Error toggling mail status:', err);
    } finally {
      setToggling(false);
    }
  };

  // Copy email to clipboard
  const handleCopyEmail = () => {
    if (mailStatus?.email) {
      navigator.clipboard.writeText(mailStatus.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate preview email
  const previewEmail = () => {
    const sanitize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const domain = process.env.NEXT_PUBLIC_MAIL_DOMAIN || 'agent-mail.online';
    return `${sanitize(agentFirstName)}.${sanitize(agentLastName)}.${sanitize(agentNumericId)}@${domain}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className="border-zinc-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Mail className="h-4 w-4 text-cyan-600" />
            Agent Mail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-200 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-cyan-50 to-teal-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
              <Mail className="h-4 w-4 text-white" />
            </div>
            Agent Mail
          </CardTitle>
          {mailStatus?.has_mail && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">
                {mailStatus.is_active ? 'Active' : 'Inactive'}
              </span>
              <Switch
                checked={mailStatus.is_active}
                onCheckedChange={handleToggleActive}
                disabled={toggling}
                className="data-[state=checked]:bg-cyan-500"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {mailStatus?.has_mail ? (
          // Mail account exists
          <div className="space-y-4">
            {/* Email Address */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-zinc-50 to-white border border-zinc-200">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500">Email Address</p>
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {mailStatus.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyEmail}
                className="h-8 w-8 p-0 hover:bg-cyan-50"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4 text-zinc-400" />
                )}
              </Button>
            </div>

            {/* Status indicators */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50">
                <Server className="h-4 w-4 text-zinc-400" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">IMAP</p>
                  <p className="text-xs font-medium text-zinc-700 truncate">
                    {mailStatus.imap_host || 'mail.agent-mail.online'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50">
                <Server className="h-4 w-4 text-zinc-400" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">SMTP</p>
                  <p className="text-xs font-medium text-zinc-700 truncate">
                    {mailStatus.smtp_host || 'mail.agent-mail.online'}
                  </p>
                </div>
              </div>
            </div>

            {/* Created date */}
            {mailStatus.created_at && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Clock className="h-3.5 w-3.5" />
                <span>Created {formatDate(mailStatus.created_at)}</span>
              </div>
            )}

            {/* Sync status */}
            {mailStatus.sync_error && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-700">{mailStatus.sync_error}</span>
              </div>
            )}

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${
                  mailStatus.is_active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                }`}
              >
                {mailStatus.is_active ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Mailbox Active
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Mailbox Inactive
                  </>
                )}
              </Badge>
            </div>
          </div>
        ) : (
          // No mail account - show activate option
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-500 mb-1">No mail account configured</p>
              <p className="text-xs text-zinc-400">
                Activate to create: <span className="font-medium text-zinc-600">{previewEmail()}</span>
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-xs text-red-700">{error}</span>
              </div>
            )}

            <Button
              onClick={handleActivateMail}
              disabled={activating}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
            >
              {activating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Activate Agent Mail
                </>
              )}
            </Button>

            <p className="text-xs text-zinc-400 text-center">
              This will create a mailbox on the mail server and store credentials securely.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
