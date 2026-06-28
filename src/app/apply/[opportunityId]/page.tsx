'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useOpportunityStore } from '@/store/supabaseStore';
import BrandMark from '@/components/BrandMark';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  Globe,
  HelpCircle,
  FileText,
  ClipboardCheck,
  ShieldCheck,
  Upload,
  Settings,
  X,
  Building2,
  CheckCircle,
  AlertTriangle,
  Star,
  MapPin,
  Heart,
  Zap,
  Shield,
  Award,
  BookOpen,
  User,
  ChevronRight,
} from 'lucide-react';
import type { ApplicationAnswer, ApplicationQuestion, ApplicationStage, StageType, JobSection } from '@/types';
import { checkRequirements, type JobRequirements, type SystemCheckResult } from '@/lib/systemCheck';

const STAGE_ICONS: Record<StageType, React.ElementType> = {
  info: FileText,
  questions: HelpCircle,
  assessment: ClipboardCheck,
  verification: ShieldCheck,
  documents: Upload,
  custom: Settings,
};

const SECTION_ICONS: Record<string, React.ElementType> = {
  Building2,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  Star,
  Briefcase,
  MapPin,
  Globe,
  Heart,
  Zap,
  Shield,
  Award,
  BookOpen,
  FileText,
};

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.opportunityId as string;

  const { profile, agent } = useAuthContext();
  const { opportunities, fetchOpportunities, applyToOpportunity } = useOpportunityStore();

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number | boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const opportunity = useMemo(() => {
    return opportunities.find(o => o.id === opportunityId);
  }, [opportunities, opportunityId]);

  useEffect(() => {
    fetchOpportunities().then(() => setLoading(false));
  }, [fetchOpportunities]);

  const stages: ApplicationStage[] = useMemo(() => {
    if (!opportunity) return [];

    if (opportunity.applicationStages && opportunity.applicationStages.length > 0) {
      return [...opportunity.applicationStages].sort((a, b) => a.order - b.order);
    }

    const questions = opportunity.applicationQuestions || [];
    const defaultStages: ApplicationStage[] = [
      {
        id: 'stage-info',
        opportunityId: opportunity.id,
        name: 'Job Details',
        description: 'Review the position details',
        type: 'info',
        order: 1,
        isRequired: true,
        content: { showJobDescription: true },
      },
    ];

    if (questions.length > 0) {
      defaultStages.push({
        id: 'stage-questions',
        opportunityId: opportunity.id,
        name: 'Application Questions',
        description: 'Answer a few questions',
        type: 'questions',
        order: 2,
        isRequired: true,
        questions: questions,
      });
    }

    defaultStages.push({
      id: 'stage-review',
      opportunityId: opportunity.id,
      name: 'Review & Submit',
      description: 'Review and submit your application',
      type: 'info',
      order: defaultStages.length + 1,
      isRequired: true,
      content: {},
    });

    return defaultStages;
  }, [opportunity]);

  const totalStages = stages.length;
  const currentStage = stages[currentStageIndex];
  const isLastStage = currentStageIndex === totalStages - 1;
  const isFirstStage = currentStageIndex === 0;

  // Group stages by their optional `group` into parent stages (Fountain-style).
  // Ungrouped stages are their own parent.
  const parentGroups = useMemo(() => {
    const groups: { title: string; indices: number[] }[] = [];
    stages.forEach((st, i) => {
      const g = st.group;
      if (g) {
        const existing = groups.find(p => p.title === g);
        if (existing) existing.indices.push(i);
        else groups.push({ title: g, indices: [i] });
      } else {
        groups.push({ title: st.name, indices: [i] });
      }
    });
    return groups;
  }, [stages]);

  const currentParentIdx = parentGroups.findIndex(p => p.indices.includes(currentStageIndex));
  const currentParent = parentGroups[currentParentIdx];

  const handleExit = () => router.push('/opportunities');
  const handleNext = () => isLastStage ? handleSubmit() : setCurrentStageIndex(prev => prev + 1);
  const handleBack = () => !isFirstStage && setCurrentStageIndex(prev => prev - 1);

  const handleSubmit = async () => {
    if (!opportunity || !agent) return;
    setSubmitting(true);
    const applicationAnswers: ApplicationAnswer[] = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }));
    const result = await applyToOpportunity(opportunity.id, applicationAnswers);
    setSubmitting(false);
    if (result.success) setSubmitted(true);
  };

  const updateAnswer = (questionId: string, value: string | string[] | number | boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const canProceed = () => {
    if (!currentStage) return false;
    if (currentStage.type === 'info') return true;
    if (currentStage.type === 'questions' && currentStage.questions) {
      return currentStage.questions.every(q => {
        if (!q.required) return true;
        const answer = answers[q.id];
        if (answer === undefined || answer === '') return false;
        if (Array.isArray(answer) && answer.length === 0) return false;
        return true;
      });
    }
    return true;
  };

  const renderQuestion = (question: ApplicationQuestion) => {
    const value = answers[question.id];

    switch (question.type) {
      case 'text':
        return (
          <Input
            placeholder={question.placeholder || 'Enter your answer...'}
            value={(value as string) || ''}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            className="h-12 border-zinc-300 focus:border-[var(--brand-blue)]"
          />
        );
      case 'textarea':
        return (
          <Textarea
            placeholder={question.placeholder || 'Enter your answer...'}
            value={(value as string) || ''}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            rows={4}
            className="border-zinc-300 focus:border-[var(--brand-blue)]"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            placeholder={question.placeholder || 'Enter a number...'}
            value={(value as number) || ''}
            onChange={(e) => updateAnswer(question.id, Number(e.target.value))}
            min={question.validation?.min}
            max={question.validation?.max}
            className="h-12 border-zinc-300 focus:border-[var(--brand-blue)]"
          />
        );
      case 'select':
        return (
          <Select value={(value as string) || ''} onValueChange={(v) => updateAnswer(question.id, v)}>
            <SelectTrigger className="h-12 border-zinc-300">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'radio':
        return (
          <RadioGroup value={(value as string) || ''} onValueChange={(v) => updateAnswer(question.id, v)} className="space-y-3">
            {question.options?.map(opt => (
              <div key={opt.value} className="flex items-center space-x-3 p-4 rounded-xl border border-zinc-200 hover:border-[rgba(32,71,255,0.3)] hover:bg-[var(--brand-blue-soft)] transition-all cursor-pointer" onClick={() => updateAnswer(question.id, opt.value)}>
                <RadioGroupItem value={opt.value} id={`${question.id}-${opt.value}`} />
                <Label htmlFor={`${question.id}-${opt.value}`} className="flex-1 cursor-pointer font-normal">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-3 p-4 rounded-xl border border-zinc-200 hover:border-[rgba(32,71,255,0.3)] hover:bg-[var(--brand-blue-soft)] transition-all cursor-pointer" onClick={() => updateAnswer(question.id, !value)}>
            <Checkbox id={question.id} checked={(value as boolean) || false} onCheckedChange={(checked) => updateAnswer(question.id, checked as boolean)} />
            <Label htmlFor={question.id} className="flex-1 cursor-pointer font-normal">{question.question}</Label>
          </div>
        );
      case 'multiselect':
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-3">
            {question.options?.map(opt => (
              <div key={opt.value} className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${selectedValues.includes(opt.value) ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-soft)]' : 'border-zinc-200 hover:border-[rgba(32,71,255,0.3)] hover:bg-[var(--brand-blue-soft)]'}`} onClick={() => {
                if (selectedValues.includes(opt.value)) {
                  updateAnswer(question.id, selectedValues.filter(v => v !== opt.value));
                } else {
                  updateAnswer(question.id, [...selectedValues, opt.value]);
                }
              }}>
                <Checkbox checked={selectedValues.includes(opt.value)} onCheckedChange={() => {}} />
                <Label className="flex-1 cursor-pointer font-normal">{opt.label}</Label>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  // Render job sections beautifully
  const renderJobSections = (sections: JobSection[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.sort((a, b) => a.order - b.order).map((section) => {
          const IconComponent = SECTION_ICONS[section.icon] || Zap;
          const contentLines = section.content.split('\n').filter(line => line.trim());

          return (
            <Card key={section.id} className="border-zinc-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2047FF] to-[#C873E5] flex items-center justify-center">
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900">{section.title}</h3>
                </div>
                <ul className="space-y-2">
                  {contentLines.map((line, idx) => {
                    const cleanLine = line.replace(/^[-•]\s*/, '').trim();
                    return (
                      <li key={idx} className="flex items-start gap-2 text-zinc-600">
                        <CheckCircle className="h-4 w-4 text-[var(--brand-blue)] mt-0.5 flex-shrink-0" />
                        <span>{cleanLine}</span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderStageContent = (stage: ApplicationStage) => {
    const compensation = opportunity?.compensation as Record<string, unknown> | null;
    const training = opportunity?.training as Record<string, unknown> | null;
    const jobSections = (opportunity as unknown as { jobSections?: JobSection[] })?.jobSections || [];

    switch (stage.type) {
      case 'info':
        if (stage.id.includes('review') || isLastStage) {
          return (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-[#C873E5] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-zinc-900 mb-4">Ready to Submit?</h1>
              <p className="text-lg text-zinc-600 mb-8 max-w-md mx-auto">Review your information and click submit when ready.</p>
              <Card className="bg-zinc-50 border-zinc-200 text-left mb-8">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-zinc-900 mb-4">Application Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-zinc-500">Position</p><p className="font-medium text-zinc-900">{opportunity?.name}</p></div>
                    <div><p className="text-zinc-500">Company</p><p className="font-medium text-zinc-900">{opportunity?.client}</p></div>
                    <div><p className="text-zinc-500">Applicant</p><p className="font-medium text-zinc-900">{profile?.first_name} {profile?.last_name}</p></div>
                    <div><p className="text-zinc-500">Email</p><p className="font-medium text-zinc-900">{profile?.email}</p></div>
                  </div>
                  {Object.keys(answers).length > 0 && (
                    <div className="mt-6 pt-4 border-t border-zinc-200">
                      <p className="text-zinc-500 text-sm mb-2">Questions Answered</p>
                      <Badge variant="secondary">{Object.keys(answers).length} responses</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        }

        // Job Info stage
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="border-b border-zinc-200 pb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#2047FF] to-[#C873E5] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-zinc-900 mb-1">{opportunity?.name}</h1>
                  <p className="text-lg text-zinc-600 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {opportunity?.client}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {opportunity?.category && <Badge variant="secondary">{opportunity.category}</Badge>}
                    <Badge className="bg-emerald-100 text-emerald-700">${String(compensation?.baseRate || 0)}/hr</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* If we have configured job sections, show them beautifully */}
            {jobSections.length > 0 ? (
              <>
                <h2 className="text-xl font-bold text-zinc-900">Program Highlights</h2>
                {renderJobSections(jobSections)}
              </>
            ) : (
              <>
                {/* Fallback: show basic description */}
                <section>
                  <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[var(--brand-blue)]" />
                    Job Description
                  </h2>
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      {opportunity?.description || 'No description provided.'}
                    </p>
                  </div>
                </section>
                <section>
                  <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Key Details</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-white">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-zinc-900 leading-none">${String(compensation?.baseRate || 0)}</p>
                        <p className="text-xs text-zinc-500 mt-1">per hour</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-white">
                      <div className="w-9 h-9 rounded-lg bg-[var(--brand-blue-soft)] flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4 text-[var(--brand-blue)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-zinc-900 leading-none">{String(training?.duration || 0)}h</p>
                        <p className="text-xs text-zinc-500 mt-1">training</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-white">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-zinc-900 leading-none">{opportunity?.capacity?.openPositions || 0}</p>
                        <p className="text-xs text-zinc-500 mt-1">positions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-white">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <Globe className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-zinc-900 leading-none">Remote</p>
                        <p className="text-xs text-zinc-500 mt-1">work from home</p>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Minimum system requirements */}
            {(() => {
              const sysReq = (opportunity as unknown as { requirements?: { systemRequirements?: JobRequirements } })?.requirements?.systemRequirements;
              if (!sysReq) return null;
              const items: { label: string; value: string }[] = [];
              if (sysReq.minInternetSpeed) items.push({ label: 'Internet', value: `${sysReq.minInternetSpeed}+ Mbps` });
              if (sysReq.minRam) items.push({ label: 'RAM', value: `${sysReq.minRam}+ GB` });
              if (sysReq.minCpuCores) items.push({ label: 'CPU', value: `${sysReq.minCpuCores}+ cores` });
              if (sysReq.minScreenWidth) items.push({ label: 'Screen', value: `${sysReq.minScreenWidth}px+ wide` });
              if (sysReq.requiresWebcam) items.push({ label: 'Webcam', value: 'Required' });
              if (sysReq.requiresMicrophone) items.push({ label: 'Microphone', value: 'Required' });
              if (sysReq.noVpn) items.push({ label: 'Connection', value: 'No VPN / proxy' });
              if (items.length === 0) return null;

              const sc = (agent as unknown as { system_check?: SystemCheckResult })?.system_check;
              const check = sc ? checkRequirements(sc, sysReq) : null;

              return (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-2">
                      <Shield className="h-4 w-4 text-[var(--brand-blue)]" />
                      Minimum System Requirements
                    </h2>
                    {check && (
                      <Badge className={check.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                        {check.passed ? 'Your system qualifies' : 'Below requirements'}
                      </Badge>
                    )}
                  </div>
                  {check ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {check.checks.map((c) => (
                        <div key={c.name} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200">
                          <div className="flex items-center gap-2 min-w-0">
                            {c.passed ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            )}
                            <span className="text-sm text-zinc-700 truncate">{c.name}</span>
                          </div>
                          <span className="text-sm font-medium text-zinc-900 shrink-0">{c.required}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {items.map((it) => (
                        <span key={it.label} className="text-sm px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-700">
                          <span className="text-zinc-500">{it.label}:</span> <span className="font-medium">{it.value}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              );
            })()}

            {/* CTA */}
            <div className="gradient-brand rounded-2xl px-5 py-4 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none">{opportunity?.capacity?.openPositions || 0} spots available</p>
                  <p className="text-white/75 text-xs mt-1">Ready to apply? Click &ldquo;Next&rdquo; to continue.</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-white/80 hidden sm:block" />
            </div>
          </div>
        );

      case 'questions':
        return (
          <div className="space-y-8">
            <div className="text-center pb-6 border-b border-zinc-200">
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">{stage.name}</h1>
              {stage.description && <p className="text-zinc-600">{stage.description}</p>}
            </div>
            {stage.questions && stage.questions.length > 0 ? (
              <div className="space-y-6">
                {stage.questions.map((question, idx) => (
                  <div key={question.id} className="space-y-3">
                    <Label className="text-base font-medium text-zinc-900 flex items-start gap-2">
                      <span className="bg-[var(--brand-blue-soft)] text-[var(--brand-blue)] rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">{idx + 1}</span>
                      <span className="flex-1">{question.question}{question.required && <span className="text-red-500 ml-1">*</span>}</span>
                    </Label>
                    {renderQuestion(question)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500">No questions configured</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">{stage.name}</h1>
            {stage.description && <p className="text-zinc-600">{stage.description}</p>}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-12 h-12 border-4 border-[var(--brand-blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <Briefcase className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-zinc-900 mb-2">Opportunity Not Found</h1>
          <p className="text-zinc-500 mb-4">This opportunity may have been removed.</p>
          <Button onClick={() => router.push('/opportunities')}>Browse Opportunities</Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--brand-blue-soft)] to-[var(--brand-purple-soft)] flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-[#C873E5] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-3">Application Submitted!</h1>
            <p className="text-zinc-600 mb-6">Your application for <strong>{opportunity.name}</strong> has been submitted.</p>
            <div className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-[#2047FF] to-[#C873E5]" onClick={() => router.push('/applications')}>View My Applications</Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StageIcon = currentStage ? STAGE_ICONS[currentStage.type] : FileText;
  const applicantName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Applicant';

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar - Fixed */}
      <div className="hidden lg:flex lg:w-80 bg-white border-r border-zinc-200 flex-col fixed left-0 top-0 bottom-0 z-20">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100">
          <BrandMark href="/dashboard" />
        </div>

        {/* Scrollable Content */}
        <div className="p-6 flex-1 overflow-auto">
          <div className="mb-6">
            <p className="text-xs font-medium text-[var(--brand-blue)] uppercase tracking-wider mb-2">Applying for</p>
            <h2 className="text-lg font-bold text-zinc-900 mb-1">{opportunity.name}</h2>
            <p className="text-sm text-zinc-500">{opportunity.client}</p>
          </div>
          <div className="mt-6">
            <p className="text-xs text-zinc-400">You&apos;re working on</p>
            <p className="text-sm font-bold text-zinc-900 mb-4">{currentParent?.title || 'Application'}</p>
            <div className="space-y-1">
              {parentGroups.map((p, pi) => {
                // Only reveal the current and completed parent stages.
                if (pi > currentParentIdx) return null;
                const firstStage = stages[p.indices[0]];
                const Icon = STAGE_ICONS[firstStage.type];
                const parentActive = pi === currentParentIdx;
                const parentDone = p.indices.every(idx => idx < currentStageIndex);
                const hasSubs = p.indices.length > 1;
                return (
                  <div key={p.title + pi}>
                    <div className={`flex items-center gap-3 p-2 rounded-lg transition-all ${parentActive ? 'bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]' : parentDone ? 'text-emerald-600' : 'text-zinc-400'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${parentActive ? 'bg-[var(--brand-blue)] text-white' : parentDone ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                        {parentDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3 w-3" />}
                      </div>
                      <span className="text-sm font-medium truncate">{p.title}</span>
                    </div>
                    {parentActive && hasSubs && (
                      <div className="ml-[1.6rem] mt-1 mb-1 space-y-1.5 border-l border-zinc-200 pl-3">
                        {p.indices.map(idx => {
                          const subActive = idx === currentStageIndex;
                          const subDone = idx < currentStageIndex;
                          return (
                            <div key={idx} className={`text-xs ${subActive ? 'text-[var(--brand-blue)] font-semibold' : subDone ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              {subDone ? '✓ ' : ''}{stages[idx].name}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Applicant Info - Fixed at Bottom */}
        <div className="p-6 border-t border-zinc-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2047FF] to-[#C873E5] flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-white" />
            </div>
            <p className="font-semibold text-zinc-900">{applicantName}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-80 flex flex-col min-h-screen">
        {/* Top Header - Fixed */}
        <div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile: Show job name */}
            <div className="lg:hidden">
              <p className="text-xs text-[var(--brand-blue)] font-medium">Applying for</p>
              <p className="font-semibold text-zinc-900 truncate">{opportunity.name}</p>
            </div>
            {/* Desktop: Just spacing to push exit to far right */}
            <div className="hidden lg:block flex-1" />

            {/* Exit Button - Far Right Corner */}
            <Button
              variant="ghost"
              onClick={handleExit}
              className="text-zinc-900 hover:text-red-600 hover:bg-red-50 rounded-lg gap-2 font-medium ml-auto"
            >
              Exit Application
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {currentParent && currentParent.indices.length > 1 && (
              <div className="flex items-center gap-1.5 text-sm text-zinc-400 mb-5">
                <span>{currentParent.title}</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-zinc-700 font-medium">{currentStage?.name}</span>
              </div>
            )}
            {currentStage && renderStageContent(currentStage)}
          </div>
        </div>

        {/* Bottom Footer - Fixed */}
        <div className="bg-white border-t border-zinc-200 px-6 py-4 sticky bottom-0 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handleBack} disabled={isFirstStage} className="gap-2">
              <ArrowLeft className="h-4 w-4" />Previous
            </Button>
            <Button onClick={handleNext} disabled={!canProceed() || submitting} className="gap-2 bg-gradient-to-r from-[#2047FF] to-[#C873E5] hover:from-[#2047FF] hover:to-[#C873E5] min-w-[140px]">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
              ) : isLastStage ? (
                <>Submit Application<CheckCircle2 className="h-4 w-4" /></>
              ) : (
                <>Next<ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
