'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { RequirePersonalInfo } from '@/components/RequirePersonalInfo';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function fetchApplications() {
      if (!agent) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          opportunity_id,
          status,
          submitted_at,
          reviewed_at,
          opportunity:opportunities (
            id,
            name,
            client,
            description,
            compensation,
            tags
          )
        `)
        .eq('agent_id', agent.id)
        .order('submitted_at', { ascending: false });

      if (!error && data) {
        setApplications(data as unknown as Application[]);
      }
      setLoading(false);
    }

    if (agent) {
      fetchApplications();
    }
  }, [agent, supabase]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
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
    <PortalLayout title="My Applications">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-50">
                  <FileText className="h-5 w-5 text-teal-600" />
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
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500 mb-4">You haven't applied to any opportunities yet</p>
                <Link href="/opportunities">
                  <Button className="bg-teal-500 hover:bg-teal-600">
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
                      className="border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-zinc-900">
                                {opportunity?.name || 'Opportunity not available'}
                              </h3>
                              <p className="text-sm text-zinc-500">{opportunity?.client}</p>
                            </div>
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
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
    </PortalLayout>
    </RequirePersonalInfo>
  );
}
