'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Hash,
  Star,
  Building2,
  BadgeCheck,
  Zap,
  Target,
  Award,
  Languages,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PIPELINE_STAGES, DOCUMENT_TYPES } from '@/lib/constants';
import type { PipelineStatus, DocumentStatus } from '@/types';

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

interface AgentDocument {
  id: string;
  type: string;
  name: string;
  url: string;
  status: DocumentStatus;
  uploaded_at: string;
  reviewed_at?: string;
  notes?: string;
}

interface AgentApplication {
  id: string;
  status: string;
  submitted_at: string;
  opportunities: {
    id: string;
    name: string;
    client: string;
  } | null;
}

interface AgentProfileSheetProps {
  agentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

// Circular Score Gauge Component
function ScoreGauge({ score, label, size = 100 }: { score: number; label: string; size?: number }) {
  const radius = (size - 12) / 2;
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
            strokeWidth="6"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-zinc-900">{score}</span>
        </div>
      </div>
      <span className="text-xs text-zinc-500 mt-1">{label}</span>
    </div>
  );
}

export function AgentProfileSheet({
  agentId,
  open,
  onOpenChange,
  onNavigate,
  hasPrev = false,
  hasNext = false,
}: AgentProfileSheetProps) {
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [documents, setDocuments] = useState<AgentDocument[]>([]);
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAgentData() {
      if (!agentId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/agents/${agentId}`);
        const result = await response.json();

        if (!response.ok || !result.agent) {
          console.error('Error fetching agent:', result.error);
          setLoading(false);
          return;
        }

        const agentData = result.agent;
        const combinedAgent: AgentProfile = {
          id: agentData.id,
          user_id: agentData.user_id,
          agent_id: agentData.agent_id,
          pipeline_status: agentData.pipeline_status as PipelineStatus,
          pipeline_stage: agentData.pipeline_stage,
          created_at: agentData.created_at,
          last_status_change: agentData.last_status_change,
          scores: agentData.scores,
          languages: agentData.languages,
          skills: agentData.skills,
          experience: agentData.experience,
          equipment: agentData.equipment,
          availability: agentData.availability,
          address: agentData.address || null,
          timezone: agentData.timezone || 'America/New_York',
          application_date: agentData.application_date,
          preferred_language: agentData.preferred_language || 'en',
          profiles: agentData.profiles || null,
        };

        setAgent(combinedAgent);
        setDocuments(result.documents || []);
        setApplications(result.applications || []);
      } catch (err) {
        console.error('Error fetching agent data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (open && agentId) {
      fetchAgentData();
    }
  }, [agentId, open]);

  const getStageInfo = (status: PipelineStatus) => {
    return PIPELINE_STAGES.find(s => s.status === status);
  };

  const getDocTypeLabel = (type: string) => {
    const docType = DOCUMENT_TYPES.find(d => d.type === type);
    return docType?.label.en || type;
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
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
    if (!agent?.scores) return 0;
    const scoreValues = Object.values(agent.scores).filter(v => typeof v === 'number');
    if (scoreValues.length === 0) return 0;
    return Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length);
  };

  const stageInfo = agent ? getStageInfo(agent.pipeline_status) : null;
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
            <span className="text-sm text-zinc-500 ml-2">Agent Profile</span>
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
          ) : !agent ? (
            <div className="text-center py-24">
              <p className="text-zinc-500">Agent not found</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Profile Header */}
              <Card className="border-zinc-200 overflow-hidden">
                <div className="h-16 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 relative">
                  {(agent.pipeline_status === 'approved' || agent.pipeline_status === 'hired' || agent.pipeline_status === 'active') && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-white/90 text-emerald-600 gap-1 text-xs">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="pt-0 pb-4 -mt-8">
                  <div className="flex items-end gap-4">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-400 p-[2px]">
                        <div className="w-full h-full rounded-xl bg-white flex items-center justify-center">
                          <span className="text-lg font-bold bg-gradient-to-br from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                            {initials}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 pb-1">
                      <h2 className="text-xl font-bold text-zinc-900">{fullName}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className="text-xs font-medium border-0"
                          style={{ backgroundColor: `${stageInfo?.color}15`, color: stageInfo?.color }}
                        >
                          {stageInfo?.label.en}
                        </Badge>
                        <span className="text-xs text-zinc-500 font-mono">{agent.agent_id?.replace('AGENT ', '')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Actions */}
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 rounded-lg border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                      onClick={() => agent.profiles?.email && window.open(`mailto:${agent.profiles.email}`)}
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => agent.profiles?.phone && window.open(`tel:${agent.profiles.phone}`)}
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Score Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-zinc-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-zinc-900">{agent.scores?.typing || 0}%</p>
                        <p className="text-[10px] text-zinc-500">Typing</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Target className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-zinc-900">{agent.scores?.communication || 0}%</p>
                        <p className="text-[10px] text-zinc-500">Communication</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Award className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-zinc-900">{agent.scores?.leadership || 0}%</p>
                        <p className="text-[10px] text-zinc-500">Leadership</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-zinc-900">{agent.availability?.hoursPerWeek || 0}h</p>
                        <p className="text-[10px] text-zinc-500">Weekly</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Overall Score */}
              <Card className="border-zinc-200">
                <CardContent className="p-4 flex items-center gap-6">
                  <ScoreGauge score={overallScore} label="Overall" size={80} />
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-zinc-900">Candidate Highlights</h3>
                    <div className="space-y-1">
                      {overallScore >= 70 && (
                        <div className="flex items-center gap-2 text-xs text-zinc-600">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span>Top performer candidate</span>
                        </div>
                      )}
                      {Array.isArray(agent.experience) && agent.experience.some(e => e.isCallCenter) && (
                        <div className="flex items-center gap-2 text-xs text-zinc-600">
                          <Briefcase className="h-3 w-3 text-cyan-500" />
                          <span>Call center experience</span>
                        </div>
                      )}
                      {agent.equipment?.hasComputer && agent.equipment?.hasHeadset && (
                        <div className="flex items-center gap-2 text-xs text-zinc-600">
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-zinc-400" />
                      <div>
                        <p className="text-[10px] text-zinc-500">Email</p>
                        <p className="text-xs font-medium text-zinc-900 truncate">{agent.profiles?.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-zinc-400" />
                      <div>
                        <p className="text-[10px] text-zinc-500">Phone</p>
                        <p className="text-xs font-medium text-zinc-900">{agent.profiles?.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-zinc-400" />
                      <div>
                        <p className="text-[10px] text-zinc-500">Location</p>
                        <p className="text-xs font-medium text-zinc-900">
                          {agent.address?.city || 'N/A'}{agent.address?.state && `, ${agent.address.state}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-zinc-400" />
                      <div>
                        <p className="text-[10px] text-zinc-500">Timezone</p>
                        <p className="text-xs font-medium text-zinc-900">{agent.timezone || 'UTC-5'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-zinc-400" />
                      <div>
                        <p className="text-[10px] text-zinc-500">Applied On</p>
                        <p className="text-xs font-medium text-zinc-900">{formatDate(agent.application_date || agent.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-zinc-400" />
                      <div>
                        <p className="text-[10px] text-zinc-500">Language</p>
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
                      <p className="text-[10px] mt-1 text-zinc-600">Computer</p>
                    </div>
                    <div className={`p-2 rounded-lg border text-center ${agent.equipment?.hasHeadset ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                      <Headphones className={`h-4 w-4 mx-auto ${agent.equipment?.hasHeadset ? 'text-emerald-600' : 'text-zinc-400'}`} />
                      <p className="text-[10px] mt-1 text-zinc-600">Headset</p>
                    </div>
                    <div className={`p-2 rounded-lg border text-center ${agent.equipment?.internetSpeed && agent.equipment.internetSpeed >= 25 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                      <Wifi className={`h-4 w-4 mx-auto ${agent.equipment?.internetSpeed && agent.equipment.internetSpeed >= 25 ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <p className="text-[10px] mt-1 text-zinc-600">{agent.equipment?.internetSpeed || 0} Mbps</p>
                    </div>
                    <div className={`p-2 rounded-lg border text-center ${agent.equipment?.hasQuietSpace ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                      <CheckCircle2 className={`h-4 w-4 mx-auto ${agent.equipment?.hasQuietSpace ? 'text-emerald-600' : 'text-zinc-400'}`} />
                      <p className="text-[10px] mt-1 text-zinc-600">Quiet</p>
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
                  <CardContent className="px-4 pb-3 space-y-3">
                    {agent.experience.slice(0, 3).map((exp, idx) => (
                      <div key={exp.id || idx} className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="h-4 w-4 text-zinc-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-zinc-900">{exp.position}</p>
                          <p className="text-[10px] text-zinc-500">{exp.company}</p>
                          <p className="text-[10px] text-zinc-400">
                            {exp.startDate} - {exp.endDate || 'Present'}
                            {exp.isCallCenter && (
                              <Badge variant="outline" className="ml-2 text-[9px] py-0 px-1 bg-cyan-50 text-cyan-700 border-cyan-200">
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

              {/* Documents */}
              {documents.length > 0 && (
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-cyan-600" />
                      Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-2">
                    {documents.slice(0, 4).map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50">
                        <FileText className="h-4 w-4 text-zinc-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-zinc-900 truncate">{getDocTypeLabel(doc.type)}</p>
                          <p className="text-[10px] text-zinc-500">{formatDate(doc.uploaded_at)}</p>
                        </div>
                        {getStatusIcon(doc.status)}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="h-3 w-3 text-zinc-500" />
                        </Button>
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
                    <div className="flex flex-wrap gap-2">
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
