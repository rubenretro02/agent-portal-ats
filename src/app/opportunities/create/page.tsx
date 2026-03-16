'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { useOpportunityStore } from '@/store/supabaseStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  Type,
  AlignLeft,
  ListOrdered,
  CheckSquare,
  CircleDot,
  Hash,
  Calendar,
  FileText,
  HelpCircle,
  ClipboardCheck,
  ShieldCheck,
  Upload,
  Settings,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  Globe,
  ChevronRight,
  Layers,
  Sparkles,
  Palette,
} from 'lucide-react';
import type { ApplicationQuestion, QuestionType, ApplicationStage, StageType } from '@/types';

// Question type configurations
const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { value: 'text', label: 'Short Text', icon: Type, description: 'Single line text input' },
  { value: 'textarea', label: 'Long Text', icon: AlignLeft, description: 'Multi-line text area' },
  { value: 'select', label: 'Dropdown', icon: ListOrdered, description: 'Single selection dropdown' },
  { value: 'radio', label: 'Single Choice', icon: CircleDot, description: 'Radio button selection' },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Yes/No checkbox' },
  { value: 'multiselect', label: 'Multiple Choice', icon: CheckSquare, description: 'Multiple selections' },
  { value: 'number', label: 'Number', icon: Hash, description: 'Numeric input' },
  { value: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
];

// Default stages
const DEFAULT_STAGES: { type: StageType; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { type: 'info', label: 'Job Details', icon: FileText, description: 'Show job information' },
  { type: 'questions', label: 'Application Questions', icon: HelpCircle, description: 'Custom questions' },
  { type: 'assessment', label: 'Assessment', icon: ClipboardCheck, description: 'Skills assessment' },
  { type: 'verification', label: 'Verification', icon: ShieldCheck, description: 'Identity verification' },
  { type: 'documents', label: 'Documents', icon: Upload, description: 'Document upload' },
  { type: 'custom', label: 'Custom Stage', icon: Settings, description: 'Custom content' },
];

const CATEGORIES = ['Technical Support', 'Customer Service', 'Sales', 'Healthcare', 'Financial Services', 'Retail', 'Other'];
const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'German'];

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Draggable Question Type Component
function DraggableQuestionType({ type }: { type: typeof QUESTION_TYPES[number] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `type-${type.value}`,
    data: { type: 'question-type', questionType: type.value },
  });

  const Icon = type.icon;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-teal-300 hover:shadow-sm transition-all ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
        <Icon className="h-4 w-4 text-teal-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900">{type.label}</p>
        <p className="text-xs text-zinc-500 truncate">{type.description}</p>
      </div>
      <GripVertical className="h-4 w-4 text-zinc-400" />
    </div>
  );
}

// Droppable Form Builder Area
function FormBuilderDropZone({ children, questions }: { children: React.ReactNode; questions: ApplicationQuestion[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'form-builder' });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[400px] rounded-xl border-2 border-dashed transition-all ${
        isOver ? 'border-teal-400 bg-teal-50/50' : 'border-zinc-200'
      } ${questions.length === 0 ? 'flex items-center justify-center' : 'p-4 space-y-3'}`}
    >
      {questions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <Layers className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="font-medium text-zinc-900 mb-1">Drag questions here</h3>
          <p className="text-sm text-zinc-500">Drag question types from the left panel</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// Question Card in Form Builder
function QuestionCard({
  question,
  index,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  question: ApplicationQuestion;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `question-${question.id}`,
    data: { type: 'question', question },
  });

  const typeInfo = QUESTION_TYPES.find(t => t.value === question.type);
  const Icon = typeInfo?.icon || Type;

  return (
    <div
      ref={setNodeRef}
      className={`bg-white border border-zinc-200 rounded-xl p-4 transition-all ${isDragging ? 'opacity-50 shadow-lg' : 'hover:border-zinc-300'}`}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-teal-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-zinc-900">{question.question || 'Untitled Question'}</span>
            {question.required && (
              <Badge className="text-xs bg-red-100 text-red-700">Required</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{typeInfo?.label || question.type}</Badge>
            {question.options && question.options.length > 0 && (
              <span className="text-xs text-zinc-400">{question.options.length} options</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMoveUp} disabled={isFirst}>
            <ChevronRight className="h-4 w-4 rotate-[-90deg]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMoveDown} disabled={isLast}>
            <ChevronRight className="h-4 w-4 rotate-90" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Stage Card Component
function StageCard({
  stage,
  isSelected,
  onSelect,
  onRemove,
}: {
  stage: ApplicationStage;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const stageType = DEFAULT_STAGES.find(s => s.type === stage.type);
  const Icon = stageType?.icon || Settings;

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
        isSelected ? 'border-teal-500 bg-teal-50' : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-teal-500' : 'bg-zinc-100'}`}>
        <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-zinc-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900">{stage.name}</p>
        <p className="text-xs text-zinc-500 truncate">{stage.description}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function CreateOpportunityPage() {
  const router = useRouter();
  const { createOpportunity } = useOpportunityStore();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    category: '',
    baseRate: 15,
    trainingHours: 8,
    maxAgents: 10,
    languages: ['English'] as string[],
    minScore: 0,
    status: 'draft',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  // Questions state
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<ApplicationQuestion | null>(null);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [optionInput, setOptionInput] = useState('');

  // Stages state
  const [stages, setStages] = useState<ApplicationStage[]>([
    {
      id: generateId(),
      opportunityId: '',
      name: 'Job Details',
      description: 'Review the position details',
      type: 'info',
      order: 1,
      isRequired: true,
      content: { showJobDescription: true },
    },
    {
      id: generateId(),
      opportunityId: '',
      name: 'Review & Submit',
      description: 'Review and submit your application',
      type: 'info',
      order: 99,
      isRequired: true,
      content: {},
    },
  ]);
  const [showStageDialog, setShowStageDialog] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageType, setNewStageType] = useState<StageType>('custom');
  const [newStageDescription, setNewStageDescription] = useState('');
  const [editingStage, setEditingStage] = useState<ApplicationStage | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'details' | 'questions' | 'stages'>('details');
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeData = active.data.current;

    // If dragging a question type to the form builder - add without opening dialog
    if (activeData?.type === 'question-type' && over.id === 'form-builder') {
      const questionType = activeData.questionType as QuestionType;
      const typeInfo = QUESTION_TYPES.find(t => t.value === questionType);
      const newQuestion: ApplicationQuestion = {
        id: generateId(),
        question: `New ${typeInfo?.label || 'Question'}`,
        type: questionType,
        required: false,
        order: questions.length,
        options: ['select', 'radio', 'multiselect'].includes(questionType) ? [] : undefined,
      };
      setQuestions([...questions, newQuestion]);
      // Don't auto-open dialog - user can click settings to configure
    }
  };

  // Question handlers
  const updateQuestion = (updatedQuestion: ApplicationQuestion) => {
    setQuestions(questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
    setEditingQuestion(null);
    setShowQuestionDialog(false);
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id).map((q, i) => ({ ...q, order: i })));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })));
  };

  const addOption = () => {
    if (!optionInput.trim() || !editingQuestion) return;
    const option = { value: optionInput.toLowerCase().replace(/\s+/g, '_'), label: optionInput };
    setEditingQuestion({
      ...editingQuestion,
      options: [...(editingQuestion.options || []), option],
    });
    setOptionInput('');
  };

  // Stage handlers
  const addStage = () => {
    if (!newStageName.trim()) return;
    const newStage: ApplicationStage = {
      id: generateId(),
      opportunityId: '',
      name: newStageName,
      description: newStageDescription,
      type: newStageType,
      order: stages.length,
      isRequired: false,
      content: {},
    };
    // Insert before the Review & Submit stage
    const reviewIndex = stages.findIndex(s => s.name === 'Review & Submit');
    if (reviewIndex !== -1) {
      const newStages = [...stages];
      newStages.splice(reviewIndex, 0, newStage);
      setStages(newStages.map((s, i) => ({ ...s, order: i })));
    } else {
      setStages([...stages, newStage]);
    }
    setNewStageName('');
    setNewStageDescription('');
    setShowStageDialog(false);
  };

  const updateStage = () => {
    if (!editingStage) return;
    setStages(stages.map(s => s.id === editingStage.id ? editingStage : s));
    setEditingStage(null);
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;
    const newStages = [...stages];
    [newStages[index], newStages[newIndex]] = [newStages[newIndex], newStages[index]];
    setStages(newStages.map((s, i) => ({ ...s, order: i })));
  };

  const removeStage = (id: string) => {
    const stage = stages.find(s => s.id === id);
    if (stage?.isRequired) return; // Can't remove required stages
    setStages(stages.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })));
  };

  // Form handlers
  const toggleLanguage = (lang: string) => {
    if (formData.languages.includes(lang)) {
      setFormData({ ...formData, languages: formData.languages.filter(l => l !== lang) });
    } else {
      setFormData({ ...formData, languages: [...formData.languages, lang] });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  // Save opportunity
  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.client) return;
    setSaving(true);

    const opportunityData = {
      ...formData,
      applicationQuestions: questions,
      applicationStages: stages,
    };

    const result = await createOpportunity(opportunityData);
    setSaving(false);

    if (result.success) {
      router.push('/opportunities');
    }
  };

  const needsOptions = (type: QuestionType) => ['select', 'radio', 'multiselect'].includes(type);

  return (
    <UnifiedLayout title="Create Opportunity">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/opportunities')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Create New Opportunity</h1>
              <p className="text-sm text-zinc-500">Build your job posting with custom application forms</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.name || !formData.description || !formData.client}
            className="gap-2 bg-teal-600 hover:bg-teal-700"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
            ) : (
              <><Save className="h-4 w-4" />Save Opportunity</>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'details' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            <Briefcase className="h-4 w-4 inline mr-2" />
            Job Details
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'questions' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            <HelpCircle className="h-4 w-4 inline mr-2" />
            Questions
            {questions.length > 0 && (
              <Badge className="ml-2 bg-teal-500">{questions.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('stages')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'stages' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            <Layers className="h-4 w-4 inline mr-2" />
            Stages
            <Badge className="ml-2 bg-zinc-200 text-zinc-600">{stages.length}</Badge>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Job Title *</Label>
                      <Input
                        placeholder="e.g., Customer Support Agent"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Client / Company *</Label>
                      <Input
                        placeholder="e.g., TechCorp Inc."
                        value={formData.client}
                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Job Description *</Label>
                    <Textarea
                      placeholder="Describe the opportunity, responsibilities, and requirements..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Compensation & Training</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        Base Rate ($/hr)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.baseRate}
                        onChange={(e) => setFormData({ ...formData, baseRate: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-cyan-500" />
                        Training Hours
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.trainingHours}
                        onChange={(e) => setFormData({ ...formData, trainingHours: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-amber-500" />
                        Max Agents
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.maxAgents}
                        onChange={(e) => setFormData({ ...formData, maxAgents: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Score</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.minScore}
                        onChange={(e) => setFormData({ ...formData, minScore: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-indigo-500" />
                      Required Languages
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map(lang => (
                        <Badge
                          key={lang}
                          variant={formData.languages.includes(lang) ? 'default' : 'outline'}
                          className={`cursor-pointer transition-all ${formData.languages.includes(lang) ? 'bg-teal-500 hover:bg-teal-600' : 'hover:bg-zinc-100'}`}
                          onClick={() => toggleLanguage(lang)}
                        >
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button variant="outline" onClick={addTag}>Add</Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {formData.tags.map(tag => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                            <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })} className="ml-1">×</button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Visibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                    <div>
                      <Label>Status</Label>
                      <p className="text-sm text-zinc-500">{formData.status === 'active' ? 'Visible to agents' : 'Hidden from agents'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Draft</span>
                      <Switch
                        checked={formData.status === 'active'}
                        onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'draft' })}
                      />
                      <span className="text-sm">Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900">Pro Tip</h3>
                      <p className="text-xs text-zinc-500">Build better applications</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600">
                    Add custom questions to gather relevant information from applicants. Use the drag & drop builder in the Questions tab.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Question Types Panel */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                      Question Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {QUESTION_TYPES.map(type => (
                      <DraggableQuestionType key={type.value} type={type} />
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Form Builder */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Application Form Builder</CardTitle>
                      <p className="text-sm text-zinc-500 mt-1">Drag question types here to build your form</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingQuestion({
                          id: generateId(),
                          question: '',
                          type: 'text',
                          required: false,
                          order: questions.length,
                        });
                        setShowQuestionDialog(true);
                      }}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Manually
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <FormBuilderDropZone questions={questions}>
                      {questions.map((question, index) => (
                        <QuestionCard
                          key={question.id}
                          question={question}
                          index={index}
                          onEdit={() => {
                            setEditingQuestion(question);
                            setShowQuestionDialog(true);
                          }}
                          onDelete={() => deleteQuestion(question.id)}
                          onMoveUp={() => moveQuestion(index, 'up')}
                          onMoveDown={() => moveQuestion(index, 'down')}
                          isFirst={index === 0}
                          isLast={index === questions.length - 1}
                        />
                      ))}
                    </FormBuilderDropZone>
                  </CardContent>
                </Card>
              </div>
            </div>

            <DragOverlay>
              {activeId?.startsWith('type-') && (
                <div className="bg-white border-2 border-teal-400 rounded-lg p-3 shadow-xl">
                  <p className="text-sm font-medium">
                    {QUESTION_TYPES.find(t => `type-${t.value}` === activeId)?.label}
                  </p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {activeTab === 'stages' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stages List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Application Stages</CardTitle>
                  <p className="text-sm text-zinc-500 mt-1">Click a stage to customize it</p>
                </div>
                <Button onClick={() => setShowStageDialog(true)} size="sm" className="gap-2 bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-4 w-4" />
                  Add Stage
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {stages.sort((a, b) => a.order - b.order).map((stage, index) => {
                  const stageType = DEFAULT_STAGES.find(s => s.type === stage.type);
                  const Icon = stageType?.icon || Settings;
                  const isFirst = index === 0;
                  const isLast = index === stages.length - 1;

                  return (
                    <div key={stage.id} className="flex items-center gap-2">
                      {/* Order number */}
                      <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium text-zinc-500 flex-shrink-0">
                        {index + 1}
                      </div>

                      {/* Move buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveStage(index, 'up')}
                          disabled={isFirst}
                          className={`p-0.5 rounded ${isFirst ? 'text-zinc-200' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'}`}
                        >
                          <ChevronRight className="h-3 w-3 -rotate-90" />
                        </button>
                        <button
                          onClick={() => moveStage(index, 'down')}
                          disabled={isLast}
                          className={`p-0.5 rounded ${isLast ? 'text-zinc-200' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'}`}
                        >
                          <ChevronRight className="h-3 w-3 rotate-90" />
                        </button>
                      </div>

                      {/* Stage Card - Clickable */}
                      <div
                        onClick={() => setEditingStage(stage)}
                        className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-zinc-200 hover:border-teal-300 hover:bg-teal-50/50 cursor-pointer transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                          <Icon className="h-5 w-5 text-zinc-500 group-hover:text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900">{stage.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{stage.description || 'Click to configure'}</p>
                        </div>
                        <Settings className="h-4 w-4 text-zinc-300 group-hover:text-teal-500 transition-colors" />
                      </div>

                      {/* Delete button */}
                      {!stage.isRequired && (
                        <button
                          onClick={() => removeStage(stage.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Stage Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Stage Templates</CardTitle>
                <p className="text-sm text-zinc-500 mt-1">Quick add common stages</p>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {DEFAULT_STAGES.map(template => {
                  const Icon = template.icon;
                  const alreadyAdded = stages.some(s => s.type === template.type && template.type !== 'custom');

                  return (
                    <button
                      key={template.type}
                      disabled={alreadyAdded}
                      onClick={() => {
                        setNewStageName(template.label);
                        setNewStageType(template.type);
                        setShowStageDialog(true);
                      }}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        alreadyAdded
                          ? 'border-zinc-100 bg-zinc-50 opacity-50 cursor-not-allowed'
                          : 'border-zinc-200 hover:border-teal-300 hover:bg-teal-50 cursor-pointer'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{template.label}</p>
                        <p className="text-xs text-zinc-500">{template.description}</p>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Question Edit Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingQuestion?.question ? 'Edit Question' : 'Add Question'}</DialogTitle>
            <DialogDescription>Configure your application question</DialogDescription>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question Text *</Label>
                <Input
                  placeholder="Enter your question..."
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                />
              </div>

              {/* Question Type - Read Only */}
              <div className="space-y-2">
                <Label>Question Type</Label>
                <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  {(() => {
                    const typeInfo = QUESTION_TYPES.find(t => t.value === editingQuestion.type);
                    const Icon = typeInfo?.icon || Type;
                    return (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900">{typeInfo?.label || editingQuestion.type}</p>
                          <p className="text-xs text-zinc-500">{typeInfo?.description}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {needsOptions(editingQuestion.type) && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add an option..."
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                    />
                    <Button variant="outline" onClick={addOption}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {(editingQuestion.options || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(editingQuestion.options || []).map((opt, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="cursor-pointer hover:bg-red-100 hover:text-red-600"
                          onClick={() => setEditingQuestion({
                            ...editingQuestion,
                            options: (editingQuestion.options || []).filter((_, idx) => idx !== i),
                          })}
                        >
                          {opt.label}
                          <span className="ml-1">×</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Placeholder (optional)</Label>
                <Input
                  placeholder="Placeholder text..."
                  value={editingQuestion.placeholder || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, placeholder: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg">
                <div>
                  <Label>Required</Label>
                  <p className="text-sm text-zinc-500">Applicant must answer</p>
                </div>
                <Switch
                  checked={editingQuestion.required}
                  onCheckedChange={(checked) => setEditingQuestion({ ...editingQuestion, required: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (editingQuestion) {
                  if (questions.find(q => q.id === editingQuestion.id)) {
                    updateQuestion(editingQuestion);
                  } else {
                    setQuestions([...questions, editingQuestion]);
                    setEditingQuestion(null);
                    setShowQuestionDialog(false);
                  }
                }
              }}
              disabled={!editingQuestion?.question?.trim()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {questions.find(q => q.id === editingQuestion?.id) ? 'Save Changes' : 'Add Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Stage Dialog */}
      <Dialog open={showStageDialog} onOpenChange={setShowStageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Application Stage</DialogTitle>
            <DialogDescription>Add a new stage to the application process</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Stage Name *</Label>
              <Input
                placeholder="e.g., Skills Assessment"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="Brief description of this stage"
                value={newStageDescription}
                onChange={(e) => setNewStageDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Stage Type</Label>
              <Select value={newStageType} onValueChange={(v) => setNewStageType(v as StageType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_STAGES.map(stage => (
                    <SelectItem key={stage.type} value={stage.type}>
                      <div className="flex items-center gap-2">
                        <stage.icon className="h-4 w-4 text-zinc-500" />
                        {stage.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStageDialog(false)}>Cancel</Button>
            <Button
              onClick={addStage}
              disabled={!newStageName.trim()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Add Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Stage Dialog */}
      <Dialog open={!!editingStage} onOpenChange={() => setEditingStage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Stage</DialogTitle>
            <DialogDescription>Customize this application stage</DialogDescription>
          </DialogHeader>
          {editingStage && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Stage Name *</Label>
                <Input
                  placeholder="e.g., Skills Assessment"
                  value={editingStage.name}
                  onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what happens in this stage..."
                  value={editingStage.description || ''}
                  onChange={(e) => setEditingStage({ ...editingStage, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Stage Type - Read Only */}
              <div className="space-y-2">
                <Label>Stage Type</Label>
                <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  {(() => {
                    const stageType = DEFAULT_STAGES.find(s => s.type === editingStage.type);
                    const Icon = stageType?.icon || Settings;
                    return (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900">{stageType?.label || editingStage.type}</p>
                          <p className="text-xs text-zinc-500">{stageType?.description}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg">
                <div>
                  <Label>Required Stage</Label>
                  <p className="text-sm text-zinc-500">Applicant must complete this</p>
                </div>
                <Switch
                  checked={editingStage.isRequired}
                  onCheckedChange={(checked) => setEditingStage({ ...editingStage, isRequired: checked })}
                  disabled={editingStage.name === 'Job Details' || editingStage.name === 'Review & Submit'}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStage(null)}>Cancel</Button>
            <Button
              onClick={updateStage}
              disabled={!editingStage?.name?.trim()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UnifiedLayout>
  );
}
