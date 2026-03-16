'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  Download,
  FileSpreadsheet,
  FileDown,
  FileText,
  FileJson,
  Filter,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());

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
    // Status filter
    if (statusFilter !== 'all' && agent.pipeline_status !== statusFilter) return false;

    // Search filter
    if (!searchQuery) return true;
    const name = `${agent.profiles?.first_name || ''} ${agent.profiles?.last_name || ''}`.toLowerCase();
    const email = (agent.profiles?.email || '').toLowerCase();
    const agentId = (agent.agent_id || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) ||
           email.includes(searchQuery.toLowerCase()) ||
           agentId.includes(searchQuery.toLowerCase());
  });

  // Toggle agent selection
  const toggleAgentSelection = (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  // Export functionality
  const exportAgents = (format: 'pdf' | 'excel' | 'csv' | 'json', scope: 'all' | 'selected' | 'filtered') => {
    let agentsToExport: AgentWithProfile[] = [];

    if (scope === 'selected') {
      agentsToExport = agents.filter(a => selectedAgents.has(a.id));
    } else if (scope === 'filtered') {
      agentsToExport = filteredAgents;
    } else {
      agentsToExport = agents;
    }

    if (agentsToExport.length === 0) {
      alert('No agents to export');
      return;
    }

    const agentsData = agentsToExport.map(agent => ({
      name: `${agent.profiles?.first_name || ''} ${agent.profiles?.last_name || ''}`.trim(),
      agentId: agent.agent_id || '',
      email: agent.profiles?.email || '',
      phone: agent.profiles?.phone || '',
      status: agent.pipeline_status,
      joinedAt: agent.created_at,
      scores: agent.scores || {},
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(agentsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agents-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const headers = ['Name', 'Agent ID', 'Email', 'Phone', 'Status', 'Joined At'];
      const rows = agentsData.map(a => [a.name, a.agentId, a.email, a.phone, a.status, a.joinedAt]);
      const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v || ''}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agents-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'excel') {
      const headers = ['Name', 'Agent ID', 'Email', 'Phone', 'Status', 'Joined At'];
      const rows = agentsData.map(a => [a.name, a.agentId, a.email, a.phone, a.status, a.joinedAt]);
      const tsv = '\ufeff' + [headers.join('\t'), ...rows.map(r => r.map(v => `"${v || ''}"`).join('\t'))].join('\n');
      const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agents-export-${new Date().toISOString().split('T')[0]}.xls`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Generate professional PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Agents Report</title>
              <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1f2937; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0891b2; padding-bottom: 20px; }
                .header h1 { color: #0891b2; font-size: 28px; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #0891b2; color: white; padding: 12px; text-align: left; }
                td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
                tr:nth-child(even) { background: #f9fafb; }
                .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Agent Portal - Agents Report</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
                <p>Total: ${agentsData.length} agents</p>
              </div>
              <table>
                <thead><tr><th>Name</th><th>Agent ID</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead>
                <tbody>
                  ${agentsData.map(a => `<tr><td>${a.name}</td><td>${a.agentId?.replace('AGENT ', '')}</td><td>${a.email}</td><td>${a.phone || '-'}</td><td>${a.status}</td></tr>`).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
      }
    }
  };

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

        {/* Search & Export */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <Input
                placeholder="Search agents by name, email or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-zinc-200 rounded-xl bg-white shadow-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-12 border-zinc-200 rounded-xl bg-white">
                <Filter className="h-4 w-4 mr-2 text-zinc-400" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {PIPELINE_STAGES.map(s => (
                  <SelectItem key={s.status} value={s.status}>{s.label.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export Dropdown */}
          <div className="flex items-center gap-2">
            {selectedAgents.size > 0 && (
              <span className="text-sm text-cyan-600 font-medium">
                {selectedAgents.size} selected
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-12 gap-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50 rounded-xl">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-zinc-500">Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs text-zinc-400 font-normal">All Agents ({agents.length})</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => exportAgents('pdf', 'all')} className="gap-2">
                  <FileDown className="h-4 w-4 text-red-500" /> PDF Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAgents('excel', 'all')} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAgents('csv', 'all')} className="gap-2">
                  <FileText className="h-4 w-4 text-blue-500" /> CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAgents('json', 'all')} className="gap-2">
                  <FileJson className="h-4 w-4 text-amber-500" /> JSON
                </DropdownMenuItem>

                {selectedAgents.size > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-zinc-400 font-normal">Selected ({selectedAgents.size})</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => exportAgents('pdf', 'selected')} className="gap-2">
                      <FileDown className="h-4 w-4 text-red-500" /> PDF Report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportAgents('excel', 'selected')} className="gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Excel
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
              const isSelected = selectedAgents.has(agent.id);

              return (
                <Card
                  key={agent.id}
                  onClick={() => router.push(`/agents/${agent.id}`)}
                  className={`border-zinc-200 hover:border-cyan-300 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden ${isSelected ? 'ring-2 ring-cyan-500 border-cyan-300' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div
                        onClick={(e) => toggleAgentSelection(agent.id, e)}
                        className="flex items-center justify-center pt-1"
                      >
                        <Checkbox
                          checked={isSelected}
                          className="h-5 w-5 border-zinc-300 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                        />
                      </div>

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
                        <p className="text-sm text-cyan-600 font-mono mt-0.5">
                          <span className="text-zinc-500 font-sans">Agent ID:</span> {agentIdDisplay}
                        </p>
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
