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
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import type { ApplicationAnswer, ApplicationQuestion } from '@/types';

interface ApplicationStep {
  id: string;
  title: string;
  description: string;
  questions: ApplicationQuestion[];
}

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.opportunityId as string;

  const { profile, agent } = useAuthContext();
  const { opportunities, fetchOpportunities, applyToOpportunity } = useOpportunityStore();

  const [currentStep, setCurrentStep] = useState(0);
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

  // Group questions into steps (4-5 questions per step)
  const steps: ApplicationStep[] = useMemo(() => {
    if (!opportunity) return [];

    const questions = opportunity.applicationQuestions || [];
    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

    // Create default steps if no questions
    if (sortedQuestions.length === 0) {
      return [
        {
          id: 'welcome',
          title: 'Welcome',
          description: 'Start your application journey',
          questions: [],
        },
        {
          id: 'confirm',
          title: 'Confirmation',
          description: 'Review and submit',
          questions: [],
        },
      ];
    }

    // Group questions into steps
    const stepsArray: ApplicationStep[] = [
      {
        id: 'welcome',
        title: 'Welcome',
        description: 'Start your application journey',
        questions: [],
      },
    ];

    const questionsPerStep = 3;
    for (let i = 0; i < sortedQuestions.length; i += questionsPerStep) {
      const stepQuestions = sortedQuestions.slice(i, i + questionsPerStep);
      stepsArray.push({
        id: `step-${Math.floor(i / questionsPerStep) + 1}`,
        title: `Questions ${i + 1}-${Math.min(i + questionsPerStep, sortedQuestions.length)}`,
        description: 'Answer the following questions',
        questions: stepQuestions,
      });
    }

    stepsArray.push({
      id: 'confirm',
      title: 'Confirmation',
      description: 'Review and submit your application',
      questions: [],
    });

    return stepsArray;
  }, [opportunity]);

  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
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
    if (!currentStepData) return false;
    if (currentStepData.questions.length === 0) return true;

    // Check if all required questions are answered
    return currentStepData.questions.every(q => {
      if (!q.required) return true;
      const answer = answers[q.id];
      if (answer === undefined || answer === '') return false;
      if (Array.isArray(answer) && answer.length === 0) return false;
      return true;
    });
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
            className="h-12"
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={question.placeholder || 'Enter your answer...'}
            value={(value as string) || ''}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            rows={4}
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
            className="h-12"
          />
        );

      case 'select':
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={(v) => updateAnswer(question.id, v)}
          >
            <SelectTrigger className="h-12">
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
              Congratulations! Your application for <strong>{opportunity.name}</strong> at {opportunity.client} has been submitted successfully. We'll review your application and get back to you soon.
            </p>
            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
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
            <div className="inline-block px-3 py-1 bg-zinc-100 text-zinc-600 text-xs font-medium rounded-full mb-6">
              {opportunity.category}
            </div>
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
                <p className="font-semibold text-zinc-900">{opportunity.capacity.openPositions} spots</p>
                <p className="text-xs text-zinc-500">Available</p>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="border-t border-zinc-100 pt-6">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
              Your Progress
            </p>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                    index === currentStep
                      ? 'bg-teal-50 text-teal-700'
                      : index < currentStep
                      ? 'text-emerald-600'
                      : 'text-zinc-400'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    index === currentStep
                      ? 'bg-teal-500 text-white'
                      : index < currentStep
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-200 text-zinc-500'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
              ))}
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
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-zinc-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                AP
              </div>
              <span className="font-bold text-zinc-900">AgentHub</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/opportunities')}>
              Exit
            </Button>
          </div>
          <div>
            <p className="text-xs text-teal-600 font-medium">Applying for</p>
            <p className="font-semibold text-zinc-900 truncate">{opportunity.name}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border-b border-zinc-200 px-6 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-zinc-500">Step {currentStep + 1} of {totalSteps}</span>
              <span className="font-medium text-teal-600">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto px-6 py-12">
            {/* Welcome Step */}
            {currentStep === 0 && (
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 mb-4">
                  Your Journey Starts Now!
                </h1>
                <p className="text-lg text-zinc-600 mb-8 max-w-md mx-auto">
                  You're about to apply for <strong>{opportunity.name}</strong> at {opportunity.client}.
                  This application will take approximately 5-10 minutes to complete.
                </p>

                <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200 text-left mb-8">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-teal-800 mb-3">What to expect:</h3>
                    <ul className="space-y-2 text-sm text-teal-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-teal-500" />
                        Answer a few questions about your experience and availability
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-teal-500" />
                        Your profile information will be included automatically
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-teal-500" />
                        You'll receive a confirmation once submitted
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Question Steps */}
            {currentStep > 0 && currentStep < totalSteps - 1 && currentStepData && (
              <div className="space-y-8">
                {currentStepData.questions.map((question, qIndex) => (
                  <div key={question.id} className="space-y-3">
                    <Label className="text-base font-medium text-zinc-900 flex items-start gap-1">
                      {question.question}
                      {question.required && <span className="text-red-500">*</span>}
                    </Label>
                    {renderQuestion(question)}
                  </div>
                ))}

                {currentStepData.questions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-zinc-500">No questions in this section. Continue to the next step.</p>
                  </div>
                )}
              </div>
            )}

            {/* Confirmation Step */}
            {isLastStep && (
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 mb-4">
                  Ready to Submit?
                </h1>
                <p className="text-lg text-zinc-600 mb-8 max-w-md mx-auto">
                  You've completed all the questions. Review your answers and click submit when you're ready.
                </p>

                <Card className="bg-zinc-50 border-zinc-200 text-left mb-8">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-zinc-900 mb-4">Application Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-500">Position</p>
                        <p className="font-medium text-zinc-900">{opportunity.name}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Company</p>
                        <p className="font-medium text-zinc-900">{opportunity.client}</p>
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
                  </CardContent>
                </Card>

                <p className="text-sm text-zinc-500 mb-6">
                  By submitting, you confirm that all information provided is accurate and you agree to be contacted regarding this opportunity.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-white border-t border-zinc-200 px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirstStep}
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
              ) : isLastStep ? (
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
