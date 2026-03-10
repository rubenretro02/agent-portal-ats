'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  X,
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
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const LANGUAGES_LIST = ['English', 'Spanish', 'French', 'Portuguese', 'German', 'Italian', 'Chinese', 'Japanese'];
const EXPERIENCE_OPTIONS = ['No experience', 'Less than 1 year', '1-2 years', '3-5 years', '5+ years'];
const SHIFT_OPTIONS = ['Morning (6am-2pm)', 'Afternoon (2pm-10pm)', 'Evening (10pm-6am)', 'Flexible'];
const HOURS_OPTIONS = ['10-20 hours', '20-30 hours', '30-40 hours', '40+ hours'];

interface OnboardingWidgetProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function OnboardingWidget({ onComplete, onSkip }: OnboardingWidgetProps) {
  const { profile, agent, refreshProfile } = useAuthContext();

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
          setError('Please fill in all required fields');
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
          setError('Please select your experience level');
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

  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');

    try {
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

      if (!profileRes.ok) throw new Error('Failed to update profile');

      if (agent) {
        const { adminDb } = await import('@/lib/adminDb');
        await adminDb({
          action: 'update',
          table: 'agents',
          data: {
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
          },
          match: { id: agent.id },
        });
      }

      await refreshProfile();
      onComplete?.();
    } catch (err) {
      console.error('Error saving:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-2 border-teal-200 bg-gradient-to-br from-white to-teal-50/30 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Complete Your Profile</h2>
            <p className="text-teal-100 text-sm">Required to apply for opportunities</p>
          </div>
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip} className="text-white/70 hover:text-white hover:bg-white/10">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-teal-100 mb-1">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-teal-700" />
        </div>

        {/* Step Pills */}
        <div className="flex gap-2 mt-3">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                index === currentStep
                  ? 'bg-white text-teal-700'
                  : index < currentStep
                  ? 'bg-teal-500 text-white'
                  : 'bg-teal-700/50 text-teal-200'
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
      </div>

      <CardContent className="p-6">
        {/* Step 0: Personal */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">First Name *</Label>
                <Input value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)} placeholder="John" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Last Name *</Label>
                <Input value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)} placeholder="Doe" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Phone *</Label>
                <Input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Sex *</Label>
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
            <div className="space-y-1.5">
              <Label className="text-sm">Date of Birth *</Label>
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
            <div className="space-y-1.5">
              <Label className="text-sm">Street Address *</Label>
              <Input value={formData.street} onChange={(e) => updateField('street', e.target.value)} placeholder="123 Main St" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">City *</Label>
                <Input value={formData.city} onChange={(e) => updateField('city', e.target.value)} placeholder="New York" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">State *</Label>
                <Select value={formData.state} onValueChange={(v) => updateField('state', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5 max-w-[150px]">
              <Label className="text-sm">ZIP Code *</Label>
              <Input value={formData.zipCode} onChange={(e) => updateField('zipCode', e.target.value)} placeholder="10001" />
            </div>
          </div>
        )}

        {/* Step 2: Experience */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Call Center Experience *</Label>
              <Select value={formData.yearsExperience} onValueChange={(v) => updateField('yearsExperience', v)}>
                <SelectTrigger><SelectValue placeholder="Select your experience" /></SelectTrigger>
                <SelectContent>{EXPERIENCE_OPTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-sm text-zinc-500">Don't worry if you have no experience - we provide full training!</p>
          </div>
        )}

        {/* Step 3: Availability */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Languages *</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES_LIST.map(lang => (
                  <Badge
                    key={lang}
                    variant={formData.languages.includes(lang) ? 'default' : 'outline'}
                    className={`cursor-pointer ${formData.languages.includes(lang) ? 'bg-teal-500' : ''}`}
                    onClick={() => toggleLanguage(lang)}
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Hours/Week *</Label>
                <Select value={formData.hoursPerWeek} onValueChange={(v) => updateField('hoursPerWeek', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{HOURS_OPTIONS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Preferred Shift *</Label>
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
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={saving}
            className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
            ) : currentStep === STEPS.length - 1 ? (
              <><Sparkles className="h-4 w-4" />Complete</>
            ) : (
              <>Next<ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
