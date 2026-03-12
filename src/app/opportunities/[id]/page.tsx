'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  Users,
  DollarSign,
  Clock,
  Globe,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface ApplicationStage {
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  label: string;
  description: string;
}

const APPLICATION_STAGES: ApplicationStage[] = [
  { status: 'applied', label: 'Applied', description: 'Initial application' },
  { status: 'screening', label: 'Screening', description: 'Phone/video screening' },
  { status: 'interview', label: 'Interview', description: 'Technical interview' },
  { status: 'offer', label: 'Offer', description: 'Job offer' },
  { status: 'hired', label: 'Hired', description: 'Hired' },
  { status: 'rejected', label: 'Rejected', description: 'Not selected' },
];

const STAGE_COLORS = {
  applied: 'from-blue-100 to-blue-50 border-blue-200',
  screening: 'from-yellow-100 to-yellow-50 border-yellow-200',
  interview: 'from-purple-100 to-purple-50 border-purple-200',
  offer: 'from-green-100 to-green-50 border-green-200',
  hired: 'from-emerald-100 to-emerald-50 border-emerald-200',
  rejected: 'from-red-100 to-red-50 border-red-200',
};

interface Agent {
  id: string;
  ats_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface Application {
  id: string;
  agent_id: string;
  status: string;
  submitted_at: string;
  agent: Agent;
}

interface Opportunity {
  id: string;
  name: string;
  client: string;
  description: string;
  compensation: Record<string, number> | null;
  training: Record<string, number> | null;
}

export default function OpportunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const opportunityId = params.id as string;
  const { profile } = useAuthContext();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingApplication, setMovingApplication] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'recruiter';

  useEffect(() => {
    if (!isAdmin) {
      router.push('/opportunities');
      return;
    }
    fetchOpportunityData();
  }, [opportunityId, isAdmin]);

  const fetchOpportunityData = async () => {
    try {
      setLoading(true);
      const [oppResponse, appResponse] = await Promise.all([
        fetch(`/api/opportunities/${opportunityId}`),
        fetch(`/api/opportunities/${opportunityId}/applications`)
      ]);

      if (oppResponse.ok) {
        const oppData = await oppResponse.json();
        setOpportunity(oppData.opportunity);
      }

      if (appResponse.ok) {
        const appData = await appResponse.json();
        setApplications(appData.applications || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveApplication = async (applicationId: string, newStatus: string) => {
    setMovingApplication(applicationId);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setApplications(apps =>
          apps.map(app =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (err) {
      console.error('Error moving application:', err);
    } finally {
      setMovingApplication(null);
    }
  };

  if (loading) {
    return (
      <UnifiedLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      </UnifiedLayout>
    );
  }

  if (!opportunity) {
    return (
      <UnifiedLayout title="Opportunity Not Found">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500">Opportunity not found</p>
            <Button onClick={() => router.push('/opportunities')} className="mt-4">
              Back to Opportunities
            </Button>
          </CardContent>
        </Card>
      </UnifiedLayout>
    );
  }

  const groupedApplications = APPLICATION_STAGES.reduce((acc, stage) => {
    acc[stage.status] = applications.filter(app => app.status === stage.status);
    return acc;
  }, {} as Record<string, Application[]>);

  const baseRate = (opportunity.compensation as Record<string, number> | null)?.baseRate;
  const trainingHours = (opportunity.training as Record<string, number> | null)?.duration;

  return (
    <UnifiedLayout title={`${opportunity.name} - Application Tracking`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/opportunities')}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">{opportunity.name}</h1>
            <p className="text-zinc-500 mt-1">{opportunity.client}</p>
          </div>
        </div>

        {/* Opportunity Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-cyan-600" />
                <p className="text-xs text-zinc-500">Total Applications</p>
              </div>
              <p className="text-2xl font-bold text-zinc-900">{applications.length}</p>
            </CardContent>
          </Card>

          {baseRate && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs text-zinc-500">Base Rate</p>
                </div>
                <p className="text-2xl font-bold text-zinc-900">${baseRate}/hr</p>
              </CardContent>
            </Card>
          )}

          {trainingHours && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <p className="text-xs text-zinc-500">Training Hours</p>
                </div>
                <p className="text-2xl font-bold text-zinc-900">{trainingHours}h</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <p className="text-xs text-zinc-500">Hired</p>
              </div>
              <p className="text-2xl font-bold text-zinc-900">
                {applications.filter(a => a.status === 'hired').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          {APPLICATION_STAGES.map((stage) => (
            <div key={stage.status} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-900">{stage.label}</h3>
                  <p className="text-xs text-zinc-500">{groupedApplications[stage.status].length}</p>
                </div>
              </div>

              <div className={`min-h-[500px] p-4 rounded-lg border-2 bg-gradient-to-br ${STAGE_COLORS[stage.status]} space-y-2`}>
                {groupedApplications[stage.status].map((app) => (
                  <Card key={app.id} className="cursor-move hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm text-zinc-900">
                        {app.agent?.profiles?.first_name} {app.agent?.profiles?.last_name}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">{app.agent?.ats_id}</p>
                      <p className="text-xs text-zinc-400 mt-1">{app.agent?.profiles?.email}</p>

                      {stage.status !== 'hired' && stage.status !== 'rejected' && (
                        <div className="flex gap-1 mt-3">
                          {APPLICATION_STAGES.filter(s => 
                            s.status !== stage.status && 
                            s.status !== 'applied' &&
                            APPLICATION_STAGES.indexOf(s) >= APPLICATION_STAGES.indexOf(stage)
                          ).slice(0, 2).map((nextStage) => (
                            <Button
                              key={nextStage.status}
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 flex-1"
                              disabled={movingApplication === app.id}
                              onClick={() => handleMoveApplication(app.id, nextStage.status)}
                            >
                              {movingApplication === app.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                '→'
                              )}
                            </Button>
                          ))}
                        </div>
                      )}

                      {stage.status !== 'rejected' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 w-full mt-2 text-red-600 hover:bg-red-50"
                          disabled={movingApplication === app.id}
                          onClick={() => handleMoveApplication(app.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {groupedApplications[stage.status].length === 0 && (
                  <div className="flex items-center justify-center h-32 text-zinc-400">
                    <p className="text-sm">No applications</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </UnifiedLayout>
  );
}
