'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Users,
  UserCheck,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
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
    phone?: string;
  } | null;
}

export default function AgentsPage() {
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [agents, setAgents] = useState<AgentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

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
          select: '*, profiles (first_name, last_name, email, phone)',
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

  const filteredAgents = agents.filter(agent => {
    if (!searchQuery) return true;
    const name = `${agent.profiles?.first_name || ''} ${agent.profiles?.last_name || ''}`.toLowerCase();
    const email = (agent.profiles?.email || '').toLowerCase();
    const agentId = (agent.agent_id || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || 
           email.includes(searchQuery.toLowerCase()) ||
           agentId.includes(searchQuery.toLowerCase());
  });

  // Stats
  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => ['active', 'hired'].includes(a.pipeline_status)).length;
  const newThisMonth = agents.filter(a => {
    const created = new Date(a.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

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
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 text-sm font-medium">Total Agents</p>
                  <p className="text-4xl font-bold mt-1">{totalAgents}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Active Agents</p>
                  <p className="text-4xl font-bold mt-1">{activeAgents}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <UserCheck className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-violet-500 to-violet-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-violet-100 text-sm font-medium">New This Month</p>
                  <p className="text-4xl font-bold mt-1">{newThisMonth}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <UserPlus className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input
            placeholder="Search agents by name, email or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base border-zinc-200 rounded-xl bg-white shadow-sm"
          />
        </div>

        {/* Agents Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg">No agents found</p>
            <p className="text-zinc-400 text-sm mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => {
              const name = `${agent.profiles?.first_name || ''} ${agent.profiles?.last_name || ''}`.trim() || 'Unknown';
              const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              const agentIdDisplay = agent.agent_id?.replace('AGENT ', '') || '00000000';
              const joinDate = new Date(agent.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <Card 
                  key={agent.id}
                  onClick={() => router.push(`/agents/${agent.id}`)}
                  className="border-zinc-200 hover:border-cyan-300 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg shadow-cyan-500/20">
                        {initials}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-zinc-900 truncate">{name}</h3>
                          <ArrowUpRight className="h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-cyan-600 font-mono mt-0.5">{agentIdDisplay}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mt-5 space-y-2.5">
                      <div className="flex items-center gap-3 text-sm text-zinc-600">
                        <Mail className="h-4 w-4 text-zinc-400" />
                        <span className="truncate">{agent.profiles?.email || 'No email'}</span>
                      </div>
                      {agent.profiles?.phone && (
                        <div className="flex items-center gap-3 text-sm text-zinc-600">
                          <Phone className="h-4 w-4 text-zinc-400" />
                          <span>{agent.profiles.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm text-zinc-500">
                        <Calendar className="h-4 w-4 text-zinc-400" />
                        <span>Joined {joinDate}</span>
                      </div>
                    </div>

                    {/* View Profile Button */}
                    <Button 
                      variant="ghost" 
                      className="w-full mt-5 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 group-hover:bg-cyan-50"
                    >
                      View Profile
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </UnifiedLayout>
  );
}
