'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Clock,
  Monitor,
  Headphones,
  Wifi,
  Globe,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Hash,
  Star,
  BadgeCheck,
  Zap,
  Target,
  Award,
  Languages,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Layers,
  Download,
  FileSpreadsheet,
  FileDown,
  FileJson,
} from 'lucide-react';
import { PIPELINE_STAGES, DOCUMENT_TYPES } from '@/lib/constants';
import type { PipelineStatus, DocumentStatus } from '@/types';

// Application statuses for the pipeline
const APP_STAGES = [
  { status: 'pending', label: 'Pending', color: '#f59e0b', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { status: 'in_review', label: 'In Review', color: '#0891b2', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  { status: 'approved', label: 'Approved', color: '#10b981', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { status: 'rejected', label: 'Rejected', color: '#ef4444', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  { status: 'withdrawn', label: 'Withdrawn', color: '#6b7280', bgColor: 'bg-zinc-50', borderColor: 'border-zinc-200' },
] as const;

type AppStatus = typeof APP_STAGES[number]['status'];

interface AgentProfile {
  id: string;
  user_id: string;
  agent_id: string;
  pipeline_status: PipelineStatus;
  pipeline_stage: number;
  created_at: string;
  last_status_change: string;
  scores: Record<string, number> | null;
  languages: string[] | null;
  skills: string[] | null;
  experience: WorkExperience[] | null;
  equipment: EquipmentInfo | null;
  availability: AvailabilityInfo | null;
  address: AddressInfo | null;
  preferred_language: 'en' | 'es';
  timezone?: string;
  application_date?: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  } | null;
}

interface AddressInfo {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  isCallCenter: boolean;
}

interface EquipmentInfo {
  hasComputer?: boolean;
  computerType?: 'desktop' | 'laptop';
  operatingSystem?: string;
  hasHeadset?: boolean;
  internetSpeed?: number;
  hasQuietSpace?: boolean;
  hasBackupInternet?: boolean;
}

interface AvailabilityInfo {
  hoursPerWeek?: number;
  preferredShifts?: string[];
  weekendsAvailable?: boolean;
  holidaysAvailable?: boolean;
  startDate?: string;
}

interface QuestionAnswer {
  id: string;
  question: string;
  type: string;
  required: boolean;
  options?: string[];
  answer: any;
}

interface ApplicationData {
  id: string;
  status: AppStatus;
  submitted_at: string;
  opportunity_id: string;
  agent: AgentProfile | null;
  answers: QuestionAnswer[];
  opportunity: {
    id: string;
    name: string;
    client: string;
  } | null;
}

interface AgentProfileSheetProps {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onStatusChange?: (applicationId: string, newStatus: AppStatus) => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

// Circular Score Gauge Component
function ScoreGauge({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#0891b2';
    if (s >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="5"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-zinc-900">{score}</span>
        </div>
      </div>
      <span className="text-[10px] text-zinc-500 mt-1">{label}</span>
    </div>
  );
}

export function AgentProfileSheet({
  applicationId,
  open,
  onOpenChange,
  onNavigate,
  onStatusChange,
  hasPrev = false,
  hasNext = false,
}: AgentProfileSheetProps) {
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchApplicationData() {
      if (!applicationId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/applications/${applicationId}`);
        const result = await response.json();

        if (!response.ok || !result.application) {
          console.error('Error fetching application:', result.error);
          setLoading(false);
          return;
        }

        setApplication(result.application);
      } catch (err) {
        console.error('Error fetching application data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (open && applicationId) {
      fetchApplicationData();
    }
  }, [applicationId, open]);

  const handleStatusChange = async (newStatus: AppStatus) => {
    if (!application || updating) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setApplication(prev => prev ? { ...prev, status: newStatus } : null);
        onStatusChange?.(application.id, newStatus);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getStageInfo = (status: AppStatus) => {
    return APP_STAGES.find(s => s.status === status);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateOverallScore = () => {
    if (!application?.agent?.scores) return 0;
    const scoreValues = Object.values(application.agent.scores).filter(v => typeof v === 'number');
    if (scoreValues.length === 0) return 0;
    return Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length);
  };

  const formatAnswer = (answer: any, type: string, options?: string[]) => {
    if (answer === null || answer === undefined) return <span className="text-zinc-400 italic">No answer</span>;

    if (type === 'boolean' || type === 'yes_no') {
      return answer ? 'Yes' : 'No';
    }
    if (type === 'multiple_choice' && Array.isArray(answer)) {
      return answer.join(', ');
    }
    if (type === 'scale') {
      return `${answer}/10`;
    }
    return String(answer);
  };

  const exportCandidate = (format: 'pdf' | 'excel' | 'csv' | 'json') => {
    if (!application || !application.agent) return;

    const agent = application.agent;
    const candidateData = {
      name: `${agent.profiles?.first_name || ''} ${agent.profiles?.last_name || ''}`.trim(),
      agentId: agent.agent_id,
      email: agent.profiles?.email || '',
      phone: agent.profiles?.phone || '',
      status: application.status,
      appliedOn: application.submitted_at,
      location: agent.address ? `${agent.address.city || ''}, ${agent.address.state || ''}` : '',
      timezone: agent.timezone || '',
      language: agent.preferred_language === 'es' ? 'Spanish' : 'English',
      scores: agent.scores || {},
      skills: agent.skills || [],
      experience: agent.experience || [],
      equipment: agent.equipment || {},
      availability: agent.availability || {},
      languages: agent.languages || [],
      applicationResponses: application.answers?.map(a => ({
        question: a.question,
        answer: a.answer,
      })) || [],
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(candidateData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidate-${candidateData.agentId?.replace('AGENT ', '') || 'unknown'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const headers = ['Name', 'Agent ID', 'Email', 'Phone', 'Status', 'Applied On', 'Location', 'Timezone', 'Language'];
      const values = [
        candidateData.name,
        candidateData.agentId,
        candidateData.email,
        candidateData.phone,
        candidateData.status,
        candidateData.appliedOn,
        candidateData.location,
        candidateData.timezone,
        candidateData.language,
      ];
      const csv = [headers.join(','), values.map(v => `"${v || ''}"`).join(',')].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidate-${candidateData.agentId?.replace('AGENT ', '') || 'unknown'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'excel') {
      // For Excel, we'll create a CSV that Excel can open
      const headers = ['Name', 'Agent ID', 'Email', 'Phone', 'Status', 'Applied On', 'Location', 'Timezone', 'Language', 'Skills', 'Languages'];
      const values = [
        candidateData.name,
        candidateData.agentId,
        candidateData.email,
        candidateData.phone,
        candidateData.status,
        candidateData.appliedOn,
        candidateData.location,
        candidateData.timezone,
        candidateData.language,
        (candidateData.skills || []).join('; '),
        (candidateData.languages || []).join('; '),
      ];
      const csv = '\ufeff' + [headers.join('\t'), values.map(v => `"${v || ''}"`).join('\t')].join('\n');
      const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidate-${candidateData.agentId?.replace('AGENT ', '') || 'unknown'}.xls`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Open print dialog for PDF
      const printContent = `
        <html>
          <head>
            <title>Candidate Profile - ${candidateData.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { color: #0891b2; border-bottom: 2px solid #0891b2; padding-bottom: 10px; }
              h2 { color: #374151; margin-top: 30px; font-size: 16px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
              .info-item { padding: 10px; background: #f9fafb; border-radius: 8px; }
              .info-label { font-size: 12px; color: #6b7280; }
              .info-value { font-size: 14px; color: #111827; font-weight: 500; }
              .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
              .badge-status { background: #e0f2fe; color: #0891b2; }
              .section { margin: 25px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
              .skills { display: flex; flex-wrap: wrap; gap: 8px; }
              .skill { background: #f3f4f6; padding: 4px 10px; border-radius: 4px; font-size: 12px; }
              .response { margin: 15px 0; padding: 15px; background: #f9fafb; border-radius: 8px; }
              .question { font-weight: 500; color: #374151; margin-bottom: 5px; }
              .answer { color: #111827; }
            </style>
          </head>
          <body>
            <h1>${candidateData.name}</h1>
            <span class="badge badge-status">${candidateData.status?.replace('_', ' ').toUpperCase()}</span>
            <span style="margin-left: 10px; color: #6b7280;">Agent ID: ${candidateData.agentId?.replace('AGENT ', '')}</span>

            <div class="info-grid">
              <div class="info-item"><div class="info-label">Email</div><div class="info-value">${candidateData.email}</div></div>
              <div class="info-item"><div class="info-label">Phone</div><div class="info-value">${candidateData.phone || 'N/A'}</div></div>
              <div class="info-item"><div class="info-label">Location</div><div class="info-value">${candidateData.location || 'N/A'}</div></div>
              <div class="info-item"><div class="info-label">Timezone</div><div class="info-value">${candidateData.timezone || 'N/A'}</div></div>
              <div class="info-item"><div class="info-label">Language</div><div class="info-value">${candidateData.language}</div></div>
              <div class="info-item"><div class="info-label">Applied On</div><div class="info-value">${new Date(candidateData.appliedOn).toLocaleDateString()}</div></div>
            </div>

            ${candidateData.skills && candidateData.skills.length > 0 ? `
              <h2>Skills</h2>
              <div class="skills">
                ${candidateData.skills.map((s: string) => `<span class="skill">${s}</span>`).join('')}
              </div>
            ` : ''}

            ${candidateData.applicationResponses && candidateData.applicationResponses.length > 0 ? `
              <h2>Application Responses</h2>
              ${candidateData.applicationResponses.map((r: any) => `
                <div class="response">
                  <div class="question">${r.question}</div>
                  <div class="answer">${r.answer || 'No answer'}</div>
                </div>
              `).join('')}
            ` : ''}
          </body>
        </html>
      `;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const agent = application?.agent;
  const stageInfo = application ? getStageInfo(application.status) : null;
  const fullName = agent ? `${agent.profiles?.first_name || ''} ${agent.profiles?.last_name || ''}`.trim() || 'Unknown' : '';
  const initials = fullName.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'UN';
  const overallScore = calculateOverallScore();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 overflow-hidden">
        {/* Navigation Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onNavigate && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('prev')}
                  disabled={!hasPrev}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('next')}
                  disabled={!hasNext}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            <span className="text-sm text-zinc-500 ml-2">Application Review</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-57px)]">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !application || !agent ? (
            <div className="text-center py-24">
              <p className="text-zinc-500">Application not found</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Profile Header with Status */}
              <Card className="border-zinc-200 overflow-hidden">
                <div className="h-14 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 relative">
                  {(agent.pipeline_status === 'approved' || agent.pipeline_status === 'hired' || agent.pipeline_status === 'active') && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-white/90 text-emerald-600 gap-1 text-xs">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="pt-0 pb-4 -mt-6">
                  <div className="flex items-end gap-4">
                    <div className="relative w-14 h-14">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-400 p-[2px]">
                        <div className="w-full h-full rounded-xl bg-white flex items-center justify-center">
                          <span className="text-base font-bold bg-gradient-to-br from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                            {initials}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 pb-1">
                      <h2 className="text-lg font-bold text-zinc-900">{fullName}</h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge
                          className="text-xs font-medium border-0"
                          style={{ backgroundColor: `${stageInfo?.color}15`, color: stageInfo?.color }}
                        >
                          {stageInfo?.label}
                        </Badge>
                        <span className="text-xs text-zinc-500">
                          <span className="font-medium text-zinc-700">Agent ID:</span>{' '}
                          <span className="font-mono">{agent.agent_id?.replace('AGENT ', '')}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Actions */}
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 rounded-lg border-cyan-200 text-cyan-700 hover:bg-cyan-50 h-8 text-xs"
                      onClick={() => agent.profiles?.email && window.open(`mailto:${agent.profiles.email}`)}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8 text-xs"
                      onClick={() => agent.profiles?.phone && window.open(`tel:${agent.profiles.phone}`)}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pipeline Controls */}
              <Card className="border-zinc-200">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-600" />
                    Application Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {APP_STAGES.filter(s => s.status !== 'withdrawn').map((stage, idx) => {
                      const currentIdx = APP_STAGES.findIndex(s => s.status === application.status);
                      const targetIdx = idx;
                      const isCurrentStage = application.status === stage.status;
                      const isBackward = targetIdx < currentIdx;
                      const isForward = targetIdx > currentIdx;

                      // Determine which icon to show
                      const getIcon = () => {
                        if (isCurrentStage) {
                          if (stage.status === 'approved') return <CheckCircle2 className="h-3.5 w-3.5" />;
                          if (stage.status === 'rejected') return <XCircle className="h-3.5 w-3.5" />;
                          return <CheckCircle2 className="h-3.5 w-3.5" />;
                        }
                        if (stage.status === 'approved') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
                        if (stage.status === 'rejected') return <XCircle className="h-3.5 w-3.5 text-red-500" />;
                        if (isBackward) return <ArrowLeft className="h-3.5 w-3.5" />;
                        return <ArrowRight className="h-3.5 w-3.5" />;
                      };

                      return (
                        <Button
                          key={stage.status}
                          variant="outline"
                          size="sm"
                          disabled={updating || isCurrentStage}
                          onClick={() => handleStatusChange(stage.status)}
                          className={`h-8 text-xs gap-1.5 transition-all ${
                            isCurrentStage
                              ? `${stage.bgColor} ${stage.borderColor} font-medium`
                              : stage.status === 'rejected'
                                ? 'hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                                : stage.status === 'approved'
                                  ? 'hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600'
                                  : 'hover:bg-zinc-50'
                          }`}
                          style={isCurrentStage ? { color: stage.color } : {}}
                        >
                          {getIcon()}
                          {stage.label}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Export Options */}
              <Card className="border-zinc-200">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                    <Download className="h-4 w-4 text-cyan-600" />
                    Export Candidate
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportCandidate('pdf')}
                      className="h-8 text-xs gap-1.5 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportCandidate('excel')}
                      className="h-8 text-xs gap-1.5 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportCandidate('csv')}
                      className="h-8 text-xs gap-1.5 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportCandidate('json')}
                      className="h-8 text-xs gap-1.5 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600"
                    >
                      <FileJson className="h-3.5 w-3.5" />
                      JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Application Responses */}
              {application.answers && application.answers.length > 0 && (
                <Card className="border-zinc-200 border-cyan-200 bg-cyan-50/30">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-cyan-600" />
                      Application Responses
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {application.answers.filter(a => a.answer !== null).length}/{application.answers.length} answered
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-3">
                    {application.answers.map((qa, idx) => (
                      <div key={qa.id} className="bg-white rounded-lg p-3 border border-zinc-200">
                        <p className="text-xs font-medium text-zinc-700 mb-1">
                          {idx + 1}. {qa.question}
                          {qa.required && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        <p className="text-sm text-zinc-900">
                          {formatAnswer(qa.answer, qa.type, qa.options)}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Score Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Card className="border-zinc-200">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center">
                        <Zap className="h-3.5 w-3.5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-zinc-900">{agent.scores?.typing || 0}%</p>
                        <p className="text-[9px] text-zinc-500">Typing</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Target className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-zinc-900">{agent.scores?.communication || 0}%</p>
                        <p className="text-[9px] text-zinc-500">Comm</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Award className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-zinc-900">{agent.scores?.leadership || 0}%</p>
                        <p className="text-[9px] text-zinc-500">Leader</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Clock className="h-3.5 w-3.5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-zinc-900">{agent.availability?.hoursPerWeek || 0}h</p>
                        <p className="text-[9px] text-zinc-500">Weekly</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Overall Score */}
              <Card className="border-zinc-200">
                <CardContent className="p-3 flex items-center gap-4">
                  <ScoreGauge score={overallScore} label="Overall" size={70} />
                  <div className="flex-1 space-y-1.5">
                    <h3 className="font-semibold text-zinc-900 text-sm">Candidate Highlights</h3>
                    <div className="space-y-1">
                      {overallScore >= 70 && (
                        <div className="flex items-center gap-2 text-[11px] text-zinc-600">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span>Top performer candidate</span>
                        </div>
                      )}
                      {Array.isArray(agent.experience) && agent.experience.some(e => e.isCallCenter) && (
                        <div className="flex items-center gap-2 text-[11px] text-zinc-600">
                          <Briefcase className="h-3 w-3 text-cyan-500" />
                          <span>Call center experience</span>
                        </div>
                      )}
                      {agent.equipment?.hasComputer && agent.equipment?.hasHeadset && (
                        <div className="flex items-center gap-2 text-[11px] text-zinc-600">
                          <Monitor className="h-3 w-3 text-emerald-500" />
                          <span>Fully equipped</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              {Array.isArray(agent.skills) && agent.skills.length > 0 && (
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm font-semibold text-zinc-900">Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {agent.skills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="bg-zinc-50 text-zinc-700 border-zinc-200 text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contact Information */}
              <Card className="border-zinc-200">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-cyan-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-zinc-400" />
                      <div className="min-w-0">
                        <p className="text-[9px] text-zinc-500">Email</p>
                        <p className="text-xs font-medium text-zinc-900 truncate">{agent.profiles?.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-zinc-400" />
                      <div>
                        <p className="text-[9px] text-zinc-500">Phone</p>
                        <p className="text-xs font-medium text-zinc-900">{agent.profiles?.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                      <div>
                        <p className="text-[9px] text-zinc-500">Location</p>
                        <p className="text-xs font-medium text-zinc-900">
                          {agent.address?.city || 'N/A'}{agent.address?.state && `, ${agent.address.state}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-zinc-400" />
                      <div>
                        <p className="text-[9px] text-zinc-500">Timezone</p>
                        <p className="text-xs font-medium text-zinc-900">{agent.timezone || 'UTC-5'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                      <div>
                        <p className="text-[9px] text-zinc-500">Applied On</p>
                        <p className="text-xs font-medium text-zinc-900">{formatDate(application.submitted_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Languages className="h-3.5 w-3.5 text-zinc-400" />
                      <div>
                        <p className="text-[9px] text-zinc-500">Language</p>
                        <p className="text-xs font-medium text-zinc-900">
                          {agent.preferred_language === 'es' ? 'Spanish' : 'English'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Equipment */}
              <Card className="border-zinc-200">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-cyan-600" />
                    Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="grid grid-cols-4 gap-2">
                    <div className={`p-2 rounded-lg border text-center ${agent.equipment?.hasComputer ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                      <Monitor className={`h-4 w-4 mx-auto ${agent.equipment?.hasComputer ? 'text-emerald-600' : 'text-zinc-400'}`} />
                      <p className="text-[9px] mt-1 text-zinc-600">Computer</p>
                    </div>
                    <div className={`p-2 rounded-lg border text-center ${agent.equipment?.hasHeadset ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                      <Headphones className={`h-4 w-4 mx-auto ${agent.equipment?.hasHeadset ? 'text-emerald-600' : 'text-zinc-400'}`} />
                      <p className="text-[9px] mt-1 text-zinc-600">Headset</p>
                    </div>
                    <div className={`p-2 rounded-lg border text-center ${agent.equipment?.internetSpeed && agent.equipment.internetSpeed >= 25 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                      <Wifi className={`h-4 w-4 mx-auto ${agent.equipment?.internetSpeed && agent.equipment.internetSpeed >= 25 ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <p className="text-[9px] mt-1 text-zinc-600">{agent.equipment?.internetSpeed || 0} Mbps</p>
                    </div>
                    <div className={`p-2 rounded-lg border text-center ${agent.equipment?.hasQuietSpace ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                      <CheckCircle2 className={`h-4 w-4 mx-auto ${agent.equipment?.hasQuietSpace ? 'text-emerald-600' : 'text-zinc-400'}`} />
                      <p className="text-[9px] mt-1 text-zinc-600">Quiet</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Experience */}
              {Array.isArray(agent.experience) && agent.experience.length > 0 && (
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-cyan-600" />
                      Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-2">
                    {agent.experience.slice(0, 3).map((exp, idx) => (
                      <div key={exp.id || idx} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="h-3.5 w-3.5 text-zinc-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-zinc-900">{exp.position}</p>
                          <p className="text-[10px] text-zinc-500">{exp.company}</p>
                          <p className="text-[9px] text-zinc-400">
                            {exp.startDate} - {exp.endDate || 'Present'}
                            {exp.isCallCenter && (
                              <Badge variant="outline" className="ml-1.5 text-[8px] py-0 px-1 bg-cyan-50 text-cyan-700 border-cyan-200">
                                Call Center
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Languages */}
              {Array.isArray(agent.languages) && agent.languages.length > 0 && (
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                      <Languages className="h-4 w-4 text-cyan-600" />
                      Languages
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {agent.languages.map((lang, idx) => (
                        <Badge key={idx} variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
