'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
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
  agent_id: string;
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

export default function AgentsPage() {
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [agents, setAgents] = useState<AgentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && profile && profile.role === 'agent') {
      router.push('/dashboard');
    }
  }, [authLoading, profile, router]);

  useEffect(() => {
    async function fetchAgents() {
      setLoading(true);
      try {
        const { adminDb } = await import('@/lib/adminDb');
        const { data, error } = await adminDb<AgentWithProfile[]>({
          action: 'select',
          table: 'agents',
          select: '*, profiles (first_name, last_name, email)',
          order: { column: 'created_at', ascending: false },
        });

        if (!error && data) {
          setAgents(data);
        }
      } catch (err) {
        console.error('Error fetching agents:', err);
      } finally {
        setLoading(false);
      }
    }

    if (profile && (profile.role === 'admin' || profile.role === 'recruiter')) {
      fetchAgents();
    }
  }, [profile]);

  const getStageInfo = (status: string) => {
    return PIPELINE_STAGES.find(s => s.status === status);
  };

  const handleMoveAgent = async (agentId: string, newStatus: string) => {
    const stageIndex = PIPELINE_STAGES.findIndex(s => s.status === newStatus);

    const { adminDb } = await import('@/lib/adminDb');
    const { error } = await adminDb({
      action: 'update',
      table: 'agents',
      data: {
        pipeline_status: newStatus,
        pipeline_stage: stageIndex + 1,
        last_status_change: new Date().toISOString(),
      },
      match: { id: agentId },
    });

    if (!error) {
      setAgents(prev =>
        prev.map(a =>
          a.id === agentId
            ? { ...a, pipeline_status: newStatus, pipeline_stage: stageIndex + 1 }
            : a
        )
      );
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = !searchQuery ||
      `${agent.profiles?.first_name || ''} ${agent.profiles?.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.profiles?.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || agent.pipeline_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (profile.role === 'agent') {
    return null;
  }

  return (
    <UnifiedLayout title="Agents">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">All Agents</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Manage and track all agents in the pipeline
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white"
          >
            <option value="all">All Statuses</option>
            {PIPELINE_STAGES.map(stage => (
              <option key={stage.status} value={stage.status}>{stage.label.en}</option>
            ))}
          </select>
        </div>

        {/* Agents List */}
        <Card className="border-zinc-200">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                No agents found
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {filteredAgents.map((agent) => {
                  const stageInfo = getStageInfo(agent.pipeline_status);
                  const name = `${agent.profiles?.first_name || ''} ${agent.profiles?.last_name || ''}`.trim() || 'Unknown';
                  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
                  const score = agent.scores?.overall || 0;

                  return (
                    <div
                      key={agent.id}
                      onClick={() => router.push(`/agents/${agent.id}`)}
                      className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors cursor-pointer"
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
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-zinc-900">{score}</p>
                          <p className="text-xs text-zinc-500">Score</p>
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/agents/${agent.id}`)}>View Profile</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMoveAgent(agent.id, 'screening')}>
                            Move to Screening
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMoveAgent(agent.id, 'training')}>
                            Move to Training
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMoveAgent(agent.id, 'approved')}>
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Reject</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  );
}
