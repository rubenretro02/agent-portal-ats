'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus,
  Trash2,
  GripVertical,
  Edit3,
  Type,
  AlignLeft,
  ListOrdered,
  CheckSquare,
  CircleDot,
  Calendar,
  Hash,
  ChevronUp,
  ChevronDown,
  Copy,
  FileText,
} from 'lucide-react';
import type { ApplicationQuestion, QuestionType } from '@/types';

interface ApplicationBuilderProps {
  questions: ApplicationQuestion[];
  onChange: (questions: ApplicationQuestion[]) => void;
  readOnly?: boolean;
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'text', label: 'Short Text', icon: Type },
  { value: 'textarea', label: 'Long Text', icon: AlignLeft },
  { value: 'select', label: 'Dropdown', icon: ListOrdered },
  { value: 'radio', label: 'Single Choice', icon: CircleDot },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'multiselect', label: 'Multiple Choice', icon: CheckSquare },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
];

function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function ApplicationBuilder({ questions, onChange, readOnly = false }: ApplicationBuilderProps) {
  const [editingQuestion, setEditingQuestion] = useState<ApplicationQuestion | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<ApplicationQuestion>>({
    type: 'text',
    required: false,
    options: [],
  });
  const [optionInput, setOptionInput] = useState('');

  const addQuestion = () => {
    if (!newQuestion.question?.trim()) return;

    const question: ApplicationQuestion = {
      id: generateId(),
      question: newQuestion.question,
      questionEs: newQuestion.questionEs,
      type: newQuestion.type || 'text',
      required: newQuestion.required || false,
      order: questions.length,
      options: newQuestion.options,
      placeholder: newQuestion.placeholder,
      placeholderEs: newQuestion.placeholderEs,
      validation: newQuestion.validation,
    };

    onChange([...questions, question]);
    setNewQuestion({ type: 'text', required: false, options: [] });
    setShowAddDialog(false);
  };

  const updateQuestion = () => {
    if (!editingQuestion) return;

    onChange(
      questions.map((q) =>
        q.id === editingQuestion.id ? editingQuestion : q
      )
    );
    setEditingQuestion(null);
  };

  const deleteQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id).map((q, i) => ({ ...q, order: i })));
  };

  const duplicateQuestion = (question: ApplicationQuestion) => {
    const newQ: ApplicationQuestion = {
      ...question,
      id: generateId(),
      order: questions.length,
      question: `${question.question} (Copy)`,
    };
    onChange([...questions, newQ]);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    onChange(newQuestions.map((q, i) => ({ ...q, order: i })));
  };

  const addOption = (isEditing: boolean) => {
    if (!optionInput.trim()) return;

    const option = {
      value: optionInput.toLowerCase().replace(/\s+/g, '_'),
      label: optionInput,
    };

    if (isEditing && editingQuestion) {
      setEditingQuestion({
        ...editingQuestion,
        options: [...(editingQuestion.options || []), option],
      });
    } else {
      setNewQuestion({
        ...newQuestion,
        options: [...(newQuestion.options || []), option],
      });
    }
    setOptionInput('');
  };

  const removeOption = (index: number, isEditing: boolean) => {
    if (isEditing && editingQuestion) {
      setEditingQuestion({
        ...editingQuestion,
        options: (editingQuestion.options || []).filter((_, i) => i !== index),
      });
    } else {
      setNewQuestion({
        ...newQuestion,
        options: (newQuestion.options || []).filter((_, i) => i !== index),
      });
    }
  };

  const getTypeIcon = (type: QuestionType) => {
    const typeInfo = QUESTION_TYPES.find((t) => t.value === type);
    const Icon = typeInfo?.icon || Type;
    return <Icon className="h-4 w-4" />;
  };

  const needsOptions = (type: QuestionType) => {
    return ['select', 'radio', 'multiselect'].includes(type);
  };

  const QuestionForm = ({ question, setQuestion, isEditing }: {
    question: Partial<ApplicationQuestion>;
    setQuestion: (q: Partial<ApplicationQuestion>) => void;
    isEditing: boolean;
  }) => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Question Text *</Label>
        <Input
          placeholder="Enter your question..."
          value={question.question || ''}
          onChange={(e) => setQuestion({ ...question, question: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Question Type</Label>
        <Select
          value={question.type || 'text'}
          onValueChange={(v) => setQuestion({ ...question, type: v as QuestionType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <type.icon className="h-4 w-4 text-zinc-500" />
                  {type.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {needsOptions(question.type || 'text') && (
        <div className="space-y-2">
          <Label>Options</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add an option..."
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addOption(isEditing);
                }
              }}
            />
            <Button type="button" variant="outline" onClick={() => addOption(isEditing)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {(question.options || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {(question.options || []).map((opt, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="px-3 py-1 cursor-pointer hover:bg-red-100 hover:text-red-600"
                  onClick={() => removeOption(i, isEditing)}
                >
                  {opt.label}
                  <span className="ml-1 text-xs">×</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Placeholder Text (Optional)</Label>
        <Input
          placeholder="Enter placeholder text..."
          value={question.placeholder || ''}
          onChange={(e) => setQuestion({ ...question, placeholder: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg">
        <div>
          <Label>Required</Label>
          <p className="text-sm text-zinc-500">Applicant must answer this question</p>
        </div>
        <Switch
          checked={question.required || false}
          onCheckedChange={(checked) => setQuestion({ ...question, required: checked })}
        />
      </div>

      {question.type === 'number' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Minimum Value</Label>
            <Input
              type="number"
              value={question.validation?.min ?? ''}
              onChange={(e) => setQuestion({
                ...question,
                validation: { ...question.validation, min: Number(e.target.value) },
              })}
            />
          </div>
          <div className="space-y-2">
            <Label>Maximum Value</Label>
            <Input
              type="number"
              value={question.validation?.max ?? ''}
              onChange={(e) => setQuestion({
                ...question,
                validation: { ...question.validation, max: Number(e.target.value) },
              })}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (readOnly) {
    return (
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No application questions configured</p>
          </div>
        ) : (
          questions.map((q, index) => (
            <div
              key={q.id}
              className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg"
            >
              <span className="text-sm font-medium text-zinc-400">{index + 1}</span>
              <div className="flex-1">
                <p className="font-medium text-zinc-900">{q.question}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {QUESTION_TYPES.find((t) => t.value === q.type)?.label || q.type}
                  </Badge>
                  {q.required && (
                    <Badge className="text-xs bg-red-100 text-red-700">Required</Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900">Application Questions</h3>
          <p className="text-sm text-zinc-500">Build your custom application form</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} size="sm" className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <Card className="border-dashed border-2 border-zinc-200">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="font-medium text-zinc-900 mb-1">No Questions Yet</h3>
            <p className="text-sm text-zinc-500 mb-4">
              Add questions to collect information from applicants
            </p>
            <Button onClick={() => setShowAddDialog(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {questions.map((question, index) => (
            <Card
              key={question.id}
              className="border-zinc-200 hover:border-zinc-300 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveQuestion(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center justify-center w-6 h-6 bg-zinc-100 rounded text-xs font-medium text-zinc-500">
                      {index + 1}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveQuestion(index, 'down')}
                      disabled={index === questions.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-zinc-400">{getTypeIcon(question.type)}</span>
                      <span className="font-medium text-zinc-900 truncate">
                        {question.question}
                      </span>
                      {question.required && (
                        <Badge className="text-xs bg-red-100 text-red-700 shrink-0">
                          Required
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {QUESTION_TYPES.find((t) => t.value === question.type)?.label}
                      </Badge>
                      {question.options && question.options.length > 0 && (
                        <span className="text-xs text-zinc-400">
                          {question.options.length} options
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingQuestion(question)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => duplicateQuestion(question)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Question Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Question</DialogTitle>
            <DialogDescription>
              Create a new question for your application form
            </DialogDescription>
          </DialogHeader>
          <QuestionForm
            question={newQuestion}
            setQuestion={setNewQuestion}
            isEditing={false}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={addQuestion}
              disabled={!newQuestion.question?.trim()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Update the question details
            </DialogDescription>
          </DialogHeader>
          {editingQuestion && (
            <QuestionForm
              question={editingQuestion}
              setQuestion={(q) => setEditingQuestion(q as ApplicationQuestion)}
              isEditing={true}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuestion(null)}>
              Cancel
            </Button>
            <Button
              onClick={updateQuestion}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
