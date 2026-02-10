'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStore } from '@/store/adminStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ChevronRight,
  RefreshCw,
  Shield,
  UserPlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PIPELINE_STAGES } from '@/lib/constants';

interface AgentWithProfile {
  id: string;
  ats_id: string;
  pipeline_status: string;
  pipeline_stage: number;
  created_at: string;
  scores: Record<string, number> | null;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface Metrics {
  totalAgents: number;
  pendingApplications: number;
  approvalRate: number;
  activeOpportunities: number;
}

interface PipelineData {
  status: string;
  count: number;
}

export default function AdminDashboard() {
  const { currentUser, hasPermission } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState<Metrics>({
    totalAgents: 0,
    pendingApplications: 0,
    approvalRate: 0,
    activeOpportunities: 0,
  });
  const [pipelineData, setPipelineData] = useState<PipelineData[]>([]);
  const [recentAgents, setRecentAgents] = useState<AgentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);

      try {
        const { adminDb } = await import('@/lib/adminDb');

        // Fetch agents with profiles
        const { data: agents, error: agentsError } = await adminDb<AgentWithProfile[]>({
          action: 'select',
          table: 'agents',
          select: '*, profiles (first_name, last_name, email)',
          order: { column: 'created_at', ascending: false },
          limit: 10,
        });

        if (!agentsError && agents) {
          setRecentAgents(agents);
        }

        // Fetch total agent count
        const { data: allAgents } = await adminDb<Record<string, unknown>[]>({
          action: 'select', table: 'agents', select: 'id',
        });
        const totalAgents = allAgents?.length || 0;

        // Fetch pending applications count
        const { data: pendingAgents } = await adminDb<Record<string, unknown>[]>({
          action: 'select', table: 'agents', select: 'id',
          filters: { pipeline_status: 'applied' },
        });
        const pendingApps = pendingAgents?.length || 0;

        // Fetch approved/hired count for approval rate
        const { data: approvedAgents } = await adminDb<Record<string, unknown>[]>({
          action: 'select', table: 'agents', select: 'id, pipeline_status',
        });
        const approvedCount = approvedAgents?.filter((a: Record<string, unknown>) =>
          ['approved', 'hired', 'active'].includes(a.pipeline_status as string)
        ).length || 0;

        // Fetch active opportunities count
        const { data: activeOppData } = await adminDb<Record<string, unknown>[]>({
          action: 'select', table: 'opportunities', select: 'id',
          filters: { status: 'active' },
        });
        const activeOpps = activeOppData?.length || 0;

        // Calculate approval rate
        const approvalRate = totalAgents > 0
          ? Math.round((approvedCount / totalAgents) * 100)
          : 0;

        setMetrics({
          totalAgents,
          pendingApplications: pendingApps,
          approvalRate,
          activeOpportunities: activeOpps,
        });

        // Build pipeline data from allAgents
        const pipelineCounts: Record<string, number> = {};
        if (allAgents) {
          for (const a of allAgents) {
            const status = a.pipeline_status as string;
            pipelineCounts[status] = (pipelineCounts[status] || 0) + 1;
          }
        }

        setPipelineData(
          PIPELINE_STAGES.map(stage => ({
            status: stage.status,
            count: pipelineCounts[stage.status] || 0,
          }))
        );

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const getStageInfo = (status: string) => {
    return PIPELINE_STAGES.find(s => s.status === status);
  };

  const handleMoveAgent = async (agentId: string, newStatus: string) => {
    const stageIndex = PIPELINE_STAGES.findIndex(s => s.status === newStatus);

    const { adminDb } = await import('@/lib/adminDb');
    const { error } = await adminDb({
      action: 'update', table: 'agents',
      data: {
        pipeline_status: newStatus,
        pipeline_stage: stageIndex + 1,
        last_status_change: new Date().toISOString(),
      },
      match: { id: agentId },
    });

    if (!error) {
      // Refresh the data
      setRecentAgents(prev =>
        prev.map(a =>
          a.id === agentId
            ? { ...a, pipeline_status: newStatus, pipeline_stage: stageIndex + 1 }
            : a
        )
      );
    }
  };

  const filteredAgents = recentAgents.filter(agent => {
    if (!searchQuery) return true;
    const name = `${agent.profiles?.first_name || ''} ${agent.profiles?.last_name || ''}`.toLowerCase();
    const email = (agent.profiles?.email || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Welcome back, {currentUser?.firstName || 'Admin'}!
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Here's what's happening with your agents today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={currentUser?.role === 'admin' ? 'bg-cyan-100 text-cyan-700' : 'bg-teal-100 text-teal-700'}
            >
              {currentUser?.role === 'admin' ? (
                <><Shield className="h-3 w-3 mr-1" />Administrator</>
              ) : (
                <><UserPlus className="h-3 w-3 mr-1" />Recruiter</>
              )}
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Total Agents</p>
                  <p className="text-2xl font-bold text-zinc-900">{metrics.totalAgents.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Pending Apps</p>
                  <p className="text-2xl font-bold text-zinc-900">{metrics.pendingApplications}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>Review pending</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Approval Rate</p>
                  <p className="text-2xl font-bold text-zinc-900">{metrics.approvalRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <Progress value={metrics.approvalRate} className="h-2 mt-3" />
            </CardContent>
          </Card>

          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Active Opportunities</p>
                  <p className="text-2xl font-bold text-zinc-900">{metrics.activeOpportunities}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Overview */}
        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Pipeline Overview</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {pipelineData.map((item) => {
                const stageInfo = getStageInfo(item.status);
                return (
                  <div
                    key={item.status}
                    className="p-3 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stageInfo?.color }} />
                      <span className="text-xs font-medium text-zinc-600 truncate">
                        {stageInfo?.label.en}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-zinc-900">{item.count}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applications */}
          <Card className="lg:col-span-2 border-zinc-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Recent Applicants</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAgents.length === 0 ? (
                  <p className="text-center text-zinc-500 py-8">No agents found</p>
                ) : (
                  filteredAgents.map((agent) => {
                    const stageInfo = getStageInfo(agent.pipeline_status);
                    const name = `${agent.profiles?.first_name || ''} ${agent.profiles?.last_name || ''}`.trim() || 'Unknown';
                    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
                    const score = agent.scores?.overall || 0;

                    return (
                      <div
                        key={agent.id}
                        className="flex items-center gap-4 p-3 rounded-lg border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 transition-all"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center text-zinc-600 font-medium">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-900">{name}</p>
                          <p className="text-sm text-zinc-500 truncate">{agent.profiles?.email}</p>
                        </div>
                        <Badge style={{ backgroundColor: `${stageInfo?.color}20`, color: stageInfo?.color }}>
                          {stageInfo?.label.en}
                        </Badge>
                        {score > 0 && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-zinc-900">{score}</p>
                            <p className="text-xs text-zinc-500">Score</p>
                          </div>
                        )}
                        {hasPermission('canMoveAgentStages') && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Profile</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMoveAgent(agent.id, 'screening')}>
                                Move to Screening
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMoveAgent(agent.id, 'training')}>
                                Move to Training
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMoveAgent(agent.id, 'approved')}>
                                Approve
                              </DropdownMenuItem>
                              {hasPermission('canRejectAgents') && (
                                <DropdownMenuItem className="text-red-600">Reject</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <Link href="/admin/agents">
                <Button variant="ghost" className="w-full mt-4 text-cyan-600">
                  View All Applicants
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-zinc-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-zinc-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/admin/opportunities">
                  <Button variant="outline" className="w-full justify-start">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Manage Opportunities
                  </Button>
                </Link>
                <Link href="/admin/agents">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    View All Agents
                  </Button>
                </Link>
                {hasPermission('canManageRecruiters') && (
                  <Link href="/admin/recruiters">
                    <Button variant="outline" className="w-full justify-start">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Manage Recruiters
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Status - Only for Admins */}
        {hasPermission('canManageSettings') && (
          <Card className="border-zinc-200 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Supabase Connection Status</h3>
                  <p className="text-zinc-400 text-sm">Real-time database connection active</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-zinc-400">Status</p>
                    <p className="font-medium">Connected</p>
                  </div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-2xl font-bold">{metrics.totalAgents}</p>
                  <p className="text-xs text-zinc-400">Total Agents</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-2xl font-bold">{metrics.pendingApplications}</p>
                  <p className="text-xs text-zinc-400">Pending Apps</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-2xl font-bold">{metrics.activeOpportunities}</p>
                  <p className="text-xs text-zinc-400">Active Opps</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
