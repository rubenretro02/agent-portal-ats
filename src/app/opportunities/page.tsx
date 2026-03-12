'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
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
import { Switch } from '@/components/ui/switch';
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
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ApplicationBuilder } from '@/components/admin/ApplicationBuilder';
import type { ApplicationQuestion } from '@/types';

interface OpportunityFormData {
  name: string;
  description: string;
  client: string;
  category: string;
  baseRate: number;
  trainingHours: number;
  maxAgents: number;
  languages: string[];
  minScore: number;
  status: string;
  tags: string[];
  applicationQuestions: ApplicationQuestion[];
}

const defaultFormData: OpportunityFormData = {
  name: '',
  description: '',
  client: '',
  category: '',
  baseRate: 15,
  trainingHours: 8,
  maxAgents: 10,
  languages: ['English'],
  minScore: 0,
  status: 'draft',
  tags: [],
  applicationQuestions: [],
};

const CATEGORIES = ['Technical Support', 'Customer Service', 'Sales', 'Healthcare', 'Financial Services', 'Retail', 'Other'];
const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'German'];

export default function OpportunitiesPage() {
  const router = useRouter();
  const { agent: authAgent, profile, isLoading: authLoading } = useAuthContext();
  const { language } = useAuthStore();
  const {
    opportunities,
    fetchOpportunities,
    applyToOpportunity,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    isLoading,
    appliedOpportunityIds,
    fetchAppliedOpportunities
  } = useOpportunityStore();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<typeof opportunities[0] | null>(null);

  const [showOnboardingWarning, setShowOnboardingWarning] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<OpportunityFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const isAdmin = profile?.role === 'admin' || profile?.role === 'recruiter';

  const isOnboardingComplete = (() => {
    if (!profile || !authAgent) return false;
    const address = authAgent.address as Record<string, string> | null;
    const experience = authAgent.experience as Record<string, string> | null;
    const availability = authAgent.availability as Record<string, string> | null;
    const langs = authAgent.languages as string[] | null;
    const profileExt = profile as unknown as { sex?: string; date_of_birth?: string };
    return !!(
      profile.first_name && profile.last_name && profileExt.sex && profileExt.date_of_birth && profile.phone &&
      address?.street && address?.city && address?.state && address?.zipCode &&
      experience?.yearsExperience &&
      langs && langs.length > 0 && availability?.hoursPerWeek && availability?.preferredShift
    );
  })();

  useEffect(() => {
    fetchOpportunities(isAdmin);
  }, [fetchOpportunities, isAdmin]);

  useEffect(() => {
    if (authAgent) fetchAppliedOpportunities();
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
          <p className="text-zinc-500 mb-4">Please sign in</p>
          <a href="/login" className="px-4 py-2 rounded-md bg-teal-500 text-white">Sign In</a>
        </div>
      </div>
    );
  }

  const categories = [...new Set(opportunities.map(c => c.category).filter(Boolean))];
  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || opp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreateOpportunity = async () => {
    if (!formData.name || !formData.description || !formData.client) return;
    setSaving(true);
    const result = await createOpportunity(formData);
    setSaving(false);
    if (result.success) {
      setShowCreateDialog(false);
      setFormData(defaultFormData);
    }
  };

  const handleEditOpportunity = async () => {
    if (!selectedOpportunity || !formData.name) return;
    setSaving(true);
    const success = await updateOpportunity(selectedOpportunity.id, formData);
    setSaving(false);
    if (success) {
      setShowEditDialog(false);
      setSelectedOpportunity(null);
    }
  };

  const handleDeleteOpportunity = async () => {
    if (!selectedOpportunity) return;
    setSaving(true);
    const success = await deleteOpportunity(selectedOpportunity.id);
    setSaving(false);
    if (success) {
      setShowDeleteConfirm(false);
      setSelectedOpportunity(null);
    }
  };

  const openEditDialog = (opp: typeof opportunities[0]) => {
    setSelectedOpportunity(opp);
    setFormData({
      name: opp.name,
      description: opp.description,
      client: opp.client,
      category: opp.category || '',
      baseRate: (opp.compensation as Record<string, number>)?.baseRate || 15,
      trainingHours: (opp.training as Record<string, number>)?.duration || 8,
      maxAgents: opp.capacity?.maxAgents || 10,
      languages: (opp.requirements as Record<string, string[]>)?.languages || ['English'],
      minScore: (opp.requirements as Record<string, number>)?.minScore || 0,
      status: opp.status,
      tags: opp.tags || [],
      applicationQuestions: opp.applicationQuestions || [],
    });
    setShowEditDialog(true);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const toggleLanguage = (lang: string) => {
    if (formData.languages.includes(lang)) {
      setFormData({ ...formData, languages: formData.languages.filter(l => l !== lang) });
    } else {
      setFormData({ ...formData, languages: [...formData.languages, lang] });
    }
  };

  const handleApplyClick = (opp: typeof opportunities[0]) => {
    if (!isOnboardingComplete) {
      setSelectedOpportunity(opp);
      setShowOnboardingWarning(true);
      return;
    }
    router.push(`/apply/${opp.id}`);
  };

  const OpportunityForm = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input placeholder="e.g., Customer Support Agent" value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Client *</Label>
          <Input placeholder="e.g., TechCorp Inc." value={formData.client}
            onChange={(e) => setFormData({ ...formData, client: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea placeholder="Describe the opportunity..." value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Base Rate ($/hr)</Label>
          <Input type="number" min={0} value={formData.baseRate}
            onChange={(e) => setFormData({ ...formData, baseRate: Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Training Hours</Label>
          <Input type="number" min={0} value={formData.trainingHours}
            onChange={(e) => setFormData({ ...formData, trainingHours: Number(e.target.value) })} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Max Agents</Label>
          <Input type="number" min={1} value={formData.maxAgents}
            onChange={(e) => setFormData({ ...formData, maxAgents: Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Min Score</Label>
          <Input type="number" min={0} max={100} value={formData.minScore}
            onChange={(e) => setFormData({ ...formData, minScore: Number(e.target.value) })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Required Languages</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(lang => (
            <Badge key={lang} variant={formData.languages.includes(lang) ? 'default' : 'outline'}
              className={`cursor-pointer ${formData.languages.includes(lang) ? 'bg-cyan-500' : ''}`}
              onClick={() => toggleLanguage(lang)}>{lang}</Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input placeholder="Add tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
          <Button type="button" variant="outline" onClick={addTag}>Add</Button>
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

      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg">
        <div>
          <Label>Status</Label>
          <p className="text-sm text-zinc-500">{formData.status === 'active' ? 'Visible to agents' : 'Hidden'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Draft</span>
          <Switch checked={formData.status === 'active'}
            onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'draft' })} />
          <span className="text-sm">Active</span>
        </div>
      </div>

      <div className="border-t border-zinc-200 pt-5">
        <ApplicationBuilder
          questions={formData.applicationQuestions}
          onChange={(questions) => setFormData({ ...formData, applicationQuestions: questions })}
        />
      </div>
    </div>
  );

  const pageTitle = isAdmin ? 'Manage Opportunities' : t('opportunities', 'title');

  const content = (
    <UnifiedLayout title={pageTitle}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => <SelectItem key={cat} value={cat || ''}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {isAdmin && (
            <Button onClick={() => { setFormData(defaultFormData); setShowCreateDialog(true); }} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="h-4 w-4 mr-2" />Create Opportunity
            </Button>
          )}
        </div>

        {isAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><p className="text-sm text-zinc-500">Total</p><p className="text-2xl font-bold">{opportunities.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-zinc-500">Active</p><p className="text-2xl font-bold text-emerald-600">{opportunities.filter(o => o.status === 'active').length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-zinc-500">Draft</p><p className="text-2xl font-bold text-amber-600">{opportunities.filter(o => o.status === 'draft').length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-zinc-500">Closed</p><p className="text-2xl font-bold text-zinc-400">{opportunities.filter(o => o.status === 'closed').length}</p></CardContent></Card>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500">No opportunities found</p>
            {isAdmin && <Button onClick={() => setShowCreateDialog(true)} className="mt-4 bg-cyan-600"><Plus className="h-4 w-4 mr-2" />Create</Button>}
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp) => {
              const isApplied = appliedOpportunityIds.includes(opp.id);
              const comp = opp.compensation as Record<string, unknown> | null;
              const train = opp.training as Record<string, unknown> | null;
              const req = opp.requirements as Record<string, unknown> | null;
              const questionCount = opp.applicationQuestions?.length || 0;

              return (
                <Card 
                  key={opp.id} 
                  className={`border-zinc-200 hover:border-teal-300 hover:shadow-lg transition-all overflow-hidden cursor-pointer ${opp.status !== 'active' ? 'opacity-75' : ''}`}
                  onClick={() => isAdmin && router.push(`/opportunities/${opp.id}`)}
                >
                  {isAdmin && <div className={`h-1 ${opp.status === 'active' ? 'bg-emerald-500' : opp.status === 'draft' ? 'bg-amber-500' : 'bg-zinc-300'}`} />}

                  <div className="p-5 border-b border-zinc-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-zinc-900 text-lg">{opp.name}</h3>
                        <p className="text-sm text-zinc-500 mt-1">{opp.client}</p>
                      </div>
                      <div className="ml-3 flex items-center gap-2">
                        {isAdmin ? (
                          <>
                            <Badge className={opp.status === 'active' ? 'bg-emerald-500' : opp.status === 'draft' ? 'bg-amber-500' : ''}>{opp.status}</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(opp)}><Edit className="h-4 w-4 mr-2" />Edit Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/admin/opportunities/${opp.id}/stages`)}>
                                  <Settings className="h-4 w-4 mr-2" />Configure Stages
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={async () => { await updateOpportunity(opp.id, { status: opp.status === 'active' ? 'draft' : 'active' }); }}>
                                  {opp.status === 'active' ? <><EyeOff className="h-4 w-4 mr-2" />Deactivate</> : <><Eye className="h-4 w-4 mr-2" />Activate</>}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedOpportunity(opp); setShowDeleteConfirm(true); }}>
                                  <Trash2 className="h-4 w-4 mr-2" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        ) : isApplied ? (
                          <Badge variant="secondary">Applied</Badge>
                        ) : (
                          <Badge className="bg-teal-500">Open</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-600 line-clamp-2">{opp.description}</p>
                  </div>

                  <CardContent className="p-5">
                    {opp.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {opp.tags.slice(0, 3).map(tag => <span key={tag} className="text-xs px-2 py-1 bg-zinc-100 rounded-full">{tag}</span>)}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4 text-emerald-500" /><span className="font-medium">${String(comp?.baseRate || 0)}/hr</span></div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500"><Clock className="h-4 w-4" /><span>{String(train?.duration || 0)}h training</span></div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500"><Users className="h-4 w-4" /><span>{opp.capacity?.openPositions || 0} positions</span></div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500"><Globe className="h-4 w-4" /><span>{((req?.languages as string[]) || ['EN']).slice(0, 2).join(', ')}</span></div>
                    </div>

                    {/* Show question count for admins */}
                    {isAdmin && (
                      <div className={`flex items-center gap-2 text-sm mb-4 ${questionCount > 0 ? 'text-teal-600' : 'text-zinc-400'}`}>
                        <HelpCircle className="h-4 w-4" />
                        <span>{questionCount > 0 ? `${questionCount} questions` : 'No questions'}</span>
                      </div>
                    )}

                    {isAdmin ? (
                      <Button variant="outline" className="w-full" onClick={() => openEditDialog(opp)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                    ) : !isApplied ? (
                      <Button className="w-full bg-teal-500 hover:bg-teal-600" onClick={() => handleApplyClick(opp)}>Apply<ArrowRight className="h-4 w-4 ml-2" /></Button>
                    ) : (
                      <Button variant="outline" className="w-full" disabled><CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />Applied</Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader><DialogTitle>Create Opportunity</DialogTitle><DialogDescription>Create a new job opportunity</DialogDescription></DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4"><OpportunityForm /></ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateOpportunity} disabled={saving || !formData.name || !formData.description || !formData.client} className="bg-cyan-600 hover:bg-cyan-700">
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader><DialogTitle>Edit Opportunity</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4"><OpportunityForm /></ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditOpportunity} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete Opportunity</DialogTitle><DialogDescription>Delete "{selectedOpportunity?.name}"?</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteOpportunity} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onboarding Warning */}
      <Dialog open={showOnboardingWarning} onOpenChange={setShowOnboardingWarning}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4"><AlertCircle className="h-7 w-7 text-amber-600" /></div>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription className="my-4">Complete your profile before applying.</DialogDescription>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setShowOnboardingWarning(false)}>Browse</Button>
              <Button className="flex-1 bg-teal-500" onClick={() => router.push('/onboarding')}>Complete Profile</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </UnifiedLayout>
  );

  return isAdmin ? content : <RequirePersonalInfo>{content}</RequirePersonalInfo>;
}
