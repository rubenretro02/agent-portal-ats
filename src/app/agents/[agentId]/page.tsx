'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
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
  ChevronRight,
} from 'lucide-react';
import { PIPELINE_STAGES, DOCUMENT_TYPES } from '@/lib/constants';
import type { PipelineStatus, DocumentStatus } from '@/types';

interface AgentProfile {
  id: string;
  ats_id: string;
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
  preferred_language: 'en' | 'es';
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    address: AddressInfo | null;
    date_of_birth: string | null;
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

export default function AgentProfilePage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuthContext();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [documents, setDocuments] = useState<AgentDocument[]>([]);
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not admin/recruiter
  useEffect(() => {
    if (!authLoading && profile && profile.role === 'agent') {
      router.push('/dashboard');
    }
  }, [authLoading, profile, router]);

  // Fetch agent data
  useEffect(() => {
    async function fetchAgentData() {
      setLoading(true);
      try {
        const { adminDb } = await import('@/lib/adminDb');

        // Fetch agent with profile
        const { data: agentData } = await adminDb<AgentProfile>({
          action: 'select_single',
          table: 'agents',
          select: `
            *,
            profiles (
              id,
              first_name,
              last_name,
              email,
              phone,
              address,
              date_of_birth
            )
          `,
          match: { id: agentId },
        });

        if (agentData) {
          setAgent(agentData);
        }

        // Fetch documents
        const { data: docsData } = await adminDb<AgentDocument[]>({
          action: 'select',
          table: 'documents',
          select: '*',
          match: { agent_id: agentId },
          order: { column: 'uploaded_at', ascending: false },
        });

        if (docsData) {
          setDocuments(docsData);
        }

        // Fetch applications
        const { data: appsData } = await adminDb<AgentApplication[]>({
          action: 'select',
          table: 'applications',
          select: `
            id,
            status,
            submitted_at,
            opportunities (
              id,
              name,
              client
            )
          `,
          match: { agent_id: agentId },
          order: { column: 'submitted_at', ascending: false },
        });

        if (appsData) {
          setApplications(appsData);
        }
      } catch (err) {
        console.error('Error fetching agent data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (profile && (profile.role === 'admin' || profile.role === 'recruiter') && agentId) {
      fetchAgentData();
    }
  }, [profile, agentId]);

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

  const calculateAge = (dob: string | null | undefined) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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

  if (loading) {
    return (
      <UnifiedLayout title="Agent Profile">
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </UnifiedLayout>
    );
  }

  if (!agent) {
    return (
      <UnifiedLayout title="Agent Profile">
        <div className="text-center py-24">
          <p className="text-zinc-500">Agent not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/agents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </div>
      </UnifiedLayout>
    );
  }

  const stageInfo = getStageInfo(agent.pipeline_status);
  const fullName = `${agent.profiles?.first_name || ''} ${agent.profiles?.last_name || ''}`.trim() || 'Unknown';
  const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const age = calculateAge(agent.profiles?.date_of_birth);
  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.status === agent.pipeline_status);

  return (
    <UnifiedLayout title="Agent Profile">
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => router.push('/agents')} className="gap-2 text-zinc-600 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </Button>

        {/* Hero Section */}
        <Card className="border-zinc-200 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              <div className="w-24 h-24 rounded-xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-2xl font-bold text-zinc-700 bg-gradient-to-br from-zinc-100 to-zinc-200">
                {initials}
              </div>
              <div className="flex-1 sm:pb-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-zinc-900">{fullName}</h1>
                  <Badge style={{ backgroundColor: `${stageInfo?.color}20`, color: stageInfo?.color }} className="text-xs font-medium">
                    {stageInfo?.label.en}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" />
                    {agent.ats_id}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Applied {formatDate(agent.created_at)}
                  </span>
                  {agent.preferred_language && (
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" />
                      {agent.preferred_language === 'es' ? 'Spanish' : 'English'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 sm:self-center">
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  Move Stage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Progress */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-zinc-900">Pipeline Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
              {PIPELINE_STAGES.slice(0, 7).map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                return (
                  <div key={stage.status} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                              ? 'ring-2 ring-offset-2'
                              : 'bg-zinc-100 text-zinc-400'
                        }`}
                        style={isCurrent ? { backgroundColor: stage.color, color: 'white', ringColor: stage.color } : {}}
                      >
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                      </div>
                      <span className={`text-xs mt-1.5 text-center truncate max-w-[80px] ${isCurrent ? 'font-medium text-zinc-900' : 'text-zinc-500'}`}>
                        {stage.label.en}
                      </span>
                    </div>
                    {idx < 6 && (
                      <ChevronRight className={`h-4 w-4 flex-shrink-0 ${idx < currentStageIndex ? 'text-emerald-500' : 'text-zinc-300'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="bg-zinc-100">
            <TabsTrigger value="info">Personal Info</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Contact Information */}
              <Card className="border-zinc-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-cyan-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Email</p>
                      <p className="text-sm font-medium text-zinc-900">{agent.profiles?.email || 'N/A'}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Phone</p>
                      <p className="text-sm font-medium text-zinc-900">{agent.profiles?.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Date of Birth</p>
                      <p className="text-sm font-medium text-zinc-900">
                        {formatDate(agent.profiles?.date_of_birth)}
                        {age && <span className="text-zinc-500 ml-1">({age} years old)</span>}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Address</p>
                      {agent.profiles?.address ? (
                        <div className="text-sm font-medium text-zinc-900">
                          <p>{agent.profiles.address.street}</p>
                          <p>{agent.profiles.address.city}, {agent.profiles.address.state} {agent.profiles.address.zipCode}</p>
                          <p>{agent.profiles.address.country}</p>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-zinc-900">N/A</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Equipment & Availability */}
              <Card className="border-zinc-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-cyan-600" />
                    Equipment & Availability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${agent.equipment?.hasComputer ? 'bg-emerald-50' : 'bg-zinc-100'}`}>
                        <Monitor className={`h-4 w-4 ${agent.equipment?.hasComputer ? 'text-emerald-600' : 'text-zinc-400'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Computer</p>
                        <p className="text-sm font-medium text-zinc-900">
                          {agent.equipment?.hasComputer ? `${agent.equipment.computerType || 'Yes'}` : 'No'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${agent.equipment?.hasHeadset ? 'bg-emerald-50' : 'bg-zinc-100'}`}>
                        <Headphones className={`h-4 w-4 ${agent.equipment?.hasHeadset ? 'text-emerald-600' : 'text-zinc-400'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Headset</p>
                        <p className="text-sm font-medium text-zinc-900">{agent.equipment?.hasHeadset ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${agent.equipment?.internetSpeed && agent.equipment.internetSpeed >= 25 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                        <Wifi className={`h-4 w-4 ${agent.equipment?.internetSpeed && agent.equipment.internetSpeed >= 25 ? 'text-emerald-600' : 'text-amber-600'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Internet Speed</p>
                        <p className="text-sm font-medium text-zinc-900">{agent.equipment?.internetSpeed ? `${agent.equipment.internetSpeed} Mbps` : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${agent.equipment?.hasQuietSpace ? 'bg-emerald-50' : 'bg-zinc-100'}`}>
                        <CheckCircle2 className={`h-4 w-4 ${agent.equipment?.hasQuietSpace ? 'text-emerald-600' : 'text-zinc-400'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Quiet Space</p>
                        <p className="text-sm font-medium text-zinc-900">{agent.equipment?.hasQuietSpace ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-zinc-500 mb-2">Availability</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-zinc-100">
                        <Clock className="h-3 w-3 mr-1" />
                        {agent.availability?.hoursPerWeek || 0} hrs/week
                      </Badge>
                      {agent.availability?.weekendsAvailable && (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">Weekends</Badge>
                      )}
                      {agent.availability?.holidaysAvailable && (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">Holidays</Badge>
                      )}
                    </div>
                    {agent.availability?.preferredShifts && agent.availability.preferredShifts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {agent.availability.preferredShifts.map(shift => (
                          <Badge key={shift} variant="outline" className="text-xs capitalize">
                            {shift}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Languages & Skills */}
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                  <Star className="h-4 w-4 text-cyan-600" />
                  Languages & Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-zinc-500 mb-2">Languages</p>
                    <div className="flex flex-wrap gap-2">
                      {agent.languages && agent.languages.length > 0 ? (
                        agent.languages.map(lang => (
                          <Badge key={lang} className="bg-cyan-50 text-cyan-700 hover:bg-cyan-100">
                            <Globe className="h-3 w-3 mr-1" />
                            {lang}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-zinc-500">No languages specified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {agent.skills && agent.skills.length > 0 ? (
                        agent.skills.map(skill => (
                          <Badge key={skill} variant="secondary" className="bg-zinc-100">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-zinc-500">No skills specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-4">
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-cyan-600" />
                  Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agent.experience && agent.experience.length > 0 ? (
                  <div className="space-y-6">
                    {agent.experience.map((exp, idx) => (
                      <div key={exp.id || idx} className="relative pl-6 pb-6 last:pb-0 border-l-2 border-zinc-200 last:border-transparent">
                        <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-cyan-500" />
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-semibold text-zinc-900">{exp.position}</h4>
                          {exp.isCallCenter && (
                            <Badge className="bg-teal-50 text-teal-700 text-xs">Call Center</Badge>
                          )}
                        </div>
                        <p className="text-sm text-zinc-600">{exp.company}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Present'}
                        </p>
                        {exp.description && (
                          <p className="text-sm text-zinc-600 mt-2">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                    <p>No work experience provided</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessment Tab */}
          <TabsContent value="assessment" className="space-y-4">
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                  <Star className="h-4 w-4 text-cyan-600" />
                  Assessment Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agent.scores && Object.keys(agent.scores).length > 0 ? (
                  <div className="space-y-4">
                    {/* Overall Score */}
                    {agent.scores.overall !== undefined && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-zinc-900">Overall Score</span>
                          <span className="text-2xl font-bold text-cyan-600">{agent.scores.overall}</span>
                        </div>
                        <Progress value={agent.scores.overall} className="h-3" />
                      </div>
                    )}

                    {/* Individual Scores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {Object.entries(agent.scores)
                        .filter(([key]) => key !== 'overall')
                        .map(([key, value]) => (
                          <div key={key} className="p-3 rounded-lg bg-zinc-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-zinc-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="text-sm font-semibold text-zinc-900">
                                {key === 'typing' ? `${value} WPM` : value}
                              </span>
                            </div>
                            <Progress value={key === 'typing' ? Math.min(value, 100) : value} className="h-2" />
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Star className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                    <p>No assessment scores available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-600" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="divide-y divide-zinc-100">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-zinc-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{getDocTypeLabel(doc.type)}</p>
                            <p className="text-xs text-zinc-500">Uploaded {formatDate(doc.uploaded_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="secondary"
                            className={
                              doc.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : doc.status === 'rejected'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-amber-50 text-amber-700'
                            }
                          >
                            {getStatusIcon(doc.status)}
                            <span className="ml-1 capitalize">{doc.status}</span>
                          </Badge>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                    <p>No documents uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-cyan-600" />
                  Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length > 0 ? (
                  <div className="divide-y divide-zinc-100">
                    {applications.map(app => (
                      <div key={app.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{app.opportunities?.name || 'Unknown Opportunity'}</p>
                          <p className="text-xs text-zinc-500">{app.opportunities?.client}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">Applied {formatDate(app.submitted_at)}</p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            app.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : app.status === 'rejected'
                                ? 'bg-red-50 text-red-700'
                                : app.status === 'in_review'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-700'
                          }
                        >
                          {app.status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {app.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                          {(app.status === 'pending' || app.status === 'in_review') && <AlertCircle className="h-3 w-3 mr-1" />}
                          <span className="capitalize">{app.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                    <p>No applications found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedLayout>
  );
}
