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
  Building2,
  ChevronRight,
  BadgeCheck,
  Zap,
  Target,
  Award,
  Languages,
} from 'lucide-react';
import { PIPELINE_STAGES, DOCUMENT_TYPES } from '@/lib/constants';
import type { PipelineStatus, DocumentStatus } from '@/types';

interface AgentProfile {
  id: string;
  user_id: string;
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

// Circular Score Gauge Component
function ScoreGauge({ score, label, size = 120 }: { score: number; label: string; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10b981'; // emerald
    if (s >= 60) return '#0891b2'; // cyan
    if (s >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-zinc-900">{score}</span>
        </div>
      </div>
      <span className="text-sm text-zinc-500 mt-2">{label}</span>
    </div>
  );
}

// Score Card Component
function ScoreCard({ value, label, icon: Icon, color }: { value: number | string; label: string; icon: React.ElementType; color: string }) {
  return (
    <Card className="border-zinc-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-3xl font-bold text-zinc-900">{typeof value === 'number' ? `${value}%` : value}</p>
            <p className="text-sm text-zinc-500 mt-1">{label}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
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

        // Fetch agent with profile - use select instead of select_single to handle edge cases
        const { data: agentData, error: agentError } = await adminDb<AgentProfile[]>({
          action: 'select',
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
          filters: { id: agentId },
          limit: 1,
        });

        if (agentError) {
          console.error('[v0] Error fetching agent:', agentError);
        }

        if (agentData && agentData.length > 0) {
          setAgent(agentData[0]);
        }

        // Fetch documents
        const { data: docsData } = await adminDb<AgentDocument[]>({
          action: 'select',
          table: 'documents',
          select: '*',
          filters: { agent_id: agentId },
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
          filters: { agent_id: agentId },
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

  const calculateOverallScore = () => {
    if (!agent?.scores) return 0;
    const scoreValues = Object.values(agent.scores).filter(v => typeof v === 'number');
    if (scoreValues.length === 0) return 0;
    return Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length);
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
  const overallScore = calculateOverallScore();
  const location = agent.profiles?.address ? 
    `${agent.profiles.address.city || ''}${agent.profiles.address.city && agent.profiles.address.country ? ', ' : ''}${agent.profiles.address.country || ''}` : 
    'N/A';

  return (
    <UnifiedLayout title="Agent Profile">
      <div className="space-y-6">
        {/* Back Button & Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={() => router.push('/agents')} className="gap-1 text-zinc-500 hover:text-zinc-900 -ml-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-zinc-400">/</span>
          <span className="text-zinc-500">Candidates</span>
          <span className="text-zinc-400">/</span>
          <span className="font-medium text-zinc-900">{fullName}</span>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Hero Card */}
            <Card className="border-zinc-200 overflow-hidden">
              {/* Gradient Banner */}
              <div className="h-20 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 relative">
                {/* Verified Badge */}
                {agent.pipeline_status === 'approved' || agent.pipeline_status === 'hired' || agent.pipeline_status === 'active' ? (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-emerald-600 gap-1">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified
                    </Badge>
                  </div>
                ) : null}
              </div>
              
              <CardContent className="pt-0 pb-6 -mt-10">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-xl font-bold text-zinc-700 bg-gradient-to-br from-zinc-100 to-zinc-200 mx-auto">
                  {initials}
                </div>
                
                {/* Name & Role */}
                <div className="text-center mt-4">
                  <h1 className="text-xl font-bold text-zinc-900">{fullName}</h1>
                  <Badge 
                    className="mt-2 text-xs"
                    style={{ backgroundColor: `${stageInfo?.color}15`, color: stageInfo?.color }}
                  >
                    {stageInfo?.label.en}
                  </Badge>
                </div>

                {/* Skills */}
                {agent.skills && agent.skills.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.skills.slice(0, 5).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="bg-zinc-50 text-zinc-700 border-zinc-200 text-xs font-normal">
                          {skill}
                        </Badge>
                      ))}
                      {agent.skills.length > 5 && (
                        <Badge variant="outline" className="bg-zinc-50 text-zinc-500 border-zinc-200 text-xs">
                          +{agent.skills.length - 5}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Position Type */}
                <div className="mt-5">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Position type</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="bg-zinc-50 text-zinc-700 border-zinc-200 text-xs font-normal">
                      Remote
                    </Badge>
                    <Badge variant="outline" className="bg-zinc-50 text-zinc-700 border-zinc-200 text-xs font-normal">
                      {agent.availability?.hoursPerWeek && agent.availability.hoursPerWeek >= 35 ? 'Full-time' : 'Part-time'}
                    </Badge>
                  </div>
                </div>

                {/* Location & Timezone */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/50">
                    <p className="text-xs text-zinc-500">Location</p>
                    <p className="text-sm font-medium text-zinc-900 mt-0.5 truncate">{location}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/50">
                    <p className="text-xs text-zinc-500">Timezone</p>
                    <p className="text-sm font-medium text-zinc-900 mt-0.5">UTC-5 (EST)</p>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="mt-5 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Phone className="h-4 w-4" />
                    Call
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Job Applications Card */}
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-900">Job Applications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {applications.length > 0 ? (
                  applications.slice(0, 3).map((app) => (
                    <div key={app.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {app.opportunities?.name || 'Unknown Position'}
                        </p>
                        <p className="text-xs text-zinc-500">{app.opportunities?.client || 'Unknown Client'}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          app.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          app.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {app.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500 text-center py-4">No applications yet</p>
                )}
                {applications.length > 3 && (
                  <Button variant="ghost" size="sm" className="w-full text-cyan-600 hover:text-cyan-700">
                    See {applications.length - 3} more
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Experience Card */}
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-900">Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agent.experience && agent.experience.length > 0 ? (
                  agent.experience.slice(0, 3).map((exp, idx) => (
                    <div key={exp.id || idx} className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-5 w-5 text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900">{exp.position}</p>
                        <p className="text-xs text-zinc-500">{exp.company}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {exp.startDate} - {exp.endDate || 'Present'}
                          {exp.isCallCenter && (
                            <Badge variant="outline" className="ml-2 text-[10px] py-0 px-1.5 bg-cyan-50 text-cyan-700 border-cyan-200">
                              Call Center
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500 text-center py-4">No experience added</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Scores & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ScoreCard 
                value={agent.scores?.typing || 0} 
                label="Typing Test" 
                icon={Zap} 
                color="bg-cyan-100 text-cyan-600" 
              />
              <ScoreCard 
                value={agent.scores?.communication || 0} 
                label="Communication" 
                icon={Target} 
                color="bg-emerald-100 text-emerald-600" 
              />
              <ScoreCard 
                value={agent.scores?.leadership || 0} 
                label="Leadership" 
                icon={Award} 
                color="bg-amber-100 text-amber-600" 
              />
              <ScoreCard 
                value={`${agent.availability?.hoursPerWeek || 0}h`} 
                label="Weekly Availability" 
                icon={Clock} 
                color="bg-violet-100 text-violet-600" 
              />
            </div>

            {/* Overall Score & Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Score Gauge */}
              <Card className="border-zinc-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-900">Overall Score</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-6">
                  <ScoreGauge score={overallScore} label="Overall Performance" size={160} />
                </CardContent>
              </Card>

              {/* Candidate Highlights */}
              <Card className="border-zinc-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-900">Candidate Highlights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Star className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Top of class</p>
                      <p className="text-xs text-zinc-500">This candidate scored in the top 10%</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Award className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Leadership potential</p>
                      <p className="text-xs text-zinc-500">Leadership score above average</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Call center experience</p>
                      <p className="text-xs text-zinc-500">{agent.experience?.filter(e => e.isCallCenter).length || 0} previous call center roles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact & Personal Information */}
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-cyan-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Email</p>
                      <p className="text-sm font-medium text-zinc-900">{agent.profiles?.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Phone</p>
                      <p className="text-sm font-medium text-zinc-900">{agent.profiles?.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Date of Birth</p>
                      <p className="text-sm font-medium text-zinc-900">
                        {formatDate(agent.profiles?.date_of_birth)}
                        {age && <span className="text-zinc-500 ml-1">({age} yrs)</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                      <Hash className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">ATS ID</p>
                      <p className="text-sm font-medium text-zinc-900">{agent.ats_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Preferred Language</p>
                      <p className="text-sm font-medium text-zinc-900">
                        {agent.preferred_language === 'es' ? 'Spanish' : 'English'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Address</p>
                      <p className="text-sm font-medium text-zinc-900">{location}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment & Setup */}
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-cyan-600" />
                  Equipment & Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl border ${agent.equipment?.hasComputer ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                    <Monitor className={`h-6 w-6 ${agent.equipment?.hasComputer ? 'text-emerald-600' : 'text-zinc-400'}`} />
                    <p className="text-sm font-medium text-zinc-900 mt-2">Computer</p>
                    <p className="text-xs text-zinc-500">{agent.equipment?.hasComputer ? (agent.equipment.computerType || 'Yes') : 'No'}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${agent.equipment?.hasHeadset ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                    <Headphones className={`h-6 w-6 ${agent.equipment?.hasHeadset ? 'text-emerald-600' : 'text-zinc-400'}`} />
                    <p className="text-sm font-medium text-zinc-900 mt-2">Headset</p>
                    <p className="text-xs text-zinc-500">{agent.equipment?.hasHeadset ? 'Yes' : 'No'}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${agent.equipment?.internetSpeed && agent.equipment.internetSpeed >= 25 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <Wifi className={`h-6 w-6 ${agent.equipment?.internetSpeed && agent.equipment.internetSpeed >= 25 ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <p className="text-sm font-medium text-zinc-900 mt-2">Internet</p>
                    <p className="text-xs text-zinc-500">{agent.equipment?.internetSpeed ? `${agent.equipment.internetSpeed} Mbps` : 'N/A'}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${agent.equipment?.hasQuietSpace ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                    <CheckCircle2 className={`h-6 w-6 ${agent.equipment?.hasQuietSpace ? 'text-emerald-600' : 'text-zinc-400'}`} />
                    <p className="text-sm font-medium text-zinc-900 mt-2">Quiet Space</p>
                    <p className="text-xs text-zinc-500">{agent.equipment?.hasQuietSpace ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Languages */}
            {agent.languages && agent.languages.length > 0 && (
              <Card className="border-zinc-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                    <Languages className="h-4 w-4 text-cyan-600" />
                    Languages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {agent.languages.map((lang, idx) => (
                      <Badge key={idx} variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-600" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-4 p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-zinc-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">{getDocTypeLabel(doc.type)}</p>
                          <p className="text-xs text-zinc-500">{formatDate(doc.uploaded_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(doc.status)}
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4 text-zinc-500" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Download className="h-4 w-4 text-zinc-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 text-center py-6">No documents uploaded</p>
                )}
              </CardContent>
            </Card>

            {/* Pipeline Progress */}
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-900">Pipeline Progress</CardTitle>
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
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                              isCompleted
                                ? 'bg-emerald-500 text-white'
                                : isCurrent
                                  ? 'ring-2 ring-offset-2 ring-cyan-500'
                                  : 'bg-zinc-100 text-zinc-400'
                            }`}
                            style={isCurrent ? { backgroundColor: stage.color, color: 'white' } : {}}
                          >
                            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                          </div>
                          <span className={`text-xs mt-2 text-center truncate max-w-[80px] ${isCurrent ? 'font-medium text-zinc-900' : 'text-zinc-500'}`}>
                            {stage.label.en}
                          </span>
                        </div>
                        {idx < 6 && (
                          <ChevronRight className={`h-4 w-4 flex-shrink-0 mx-1 ${idx < currentStageIndex ? 'text-emerald-500' : 'text-zinc-300'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end mt-4">
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    Move to Next Stage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
}
