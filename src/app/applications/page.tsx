'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { RequirePersonalInfo } from '@/components/RequirePersonalInfo';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  ArrowRight,
  FileText,
  ChevronRight,
  Building2,
} from 'lucide-react';

interface Application {
  id: string;
  opportunity_id: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  opportunity: {
    id: string;
    name: string;
    client: string;
    description: string;
    compensation: Record<string, unknown> | null;
    tags: string[];
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700', icon: Clock },
  reviewing: { label: 'Under Review', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Not Selected', color: 'bg-red-100 text-red-700', icon: XCircle },
  withdrawn: { label: 'Withdrawn', color: 'bg-zinc-100 text-zinc-700', icon: XCircle },
};

export default function ApplicationsPage() {
  const { agent, isLoading: authLoading } = useAuthContext();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    async function fetchApplications() {
      if (!agent) return;

      setLoading(true);
      const { adminDb } = await import('@/lib/adminDb');
      const { data, error } = await adminDb<Application[]>({
        action: 'select',
        table: 'applications',
        select: 'id, opportunity_id, status, submitted_at, reviewed_at, opportunity:opportunities (id, name, client, description, compensation, tags)',
        filters: { agent_id: agent.id },
        order: { column: 'submitted_at', ascending: false },
      });

      if (!error && data) {
        setApplications(data);
      }
      setLoading(false);
    }

    if (agent) {
      fetchApplications();
    }
  }, [agent]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--brand-blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const pendingCount = applications.filter(a => a.status === 'pending' || a.status === 'reviewing').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;

  return (
    <RequirePersonalInfo>
    <UnifiedLayout title="My Applications">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--brand-blue-soft)]">
                  <FileText className="h-5 w-5 text-[var(--brand-blue)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900">{applications.length}</p>
                  <p className="text-sm text-zinc-500">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900">{pendingCount}</p>
                  <p className="text-sm text-zinc-500">Under Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900">{approvedCount}</p>
                  <p className="text-sm text-zinc-500">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-zinc-400" />
              Application History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-[var(--brand-blue)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500 mb-4">You haven't applied to any opportunities yet</p>
                <Link href="/opportunities">
                  <Button className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue)]">
                    View Opportunities
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => {
                  const statusConfig = STATUS_CONFIG[application.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;
                  const opportunity = application.opportunity;

                  return (
                    <div
                      key={application.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedApp(application)}
                      onKeyDown={(e) => { if (e.key === 'Enter') setSelectedApp(application); }}
                      className="group border border-zinc-200 rounded-lg p-4 hover:border-[var(--brand-blue)]/40 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h3 className="font-semibold text-zinc-900 group-hover:text-[var(--brand-blue)] transition-colors">
                                {opportunity?.name || 'Opportunity not available'}
                              </h3>
                              <p className="text-sm text-zinc-500">{opportunity?.client}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={statusConfig.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-[var(--brand-blue)] group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>

                          {opportunity?.description && (
                            <p className="text-sm text-zinc-600 line-clamp-2 mb-3">
                              {opportunity.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-zinc-500">
                              <Calendar className="h-4 w-4" />
                              <span>Applied: {formatDate(application.submitted_at)}</span>
                            </div>
                            {opportunity?.compensation && (
                              <div className="flex items-center gap-1 text-emerald-600">
                                <DollarSign className="h-4 w-4" />
                                <span>${String((opportunity.compensation as Record<string, unknown>).baseRate || 0)}/hr</span>
                              </div>
                            )}
                          </div>

                          {opportunity?.tags && opportunity.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {opportunity.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-1 bg-zinc-100 text-zinc-600 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action */}
        {applications.length > 0 && (
          <div className="text-center">
            <Link href="/opportunities">
              <Button variant="outline">
                Explore more opportunities
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Gig Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(o) => !o && setSelectedApp(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedApp && (() => {
            const opp = selectedApp.opportunity;
            const cfg = STATUS_CONFIG[selectedApp.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const comp = opp?.compensation as Record<string, unknown> | null;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-xl">{opp?.name || 'Opportunity'}</DialogTitle>
                      <DialogDescription>{opp?.client}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                  <Badge className={`${cfg.color} w-fit`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {cfg.label}
                  </Badge>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-zinc-900 leading-none">${String(comp?.baseRate || 0)}</p>
                        <p className="text-xs text-zinc-500 mt-1">per hour</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200">
                      <div className="w-9 h-9 rounded-lg bg-[var(--brand-blue-soft)] flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-[var(--brand-blue)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-900 leading-none">{formatDate(selectedApp.submitted_at)}</p>
                        <p className="text-xs text-zinc-500 mt-1">applied</p>
                      </div>
                    </div>
                  </div>

                  {opp?.description && (
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Description</p>
                      <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{opp.description}</p>
                    </div>
                  )}

                  {opp?.tags && opp.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {opp.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}

                  {opp?.id && (
                    <Link href={`/opportunities/${opp.id}`}>
                      <Button variant="outline" className="w-full gap-2">
                        View full opportunity
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </UnifiedLayout>
    </RequirePersonalInfo>
  );
}
