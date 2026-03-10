'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  GripVertical,
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  ClipboardCheck,
  ShieldCheck,
  Upload,
  Settings,
  Loader2,
  X,
  Type,
  AlignLeft,
  List,
  CheckSquare,
  Circle,
  Hash,
  Calendar,
  FileUp,
} from 'lucide-react';
import type { ApplicationStage, ApplicationQuestion, StageType, QuestionType } from '@/types';

interface StageBuilderProps {
  stages: ApplicationStage[];
  onStagesChange: (stages: ApplicationStage[]) => void;
  onSave: (stages: ApplicationStage[]) => Promise<void>;
  isSaving?: boolean;
  opportunityId: string;
}

const STAGE_TYPES: { value: StageType; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'info', label: 'Job Information', icon: FileText, description: 'Display job details, requirements, compensation' },
  { value: 'questions', label: 'Questions', icon: HelpCircle, description: 'Custom application questions' },
  { value: 'assessment', label: 'Assessment', icon: ClipboardCheck, description: 'Skill tests and evaluations' },
  { value: 'verification', label: 'Verification', icon: ShieldCheck, description: 'Background check, identity verification' },
  { value: 'documents', label: 'Documents', icon: Upload, description: 'Required document uploads' },
  { value: 'custom', label: 'Custom', icon: Settings, description: 'Custom stage content' },
];

const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ElementType }[] = [
  { value: 'text', label: 'Short Text', icon: Type },
  { value: 'textarea', label: 'Long Text', icon: AlignLeft },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'multiselect', label: 'Multi-Select', icon: CheckSquare },
  { value: 'radio', label: 'Radio Buttons', icon: Circle },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'file', label: 'File Upload', icon: FileUp },
];

// Sortable Stage Item
interface SortableStageProps {
  stage: ApplicationStage;
  onEdit: (stage: ApplicationStage) => void;
  onDelete: (id: string) => void;
  onAddQuestion: (stageId: string) => void;
  onEditQuestion: (stageId: string, question: ApplicationQuestion) => void;
  onDeleteQuestion: (stageId: string, questionId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function SortableStage({
  stage,
  onEdit,
  onDelete,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  isExpanded,
  onToggleExpand,
}: SortableStageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeInfo = STAGE_TYPES.find((t) => t.value === stage.type);
  const StageIcon = typeInfo?.icon || Settings;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={`border-zinc-200 ${isDragging ? 'shadow-lg ring-2 ring-teal-500' : ''}`}>
        <CardHeader className="p-4">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <button
              {...listeners}
              className="p-1 text-zinc-400 hover:text-zinc-600 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            {/* Stage Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stage.color || 'bg-teal-100'}`}>
              <StageIcon className="h-5 w-5 text-teal-600" />
            </div>

            {/* Stage Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-900">{stage.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {typeInfo?.label}
                </Badge>
                {stage.isRequired && (
                  <Badge className="bg-amber-100 text-amber-700 text-xs">Required</Badge>
                )}
              </div>
              {stage.description && (
                <p className="text-sm text-zinc-500 truncate">{stage.description}</p>
              )}
            </div>

            {/* Question Count */}
            {stage.type === 'questions' && stage.questions && (
              <Badge variant="outline" className="text-xs">
                {stage.questions.length} question{stage.questions.length !== 1 ? 's' : ''}
              </Badge>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit(stage)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(stage.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onToggleExpand}>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Expanded Content */}
        {isExpanded && (
          <CardContent className="pt-0 pb-4 px-4 border-t border-zinc-100">
            {stage.type === 'questions' && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-zinc-600">Questions in this stage</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddQuestion(stage.id)}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Question
                  </Button>
                </div>

                {(!stage.questions || stage.questions.length === 0) ? (
                  <div className="text-center py-6 bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-200">
                    <HelpCircle className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">No questions yet</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onAddQuestion(stage.id)}
                      className="mt-2"
                    >
                      Add your first question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stage.questions.map((question, idx) => {
                      const qTypeInfo = QUESTION_TYPES.find((t) => t.value === question.type);
                      const QIcon = qTypeInfo?.icon || Type;
                      return (
                        <div
                          key={question.id}
                          className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg group"
                        >
                          <span className="text-xs font-medium text-zinc-400 w-6">{idx + 1}.</span>
                          <QIcon className="h-4 w-4 text-zinc-400" />
                          <span className="flex-1 text-sm text-zinc-700 truncate">
                            {question.question}
                          </span>
                          {question.required && (
                            <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                              Required
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onEditQuestion(stage.id, question)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500"
                              onClick={() => onDeleteQuestion(stage.id, question.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {stage.type === 'info' && (
              <div className="mt-4 space-y-2 text-sm text-zinc-600">
                <p>This stage will display:</p>
                <ul className="list-disc list-inside space-y-1 text-zinc-500">
                  {stage.content?.showJobDescription && <li>Job Description</li>}
                  {stage.content?.showRequirements && <li>Requirements</li>}
                  {stage.content?.showCompensation && <li>Compensation Details</li>}
                  {stage.content?.showSchedule && <li>Schedule Information</li>}
                </ul>
              </div>
            )}

            {stage.type === 'verification' && (
              <div className="mt-4 text-sm text-zinc-600">
                <p>Verification Type: <strong>{stage.verificationConfig?.verificationType || 'Not configured'}</strong></p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function StageBuilder({ stages, onStagesChange, onSave, isSaving, opportunityId }: StageBuilderProps) {
  const [editingStage, setEditingStage] = useState<ApplicationStage | null>(null);
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<{ stageId: string; question: ApplicationQuestion } | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [activeStageForQuestion, setActiveStageForQuestion] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);
      const newStages = arrayMove(stages, oldIndex, newIndex).map((s, idx) => ({
        ...s,
        order: idx + 1,
      }));
      onStagesChange(newStages);
    }
  };

  const toggleExpand = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  const handleAddStage = () => {
    const newStage: ApplicationStage = {
      id: `stage-${Date.now()}`,
      opportunityId,
      name: '',
      type: 'questions',
      order: stages.length + 1,
      isRequired: true,
      questions: [],
    };
    setEditingStage(newStage);
    setIsAddingStage(true);
  };

  const handleSaveStage = (stage: ApplicationStage) => {
    if (isAddingStage) {
      onStagesChange([...stages, stage]);
    } else {
      onStagesChange(stages.map((s) => (s.id === stage.id ? stage : s)));
    }
    setEditingStage(null);
    setIsAddingStage(false);
  };

  const handleDeleteStage = (id: string) => {
    onStagesChange(stages.filter((s) => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  // Question handlers
  const handleAddQuestion = (stageId: string) => {
    const newQuestion: ApplicationQuestion = {
      id: `q-${Date.now()}`,
      stageId,
      question: '',
      type: 'text',
      required: false,
      order: (stages.find(s => s.id === stageId)?.questions?.length || 0) + 1,
    };
    setEditingQuestion({ stageId, question: newQuestion });
    setIsAddingQuestion(true);
    setActiveStageForQuestion(stageId);
  };

  const handleEditQuestion = (stageId: string, question: ApplicationQuestion) => {
    setEditingQuestion({ stageId, question });
    setIsAddingQuestion(false);
    setActiveStageForQuestion(stageId);
  };

  const handleSaveQuestion = (stageId: string, question: ApplicationQuestion) => {
    const updatedStages = stages.map((stage) => {
      if (stage.id !== stageId) return stage;

      const questions = stage.questions || [];
      const existingIdx = questions.findIndex((q) => q.id === question.id);

      if (existingIdx >= 0) {
        // Update existing
        const newQuestions = [...questions];
        newQuestions[existingIdx] = question;
        return { ...stage, questions: newQuestions };
      } else {
        // Add new
        return { ...stage, questions: [...questions, question] };
      }
    });

    onStagesChange(updatedStages);
    setEditingQuestion(null);
    setIsAddingQuestion(false);
    setActiveStageForQuestion(null);
  };

  const handleDeleteQuestion = (stageId: string, questionId: string) => {
    const updatedStages = stages.map((stage) => {
      if (stage.id !== stageId) return stage;
      return {
        ...stage,
        questions: stage.questions?.filter((q) => q.id !== questionId) || [],
      };
    });
    onStagesChange(updatedStages);
  };

  // Create default stages if empty
  const handleCreateDefaultStages = () => {
    const defaultStages: ApplicationStage[] = [
      {
        id: `stage-${Date.now()}-1`,
        opportunityId,
        name: 'Job Information',
        description: 'Review the job details and requirements',
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
      {
        id: `stage-${Date.now()}-2`,
        opportunityId,
        name: 'Application Questions',
        description: 'Answer questions about your experience',
        type: 'questions',
        order: 2,
        isRequired: true,
        questions: [],
      },
      {
        id: `stage-${Date.now()}-3`,
        opportunityId,
        name: 'Review & Submit',
        description: 'Review your application and submit',
        type: 'info',
        order: 3,
        isRequired: true,
        content: {},
      },
    ];
    onStagesChange(defaultStages);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Application Stages</h3>
          <p className="text-sm text-zinc-500">
            Create and organize the stages of your application process
          </p>
        </div>
        <Button onClick={handleAddStage} className="bg-teal-500 hover:bg-teal-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Stage
        </Button>
      </div>

      {/* Stages List */}
      {stages.length === 0 ? (
        <Card className="border-dashed border-2 border-zinc-300">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">No stages configured</h3>
            <p className="text-zinc-500 mb-6 max-w-md mx-auto">
              Create application stages to guide candidates through your hiring process.
              Each stage can contain questions, assessments, or information.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={handleCreateDefaultStages} variant="outline">
                Use Default Template
              </Button>
              <Button onClick={handleAddStage} className="bg-teal-500 hover:bg-teal-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Stage
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {stages.map((stage) => (
                <SortableStage
                  key={stage.id}
                  stage={stage}
                  onEdit={setEditingStage}
                  onDelete={handleDeleteStage}
                  onAddQuestion={handleAddQuestion}
                  onEditQuestion={handleEditQuestion}
                  onDeleteQuestion={handleDeleteQuestion}
                  isExpanded={expandedStages.has(stage.id)}
                  onToggleExpand={() => toggleExpand(stage.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Save Button */}
      {stages.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => onSave(stages)}
            disabled={isSaving}
            className="bg-teal-500 hover:bg-teal-600"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save All Changes'
            )}
          </Button>
        </div>
      )}

      {/* Edit Stage Dialog */}
      <StageEditDialog
        stage={editingStage}
        isOpen={!!editingStage}
        onClose={() => {
          setEditingStage(null);
          setIsAddingStage(false);
        }}
        onSave={handleSaveStage}
        isNew={isAddingStage}
      />

      {/* Edit Question Dialog */}
      <QuestionEditDialog
        question={editingQuestion?.question || null}
        isOpen={!!editingQuestion}
        onClose={() => {
          setEditingQuestion(null);
          setIsAddingQuestion(false);
          setActiveStageForQuestion(null);
        }}
        onSave={(question) => {
          if (activeStageForQuestion) {
            handleSaveQuestion(activeStageForQuestion, question);
          }
        }}
        isNew={isAddingQuestion}
      />
    </div>
  );
}

// Stage Edit Dialog
interface StageEditDialogProps {
  stage: ApplicationStage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (stage: ApplicationStage) => void;
  isNew: boolean;
}

function StageEditDialog({ stage, isOpen, onClose, onSave, isNew }: StageEditDialogProps) {
  const [formData, setFormData] = useState<ApplicationStage | null>(null);

  useEffect(() => {
    if (stage) {
      setFormData({ ...stage });
    }
  }, [stage]);

  if (!stage || !formData) return null;

  const handleSave = () => {
    if (!formData.name) return;
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Add Stage' : 'Edit Stage'}</DialogTitle>
          <DialogDescription>
            Configure this application stage
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stage Type */}
          <div className="space-y-2">
            <Label>Stage Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {STAGE_TYPES.map((type) => (
                <div
                  key={type.value}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.type === type.value
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                  onClick={() => setFormData({ ...formData, type: type.value })}
                >
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4 text-teal-600" />
                    <span className="font-medium text-sm">{type.label}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{type.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stage Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stage Name (English) *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Application Questions"
              />
            </div>
            <div className="space-y-2">
              <Label>Stage Name (Spanish)</Label>
              <Input
                value={formData.nameEs || ''}
                onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
                placeholder="e.g., Preguntas de Aplicación"
              />
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Description (English)</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this stage..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Spanish)</Label>
              <Textarea
                value={formData.descriptionEs || ''}
                onChange={(e) => setFormData({ ...formData, descriptionEs: e.target.value })}
                placeholder="Descripción breve de esta etapa..."
                rows={2}
              />
            </div>
          </div>

          {/* Info Stage Content */}
          {formData.type === 'info' && (
            <div className="space-y-4 p-4 bg-zinc-50 rounded-lg">
              <Label>Content to Display</Label>
              <div className="space-y-3">
                {[
                  { key: 'showJobDescription', label: 'Job Description' },
                  { key: 'showRequirements', label: 'Requirements' },
                  { key: 'showCompensation', label: 'Compensation Details' },
                  { key: 'showSchedule', label: 'Schedule Information' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    <Switch
                      checked={formData.content?.[item.key as keyof typeof formData.content] as boolean || false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          content: { ...formData.content, [item.key]: checked },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Config */}
          {formData.type === 'verification' && (
            <div className="space-y-4 p-4 bg-zinc-50 rounded-lg">
              <Label>Verification Type</Label>
              <Select
                value={formData.verificationConfig?.verificationType || 'background'}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    verificationConfig: {
                      ...formData.verificationConfig,
                      verificationType: v as 'background' | 'identity' | 'employment' | 'education' | 'custom',
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="background">Background Check</SelectItem>
                  <SelectItem value="identity">Identity Verification</SelectItem>
                  <SelectItem value="employment">Employment History</SelectItem>
                  <SelectItem value="education">Education Verification</SelectItem>
                  <SelectItem value="custom">Custom Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Required Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg">
            <div>
              <Label>Required Stage</Label>
              <p className="text-sm text-zinc-500">Applicants must complete this stage</p>
            </div>
            <Switch
              checked={formData.isRequired}
              onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name}
            className="bg-teal-500 hover:bg-teal-600"
          >
            {isNew ? 'Add Stage' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Question Edit Dialog (reused from QuestionBuilder)
interface QuestionEditDialogProps {
  question: ApplicationQuestion | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: ApplicationQuestion) => void;
  isNew: boolean;
}

function QuestionEditDialog({ question, isOpen, onClose, onSave, isNew }: QuestionEditDialogProps) {
  const [formData, setFormData] = useState<ApplicationQuestion | null>(null);
  const [newOption, setNewOption] = useState({ value: '', label: '', labelEs: '' });

  useEffect(() => {
    if (question) {
      setFormData({ ...question });
    }
  }, [question]);

  if (!question || !formData) return null;

  const needsOptions = ['select', 'multiselect', 'radio'].includes(formData.type);

  const handleAddOption = () => {
    if (!newOption.value || !newOption.label) return;

    setFormData({
      ...formData,
      options: [...(formData.options || []), { ...newOption }],
    });
    setNewOption({ value: '', label: '', labelEs: '' });
  };

  const handleRemoveOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options?.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    if (!formData.question) return;
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Add Question' : 'Edit Question'}</DialogTitle>
          <DialogDescription>
            Configure your application question
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Question Type */}
          <div className="space-y-2">
            <Label>Question Type</Label>
            <Select
              value={formData.type}
              onValueChange={(v) => setFormData({ ...formData, type: v as QuestionType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Question Text */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Question (English) *</Label>
              <Textarea
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter your question..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Question (Spanish)</Label>
              <Textarea
                value={formData.questionEs || ''}
                onChange={(e) => setFormData({ ...formData, questionEs: e.target.value })}
                placeholder="Ingrese su pregunta..."
                rows={2}
              />
            </div>
          </div>

          {/* Placeholder */}
          {['text', 'textarea', 'number'].includes(formData.type) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Placeholder (English)</Label>
                <Input
                  value={formData.placeholder || ''}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                  placeholder="Enter placeholder text..."
                />
              </div>
              <div className="space-y-2">
                <Label>Placeholder (Spanish)</Label>
                <Input
                  value={formData.placeholderEs || ''}
                  onChange={(e) => setFormData({ ...formData, placeholderEs: e.target.value })}
                  placeholder="Ingrese texto de ejemplo..."
                />
              </div>
            </div>
          )}

          {/* Options for select/radio/multiselect */}
          {needsOptions && (
            <div className="space-y-4">
              <Label>Options</Label>

              {/* Existing Options */}
              <div className="space-y-2">
                {formData.options?.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-50 rounded-lg">
                    <span className="flex-1 text-sm">
                      <strong>{opt.value}</strong>: {opt.label}
                      {opt.labelEs && <span className="text-zinc-500"> / {opt.labelEs}</span>}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add New Option */}
              <div className="grid grid-cols-4 gap-2">
                <Input
                  value={newOption.value}
                  onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                  placeholder="Value"
                />
                <Input
                  value={newOption.label}
                  onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                  placeholder="Label (EN)"
                />
                <Input
                  value={newOption.labelEs}
                  onChange={(e) => setNewOption({ ...newOption, labelEs: e.target.value })}
                  placeholder="Label (ES)"
                />
                <Button variant="outline" onClick={handleAddOption}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Number Validation */}
          {formData.type === 'number' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Value</Label>
                <Input
                  type="number"
                  value={formData.validation?.min || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validation: { ...formData.validation, min: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Maximum Value</Label>
                <Input
                  type="number"
                  value={formData.validation?.max || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validation: { ...formData.validation, max: Number(e.target.value) },
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* Required Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg">
            <div>
              <Label>Required Question</Label>
              <p className="text-sm text-zinc-500">Applicants must answer this question</p>
            </div>
            <Switch
              checked={formData.required}
              onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.question}
            className="bg-teal-500 hover:bg-teal-600"
          >
            {isNew ? 'Add Question' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
