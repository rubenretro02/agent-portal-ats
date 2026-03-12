'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCorners,
} from '@dnd-kit/core';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  GripVertical,
  ChevronRight,
  XCircle,
  Square,
  CheckSquare,
  UserCheck,
  Layers,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'withdrawn';

interface Agent {
  id: string;
  ats_id: string;
  profiles: { first_name: string; last_name: string; email: string } | null;
}

interface Application {
  id: string;
  agent_id: string;
  status: AppStatus;
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

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGES: { status: AppStatus; label: string; color: string; headerColor: string; badgeColor: string }[] = [
  { status: 'pending',   label: 'Pending',   color: 'bg-blue-50 border-blue-200',    headerColor: 'bg-blue-100',    badgeColor: 'bg-blue-200 text-blue-800' },
  { status: 'in_review', label: 'In Review', color: 'bg-amber-50 border-amber-200',  headerColor: 'bg-amber-100',   badgeColor: 'bg-amber-200 text-amber-800' },
  { status: 'approved',  label: 'Approved',  color: 'bg-emerald-50 border-emerald-200', headerColor: 'bg-emerald-100', badgeColor: 'bg-emerald-200 text-emerald-800' },
  { status: 'rejected',  label: 'Rejected',  color: 'bg-red-50 border-red-200',      headerColor: 'bg-red-100',     badgeColor: 'bg-red-200 text-red-800' },
  { status: 'withdrawn', label: 'Withdrawn', color: 'bg-zinc-50 border-zinc-200',    headerColor: 'bg-zinc-100',    badgeColor: 'bg-zinc-200 text-zinc-700' },
];

const NEXT_STAGES: Record<AppStatus, AppStatus | null> = {
  pending:   'in_review',
  in_review: 'approved',
  approved:  null,
  rejected:  null,
  withdrawn: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fullName(app: Application) {
  const p = app.agent?.profiles;
  return p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown' : 'Unknown';
}

function initials(app: Application) {
  const n = fullName(app);
  return n.split(' ').filter(Boolean).map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'UN';
}

// ─── Droppable Column ─────────────────────────────────────────────────────────

function DroppableColumn({
  stage,
  apps,
  selectedIds,
  onSelect,
  onSelectAll,
  onMove,
  onBatchMove,
  movingId,
}: {
  stage: typeof STAGES[number];
  apps: Application[];
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (status: AppStatus, checked: boolean) => void;
  onMove: (appId: string, toStatus: AppStatus) => void;
  onBatchMove: (toStatus: AppStatus) => void;
  movingId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.status });
  const colSelected = apps.filter(a => selectedIds.has(a.id));
  const allSelected = apps.length > 0 && apps.every(a => selectedIds.has(a.id));
  const nextStatus = NEXT_STAGES[stage.status];

  return (
    <div className="flex flex-col min-w-[230px] max-w-[270px] w-full">
      {/* Column header */}
      <div className={`rounded-t-xl px-3 py-2.5 ${stage.headerColor} border border-b-0 border-opacity-60`} style={{ borderColor: 'inherit' }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {apps.length > 0 && (
              <button
                onClick={() => onSelectAll(stage.status, !allSelected)}
                className="text-zinc-500 hover:text-zinc-800 transition-colors"
                title={allSelected ? 'Deselect all' : 'Select all'}
              >
                {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              </button>
            )}
            <span className="font-semibold text-sm text-zinc-800">{stage.label}</span>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${stage.badgeColor}`}>{apps.length}</span>
          </div>
          {/* Batch action buttons on column header */}
          {colSelected.length > 1 && (
            <div className="flex items-center gap-1">
              {nextStatus && (
                <button
                  title={`Move ${colSelected.length} to ${STAGES.find(s => s.status === nextStatus)?.label}`}
                  onClick={() => onBatchMove(nextStatus)}
                  className="text-xs bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-md px-1.5 py-0.5 flex items-center gap-0.5 transition-colors"
                >
                  <Layers className="h-3 w-3" />
                  {colSelected.length}
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
              {stage.status !== 'rejected' && (
                <button
                  title={`Reject ${colSelected.length} candidates`}
                  onClick={() => onBatchMove('rejected')}
                  className="text-xs bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-md px-1.5 py-0.5 flex items-center gap-0.5 transition-colors"
                >
                  <XCircle className="h-3 w-3" />
                  {colSelected.length}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[480px] p-2 rounded-b-xl border border-t-0 space-y-2 transition-colors ${stage.color} ${isOver ? 'ring-2 ring-cyan-400 ring-inset bg-opacity-80' : ''}`}
      >
        {apps.map(app => (
          <DraggableCard
            key={app.id}
            app={app}
            stage={stage}
            isSelected={selectedIds.has(app.id)}
            isMoving={movingId === app.id}
            onSelect={onSelect}
            onMove={onMove}
          />
        ))}

        {apps.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-zinc-400">
            <UserCheck className="h-6 w-6 opacity-40" />
            <p className="text-xs">Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Draggable Card ───────────────────────────────────────────────────────────

function DraggableCard({
  app,
  stage,
  isSelected,
  isMoving,
  onSelect,
  onMove,
}: {
  app: Application;
  stage: typeof STAGES[number];
  isSelected: boolean;
  isMoving: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onMove: (appId: string, toStatus: AppStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id });
  const nextStatus = NEXT_STAGES[stage.status];

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white rounded-xl border shadow-sm transition-all select-none
        ${isDragging ? 'opacity-40 shadow-lg' : 'hover:shadow-md'}
        ${isSelected ? 'ring-2 ring-cyan-500 border-cyan-300' : 'border-zinc-200 hover:border-zinc-300'}
      `}
    >
      <div className="p-3">
        <div className="flex items-start gap-2">
          {/* Checkbox */}
          <button
            className="mt-0.5 text-zinc-400 hover:text-cyan-600 transition-colors flex-shrink-0"
            onClick={() => onSelect(app.id, !isSelected)}
          >
            {isSelected
              ? <CheckSquare className="h-4 w-4 text-cyan-600" />
              : <Square className="h-4 w-4" />}
          </button>

          {/* Avatar */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">{initials(app)}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs text-zinc-900 truncate">{fullName(app)}</p>
            <p className="text-[10px] text-zinc-500 truncate">{app.agent?.profiles?.email || 'No email'}</p>
            <p className="text-[10px] text-cyan-600 font-mono mt-0.5">{app.agent?.ats_id}</p>
          </div>

          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 flex-shrink-0 mt-0.5"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </div>

        {/* Action buttons */}
        {!isDragging && (
          <div className="flex gap-1 mt-2.5">
            {nextStatus && (
              <Button
                size="sm"
                className="h-6 text-[10px] flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-2"
                disabled={isMoving}
                onClick={() => onMove(app.id, nextStatus)}
              >
                {isMoving ? <Loader2 className="h-3 w-3 animate-spin" /> : (
                  <span className="flex items-center gap-1">
                    {STAGES.find(s => s.status === nextStatus)?.label}
                    <ChevronRight className="h-3 w-3" />
                  </span>
                )}
              </Button>
            )}
            {stage.status !== 'rejected' && stage.status !== 'withdrawn' && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] border-red-200 text-red-600 hover:bg-red-50 px-2"
                disabled={isMoving}
                onClick={() => onMove(app.id, 'rejected')}
              >
                <XCircle className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Drag overlay card ────────────────────────────────────────────────────────

function OverlayCard({ app }: { app: Application }) {
  return (
    <div className="bg-white rounded-xl border-2 border-cyan-400 shadow-2xl p-3 w-[220px] opacity-95">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">{initials(app)}</span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-xs text-zinc-900 truncate">{fullName(app)}</p>
          <p className="text-[10px] text-cyan-600 font-mono">{app.agent?.ats_id}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OpportunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const opportunityId = params.id as string;
  const { profile } = useAuthContext();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | AppStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = profile?.role === 'admin' || profile?.role === 'recruiter';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (!isAdmin) { router.push('/opportunities'); return; }
    fetchData();
  }, [opportunityId, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oppRes, appRes] = await Promise.all([
        fetch(`/api/opportunities/${opportunityId}`),
        fetch(`/api/opportunities/${opportunityId}/applications`),
      ]);
      if (oppRes.ok) setOpportunity((await oppRes.json()).opportunity);
      if (appRes.ok) setApplications((await appRes.json()).applications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const moveApplication = useCallback(async (appId: string, newStatus: AppStatus) => {
    setMovingId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
        setSelectedIds(prev => { const n = new Set(prev); n.delete(appId); return n; });
      }
    } finally {
      setMovingId(null);
    }
  }, []);

  const batchMove = useCallback(async (toStatus: AppStatus) => {
    const ids = [...selectedIds];
    setSelectedIds(new Set());
    await Promise.all(ids.map(id => fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: toStatus }),
    })));
    setApplications(prev => prev.map(a => ids.includes(a.id) ? { ...a, status: toStatus } : a));
  }, [selectedIds]);

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      checked ? n.add(id) : n.delete(id);
      return n;
    });
  };

  const handleSelectAll = (status: AppStatus, checked: boolean) => {
    const ids = applications.filter(a => a.status === status).map(a => a.id);
    setSelectedIds(prev => {
      const n = new Set(prev);
      ids.forEach(id => checked ? n.add(id) : n.delete(id));
      return n;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const app = applications.find(a => a.id === event.active.id);
    setActiveApp(app || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveApp(null);
    const { active, over } = event;
    if (!over) return;
    const app = applications.find(a => a.id === active.id);
    if (!app) return;
    const newStatus = over.id as AppStatus;
    if (newStatus !== app.status && STAGES.find(s => s.status === newStatus)) {
      moveApplication(app.id, newStatus);
    }
  };

  if (loading) return (
    <UnifiedLayout title="Loading...">
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    </UnifiedLayout>
  );

  if (!opportunity) return (
    <UnifiedLayout title="Not Found">
      <Card><CardContent className="py-16 text-center">
        <AlertCircle className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
        <p className="text-zinc-500 mb-4">Opportunity not found</p>
        <Button onClick={() => router.push('/opportunities')}>Back to Opportunities</Button>
      </CardContent></Card>
    </UnifiedLayout>
  );

  const grouped = STAGES.reduce((acc, s) => {
    acc[s.status] = filteredApps.filter(a => a.status === s.status);
    return acc;
  }, {} as Record<string, Application[]>);

  const baseRate = opportunity.compensation?.baseRate;
  const trainingHours = opportunity.training?.duration;
  const totalSelected = selectedIds.size;

  // Filter applications based on status and search
  const filteredApps = applications.filter(app => {
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = fullName(app).toLowerCase();
      const email = app.agent?.profiles?.email?.toLowerCase() || '';
      const atsId = app.agent?.ats_id?.toLowerCase() || '';
      return name.includes(query) || email.includes(query) || atsId.includes(query);
    }
    return true;
  });

  return (
    <UnifiedLayout title={`${opportunity.name} - Application Tracking`}>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/opportunities')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-zinc-900">{opportunity.name}</h1>
            <p className="text-sm text-zinc-500">{opportunity.client}</p>
          </div>
          {/* Global batch toolbar */}
          {totalSelected > 0 && (
            <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-2">
              <span className="text-sm font-medium text-cyan-700">{totalSelected} selected</span>
              <div className="w-px h-4 bg-cyan-200" />
              {STAGES.filter(s => s.status !== 'pending' && s.status !== 'withdrawn').map(s => (
                <Button
                  key={s.status}
                  size="sm"
                  variant="outline"
                  className={`h-7 text-xs ${s.status === 'rejected' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-cyan-200 text-cyan-700 hover:bg-cyan-50'}`}
                  onClick={() => batchMove(s.status)}
                >
                  Move to {s.label}
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-zinc-500"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="border-zinc-200 bg-gradient-to-r from-zinc-50 to-white">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-medium text-zinc-600">Search</label>
                <input
                  type="text"
                  placeholder="Search by name, email or ATS ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-zinc-600">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | AppStatus)}
                  className="w-full mt-1.5 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="all">All Statuses</option>
                  {STAGES.map(s => (
                    <option key={s.status} value={s.status}>{s.label}</option>
                  ))}
                </select>
              </div>
              {(searchQuery || filterStatus !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                  }}
                  className="border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-zinc-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Total</p>
                <p className="text-2xl font-bold text-zinc-900">{applications.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Approved</p>
                <p className="text-2xl font-bold text-zinc-900">{applications.filter(a => a.status === 'approved').length}</p>
              </div>
            </CardContent>
          </Card>
          {baseRate && (
            <Card className="border-zinc-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Base Rate</p>
                  <p className="text-2xl font-bold text-zinc-900">${baseRate}/hr</p>
                </div>
              </CardContent>
            </Card>
          )}
          {trainingHours && (
            <Card className="border-zinc-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Training</p>
                  <p className="text-2xl font-bold text-zinc-900">{trainingHours}h</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Kanban board with DnD */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STAGES.map(stage => (
              <DroppableColumn
                key={stage.status}
                stage={stage}
                apps={grouped[stage.status]}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onSelectAll={handleSelectAll}
                onMove={moveApplication}
                onBatchMove={batchMove}
                movingId={movingId}
              />
            ))}
          </div>

          <DragOverlay>
            {activeApp ? <OverlayCard app={activeApp} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </UnifiedLayout>
  );
}
