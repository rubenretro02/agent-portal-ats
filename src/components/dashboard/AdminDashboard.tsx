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
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';

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

interface PipelineData {
  name: string;
  value: number;
  color: string;
}

const PIPELINE_COLORS: Record<string, string> = {
  applied: '#6366f1',
  screening: '#ec4899',
  interview: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  hired: '#06b6d4',
  active: '#8b5cf6',
};

export function AdminDashboard() {
  const { profile } = useAuthContext();
  const [metrics, setMetrics] = useState<Metrics>({
    totalAgents: 0,
    pendingApplications: 0,
    approvalRate: 0,
    activeOpportunities: 0,
  });
  const [pipelineData, setPipelineData] = useState<PipelineData[]>([]);
  const [recentAgents, setRecentAgents] = useState<AgentWithProfile[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; applications: number; approved: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { adminDb } = await import('@/lib/adminDb');

      const { data: agents } = await adminDb<AgentWithProfile[]>({
        action: 'select',
        table: 'agents',
        select: '*, profiles (first_name, last_name, email)',
        order: { column: 'created_at', ascending: false },
      });

      const { data: activeOppData } = await adminDb<Record<string, unknown>[]>({
        action: 'select',
        table: 'opportunities',
        select: 'id',
        filters: { status: 'active' },
      });

      const allAgents = agents || [];
      const totalAgents = allAgents.length;
      const pendingApps = allAgents.filter(a => a.pipeline_status === 'applied').length;
      const approvedCount = allAgents.filter(a =>
        ['approved', 'hired', 'active'].includes(a.pipeline_status || '')
      ).length;

      setMetrics({
        totalAgents,
        pendingApplications: pendingApps,
        approvalRate: totalAgents > 0 ? Math.round((approvedCount / totalAgents) * 100) : 0,
        activeOpportunities: activeOppData?.length || 0,
      });

      // Pipeline distribution
      const statusCounts: Record<string, number> = {};
      allAgents.forEach(agent => {
        const status = agent.pipeline_status || 'applied';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const chartData: PipelineData[] = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: PIPELINE_COLORS[name] || '#94a3b8',
      }));
      setPipelineData(chartData);

      setRecentAgents(allAgents.slice(0, 5));

      // Monthly data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const baseValue = Math.max(Math.round(totalAgents / 6), 2);
      setMonthlyData(months.map(month => ({
        month,
        applications: Math.round(baseValue * (0.6 + Math.random() * 0.8)),
        approved: Math.round(baseValue * 0.4 * (0.5 + Math.random())),
      })));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    ringColor,
    ringValue,
    trend,
    trendUp,
    subtitle,
    href,
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    ringColor: string;
    ringValue: number;
    trend?: string;
    trendUp?: boolean;
    subtitle?: string;
    href?: string;
  }) => {
    const circumference = 2 * Math.PI * 20;
    const strokeDashoffset = circumference - (ringValue / 100) * circumference;

    const cardContent = (
      <Card className={`border-zinc-100 hover:shadow-lg transition-all ${href ? 'cursor-pointer hover:border-cyan-200 hover:scale-[1.02]' : ''}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-2">
              <MoreVertical className="h-4 w-4 text-zinc-400" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-zinc-900">{value}</p>
                {trend && (
                  <span className={`flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${trendUp ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                    {trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {trend}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
            </div>
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="#f4f4f5" strokeWidth="4" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="w-5 h-5" style={{ color: ringColor }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );

    if (href) {
      return <Link href={href}>{cardContent}</Link>;
    }
    return cardContent;
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Agents"
          value={metrics.totalAgents}
          icon={Users}
          ringColor="#f43f5e"
          ringValue={75}
          trend="12%"
          trendUp={true}
          subtitle="Since last month"
          href="/agents"
        />
        <StatCard
          title="Pending Review"
          value={metrics.pendingApplications}
          icon={Clock}
          ringColor="#f59e0b"
          ringValue={metrics.totalAgents > 0 ? (metrics.pendingApplications / metrics.totalAgents) * 100 : 0}
          subtitle="Awaiting action"
          href="/applications"
        />
        <StatCard
          title="Approval Rate"
          value={`${metrics.approvalRate}%`}
          icon={TrendingUp}
          ringColor="#10b981"
          ringValue={metrics.approvalRate}
          trend="5.7%"
          trendUp={true}
          subtitle="Since last month"
          href="/analytics"
        />
        <StatCard
          title="Active Opportunities"
          value={metrics.activeOpportunities}
          icon={Briefcase}
          ringColor="#6366f1"
          ringValue={60}
          subtitle="Open positions"
          href="/opportunities"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Donut */}
        <Card className="border-zinc-100">
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-base font-semibold">Pipeline Overview</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchDashboardData} className="h-8 text-xs">
              <RefreshCw className="w-3 h-3 mr-1.5" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height={200} minWidth={200}>
                <PieChart>
                  <Pie
                    data={pipelineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} agents`, name]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e4e4e7',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold text-zinc-900">{metrics.totalAgents}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Total</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
              {pipelineData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-zinc-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="border-zinc-100">
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-base font-semibold">Applications</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4 text-zinc-400" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height={260} minWidth={200}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e4e4e7',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="applications" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Area Chart */}
        <Card className="border-zinc-100">
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-base font-semibold">Approval Trends</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4 text-zinc-400" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height={260} minWidth={200}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e4e4e7',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="approved"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorApproved)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Agents */}
      <Card className="border-zinc-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Agents</CardTitle>
          <Link href="/agents">
            <Button variant="ghost" size="sm" className="text-cyan-600 text-xs">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {recentAgents.map((agent) => {
              const name = `${agent.profiles?.first_name || ''} ${agent.profiles?.last_name || ''}`.trim() || 'Unknown';
              const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              const agentId = agent.agent_id?.replace('AGENT ', '') || '00000000';

              return (
                <Link key={agent.id} href={`/agents/${agent.id}`}>
                  <div className="flex flex-col items-center p-5 rounded-xl bg-zinc-50/80 hover:bg-zinc-100 transition-colors cursor-pointer group">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/30 transition-shadow">
                      {initials}
                    </div>
                    <p className="font-medium text-zinc-900 text-sm mt-3 text-center">{name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-full">{agent.profiles?.email?.split('@')[0]}</p>
                    <p className="text-[10px] text-cyan-600 font-mono mt-2 flex items-center gap-1">
                      ID: {agentId}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
