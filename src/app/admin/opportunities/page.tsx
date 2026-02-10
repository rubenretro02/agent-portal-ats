'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStore } from '@/store/adminStore';
import { useOpportunityStore } from '@/store/supabaseStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Briefcase,
  Plus,
  Search,
  MoreVertical,
  Users,
  DollarSign,
  Clock,
  Edit,
  Trash2,
  Eye,
  Pause,
  Play,
  CheckCircle2,
  AlertCircle,
  Type,
  AlignLeft,
  List,
  CircleDot,
  CheckSquare,
  GripVertical,
  X,
} from 'lucide-react';
import type { OpportunityStatus } from '@/types';

interface NewQuestion {
  id: string;
  question: string;
  questionEs: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number';
  required: boolean;
  options: string[];
  placeholder: string;
}

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text', icon: Type },
  { value: 'textarea', label: 'Long Text', icon: AlignLeft },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'radio', label: 'Radio Options', icon: CircleDot },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
];

export default function OpportunitiesManagementPage() {
  const { hasPermission } = useAdminStore();
  const {
    opportunities,
    fetchOpportunities,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    isLoading
  } = useOpportunityStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [totalApplications, setTotalApplications] = useState(0);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Basic info, Step 2: Questions

  const [newOpportunity, setNewOpportunity] = useState({
    name: '',
    description: '',
    client: '',
    category: '',
    baseRate: '',
    trainingHours: '',
    maxAgents: '',
    languages: 'English',
    minScore: '0',
  });

  const [questions, setQuestions] = useState<NewQuestion[]>([]);
  const [newOptionText, setNewOptionText] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchOpportunities(true);
    const fetchApplicationCount = async () => {
      const { adminDb } = await import('@/lib/adminDb');
      const result = await adminDb({ action: 'count', table: 'applications' });
      setTotalApplications(result.count || 0);
    };
    fetchApplicationCount();
  }, [fetchOpportunities]);

  const filteredOpportunities = opportunities.filter(o => {
    const matchesSearch =
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: OpportunityStatus | string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'paused':
        return <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" />Paused</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'closed':
        return <Badge variant="secondary" className="bg-zinc-200">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const addQuestion = () => {
    const newQ: NewQuestion = {
      id: `new-${Date.now()}`,
      question: '',
      questionEs: '',
      type: 'text',
      required: false,
      options: [],
      placeholder: '',
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (id: string, updates: Partial<NewQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = (questionId: string) => {
    const optionText = newOptionText[questionId]?.trim();
    if (!optionText) return;

    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, options: [...q.options, optionText] };
      }
      return q;
    }));
    setNewOptionText({ ...newOptionText, [questionId]: '' });
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, options: q.options.filter((_, i) => i !== optionIndex) };
      }
      return q;
    }));
  };

  const handleCreateOpportunity = async () => {
    setError('');
    setCreating(true);

    try {
      const result = await createOpportunity({
        name: newOpportunity.name,
        description: newOpportunity.description,
        client: newOpportunity.client,
        category: newOpportunity.category || undefined,
        baseRate: parseFloat(newOpportunity.baseRate) || 0,
        trainingHours: parseInt(newOpportunity.trainingHours) || 0,
        maxAgents: parseInt(newOpportunity.maxAgents) || 10,
        languages: newOpportunity.languages.split(',').map(l => l.trim()),
        minScore: parseInt(newOpportunity.minScore) || 0,
        status: 'active',
      });

      if (result.success && result.id) {
        // Create questions for this opportunity using admin API to bypass RLS
        if (questions.length > 0) {
          const { adminDb } = await import('@/lib/adminDb');
          for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            await adminDb({
              action: 'insert',
              table: 'application_questions',
              data: {
                opportunity_id: result.id,
                question: q.question,
                question_es: q.questionEs || null,
                type: q.type,
                required: q.required,
                order: i + 1,
                placeholder: q.placeholder || null,
                options: q.options.length > 0
                  ? q.options.map(opt => ({ value: opt.toLowerCase().replace(/\s+/g, '_'), label: opt }))
                  : null,
              },
              select: false,
            });
          }
        }

        setCreateDialogOpen(false);
        setStep(1);
        setNewOpportunity({
          name: '',
          description: '',
          client: '',
          category: '',
          baseRate: '',
          trainingHours: '',
          maxAgents: '',
          languages: 'English',
          minScore: '0',
        });
        setQuestions([]);
        fetchOpportunities(true);
      } else {
        setError(result.error || 'Error creating opportunity');
      }
    } catch (err) {
      setError('Error creating opportunity');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await updateOpportunity(id, { status: newStatus });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to close this opportunity?')) {
      await deleteOpportunity(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      setStep(1);
      setError('');
    }
  };

  const activeCount = opportunities.filter(o => o.status === 'active').length;
  const pausedCount = opportunities.filter(o => o.status === 'paused').length;
  const draftCount = opportunities.filter(o => o.status === 'draft').length;

  const canProceedToStep2 = newOpportunity.name && newOpportunity.client && newOpportunity.baseRate;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Opportunities</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Manage job opportunities and assignments
            </p>
          </div>

          {hasPermission('canCreateCampaigns') && (
            <Dialog open={createDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Opportunity
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>
                    {step === 1 ? 'Create New Opportunity' : 'Application Questions'}
                  </DialogTitle>
                  <DialogDescription>
                    {step === 1
                      ? 'Set up basic opportunity details'
                      : 'Add questions that applicants must answer'}
                  </DialogDescription>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex items-center gap-2 mb-4">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${step === 1 ? 'bg-cyan-100 text-cyan-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    <span className="font-medium">1</span>
                    <span>Details</span>
                  </div>
                  <div className="w-8 h-0.5 bg-zinc-200" />
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${step === 2 ? 'bg-cyan-100 text-cyan-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    <span className="font-medium">2</span>
                    <span>Questions</span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <ScrollArea className="max-h-[50vh] pr-4">
                  {step === 1 && (
                    <div className="grid grid-cols-2 gap-4 py-2">
                      <div className="col-span-2 space-y-2">
                        <Label>Opportunity Name *</Label>
                        <Input
                          value={newOpportunity.name}
                          onChange={(e) => setNewOpportunity({ ...newOpportunity, name: e.target.value })}
                          placeholder="e.g., TechCare Premium Support"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Client *</Label>
                        <Input
                          value={newOpportunity.client}
                          onChange={(e) => setNewOpportunity({ ...newOpportunity, client: e.target.value })}
                          placeholder="e.g., TechCare Inc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={newOpportunity.category}
                          onValueChange={(v) => setNewOpportunity({ ...newOpportunity, category: v })}
                        >
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer_service">Customer Service</SelectItem>
                            <SelectItem value="technical_support">Technical Support</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="financial">Financial Services</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newOpportunity.description}
                          onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                          placeholder="Describe the opportunity responsibilities..."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Base Rate ($/hr) *</Label>
                        <Input
                          type="number"
                          value={newOpportunity.baseRate}
                          onChange={(e) => setNewOpportunity({ ...newOpportunity, baseRate: e.target.value })}
                          placeholder="18"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Training Hours</Label>
                        <Input
                          type="number"
                          value={newOpportunity.trainingHours}
                          onChange={(e) => setNewOpportunity({ ...newOpportunity, trainingHours: e.target.value })}
                          placeholder="40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Agents</Label>
                        <Input
                          type="number"
                          value={newOpportunity.maxAgents}
                          onChange={(e) => setNewOpportunity({ ...newOpportunity, maxAgents: e.target.value })}
                          placeholder="50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Minimum Score</Label>
                        <Input
                          type="number"
                          value={newOpportunity.minScore}
                          onChange={(e) => setNewOpportunity({ ...newOpportunity, minScore: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Required Languages (comma separated)</Label>
                        <Input
                          value={newOpportunity.languages}
                          onChange={(e) => setNewOpportunity({ ...newOpportunity, languages: e.target.value })}
                          placeholder="English, Spanish"
                        />
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 py-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-600">
                          Add questions that applicants will answer when applying
                        </p>
                        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Question
                        </Button>
                      </div>

                      {questions.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-zinc-200 rounded-lg">
                          <Type className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                          <p className="text-zinc-500 text-sm">No questions added yet</p>
                          <Button type="button" variant="link" size="sm" onClick={addQuestion} className="mt-2">
                            Add your first question
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {questions.map((q, index) => (
                            <div key={q.id} className="border border-zinc-200 rounded-lg p-4 space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="flex items-center gap-1 text-zinc-400 mt-2">
                                  <GripVertical className="h-4 w-4" />
                                  <span className="text-sm font-medium">{index + 1}</span>
                                </div>
                                <div className="flex-1 space-y-3">
                                  <div className="flex gap-3">
                                    <div className="flex-1">
                                      <Input
                                        value={q.question}
                                        onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                                        placeholder="Enter your question..."
                                        className="font-medium"
                                      />
                                    </div>
                                    <Select
                                      value={q.type}
                                      onValueChange={(v) => updateQuestion(q.id, { type: v as NewQuestion['type'] })}
                                    >
                                      <SelectTrigger className="w-40">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {QUESTION_TYPES.map(t => (
                                          <SelectItem key={t.value} value={t.value}>
                                            <div className="flex items-center gap-2">
                                              <t.icon className="h-4 w-4" />
                                              {t.label}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeQuestion(q.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  {/* Options for select/radio */}
                                  {(q.type === 'select' || q.type === 'radio') && (
                                    <div className="space-y-2 pl-4 border-l-2 border-zinc-100">
                                      <Label className="text-xs text-zinc-500">Options</Label>
                                      {q.options.map((opt, optIndex) => (
                                        <div key={optIndex} className="flex items-center gap-2">
                                          <span className="text-sm text-zinc-600 bg-zinc-50 px-2 py-1 rounded flex-1">
                                            {opt}
                                          </span>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => removeOption(q.id, optIndex)}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                      <div className="flex gap-2">
                                        <Input
                                          value={newOptionText[q.id] || ''}
                                          onChange={(e) => setNewOptionText({ ...newOptionText, [q.id]: e.target.value })}
                                          placeholder="Add option..."
                                          className="h-8 text-sm"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              addOption(q.id);
                                            }
                                          }}
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => addOption(q.id)}
                                        >
                                          Add
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Placeholder for text fields */}
                                  {(q.type === 'text' || q.type === 'textarea') && (
                                    <Input
                                      value={q.placeholder}
                                      onChange={(e) => updateQuestion(q.id, { placeholder: e.target.value })}
                                      placeholder="Placeholder text (optional)..."
                                      className="text-sm"
                                    />
                                  )}

                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={q.required}
                                      onCheckedChange={(checked) => updateQuestion(q.id, { required: checked })}
                                    />
                                    <Label className="text-sm text-zinc-600">Required</Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <Separator />

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  {step === 1 ? (
                    <>
                      <Button variant="outline" onClick={() => handleDialogClose(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => setStep(2)}
                        disabled={!canProceedToStep2}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        Next: Add Questions
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button
                        onClick={handleCreateOpportunity}
                        disabled={creating}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        {creating ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating...
                          </div>
                        ) : (
                          `Create Opportunity ${questions.length > 0 ? `with ${questions.length} Questions` : ''}`
                        )}
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Total</p>
                  <p className="text-2xl font-bold text-zinc-900">{opportunities.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-zinc-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Active</p>
                  <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Play className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Paused</p>
                  <p className="text-2xl font-bold text-amber-600">{pausedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Pause className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Draft</p>
                  <p className="text-2xl font-bold text-zinc-600">{draftCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <Edit className="h-5 w-5 text-zinc-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Applications</p>
                  <p className="text-2xl font-bold text-cyan-600">{totalApplications}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Opportunities Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <Card className="border-zinc-200">
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 mb-4">No opportunities found</p>
              {hasPermission('canCreateCampaigns') && (
                <Button onClick={() => setCreateDialogOpen(true)} className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first opportunity
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOpportunities.map((opportunity) => {
              const compensation = opportunity.compensation as Record<string, unknown> | null;
              const training = opportunity.training as Record<string, unknown> | null;

              return (
                <Card key={opportunity.id} className="border-zinc-200 hover:border-zinc-300 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-900 truncate">{opportunity.name}</h3>
                        <p className="text-sm text-zinc-500">{opportunity.client}</p>
                      </div>
                      {getStatusBadge(opportunity.status)}
                    </div>

                    <p className="text-sm text-zinc-600 line-clamp-2 mb-4">
                      {opportunity.description || 'No description'}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(opportunity.tags || []).slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {opportunity.category && (
                        <span className="text-xs px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full">
                          {opportunity.category}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      <div className="bg-zinc-50 rounded-lg p-2">
                        <DollarSign className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                        <p className="text-sm font-medium">${String(compensation?.baseRate || 0)}</p>
                        <p className="text-xs text-zinc-500">/hour</p>
                      </div>
                      <div className="bg-zinc-50 rounded-lg p-2">
                        <Users className="h-4 w-4 text-cyan-500 mx-auto mb-1" />
                        <p className="text-sm font-medium">{opportunity.capacity?.currentAgents || 0}</p>
                        <p className="text-xs text-zinc-500">agents</p>
                      </div>
                      <div className="bg-zinc-50 rounded-lg p-2">
                        <Clock className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                        <p className="text-sm font-medium">{String(training?.duration || 0)}h</p>
                        <p className="text-xs text-zinc-500">training</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/admin/opportunities/${opportunity.id}/questions`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-1" />
                          Questions
                        </Button>
                      </Link>
                      {hasPermission('canEditCampaigns') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleStatus(opportunity.id, opportunity.status)}>
                              {opportunity.status === 'active' ? (
                                <><Pause className="h-4 w-4 mr-2" />Pause</>
                              ) : (
                                <><Play className="h-4 w-4 mr-2" />Activate</>
                              )}
                            </DropdownMenuItem>
                            {hasPermission('canDeleteCampaigns') && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(opportunity.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Close
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
