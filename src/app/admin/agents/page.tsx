'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStore } from '@/store/adminStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  ArrowRight,
  Eye,
  FileText,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Mail,
  Phone,
} from 'lucide-react';
import { PIPELINE_STAGES } from '@/lib/constants';
import type { PipelineStatus } from '@/types';

// Mock agents data
const mockAgents = [
  { id: '1', firstName: 'Maria', lastName: 'Garcia', email: 'maria@example.com', phone: '+1 555-0101', status: 'training' as PipelineStatus, score: 85, appliedAt: new Date('2024-01-20'), campaignName: 'TechCare Support' },
  { id: '2', firstName: 'John', lastName: 'Smith', email: 'john@example.com', phone: '+1 555-0102', status: 'screening' as PipelineStatus, score: 72, appliedAt: new Date('2024-01-19'), campaignName: 'HealthLine Bilingual' },
  { id: '3', firstName: 'Ana', lastName: 'Rodriguez', email: 'ana@example.com', phone: '+1 555-0103', status: 'applied' as PipelineStatus, score: 0, appliedAt: new Date('2024-01-18'), campaignName: 'ShopEasy Customer Care' },
  { id: '4', firstName: 'Michael', lastName: 'Chen', email: 'michael@example.com', phone: '+1 555-0104', status: 'background_check' as PipelineStatus, score: 88, appliedAt: new Date('2024-01-17'), campaignName: 'TechCare Support' },
  { id: '5', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@example.com', phone: '+1 555-0105', status: 'approved' as PipelineStatus, score: 91, appliedAt: new Date('2024-01-16'), campaignName: 'HealthLine Bilingual' },
  { id: '6', firstName: 'Carlos', lastName: 'Martinez', email: 'carlos@example.com', phone: '+1 555-0106', status: 'active' as PipelineStatus, score: 87, appliedAt: new Date('2024-01-10'), campaignName: 'TechCare Support' },
  { id: '7', firstName: 'Emily', lastName: 'Davis', email: 'emily@example.com', phone: '+1 555-0107', status: 'hired' as PipelineStatus, score: 79, appliedAt: new Date('2024-01-12'), campaignName: 'ShopEasy Customer Care' },
];

export default function AgentsManagementPage() {
  const { hasPermission } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<typeof mockAgents[0] | null>(null);
  const [newStatus, setNewStatus] = useState<PipelineStatus>('screening');
  const [agents, setAgents] = useState(mockAgents);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch =
      agent.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStageInfo = (status: PipelineStatus) => {
    return PIPELINE_STAGES.find(s => s.status === status);
  };

  const handleMoveAgent = () => {
    if (!selectedAgent) return;

    setAgents(prev => prev.map(a =>
      a.id === selectedAgent.id ? { ...a, status: newStatus } : a
    ));

    setMoveDialogOpen(false);
    setSelectedAgent(null);
  };

  const openMoveDialog = (agent: typeof mockAgents[0], status: PipelineStatus) => {
    setSelectedAgent(agent);
    setNewStatus(status);
    setMoveDialogOpen(true);
  };

  // Calculate stats
  const statsByStatus = PIPELINE_STAGES.map(stage => ({
    ...stage,
    count: agents.filter(a => a.status === stage.status).length,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Agents</h1>
            <p className="text-zinc-500 text-sm mt-1">
              View and manage agent applications
            </p>
          </div>
        </div>

        {/* Pipeline Stats */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statsByStatus.slice(0, 7).map((stage) => (
            <button
              key={stage.status}
              onClick={() => setStatusFilter(statusFilter === stage.status ? 'all' : stage.status)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all shrink-0 ${
                statusFilter === stage.status
                  ? 'border-cyan-500 bg-cyan-50'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
              <span className="text-sm font-medium text-zinc-700">{stage.label.en}</span>
              <Badge variant="secondary" className="text-xs">{stage.count}</Badge>
            </button>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {PIPELINE_STAGES.map(stage => (
                    <SelectItem key={stage.status} value={stage.status}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                        {stage.label.en}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Agents Table */}
        <Card className="border-zinc-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                      No agents found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgents.map((agent) => {
                    const stageInfo = getStageInfo(agent.status);
                    return (
                      <TableRow key={agent.id} className="hover:bg-zinc-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-medium text-sm">
                              {agent.firstName[0]}{agent.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900">
                                {agent.firstName} {agent.lastName}
                              </p>
                              <p className="text-sm text-zinc-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {agent.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            style={{
                              backgroundColor: `${stageInfo?.color}20`,
                              color: stageInfo?.color,
                              borderColor: stageInfo?.color,
                            }}
                            className="border"
                          >
                            {stageInfo?.label.en}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-zinc-600">{agent.campaignName}</span>
                        </TableCell>
                        <TableCell>
                          {agent.score > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-zinc-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${agent.score}%`,
                                    backgroundColor: agent.score >= 80 ? '#22c55e' : agent.score >= 60 ? '#f59e0b' : '#ef4444'
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium">{agent.score}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-400">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-zinc-500">
                            {agent.appliedAt.toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                View Documents
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>

                              {hasPermission('canMoveAgentStages') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openMoveDialog(agent, 'screening')}
                                    disabled={agent.status === 'screening'}
                                  >
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    Move to Screening
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openMoveDialog(agent, 'background_check')}
                                    disabled={agent.status === 'background_check'}
                                  >
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    Move to Background Check
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openMoveDialog(agent, 'training')}
                                    disabled={agent.status === 'training'}
                                  >
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    Move to Training
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openMoveDialog(agent, 'approved')}
                                    disabled={agent.status === 'approved'}
                                    className="text-emerald-600"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                </>
                              )}

                              {hasPermission('canRejectAgents') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openMoveDialog(agent, 'rejected')}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Move Agent Dialog */}
        <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move Agent to New Stage</DialogTitle>
              <DialogDescription>
                You are about to move {selectedAgent?.firstName} {selectedAgent?.lastName} to a new pipeline stage.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <Badge
                    style={{
                      backgroundColor: `${getStageInfo(selectedAgent?.status || 'applied')?.color}20`,
                      color: getStageInfo(selectedAgent?.status || 'applied')?.color
                    }}
                  >
                    {getStageInfo(selectedAgent?.status || 'applied')?.label.en}
                  </Badge>
                  <p className="text-xs text-zinc-500 mt-1">Current</p>
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-400" />
                <div className="text-center">
                  <Badge
                    style={{
                      backgroundColor: `${getStageInfo(newStatus)?.color}20`,
                      color: getStageInfo(newStatus)?.color
                    }}
                  >
                    {getStageInfo(newStatus)?.label.en}
                  </Badge>
                  <p className="text-xs text-zinc-500 mt-1">New</p>
                </div>
              </div>

              {newStatus === 'rejected' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  This action will reject the agent's application. They will be notified via email.
                </div>
              )}

              {newStatus === 'approved' && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                  This agent will be approved and can now be assigned to campaigns.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleMoveAgent}
                className={newStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'}
              >
                Confirm Move
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
