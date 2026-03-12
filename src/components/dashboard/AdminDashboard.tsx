'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  Calendar,
  Target,
  Zap,
} from 'lucide-react';
import { PIPELINE_STAGES } from '@/lib/constants';

interface AgentWithProfile {
  id: string;
  agent_id: string;
  pipeline_status: string;
  pipeline_stage: number;
  created_at: string;
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

export function AdminDashboard() {
  const { profile } = useAuthContext();
  const [metrics, setMetrics] = useState<Metrics>({
    totalAgents: 0,
    pendingApplications: 0,
    approvalRate: 0,
    activeOpportunities: 0,
  });
  const [recentAgents, setRecentAgents] = useState<AgentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);

      try {
        const { adminDb } = await import('@/lib/adminDb');

        const { data: agents } = await adminDb<AgentWithProfile[]>({
          action: 'select',
          table: 'agents',
          select: '*, profiles (first_name, last_name, email)',
          order: { column: 'created_at', ascending: false },
          limit: 5,
        });

        if (agents) {
          setRecentAgents(agents);
        }

        const { data: allAgents } = await adminDb<Record<string, unknown>[]>({
          action: 'select', table: 'agents', select: 'id, pipeline_status',
        });
        const totalAgents = allAgents?.length || 0;
        const pendingApps = allAgents?.filter(a => a.pipeline_status === 'applied').length || 0;
        const approvedCount = allAgents?.filter((a: Record<string, unknown>) =>
          ['approved', 'hired', 'active'].includes(a.pipeline_status as string)
        ).length || 0;

        const { data: activeOppData } = await adminDb<Record<string, unknown>[]>({
          action: 'select', table: 'opportunities', select: 'id',
          filters: { status: 'active' },
        });

        setMetrics({
          totalAgents,
          pendingApplications: pendingApps,
          approvalRate: totalAgents > 0 ? Math.round((approvedCount / totalAgents) * 100) : 0,
          activeOpportunities: activeOppData?.length || 0,
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric'
  });

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-zinc-500 text-sm">{today}</p>
          <h1 className="text-3xl font-bold text-zinc-900 mt-1">
            Welcome back, {profile?.first_name || 'Admin'}
          </h1>
          <p className="text-zinc-500 mt-2">
            Here's an overview of your recruitment pipeline
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/opportunities">
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/25">
              <Briefcase className="h-4 w-4 mr-2" />
              View Opportunities
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-cyan-100">Total Agents</span>
            </div>
            <p className="text-4xl font-bold">{metrics.totalAgents}</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-amber-100">Pending Review</span>
            </div>
            <p className="text-4xl font-bold">{metrics.pendingApplications}</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-500 to-teal-500 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-emerald-100">Approval Rate</span>
            </div>
            <p className="text-4xl font-bold">{metrics.approvalRate}%</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-violet-100">Opportunities</span>
            </div>
            <p className="text-4xl font-bold">{metrics.activeOpportunities}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Agents */}
        <Card className="lg:col-span-2 border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Agents</CardTitle>
            <Link href="/agents">
              <Button variant="ghost" size="sm" className="text-cyan-600">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentAgents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500">No agents yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAgents.map((agent) => {
                  const name = `${agent.profiles?.first_name || ''} ${agent.profiles?.last_name || ''}`.trim() || 'Unknown';
                  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  const agentId = agent.agent_id?.replace('AGENT ', '') || '00000000';
                  const joinDate = new Date(agent.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  });

                  return (
                    <Link key={agent.id} href={`/agents/${agent.id}`}>
                      <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-50 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-cyan-500/20">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-zinc-900">{name}</p>
                            <ArrowUpRight className="h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-sm text-zinc-500 truncate">{agent.profiles?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-cyan-600">{agentId}</p>
                          <p className="text-xs text-zinc-400">{joinDate}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/opportunities">
              <div className="p-4 rounded-xl border border-zinc-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900">Opportunities</p>
                    <p className="text-sm text-zinc-500">Manage job listings</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-cyan-600 transition-colors" />
                </div>
              </div>
            </Link>

            <Link href="/agents">
              <div className="p-4 rounded-xl border border-zinc-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900">All Agents</p>
                    <p className="text-sm text-zinc-500">View agent directory</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
                </div>
              </div>
            </Link>

            <Link href="/recruiters">
              <div className="p-4 rounded-xl border border-zinc-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900">Recruiters</p>
                    <p className="text-sm text-zinc-500">Manage team members</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-violet-600 transition-colors" />
                </div>
              </div>
            </Link>

            <Link href="/analytics">
              <div className="p-4 rounded-xl border border-zinc-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900">Analytics</p>
                    <p className="text-sm text-zinc-500">View reports</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-amber-600 transition-colors" />
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
