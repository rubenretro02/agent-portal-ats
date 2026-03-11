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
} from 'lucide-react';

export interface JobSection {
  id: string;
  title: string;
  titleEs?: string;
  content: string;
  contentEs?: string;
  icon: string;
  order: number;
  type: 'about' | 'hours' | 'compensation' | 'role' | 'requirements' | 'benefits' | 'custom';
}

interface JobDescriptionBuilderProps {
  sections: JobSection[];
  onChange: (sections: JobSection[]) => void;
}

const SECTION_TEMPLATES = [
  { type: 'about', title: 'About the Company', icon: 'Building2', placeholder: 'Tell candidates why they should work with this company...' },
  { type: 'role', title: 'Role Overview', icon: 'Briefcase', placeholder: 'Describe the main responsibilities and what a typical day looks like...' },
  { type: 'hours', title: 'Hours & Schedule', icon: 'Clock', placeholder: 'Monday - Friday 8am - 8pm ET\nNo weekends required\nFlexible scheduling available' },
  { type: 'compensation', title: 'Compensation & Pay', icon: 'DollarSign', placeholder: '$15/hour base rate\nPerformance bonuses available\nWeekly pay via direct deposit' },
  { type: 'requirements', title: 'Requirements', icon: 'CheckCircle', placeholder: 'Must be fluent in English\nReliable internet connection\nQuiet workspace for calls' },
  { type: 'benefits', title: 'Benefits & Perks', icon: 'Star', placeholder: 'Paid training\nFlexible schedule\nWork from home\nGrowth opportunities' },
  { type: 'custom', title: 'Custom Section', icon: 'Zap', placeholder: 'Add your custom content here...' },
];

const ICONS: Record<string, React.ElementType> = {
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
};

interface SortableSectionProps {
  section: JobSection;
  onEdit: (section: JobSection) => void;
  onDelete: (id: string) => void;
}

function SortableSection({ section, onEdit, onDelete }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComponent = ICONS[section.icon] || Zap;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={`border-zinc-200 ${isDragging ? 'shadow-lg ring-2 ring-teal-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button
              {...listeners}
              className="mt-1 p-1 text-zinc-400 hover:text-zinc-600 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <IconComponent className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-zinc-900">{section.title}</h3>
                <Badge variant="secondary" className="text-xs capitalize">{section.type}</Badge>
              </div>
              <p className="text-sm text-zinc-500 line-clamp-2 whitespace-pre-wrap">
                {section.content || 'No content yet...'}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit(section)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(section.id)} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function JobDescriptionBuilder({ sections, onChange }: JobDescriptionBuilderProps) {
  const [editingSection, setEditingSection] = useState<JobSection | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const newSections = arrayMove(sections, oldIndex, newIndex).map((s, idx) => ({
        ...s,
        order: idx + 1,
      }));
      onChange(newSections);
    }
  };

  const handleAddSection = () => {
    const template = SECTION_TEMPLATES.find(t => t.type === selectedTemplate) || SECTION_TEMPLATES[6];
    const newSection: JobSection = {
      id: `section-${Date.now()}`,
      title: template.title,
      content: '',
      icon: template.icon,
      order: sections.length + 1,
      type: template.type as JobSection['type'],
    };
    setEditingSection(newSection);
    setIsAddingNew(true);
  };

  const handleSaveSection = (section: JobSection) => {
    if (isAddingNew) {
      onChange([...sections, section]);
    } else {
      onChange(sections.map((s) => (s.id === section.id ? section : s)));
    }
    setEditingSection(null);
    setIsAddingNew(false);
  };

  const handleDeleteSection = (id: string) => {
    onChange(sections.filter((s) => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Job Description Sections</h3>
          <p className="text-sm text-zinc-500">Add sections to describe the opportunity</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Section type" />
            </SelectTrigger>
            <SelectContent>
              {SECTION_TEMPLATES.map((t) => (
                <SelectItem key={t.type} value={t.type}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddSection} className="bg-teal-500 hover:bg-teal-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
      </div>

      {sections.length === 0 ? (
        <Card className="border-dashed border-2 border-zinc-300">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-zinc-500 mb-4">No sections yet. Add sections to describe this opportunity.</p>
            <Button onClick={handleAddSection} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add First Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onEdit={setEditingSection}
                  onDelete={handleDeleteSection}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit Section Dialog */}
      <SectionEditDialog
        section={editingSection}
        isOpen={!!editingSection}
        onClose={() => {
          setEditingSection(null);
          setIsAddingNew(false);
        }}
        onSave={handleSaveSection}
        isNew={isAddingNew}
      />
    </div>
  );
}

interface SectionEditDialogProps {
  section: JobSection | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: JobSection) => void;
  isNew: boolean;
}

function SectionEditDialog({ section, isOpen, onClose, onSave, isNew }: SectionEditDialogProps) {
  const [formData, setFormData] = useState<JobSection | null>(null);

  // Update form data when section changes
  if (section && (!formData || formData.id !== section.id)) {
    setFormData({ ...section });
  }

  if (!section || !formData) return null;

  const template = SECTION_TEMPLATES.find(t => t.type === formData.type);

  const handleSave = () => {
    if (!formData.title || !formData.content) return;
    onSave(formData);
    setFormData(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setFormData(null); } }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Add Section' : 'Edit Section'}</DialogTitle>
          <DialogDescription>
            Configure this job description section
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section Title */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Section Title (English) *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., About the Company"
              />
            </div>
            <div className="space-y-2">
              <Label>Section Title (Spanish)</Label>
              <Input
                value={formData.titleEs || ''}
                onChange={(e) => setFormData({ ...formData, titleEs: e.target.value })}
                placeholder="e.g., Sobre la Empresa"
              />
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ICONS).map(([name, Icon]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: name })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    formData.icon === name
                      ? 'bg-teal-500 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Content (English) *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={template?.placeholder || 'Enter content...'}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-zinc-500">Use bullet points with • or - for lists</p>
            </div>
            <div className="space-y-2">
              <Label>Content (Spanish)</Label>
              <Textarea
                value={formData.contentEs || ''}
                onChange={(e) => setFormData({ ...formData, contentEs: e.target.value })}
                placeholder="Contenido en español..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setFormData(null); }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.title || !formData.content}
            className="bg-teal-500 hover:bg-teal-600"
          >
            {isNew ? 'Add Section' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
