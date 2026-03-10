'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  MapPin,
  Briefcase,
  Globe,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const STEPS = [
  { id: 'personal', title: 'Personal Info', icon: User },
  { id: 'address', title: 'Address', icon: MapPin },
  { id: 'experience', title: 'Experience', icon: Briefcase },
  { id: 'availability', title: 'Availability', icon: Globe },
];

const MONTHS = [
  { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' }, { value: '04', label: 'Apr' },
  { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' }, { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: String(i + 1),
}));

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => ({
  value: String(currentYear - 18 - i),
  label: String(currentYear - 18 - i),
}));

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const LANGUAGES_LIST = ['English', 'Spanish', 'French', 'Portuguese', 'German', 'Italian', 'Chinese', 'Japanese'];
const EXPERIENCE_OPTIONS = ['No experience', 'Less than 1 year', '1-2 years', '3-5 years', '5+ years'];
const SHIFT_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Flexible'];
const HOURS_OPTIONS = ['10-20', '20-30', '30-40', '40+'];

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function OnboardingModal({ open, onOpenChange, onComplete }: OnboardingModalProps) {
  const { profile, agent, refreshProfile } = useAuthContext();

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    sex: '',
    dobMonth: '',
    dobDay: '',
    dobYear: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    yearsExperience: '',
    languages: [] as string[],
    hoursPerWeek: '',
    preferredShift: '',
  });

  useEffect(() => {
    if (profile) {
      const profileExt = profile as unknown as { sex?: string; date_of_birth?: string };
      const dob = profileExt.date_of_birth?.split('-') || [];

      setFormData(prev => ({
        ...prev,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || '',
        sex: profileExt.sex || '',
        dobYear: dob[0] || '',
        dobMonth: dob[1] || '',
        dobDay: dob[2] || '',
      }));
    }

    if (agent) {
      const address = agent.address as Record<string, string> | null;
      const experience = agent.experience as Record<string, string> | null;
      const availability = agent.availability as Record<string, string> | null;
      const langs = agent.languages as string[] | null;

      setFormData(prev => ({
        ...prev,
        street: address?.street || '',
        city: address?.city || '',
        state: address?.state || '',
        zipCode: address?.zipCode || '',
        yearsExperience: experience?.yearsExperience || '',
        languages: langs || [],
        hoursPerWeek: availability?.hoursPerWeek || '',
        preferredShift: availability?.preferredShift || '',
      }));
    }
  }, [profile, agent]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const updateField = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggleLanguage = (lang: string) => {
    if (formData.languages.includes(lang)) {
      updateField('languages', formData.languages.filter(l => l !== lang));
    } else {
      updateField('languages', [...formData.languages, lang]);
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0:
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.sex || !formData.dobMonth || !formData.dobDay || !formData.dobYear) {
          setError('Please fill in all fields');
          return false;
        }
        break;
      case 1:
        if (!formData.street || !formData.city || !formData.state || !formData.zipCode) {
          setError('Please fill in all address fields');
          return false;
        }
        break;
      case 2:
        if (!formData.yearsExperience) {
          setError('Please select your experience');
          return false;
        }
        break;
      case 3:
        if (formData.languages.length === 0 || !formData.hoursPerWeek || !formData.preferredShift) {
          setError('Please complete all fields');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setSaving(true);
    setError('');

    try {
      // Step 1: Update profile
      console.log('[Onboarding] Updating profile...');
      const profileRes = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          sex: formData.sex,
          date_of_birth: `${formData.dobYear}-${formData.dobMonth}-${formData.dobDay}`,
        }),
      });

      const profileResult = await profileRes.json();
      console.log('[Onboarding] Profile update result:', profileResult);

      if (!profileRes.ok) {
        throw new Error(profileResult.error || 'Failed to update profile');
      }

      // Step 2: Update agent data
      if (agent) {
        console.log('[Onboarding] Updating agent...', agent.id);
        const { adminDb } = await import('@/lib/adminDb');

        const agentUpdateData = {
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: 'USA',
          },
          experience: { yearsExperience: formData.yearsExperience },
          languages: formData.languages,
          availability: {
            hoursPerWeek: formData.hoursPerWeek,
            preferredShift: formData.preferredShift,
          },
        };

        console.log('[Onboarding] Agent update data:', agentUpdateData);

        const agentResult = await adminDb({
          action: 'update',
          table: 'agents',
          data: agentUpdateData,
          match: { id: agent.id },
        });

        console.log('[Onboarding] Agent update result:', agentResult);

        if (agentResult.error) {
          throw new Error(agentResult.error);
        }
      } else {
        console.warn('[Onboarding] No agent found, skipping agent update');
      }

      // Step 3: Refresh profile
      console.log('[Onboarding] Refreshing profile...');
      await refreshProfile();

      setSuccess(true);
      setTimeout(() => {
        onComplete?.();
        onOpenChange(false);
      }, 1500);

    } catch (err) {
      console.error('[Onboarding] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Profile Complete!</h2>
            <p className="text-zinc-500">You can now apply to opportunities.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-xl">Complete Your Profile</DialogTitle>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Step {currentStep + 1} of {STEPS.length}</span>
              <span className="font-medium text-teal-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Step Pills */}
          <div className="flex gap-1.5 mt-3 pb-4 border-b">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                  index === currentStep
                    ? 'bg-teal-100 text-teal-700'
                    : index < currentStep
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-zinc-100 text-zinc-400'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <step.icon className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
          {/* Step 0: Personal */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">First Name *</Label>
                  <Input value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Last Name *</Label>
                  <Input value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Phone *</Label>
                  <Input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sex *</Label>
                  <Select value={formData.sex} onValueChange={(v) => updateField('sex', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date of Birth *</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={formData.dobMonth} onValueChange={(v) => updateField('dobMonth', v)}>
                    <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                    <SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={formData.dobDay} onValueChange={(v) => updateField('dobDay', v)}>
                    <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                    <SelectContent>{DAYS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={formData.dobYear} onValueChange={(v) => updateField('dobYear', v)}>
                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                    <SelectContent>{YEARS.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Address */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Street Address *</Label>
                <Input value={formData.street} onChange={(e) => updateField('street', e.target.value)} placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">City *</Label>
                  <Input value={formData.city} onChange={(e) => updateField('city', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">State *</Label>
                  <Select value={formData.state} onValueChange={(v) => updateField('state', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1 max-w-[120px]">
                <Label className="text-xs">ZIP Code *</Label>
                <Input value={formData.zipCode} onChange={(e) => updateField('zipCode', e.target.value)} placeholder="10001" />
              </div>
            </div>
          )}

          {/* Step 2: Experience */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Call Center Experience *</Label>
                <Select value={formData.yearsExperience} onValueChange={(v) => updateField('yearsExperience', v)}>
                  <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                  <SelectContent>{EXPERIENCE_OPTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <p className="text-xs text-zinc-500">Don't worry if you have no experience - we provide training!</p>
            </div>
          )}

          {/* Step 3: Availability */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Languages You Speak *</Label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES_LIST.map(lang => (
                    <Badge
                      key={lang}
                      variant={formData.languages.includes(lang) ? 'default' : 'outline'}
                      className={`cursor-pointer text-xs ${formData.languages.includes(lang) ? 'bg-teal-500' : ''}`}
                      onClick={() => toggleLanguage(lang)}
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Hours/Week *</Label>
                  <Select value={formData.hoursPerWeek} onValueChange={(v) => updateField('hoursPerWeek', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{HOURS_OPTIONS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Preferred Shift *</Label>
                  <Select value={formData.preferredShift} onValueChange={(v) => updateField('preferredShift', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{SHIFT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" size="sm" onClick={handleBack} disabled={currentStep === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button size="sm" onClick={handleNext} className="bg-teal-500 hover:bg-teal-600">
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 min-w-[100px]">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-1" />Complete</>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
