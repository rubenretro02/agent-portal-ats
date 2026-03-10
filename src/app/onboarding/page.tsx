'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Lock,
  Loader2,
  Home,
} from 'lucide-react';

// Step definitions
const STEPS = [
  { id: 'personal', title: 'Personal Info', icon: User, description: 'Basic contact information' },
  { id: 'address', title: 'Address', icon: MapPin, description: 'Where you\'re located' },
  { id: 'experience', title: 'Experience', icon: Briefcase, description: 'Your work background' },
  { id: 'languages', title: 'Languages & Availability', icon: Globe, description: 'Skills and schedule' },
];

// Months for DOB picker
const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => {
  const day = String(i + 1).padStart(2, '0');
  return { value: day, label: day };
});

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => {
  const year = String(currentYear - 18 - i);
  return { value: year, label: year };
});

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

const LANGUAGES_LIST = ['English', 'Spanish', 'French', 'Portuguese', 'German', 'Italian', 'Chinese', 'Japanese', 'Korean', 'Arabic'];
const EXPERIENCE_OPTIONS = ['Less than 1 year', '1-2 years', '3-5 years', '5+ years'];
const SHIFT_OPTIONS = ['Morning (6am-2pm)', 'Afternoon (2pm-10pm)', 'Evening (10pm-6am)', 'Flexible'];
const HOURS_OPTIONS = ['10-20 hours', '20-30 hours', '30-40 hours', '40+ hours'];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, agent, refreshProfile, isLoading } = useAuthContext();

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    // Personal
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    sex: '',
    dobMonth: '',
    dobDay: '',
    dobYear: '',
    // Address
    street: '',
    city: '',
    state: '',
    zipCode: '',
    // Experience
    yearsExperience: '',
    previousCompany: '',
    workDescription: '',
    // Languages & Availability
    languages: [] as string[],
    hoursPerWeek: '',
    preferredShift: '',
  });

  // Pre-fill form data from profile/agent
  useEffect(() => {
    if (profile) {
      const profileExt = profile as unknown as { middle_name?: string; sex?: string; date_of_birth?: string };
      const dob = profileExt.date_of_birth?.split('-') || [];

      setFormData(prev => ({
        ...prev,
        firstName: profile.first_name || '',
        middleName: profileExt.middle_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
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
        previousCompany: experience?.previousCompany || '',
        workDescription: experience?.workDescription || '',
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
      case 0: // Personal
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.sex || !formData.dobMonth || !formData.dobDay || !formData.dobYear) {
          setError('Please fill in all required fields');
          return false;
        }
        break;
      case 1: // Address
        if (!formData.street || !formData.city || !formData.state || !formData.zipCode) {
          setError('Please fill in all address fields');
          return false;
        }
        break;
      case 2: // Experience
        if (!formData.yearsExperience) {
          setError('Please select your experience level');
          return false;
        }
        break;
      case 3: // Languages
        if (formData.languages.length === 0 || !formData.hoursPerWeek || !formData.preferredShift) {
          setError('Please select at least one language and your availability');
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
      // Update profile
      const profileRes = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          middle_name: formData.middleName || 'N/A',
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          sex: formData.sex,
          date_of_birth: `${formData.dobYear}-${formData.dobMonth}-${formData.dobDay}`,
        }),
      });

      if (!profileRes.ok) {
        throw new Error('Failed to update profile');
      }

      // Update agent data
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
            experience: {
              yearsExperience: formData.yearsExperience,
              previousCompany: formData.previousCompany,
              workDescription: formData.workDescription,
            },
            languages: formData.languages,
            availability: {
              hoursPerWeek: formData.hoursPerWeek,
              preferredShift: formData.preferredShift,
            },
            onboarding_completed: true,
          },
          match: { id: agent.id },
        });
      }

      await refreshProfile();
      router.push('/dashboard');
    } catch (err) {
      console.error('Error saving onboarding:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-white">
              AP
            </div>
            <span className="text-xl font-bold text-white">AgentHub</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-zinc-400 hover:text-white">
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </header>

      {/* Progress Header */}
      <div className="bg-zinc-800/50 border-b border-zinc-700/50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
            <p className="text-zinc-400">We need some additional information to activate your account</p>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-zinc-400">Step {currentStep + 1} of {STEPS.length}</span>
              <span className="text-teal-400 font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-zinc-700" />
          </div>

          {/* Step Icons */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all
                    ${isCompleted ? 'bg-teal-500 text-white' : isCurrent ? 'bg-teal-500/20 text-teal-400 ring-2 ring-teal-500' : 'bg-zinc-700 text-zinc-400'}
                  `}>
                    {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-medium ${isCurrent ? 'text-teal-400' : 'text-zinc-500'}`}>
                    {step.title}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div className={`hidden md:block absolute w-full h-0.5 top-6 left-1/2 ${isCompleted ? 'bg-teal-500' : 'bg-zinc-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Card className="bg-white border-0 shadow-2xl">
          <CardContent className="p-8">
            {/* Step Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                {(() => {
                  const Icon = STEPS[currentStep].icon;
                  return <Icon className="h-7 w-7 text-white" />;
                })()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">{STEPS[currentStep].title}</h2>
                <p className="text-zinc-500">{STEPS[currentStep].description}</p>
              </div>
            </div>

            {/* Step 0: Personal Info */}
            {currentStep === 0 && (
              <div className="space-y-5">
                {/* Username (locked) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Username
                    <Lock className="h-3 w-3 text-zinc-400" />
                  </Label>
                  <Input value={profile?.username || ''} disabled className="bg-zinc-100" />
                  <p className="text-xs text-zinc-400">Username cannot be changed</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Middle Name</Label>
                    <Input
                      value={formData.middleName}
                      onChange={(e) => updateField('middleName', e.target.value)}
                      placeholder="N/A if none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sex *</Label>
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

                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Select value={formData.dobMonth} onValueChange={(v) => updateField('dobMonth', v)}>
                      <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={formData.dobDay} onValueChange={(v) => updateField('dobDay', v)}>
                      <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                      <SelectContent>
                        {DAYS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={formData.dobYear} onValueChange={(v) => updateField('dobYear', v)}>
                      <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                      <SelectContent>
                        {YEARS.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Address */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Street Address *</Label>
                  <Input
                    value={formData.street}
                    onChange={(e) => updateField('street', e.target.value)}
                    placeholder="123 Main St, Apt 4B"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select value={formData.state} onValueChange={(v) => updateField('state', v)}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>ZIP Code *</Label>
                  <Input
                    value={formData.zipCode}
                    onChange={(e) => updateField('zipCode', e.target.value)}
                    placeholder="10001"
                    className="max-w-[150px]"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Experience */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Call Center Experience *</Label>
                  <Select value={formData.yearsExperience} onValueChange={(v) => updateField('yearsExperience', v)}>
                    <SelectTrigger><SelectValue placeholder="Select experience level" /></SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_OPTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Previous Company (Optional)</Label>
                  <Input
                    value={formData.previousCompany}
                    onChange={(e) => updateField('previousCompany', e.target.value)}
                    placeholder="Company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Brief Description of Work (Optional)</Label>
                  <Textarea
                    value={formData.workDescription}
                    onChange={(e) => updateField('workDescription', e.target.value)}
                    placeholder="Describe your previous roles and responsibilities..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Languages & Availability */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Languages You Speak *</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES_LIST.map(lang => (
                      <Badge
                        key={lang}
                        variant={formData.languages.includes(lang) ? 'default' : 'outline'}
                        className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                          formData.languages.includes(lang)
                            ? 'bg-teal-500 hover:bg-teal-600'
                            : 'hover:border-teal-500 hover:text-teal-500'
                        }`}
                        onClick={() => toggleLanguage(lang)}
                      >
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hours Per Week *</Label>
                    <Select value={formData.hoursPerWeek} onValueChange={(v) => updateField('hoursPerWeek', v)}>
                      <SelectTrigger><SelectValue placeholder="Select hours" /></SelectTrigger>
                      <SelectContent>
                        {HOURS_OPTIONS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Shift *</Label>
                    <Select value={formData.preferredShift} onValueChange={(v) => updateField('preferredShift', v)}>
                      <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                      <SelectContent>
                        {SHIFT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={saving}
                className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 min-w-[140px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : currentStep === STEPS.length - 1 ? (
                  <>
                    Complete
                    <Sparkles className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
