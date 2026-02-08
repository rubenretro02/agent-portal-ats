'use client';

import { useState } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
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
  GripVertical,
  Plus,
  Trash2,
  Edit,
  Copy,
  Type,
  AlignLeft,
  List,
  CheckSquare,
  Circle,
  Calendar,
  Hash,
  FileUp,
  X,
} from 'lucide-react';
import type { ApplicationQuestion, QuestionType } from '@/types';

interface QuestionBuilderProps {
  questions: ApplicationQuestion[];
  onQuestionsChange: (questions: ApplicationQuestion[]) => void;
  onSave: (questions: ApplicationQuestion[]) => Promise<void>;
  isSaving?: boolean;
}

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

interface SortableQuestionProps {
  question: ApplicationQuestion;
  onEdit: (question: ApplicationQuestion) => void;
  onDelete: (id: string) => void;
  onDuplicate: (question: ApplicationQuestion) => void;
}

function SortableQuestion({ question, onEdit, onDelete, onDuplicate }: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeInfo = QUESTION_TYPES.find((t) => t.value === question.type);
  const TypeIcon = typeInfo?.icon || Type;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={`border-zinc-200 ${isDragging ? 'shadow-lg ring-2 ring-teal-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <button
              {...listeners}
              className="mt-1 p-1 text-zinc-400 hover:text-zinc-600 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            {/* Question Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                  <TypeIcon className="h-4 w-4 text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-zinc-900 truncate">{question.question}</p>
                  {question.questionEs && (
                    <p className="text-xs text-zinc-500 truncate">ES: {question.questionEs}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {typeInfo?.label}
                  </Badge>
                  {question.required && (
                    <Badge className="bg-red-100 text-red-700 text-xs">Required</Badge>
                  )}
                </div>
              </div>

              {/* Options Preview for select/radio/multiselect */}
              {question.options && question.options.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {question.options.slice(0, 4).map((opt, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 bg-zinc-100 rounded-full text-zinc-600">
                      {opt.label}
                    </span>
                  ))}
                  {question.options.length > 4 && (
                    <span className="text-xs px-2 py-0.5 bg-zinc-100 rounded-full text-zinc-500">
                      +{question.options.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit(question)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDuplicate(question)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(question.id)} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function QuestionBuilder({ questions, onQuestionsChange, onSave, isSaving }: QuestionBuilderProps) {
  const [editingQuestion, setEditingQuestion] = useState<ApplicationQuestion | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('text');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      const newQuestions = arrayMove(questions, oldIndex, newIndex).map((q, idx) => ({
        ...q,
        order: idx + 1,
      }));
      onQuestionsChange(newQuestions);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: ApplicationQuestion = {
      id: `new-${Date.now()}`,
      question: '',
      questionEs: '',
      type: newQuestionType,
      required: false,
      order: questions.length + 1,
      options: ['select', 'multiselect', 'radio'].includes(newQuestionType) ? [] : undefined,
      placeholder: '',
      placeholderEs: '',
    };
    setEditingQuestion(newQuestion);
    setIsAddingNew(true);
  };

  const handleSaveQuestion = (question: ApplicationQuestion) => {
    if (isAddingNew) {
      onQuestionsChange([...questions, question]);
    } else {
      onQuestionsChange(questions.map((q) => (q.id === question.id ? question : q)));
    }
    setEditingQuestion(null);
    setIsAddingNew(false);
  };

  const handleDeleteQuestion = (id: string) => {
    onQuestionsChange(questions.filter((q) => q.id !== id));
  };

  const handleDuplicateQuestion = (question: ApplicationQuestion) => {
    const duplicate: ApplicationQuestion = {
      ...question,
      id: `new-${Date.now()}`,
      question: `${question.question} (Copy)`,
      order: questions.length + 1,
    };
    onQuestionsChange([...questions, duplicate]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Application Questions</h3>
          <p className="text-sm text-zinc-500">Drag and drop to reorder questions</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={newQuestionType} onValueChange={(v) => setNewQuestionType(v as QuestionType)}>
            <SelectTrigger className="w-40">
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
          <Button onClick={handleAddQuestion} className="bg-teal-500 hover:bg-teal-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <Card className="border-dashed border-2 border-zinc-300">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <Plus className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-zinc-500 mb-4">No questions yet. Add your first question to get started.</p>
            <Button onClick={handleAddQuestion} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {questions.map((question) => (
                <SortableQuestion
                  key={question.id}
                  question={question}
                  onEdit={setEditingQuestion}
                  onDelete={handleDeleteQuestion}
                  onDuplicate={handleDuplicateQuestion}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Save Button */}
      {questions.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={() => onSave(questions)} disabled={isSaving} className="bg-teal-500 hover:bg-teal-600">
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Questions'
            )}
          </Button>
        </div>
      )}

      {/* Edit Question Dialog */}
      <QuestionEditDialog
        question={editingQuestion}
        isOpen={!!editingQuestion}
        onClose={() => {
          setEditingQuestion(null);
          setIsAddingNew(false);
        }}
        onSave={handleSaveQuestion}
        isNew={isAddingNew}
      />
    </div>
  );
}

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

  // Update form data when question changes
  useState(() => {
    if (question) {
      setFormData({ ...question });
    }
  });

  if (!question || !formData) {
    if (question && !formData) {
      setFormData({ ...question });
    }
    return null;
  }

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
            Configure your application question settings
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
                  onChange={(e) => setFormData({
                    ...formData,
                    validation: { ...formData.validation, min: Number(e.target.value) },
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Maximum Value</Label>
                <Input
                  type="number"
                  value={formData.validation?.max || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    validation: { ...formData.validation, max: Number(e.target.value) },
                  })}
                />
              </div>
            </div>
          )}

          {/* Required Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg">
            <div>
              <Label>Required Question</Label>
              <p className="text-sm text-zinc-500">Agents must answer this question to submit</p>
            </div>
            <Switch
              checked={formData.required}
              onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!formData.question} className="bg-teal-500 hover:bg-teal-600">
            {isNew ? 'Add Question' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
