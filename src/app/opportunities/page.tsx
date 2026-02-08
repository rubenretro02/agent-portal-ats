'use client';

import { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { RequirePersonalInfo } from '@/components/RequirePersonalInfo';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuthStore, useOpportunityStore } from '@/store/supabaseStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Filter,
  DollarSign,
  Clock,
  Users,
  Globe,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import type { ApplicationQuestion, ApplicationAnswer } from '@/types';

export default function OpportunitiesPage() {
  const { agent: authAgent, profile, isLoading: authLoading } = useAuthContext();
  const { language } = useAuthStore();
  const { opportunities, fetchOpportunities, applyToOpportunity, isLoading, appliedOpportunityIds, fetchAppliedOpportunities } = useOpportunityStore();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<typeof opportunities[0] | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [copied, setCopied] = useState(false);

  // Form state
  const [formAnswers, setFormAnswers] = useState<Record<string, string | string[] | number | boolean>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Always fetch opportunities, regardless of agent state
    fetchOpportunities();
  }, [fetchOpportunities]);

  useEffect(() => {
    // Fetch applied opportunities when agent is loaded
    if (authAgent) {
      fetchAppliedOpportunities();
    }
  }, [authAgent, fetchAppliedOpportunities]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Please sign in to view opportunities</p>
          <a href="/login" className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-teal-500 text-white font-medium hover:bg-teal-600">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Use authAgent data with fallback defaults
  const agent = authAgent || {
    id: '',
    user_id: profile.id,
    ats_id: '',
    pipeline_status: 'applied',
    pipeline_stage: 1,
    scores: null,
    languages: ['English'],
    equipment: null,
  };

  const categories = [...new Set(opportunities.map(c => c.category).filter(Boolean))];

  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch =
      opportunity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || opportunity.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Parse agent data
  const agentScores = agent.scores as Record<string, number> | null;
  const agentLanguages = (agent.languages as string[]) || [];
  const agentEquipment = agent.equipment as Record<string, unknown> | null;

  const checkRequirements = (opportunity: typeof opportunities[0]) => {
    const requirements = opportunity.requirements as Record<string, unknown> | null;
    if (!requirements) {
      return { score: true, languages: true, experience: true, equipment: true, allMet: true };
    }

    const minScore = (requirements.minScore as number) || 0;
    const requiredLanguages = (requirements.languages as string[]) || [];
    const equipmentReqs = (requirements.equipmentRequirements as Record<string, unknown>) || {};

    const results = {
      score: (agentScores?.overall || 0) >= minScore,
      languages: requiredLanguages.every(lang => agentLanguages.includes(lang)),
      experience: true, // Simplified for now
      equipment: (!equipmentReqs.hasComputer || agentEquipment?.hasComputer) &&
                 (!equipmentReqs.hasHeadset || agentEquipment?.hasHeadset),
    };

    return {
      ...results,
      allMet: Object.values(results).every(Boolean),
    };
  };

  const getQuestionLabel = (question: ApplicationQuestion) => {
    return language === 'es' && question.questionEs ? question.questionEs : question.question;
  };

  const getOptionLabel = (option: { value: string; label: string; labelEs?: string }) => {
    return language === 'es' && option.labelEs ? option.labelEs : option.label;
  };

  const getPlaceholder = (question: ApplicationQuestion) => {
    return language === 'es' && question.placeholderEs ? question.placeholderEs : question.placeholder;
  };

  const handleOpenDetailsDialog = (opportunity: typeof opportunities[0]) => {
    setSelectedOpportunity(opportunity);
    setShowDetailsDialog(true);
  };

  const handleProceedToApply = () => {
    setShowDetailsDialog(false);
    setFormAnswers({});
    setFormErrors({});
    setShowApplyDialog(true);
  };

  const validateForm = () => {
    if (!selectedOpportunity) return false;

    const errors: Record<string, string> = {};

    selectedOpportunity.applicationQuestions.forEach(question => {
      if (question.required) {
        const answer = formAnswers[question.id];
        if (answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
          errors[question.id] = language === 'es' ? 'Este campo es requerido' : 'This field is required';
        }
      }

      // Validate number fields
      if (question.type === 'number' && question.validation) {
        const value = Number(formAnswers[question.id]);
        if (question.validation.min !== undefined && value < question.validation.min) {
          errors[question.id] = question.validation.message || `Minimum value is ${question.validation.min}`;
        }
        if (question.validation.max !== undefined && value > question.validation.max) {
          errors[question.id] = question.validation.message || `Maximum value is ${question.validation.max}`;
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApply = async () => {
    if (!selectedOpportunity || !validateForm()) return;

    setApplying(true);

    // Convert form answers to ApplicationAnswer format
    const answers: ApplicationAnswer[] = Object.entries(formAnswers).map(([questionId, value]) => ({
      questionId,
      value,
    }));

    const result = await applyToOpportunity(selectedOpportunity.id, answers);

    if (result.success) {
      setApplicationId(result.applicationId);
      setShowApplyDialog(false);
      setShowSuccessDialog(true);
    }

    setApplying(false);
  };

  const copyApplicationId = () => {
    navigator.clipboard.writeText(applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderQuestion = (question: ApplicationQuestion) => {
    const error = formErrors[question.id];

    switch (question.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              {getQuestionLabel(question)}
              {question.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              placeholder={getPlaceholder(question)}
              value={(formAnswers[question.id] as string) || ''}
              onChange={(e) => setFormAnswers({ ...formAnswers, [question.id]: e.target.value })}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              {getQuestionLabel(question)}
              {question.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              placeholder={getPlaceholder(question)}
              value={(formAnswers[question.id] as string) || ''}
              onChange={(e) => setFormAnswers({ ...formAnswers, [question.id]: e.target.value })}
              rows={4}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              {getQuestionLabel(question)}
              {question.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              type="number"
              placeholder={getPlaceholder(question)}
              value={(formAnswers[question.id] as number) || ''}
              onChange={(e) => setFormAnswers({ ...formAnswers, [question.id]: Number(e.target.value) })}
              min={question.validation?.min}
              max={question.validation?.max}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              {getQuestionLabel(question)}
              {question.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              type="date"
              value={(formAnswers[question.id] as string) || ''}
              onChange={(e) => setFormAnswers({ ...formAnswers, [question.id]: e.target.value })}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              {getQuestionLabel(question)}
              {question.required && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={(formAnswers[question.id] as string) || ''}
              onValueChange={(value: string) => setFormAnswers({ ...formAnswers, [question.id]: value })}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {getOptionLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              {getQuestionLabel(question)}
              {question.required && <span className="text-red-500">*</span>}
            </Label>
            <RadioGroup
              value={(formAnswers[question.id] as string) || ''}
              onValueChange={(value: string) => setFormAnswers({ ...formAnswers, [question.id]: value })}
              className="space-y-2"
            >
              {question.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                  <Label htmlFor={`${question.id}-${option.value}`} className="font-normal cursor-pointer">
                    {getOptionLabel(option)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'multiselect':
        const selectedValues = (formAnswers[question.id] as string[]) || [];
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              {getQuestionLabel(question)}
              {question.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="space-y-2">
              {question.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${option.value}`}
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormAnswers({ ...formAnswers, [question.id]: [...selectedValues, option.value] });
                      } else {
                        setFormAnswers({ ...formAnswers, [question.id]: selectedValues.filter(v => v !== option.value) });
                      }
                    }}
                  />
                  <Label htmlFor={`${question.id}-${option.value}`} className="font-normal cursor-pointer">
                    {getOptionLabel(option)}
                  </Label>
                </div>
              ))}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-start space-x-2">
            <Checkbox
              id={question.id}
              checked={(formAnswers[question.id] as boolean) || false}
              onCheckedChange={(checked) => setFormAnswers({ ...formAnswers, [question.id]: checked })}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor={question.id} className="font-normal cursor-pointer">
                {getQuestionLabel(question)}
                {question.required && <span className="text-red-500">*</span>}
              </Label>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  const sortedQuestions = selectedOpportunity?.applicationQuestions?.sort((a, b) => a.order - b.order) || [];
  const totalQuestions = sortedQuestions.length;
  const answeredQuestions = sortedQuestions.filter(q => {
    const answer = formAnswers[q.id];
    return answer !== undefined && answer !== '' && (!Array.isArray(answer) || answer.length > 0);
  }).length;
  const progressPercent = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  return (
    <RequirePersonalInfo>
    <PortalLayout title={t('opportunities', 'title')}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
            <Input
              placeholder={language === 'es' ? 'Buscar oportunidades...' : 'Search opportunities...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={language === 'es' ? 'Categoría' : 'Category'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === 'es' ? 'Todas las categorías' : 'All Categories'}
              </SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat || ''}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Opportunity Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <Card className="border-zinc-200">
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500">{t('opportunities', 'noAvailable')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => {
              const isApplied = appliedOpportunityIds.includes(opportunity.id);
              const compensation = opportunity.compensation as Record<string, unknown> | null;
              const training = opportunity.training as Record<string, unknown> | null;
              const reqData = opportunity.requirements as Record<string, unknown> | null;

              return (
                <Card
                  key={opportunity.id}
                  className="border-zinc-200 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-100 transition-all duration-300 ease-out transform hover:scale-[1.03] cursor-pointer overflow-hidden group"
                >
                  {/* Header */}
                  <div className="p-5 border-b border-zinc-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-zinc-900 text-lg leading-tight group-hover:text-teal-700 transition-colors duration-300">
                          {opportunity.name}
                        </h3>
                        <p className="text-sm text-zinc-500 mt-1">{opportunity.client}</p>
                      </div>
                      <div className="ml-3">
                        {isApplied ? (
                          <Badge variant="secondary">
                            {t('opportunities', 'applied')}
                          </Badge>
                        ) : (
                          <Badge className="bg-teal-500 group-hover:bg-teal-600 transition-colors duration-300">
                            {language === 'es' ? 'Abierta' : 'Open'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-zinc-600 line-clamp-2">
                      {opportunity.description}
                    </p>
                  </div>

                  <CardContent className="p-5">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {opportunity.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-zinc-100 text-zinc-600 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm group-hover:bg-emerald-50 rounded-lg p-1.5 -ml-1.5 transition-colors duration-300">
                        <DollarSign className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-medium">${String(compensation?.baseRate || 0)}/hr</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 group-hover:bg-amber-50 rounded-lg p-1.5 -ml-1.5 transition-colors duration-300">
                        <Clock className="h-4 w-4 group-hover:text-amber-500 group-hover:scale-110 transition-all duration-300" />
                        <span>{String(training?.duration || 0)}h training</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 group-hover:bg-cyan-50 rounded-lg p-1.5 -ml-1.5 transition-colors duration-300">
                        <Users className="h-4 w-4 group-hover:text-cyan-500 group-hover:scale-110 transition-all duration-300" />
                        <span>{opportunity.capacity.openPositions} {language === 'es' ? 'plazas' : 'open'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 group-hover:bg-purple-50 rounded-lg p-1.5 -ml-1.5 transition-colors duration-300">
                        <Globe className="h-4 w-4 group-hover:text-purple-500 group-hover:scale-110 transition-all duration-300" />
                        <span>{((reqData?.languages as string[]) || []).join(', ') || 'English'}</span>
                      </div>
                    </div>

                    {/* Requirements Info (informational only, not blocking) */}
                    {!isApplied && (
                      <div className="bg-zinc-50 rounded-lg p-3 mb-4">
                        <p className="text-xs font-medium text-zinc-700 mb-2">
                          {language === 'es' ? 'Requisitos (se evaluarán después)' : 'Requirements (assessed later)'}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-zinc-400" />
                            Score {(reqData?.minScore as number) || 0}+
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-zinc-400" />
                            {((reqData?.languages as string[]) || ['English']).join(', ')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            {(reqData?.minExperience as number) || 0}+ {language === 'es' ? 'meses exp' : 'mo exp'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3 text-zinc-400" />
                            {language === 'es' ? 'Equipo requerido' : 'Equipment required'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Button - Anyone can apply */}
                    {!isApplied && (
                      <Button
                        className="w-full bg-teal-500 hover:bg-teal-600 group-hover:shadow-md transition-all duration-300"
                        onClick={() => handleOpenDetailsDialog(opportunity)}
                      >
                        {t('opportunities', 'apply')}
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    )}

                    {isApplied && (
                      <Button variant="outline" className="w-full" disabled>
                        <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                        {t('opportunities', 'applied')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Job Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedOpportunity?.name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span>{selectedOpportunity?.client}</span>
              {selectedOpportunity?.category && (
                <>
                  <span className="text-zinc-300">•</span>
                  <span>{selectedOpportunity.category}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedOpportunity && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6 py-4">
                {/* Description */}
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-2">
                    {language === 'es' ? 'Descripción del Puesto' : 'Job Description'}
                  </h3>
                  <p className="text-zinc-600 leading-relaxed">
                    {selectedOpportunity.description}
                  </p>
                </div>

                {/* Compensation & Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <h4 className="font-medium text-emerald-800 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {language === 'es' ? 'Compensación' : 'Compensation'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-emerald-700">{language === 'es' ? 'Tarifa Base' : 'Base Rate'}</span>
                        <span className="font-bold text-emerald-900">
                          ${String((selectedOpportunity.compensation as Record<string, unknown>)?.baseRate || 0)}/hr
                        </span>
                      </div>
                      {Boolean((selectedOpportunity.compensation as Record<string, unknown>)?.bonusStructure) && (
                        <div className="flex justify-between">
                          <span className="text-emerald-700">{language === 'es' ? 'Bonos' : 'Bonuses'}</span>
                          <span className="text-emerald-800">
                            {String((selectedOpportunity.compensation as Record<string, unknown>)?.bonusStructure || '')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-cyan-50 rounded-lg p-4">
                    <h4 className="font-medium text-cyan-800 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {language === 'es' ? 'Entrenamiento' : 'Training'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-cyan-700">{language === 'es' ? 'Duración' : 'Duration'}</span>
                        <span className="font-bold text-cyan-900">
                          {String((selectedOpportunity.training as Record<string, unknown>)?.duration || 0)} {language === 'es' ? 'horas' : 'hours'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-700">{language === 'es' ? 'Requerido' : 'Required'}</span>
                        <span className="text-cyan-800">
                          {Boolean((selectedOpportunity.training as Record<string, unknown>)?.required) ? (language === 'es' ? 'Sí' : 'Yes') : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-zinc-50 rounded-lg p-4">
                  <h4 className="font-medium text-zinc-900 mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-zinc-500" />
                    {language === 'es' ? 'Requisitos del Puesto' : 'Job Requirements'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-500" />
                      <span>Score mínimo: {String((selectedOpportunity.requirements as Record<string, unknown>)?.minScore || 0)}+</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-teal-500" />
                      <span>{((selectedOpportunity.requirements as Record<string, unknown>)?.languages as string[] || ['English']).join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-teal-500" />
                      <span>{String((selectedOpportunity.requirements as Record<string, unknown>)?.minExperience || 0)}+ {language === 'es' ? 'meses de experiencia' : 'months experience'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-teal-500" />
                      <span>{selectedOpportunity.capacity.openPositions} {language === 'es' ? 'posiciones abiertas' : 'open positions'}</span>
                    </div>
                  </div>
                </div>

                {/* Equipment Requirements */}
                {(() => {
                  const equipReqs = (selectedOpportunity.requirements as Record<string, unknown>)?.equipmentRequirements as Record<string, unknown> | undefined;
                  if (!equipReqs) return null;
                  return (
                    <div className="bg-amber-50 rounded-lg p-4">
                      <h4 className="font-medium text-amber-800 mb-3">
                        {language === 'es' ? 'Equipo Necesario' : 'Equipment Needed'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Boolean(equipReqs.hasComputer) && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                            {language === 'es' ? 'Computadora' : 'Computer'}
                          </span>
                        )}
                        {Boolean(equipReqs.hasHeadset) && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                            {language === 'es' ? 'Auriculares' : 'Headset'}
                          </span>
                        )}
                        {Boolean(equipReqs.hasQuietSpace) && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                            {language === 'es' ? 'Espacio Tranquilo' : 'Quiet Space'}
                          </span>
                        )}
                        {Boolean(equipReqs.internetSpeed) && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                            Internet {String(equipReqs.internetSpeed)}+ Mbps
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Tags */}
                {selectedOpportunity.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-zinc-900 mb-2">
                      {language === 'es' ? 'Etiquetas' : 'Tags'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedOpportunity.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Questions Preview */}
                {selectedOpportunity.applicationQuestions.length > 0 && (
                  <div className="border-t border-zinc-200 pt-4">
                    <h4 className="font-medium text-zinc-900 mb-2">
                      {language === 'es' ? 'Preguntas de Aplicación' : 'Application Questions'}
                    </h4>
                    <p className="text-sm text-zinc-500 mb-3">
                      {language === 'es'
                        ? `Tendrás que responder ${selectedOpportunity.applicationQuestions.length} preguntas para completar tu aplicación.`
                        : `You will need to answer ${selectedOpportunity.applicationQuestions.length} questions to complete your application.`}
                    </p>
                    <ul className="space-y-1 text-sm text-zinc-600">
                      {selectedOpportunity.applicationQuestions.slice(0, 3).map((q, i) => (
                        <li key={q.id} className="flex items-start gap-2">
                          <span className="text-teal-500 font-medium">{i + 1}.</span>
                          <span>{language === 'es' && q.questionEs ? q.questionEs : q.question}</span>
                        </li>
                      ))}
                      {selectedOpportunity.applicationQuestions.length > 3 && (
                        <li className="text-zinc-400 italic pl-5">
                          + {selectedOpportunity.applicationQuestions.length - 3} {language === 'es' ? 'preguntas más' : 'more questions'}...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)} className="sm:flex-1">
              {language === 'es' ? 'Cerrar' : 'Close'}
            </Button>
            <Button onClick={handleProceedToApply} className="bg-teal-500 hover:bg-teal-600 sm:flex-1">
              {language === 'es' ? 'Continuar con la Aplicación' : 'Continue to Apply'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Application Form Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {t('opportunities', 'applicationForm')}
            </DialogTitle>
            <DialogDescription>
              {selectedOpportunity?.name} - {selectedOpportunity?.client}
            </DialogDescription>
          </DialogHeader>

          {selectedOpportunity && (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">
                    {answeredQuestions} / {totalQuestions} {language === 'es' ? 'preguntas contestadas' : 'questions answered'}
                  </span>
                  <span className="font-medium text-teal-600">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              <ScrollArea className="max-h-[50vh] pr-4">
                <div className="space-y-6 py-4">
                  {/* Opportunity Info */}
                  <div className="bg-zinc-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <span>${String((selectedOpportunity.compensation as Record<string, unknown>)?.baseRate || 0)}/hr</span>
                      {(selectedOpportunity.compensation as Record<string, unknown>)?.bonusStructure ? (
                        <span className="text-zinc-500">+ {String((selectedOpportunity.compensation as Record<string, unknown>).bonusStructure)}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-zinc-400" />
                      <span>{String((selectedOpportunity.training as Record<string, unknown>)?.duration || 0)} {language === 'es' ? 'horas de entrenamiento' : 'hours training'}</span>
                    </div>
                  </div>

                  {/* Questions */}
                  {sortedQuestions.map((question, index) => (
                    <div key={question.id} className="space-y-2">
                      <div className="text-xs text-zinc-400 mb-1">
                        {language === 'es' ? 'Pregunta' : 'Question'} {index + 1} / {totalQuestions}
                      </div>
                      {renderQuestion(question)}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  {language === 'es'
                    ? 'Al aplicar, tu perfil será compartido con el equipo de reclutamiento.'
                    : 'By applying, your profile will be shared with the recruitment team.'}
                </p>
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
              {t('common', 'cancel')}
            </Button>
            <Button
              onClick={handleApply}
              disabled={applying}
              className="bg-teal-500 hover:bg-teal-600"
            >
              {applying ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {language === 'es' ? 'Enviando...' : 'Submitting...'}
                </div>
              ) : (
                <>
                  {t('opportunities', 'submitApplication')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl mb-2">
              {t('opportunities', 'applicationSubmitted')}
            </DialogTitle>
            <DialogDescription className="text-center mb-6">
              {language === 'es'
                ? 'Tu aplicación ha sido enviada exitosamente. Te notificaremos sobre el estado.'
                : 'Your application has been submitted successfully. We will notify you about the status.'}
            </DialogDescription>

            {/* Application ID */}
            <div className="w-full bg-zinc-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-zinc-500 mb-2">{t('opportunities', 'applicationId')}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-white px-3 py-2 rounded border border-zinc-200 truncate">
                  {applicationId}
                </code>
                <Button variant="outline" size="icon" onClick={copyApplicationId}>
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="w-full bg-teal-500 hover:bg-teal-600"
            >
              {language === 'es' ? 'Continuar' : 'Continue'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PortalLayout>
    </RequirePersonalInfo>
  );
}
