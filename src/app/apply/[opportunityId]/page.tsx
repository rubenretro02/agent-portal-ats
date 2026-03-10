'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useOpportunityStore } from '@/store/supabaseStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
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
  CheckSquare,
  Star,
  X,
  Building2,
  ListChecks,
  Award,
  GraduationCap,
  MapPin,
  Calendar,
  Headphones,
} from 'lucide-react';
import type { ApplicationAnswer, ApplicationQuestion, ApplicationStage, StageType } from '@/types';

// Stage type icons
const STAGE_ICONS: Record<StageType, React.ElementType> = {
  info: FileText,
  questions: HelpCircle,
  assessment: ClipboardCheck,
  verification: ShieldCheck,
  documents: Upload,
  custom: Settings,
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

  // Build stages from opportunity data
  const stages: ApplicationStage[] = useMemo(() => {
    if (!opportunity) return [];

    // Use new stages if available
    if (opportunity.applicationStages && opportunity.applicationStages.length > 0) {
      return [...opportunity.applicationStages].sort((a, b) => a.order - b.order);
    }

    // Fallback: Create default stages from old questions format
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
        content: {
          showJobDescription: true,
          showRequirements: true,
          showCompensation: true,
          showSchedule: true,
        },
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
  const progress = totalStages > 0 ? ((currentStageIndex + 1) / totalStages) * 100 : 0;
  const isLastStage = currentStageIndex === totalStages - 1;
  const isFirstStage = currentStageIndex === 0;

  const handleExit = () => {
    router.push('/opportunities');
  };

  const handleNext = () => {
    if (isLastStage) {
      handleSubmit();
    } else {
      setCurrentStageIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStage) {
      setCurrentStageIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!opportunity || !agent) return;

    setSubmitting(true);

    const applicationAnswers: ApplicationAnswer[] = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }));

    const result = await applyToOpportunity(opportunity.id, applicationAnswers);

    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    }
  };

  const updateAnswer = (questionId: string, value: string | string[] | number | boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const canProceed = () => {
    if (!currentStage) return false;

    // Info stages can always proceed
    if (currentStage.type === 'info') return true;

    // Questions stages need required questions answered
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
            className="h-12 border-zinc-300 focus:border-teal-500"
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={question.placeholder || 'Enter your answer...'}
            value={(value as string) || ''}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            rows={4}
            className="border-zinc-300 focus:border-teal-500"
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
            className="h-12 border-zinc-300 focus:border-teal-500"
          />
        );

      case 'select':
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={(v) => updateAnswer(question.id, v)}
          >
            <SelectTrigger className="h-12 border-zinc-300">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={(value as string) || ''}
            onValueChange={(v) => updateAnswer(question.id, v)}
            className="space-y-3"
          >
            {question.options?.map(opt => (
              <div
                key={opt.value}
                className="flex items-center space-x-3 p-4 rounded-xl border border-zinc-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer"
                onClick={() => updateAnswer(question.id, opt.value)}
              >
                <RadioGroupItem value={opt.value} id={`${question.id}-${opt.value}`} />
                <Label htmlFor={`${question.id}-${opt.value}`} className="flex-1 cursor-pointer font-normal">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div
            className="flex items-center space-x-3 p-4 rounded-xl border border-zinc-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer"
            onClick={() => updateAnswer(question.id, !value)}
          >
            <Checkbox
              id={question.id}
              checked={(value as boolean) || false}
              onCheckedChange={(checked) => updateAnswer(question.id, checked as boolean)}
            />
            <Label htmlFor={question.id} className="flex-1 cursor-pointer font-normal">
              {question.question}
            </Label>
          </div>
        );

      case 'multiselect':
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-3">
            {question.options?.map(opt => (
              <div
                key={opt.value}
                className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedValues.includes(opt.value)
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-zinc-200 hover:border-teal-300 hover:bg-teal-50/50'
                }`}
                onClick={() => {
                  if (selectedValues.includes(opt.value)) {
                    updateAnswer(question.id, selectedValues.filter(v => v !== opt.value));
                  } else {
                    updateAnswer(question.id, [...selectedValues, opt.value]);
                  }
                }}
              >
                <Checkbox
                  checked={selectedValues.includes(opt.value)}
                  onCheckedChange={() => {}}
                />
                <Label className="flex-1 cursor-pointer font-normal">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // Render Job Description Template (Professional Style)
  const renderJobDescriptionTemplate = () => {
    const compensation = opportunity?.compensation as Record<string, unknown> | null;
    const training = opportunity?.training as Record<string, unknown> | null;
    const requirements = opportunity?.requirements as Record<string, unknown> | null;
    const languages = (requirements?.languages as string[]) || [];
    const skills = (requirements?.skills as string[]) || [];

    return (
      <div className="space-y-8">
        {/* Job Header */}
        <div className="border-b border-zinc-200 pb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-zinc-900 mb-1">
                {opportunity?.name}
              </h1>
              <p className="text-lg text-zinc-600 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {opportunity?.client}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {opportunity?.category && (
                  <Badge variant="secondary">{opportunity.category}</Badge>
                )}
                <Badge className="bg-emerald-100 text-emerald-700">
                  ${String(compensation?.baseRate || 0)}/hr
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Remote
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Job Details Section */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            Job Details
          </h2>
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">
              {opportunity?.description || 'No description provided.'}
            </p>
          </div>
        </section>

        {/* About the Company */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-teal-600" />
            About the Company
          </h2>
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <p className="text-zinc-700 leading-relaxed">
              <strong>{opportunity?.client}</strong> is looking for talented individuals to join their team.
              This is a remote opportunity that offers flexibility and competitive compensation.
            </p>
          </div>
        </section>

        {/* Role & Responsibilities */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-teal-600" />
            Role & Responsibilities
          </h2>
          <ul className="space-y-2 text-zinc-700">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <span>Handle inbound/outbound calls professionally</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <span>Provide excellent customer service and support</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <span>Meet performance metrics and quality standards</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <span>Document interactions accurately in the system</span>
            </li>
            {skills.length > 0 && skills.map((skill, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
                <span>{skill}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Benefits */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-teal-600" />
            Benefits
          </h2>
          <ul className="space-y-2 text-zinc-700">
            <li className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>${String(compensation?.baseRate || 0)}/hr</strong> base rate {compensation?.bonusStructure ? `+ ${compensation.bonusStructure}` : ''}</span>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-cyan-500 mt-0.5 flex-shrink-0" />
              <span>Flexible schedule - work from home</span>
            </li>
            <li className="flex items-start gap-3">
              <Headphones className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <span>Paid training ({String(training?.duration || 0)} hours)</span>
            </li>
            <li className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <span>Weekly payments via direct deposit</span>
            </li>
            <li className="flex items-start gap-3">
              <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>Performance bonuses available</span>
            </li>
          </ul>
        </section>

        {/* Qualifications */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-teal-600" />
            Qualifications
          </h2>
          <ul className="space-y-2 text-zinc-700">
            {languages.length > 0 && (
              <li className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <span>Fluent in {languages.join(' and ')}</span>
              </li>
            )}
            <li className="flex items-start gap-3">
              <CheckSquare className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <span>Reliable high-speed internet connection</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckSquare className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <span>Quiet workspace for calls</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckSquare className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <span>Computer with headset</span>
            </li>
            {Number(requirements?.minExperience || 0) > 0 ? (
              <li className="flex items-start gap-3">
                <CheckSquare className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
                <span>{String(requirements?.minExperience)} months of call center experience</span>
              </li>
            ) : (
              <li className="flex items-start gap-3">
                <CheckSquare className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
                <span>No prior experience required - we provide training!</span>
              </li>
            )}
            {Boolean(requirements?.backgroundCheckRequired) && (
              <li className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span>Must pass background check</span>
              </li>
            )}
          </ul>
        </section>

        {/* Positions Available */}
        <section className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm mb-1">Positions Available</p>
              <p className="text-3xl font-bold">{opportunity?.capacity?.openPositions || 0} spots</p>
            </div>
            <div className="text-right">
              <p className="text-teal-100 text-sm mb-1">Apply Now</p>
              <p className="text-lg font-medium">Click "Next" to continue</p>
            </div>
          </div>
        </section>
      </div>
    );
  };

  // Render stage content based on type
  const renderStageContent = (stage: ApplicationStage) => {
    switch (stage.type) {
      case 'info':
        // Check if this is the review/submit stage (last stage)
        if (stage.id.includes('review') || isLastStage) {
          return (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-zinc-900 mb-4">
                Ready to Submit?
              </h1>
              <p className="text-lg text-zinc-600 mb-8 max-w-md mx-auto">
                You've completed all the stages. Review your information and click submit when ready.
              </p>

              <Card className="bg-zinc-50 border-zinc-200 text-left mb-8">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-zinc-900 mb-4">Application Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-500">Position</p>
                      <p className="font-medium text-zinc-900">{opportunity?.name}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Company</p>
                      <p className="font-medium text-zinc-900">{opportunity?.client}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Applicant</p>
                      <p className="font-medium text-zinc-900">{profile?.first_name} {profile?.last_name}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Email</p>
                      <p className="font-medium text-zinc-900">{profile?.email}</p>
                    </div>
                  </div>

                  {Object.keys(answers).length > 0 && (
                    <div className="mt-6 pt-4 border-t border-zinc-200">
                      <p className="text-zinc-500 text-sm mb-2">Questions Answered</p>
                      <Badge variant="secondary">{Object.keys(answers).length} responses</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              <p className="text-sm text-zinc-500 mb-6">
                By submitting, you confirm that all information provided is accurate.
              </p>
            </div>
          );
        }

        // Job Information stage (first stage) - Use professional template
        return renderJobDescriptionTemplate();

      case 'questions':
        return (
          <div className="space-y-8">
            <div className="text-center pb-6 border-b border-zinc-200">
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">
                {stage.name}
              </h1>
              {stage.description && (
                <p className="text-zinc-600">{stage.description}</p>
              )}
            </div>

            {stage.questions && stage.questions.length > 0 ? (
              <div className="space-y-6">
                {stage.questions.map((question, idx) => (
                  <div key={question.id} className="space-y-3">
                    <Label className="text-base font-medium text-zinc-900 flex items-start gap-2">
                      <span className="bg-teal-100 text-teal-700 rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1">
                        {question.question}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </Label>
                    {renderQuestion(question)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500">No questions in this stage</p>
              </div>
            )}
          </div>
        );

      case 'assessment':
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ClipboardCheck className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">{stage.name}</h1>
            <p className="text-zinc-600 mb-8 max-w-md mx-auto">
              {stage.description || 'Complete the assessment to continue with your application.'}
            </p>
          </div>
        );

      case 'verification':
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">{stage.name}</h1>
            <p className="text-zinc-600 mb-8 max-w-md mx-auto">
              {stage.description || 'Complete the verification process to continue.'}
            </p>
          </div>
        );

      case 'documents':
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">{stage.name}</h1>
            <p className="text-zinc-600 mb-8 max-w-md mx-auto">
              {stage.description || 'Upload the required documents to continue.'}
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">{stage.name}</h1>
            {stage.description && (
              <p className="text-zinc-600">{stage.description}</p>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <Briefcase className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-zinc-900 mb-2">Opportunity Not Found</h1>
          <p className="text-zinc-500 mb-4">This opportunity may have been removed or is no longer available.</p>
          <Button onClick={() => router.push('/opportunities')}>
            Browse Opportunities
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-3">
              Application Submitted!
            </h1>
            <p className="text-zinc-600 mb-6">
              Your application for <strong>{opportunity.name}</strong> at {opportunity.client} has been submitted successfully.
            </p>
            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500"
                onClick={() => router.push('/applications')}
              >
                View My Applications
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const compensation = opportunity.compensation as Record<string, unknown> | null;
  const training = opportunity.training as Record<string, unknown> | null;
  const StageIcon = currentStage ? STAGE_ICONS[currentStage.type] : FileText;

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-80 bg-white border-r border-zinc-200 flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-white">
              AP
            </div>
            <span className="text-xl font-bold text-zinc-900">AgentHub</span>
          </div>
        </div>

        {/* Job Info */}
        <div className="p-6 flex-1">
          <div className="mb-6">
            <p className="text-xs font-medium text-teal-600 uppercase tracking-wider mb-2">
              Applying for
            </p>
            <h2 className="text-lg font-bold text-zinc-900 mb-1">
              {opportunity.name}
            </h2>
            <p className="text-sm text-zinc-500">{opportunity.client}</p>
          </div>

          {opportunity.category && (
            <Badge variant="secondary" className="mb-6">
              {opportunity.category}
            </Badge>
          )}

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">${String(compensation?.baseRate || 0)}/hr</p>
                <p className="text-xs text-zinc-500">Base Rate</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-cyan-600" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">{String(training?.duration || 0)} hours</p>
                <p className="text-xs text-zinc-500">Training</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">{opportunity.capacity?.openPositions || 0} spots</p>
                <p className="text-xs text-zinc-500">Available</p>
              </div>
            </div>
          </div>

          {/* Stage Progress */}
          <div className="border-t border-zinc-100 pt-6">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
              Application Stages
            </p>
            <div className="space-y-2">
              {stages.map((stage, index) => {
                const Icon = STAGE_ICONS[stage.type];
                return (
                  <div
                    key={stage.id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                      index === currentStageIndex
                        ? 'bg-teal-50 text-teal-700'
                        : index < currentStageIndex
                        ? 'text-emerald-600'
                        : 'text-zinc-400'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index === currentStageIndex
                        ? 'bg-teal-500 text-white'
                        : index < currentStageIndex
                        ? 'bg-emerald-500 text-white'
                        : 'bg-zinc-200 text-zinc-500'
                    }`}>
                      {index < currentStageIndex ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-3 w-3" />
                      )}
                    </div>
                    <span className="text-sm font-medium truncate">{stage.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Support Link */}
        <div className="p-6 border-t border-zinc-100">
          <a href="mailto:support@agenthub.com" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-teal-600 transition-colors">
            <HelpCircle className="h-4 w-4" />
            Get Support
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Progress and Exit Button */}
        <div className="bg-white border-b border-zinc-200 px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              {/* Mobile: Job Title */}
              <div className="lg:hidden">
                <p className="text-xs text-teal-600 font-medium">Applying for</p>
                <p className="font-semibold text-zinc-900 truncate">{opportunity.name}</p>
              </div>

              {/* Desktop: Stage info */}
              <div className="hidden lg:flex items-center gap-2 text-sm text-zinc-500">
                <StageIcon className="h-4 w-4" />
                {currentStage?.name || `Stage ${currentStageIndex + 1}`}
              </div>

              {/* Progress indicator */}
              <span className="font-medium text-teal-600 text-sm">{Math.round(progress)}% Complete</span>

              {/* Exit Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExit}
                className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {currentStage && renderStageContent(currentStage)}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-white border-t border-zinc-200 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirstStage}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || submitting}
              className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 min-w-[140px]"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : isLastStage ? (
                <>
                  Submit Application
                  <CheckCircle2 className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
