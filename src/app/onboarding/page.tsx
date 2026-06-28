'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/AuthProvider';
import BrandMark from '@/components/BrandMark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Keyboard,
  Cpu,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  LifeBuoy,
} from 'lucide-react';
import { TypingTest, type TypingResult } from '@/components/onboarding/TypingTest';
import { SystemCheck } from '@/components/SystemCheck';
import type { SystemCheckResult } from '@/lib/systemCheck';

const STEPS = [
  { id: 'personal', title: 'Personal Info', icon: User, heading: "Let's start with the basics", subtitle: 'Your name, contact and date of birth.' },
  { id: 'address', title: 'Home Address', icon: MapPin, heading: 'Where do you live?', subtitle: 'We use this to match you with regional opportunities.' },
  { id: 'experience', title: 'Experience', icon: Briefcase, heading: 'Tell us about your experience', subtitle: "Don't worry if you're new, we provide training." },
  { id: 'availability', title: 'Availability', icon: Globe, heading: 'Languages & availability', subtitle: 'Let us know when and how you can work.' },
  { id: 'typing', title: 'Typing Test', icon: Keyboard, heading: 'Quick typing check', subtitle: 'We measure your words per minute and accuracy.' },
  { id: 'systemcheck', title: 'System Check', icon: Cpu, heading: 'Computer & connection check', subtitle: 'We verify your setup meets the minimum requirements.' },
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
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const LANGUAGES_LIST = ['English', 'Spanish', 'French', 'Portuguese', 'German', 'Italian', 'Chinese', 'Japanese'];
const EXPERIENCE_OPTIONS = ['No experience', 'Less than 1 year', '1-2 years', '3-5 years', '5+ years'];
const SHIFT_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Flexible'];
const HOURS_OPTIONS = ['10-20', '20-30', '30-40', '40+'];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, agent, refreshProfile } = useAuthContext();

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const existingTyping = (agent as unknown as { scores?: { typing?: number; typingAccuracy?: number } } | null)?.scores;
  const [typingResult, setTypingResult] = useState<TypingResult | null>(
    existingTyping?.typing
      ? { wpm: existingTyping.typing, accuracy: existingTyping.typingAccuracy ?? 100 }
      : null
  );

  const [systemCheckResult, setSystemCheckResult] = useState<SystemCheckResult | null>(
    (agent as unknown as { system_check?: SystemCheckResult } | null)?.system_check ?? null
  );

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

      const scores = (agent as unknown as { scores?: { typing?: number; typingAccuracy?: number } }).scores;
      if (scores?.typing) {
        setTypingResult(prev => prev ?? { wpm: scores.typing as number, accuracy: scores.typingAccuracy ?? 100 });
      }
      const sysCheck = (agent as unknown as { system_check?: SystemCheckResult }).system_check;
      if (sysCheck) {
        setSystemCheckResult(prev => prev ?? sysCheck);
      }
    }
  }, [profile, agent]);

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
      case 4:
        if (!typingResult) {
          setError('Please finish the typing test to continue');
          return false;
        }
        break;
      case 5:
        if (!systemCheckResult) {
          setError('Please run the system check to continue');
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
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

      const profileResult = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error(profileResult.error || 'Failed to update profile');
      }

      if (agent) {
        const { adminDb } = await import('@/lib/adminDb');

        const agentUpdateData: Record<string, unknown> = {
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

        if (typingResult) {
          const prevScores = (agent as unknown as { scores?: Record<string, number> }).scores || {};
          agentUpdateData.scores = {
            ...prevScores,
            typing: typingResult.wpm,
            typingAccuracy: typingResult.accuracy,
          };
        }

        if (systemCheckResult) {
          agentUpdateData.system_check = systemCheckResult;
          agentUpdateData.system_check_date = new Date().toISOString();
          agentUpdateData.equipment = {
            hasComputer: true,
            hasWebcam: systemCheckResult.mediaDevices.hasWebcam,
            hasMicrophone: systemCheckResult.mediaDevices.hasMicrophone,
            internetSpeed: systemCheckResult.internetSpeed.downloadMbps,
            cpuCores: systemCheckResult.hardware.cpuCores,
            ramGB: systemCheckResult.hardware.ramGB,
          };
        }

        const agentResult = await adminDb({
          action: 'update',
          table: 'agents',
          data: agentUpdateData,
          match: { id: agent.id },
        });

        if (agentResult.error) {
          throw new Error(agentResult.error);
        }
      }

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => router.replace('/dashboard'), 2000);
    } catch (err) {
      console.error('[Onboarding] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const applicantName = `${formData.firstName || profile?.first_name || ''} ${formData.lastName || profile?.last_name || ''}`.trim() || 'Your application';
  const current = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Profile complete</h1>
          <p className="text-zinc-500 mb-6">You can now apply to opportunities. Taking you to your dashboard...</p>
          <Link href="/dashboard">
            <Button className="btn-brand">Go to dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="h-1 gradient-brand" />

      {/* Header */}
      <header className="px-5 sm:px-8 py-3 border-b border-zinc-100 flex items-center justify-between">
        <BrandMark href="/dashboard" />
        <Link href="/dashboard" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
          Save &amp; exit
        </Link>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar — context + dynamic "You're working on" */}
        <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 border-r border-zinc-100 p-7">
          <p className="text-lg font-bold text-zinc-900 leading-snug">Complete your profile</p>

          <div className="mt-7">
            <p className="text-xs text-zinc-400">You&apos;re working on</p>
            <p className="text-base font-bold text-zinc-900 mt-0.5">{current.title}</p>
          </div>

          <nav className="mt-7 space-y-0.5">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon;
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <button
                  key={s.id}
                  onClick={() => i < currentStep && setCurrentStep(i)}
                  disabled={i > currentStep}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    active ? 'bg-[var(--brand-blue-soft)]' : done ? 'hover:bg-zinc-50' : ''
                  } ${i > currentStep ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    done ? 'bg-emerald-500 text-white' : active ? 'bg-[var(--brand-blue)] text-white' : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-3.5 w-3.5" />}
                  </span>
                  <span className={`text-sm ${active ? 'font-semibold text-[var(--brand-blue)]' : done ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-7">
            <p className="text-xs text-zinc-400 mb-1">Applicant</p>
            <p className="text-sm font-medium text-zinc-700">{applicantName}</p>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8">
              {/* Mobile progress */}
              <div className="lg:hidden mb-6">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                  <span className="font-medium text-zinc-900">{current.title}</span>
                  <span>Step {currentStep + 1} of {STEPS.length}</span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full gradient-brand rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="flex justify-end mb-4">
                <a href="mailto:support@wingcx.com" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-blue)] hover:underline">
                  <LifeBuoy className="h-4 w-4" />
                  Get Support
                </a>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight leading-tight">{current.heading}</h1>
              <p className="text-zinc-500 mt-2 mb-8">{current.subtitle}</p>

              {/* Step content */}
              {currentStep === 0 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>First name *</Label>
                      <Input className="h-11" value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last name *</Label>
                      <Input className="h-11" value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Phone *</Label>
                      <Input className="h-11" type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="(555) 123-4567" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Sex *</Label>
                      <Select value={formData.sex} onValueChange={(v) => updateField('sex', v)}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date of birth *</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Select value={formData.dobMonth} onValueChange={(v) => updateField('dobMonth', v)}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={formData.dobDay} onValueChange={(v) => updateField('dobDay', v)}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Day" /></SelectTrigger>
                        <SelectContent>{DAYS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={formData.dobYear} onValueChange={(v) => updateField('dobYear', v)}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Year" /></SelectTrigger>
                        <SelectContent>{YEARS.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label>Street address *</Label>
                    <Input className="h-11" value={formData.street} onChange={(e) => updateField('street', e.target.value)} placeholder="123 Main St" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>City *</Label>
                      <Input className="h-11" value={formData.city} onChange={(e) => updateField('city', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>State *</Label>
                      <Select value={formData.state} onValueChange={(v) => updateField('state', v)}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-w-[160px]">
                    <Label>ZIP code *</Label>
                    <Input className="h-11" value={formData.zipCode} onChange={(e) => updateField('zipCode', e.target.value)} placeholder="10001" />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-3">
                  <Label>Call center experience *</Label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {EXPERIENCE_OPTIONS.map(opt => {
                      const selected = formData.yearsExperience === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateField('yearsExperience', opt)}
                          className={`flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                            selected ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-soft)]' : 'border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full border-2 shrink-0 ${selected ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)]' : 'border-zinc-300'}`} />
                          <span className="text-sm text-zinc-800">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <Label>Languages you speak *</Label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES_LIST.map(lang => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                            formData.languages.includes(lang) ? 'bg-[var(--brand-blue)] text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Hours per week *</Label>
                      <Select value={formData.hoursPerWeek} onValueChange={(v) => updateField('hoursPerWeek', v)}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{HOURS_OPTIONS.map(h => <SelectItem key={h} value={h}>{h} hours</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Preferred shift *</Label>
                      <Select value={formData.preferredShift} onValueChange={(v) => updateField('preferredShift', v)}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{SHIFT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <TypingTest
                  seed={agent?.id || profile?.id || 'default'}
                  initialResult={typingResult}
                  onComplete={setTypingResult}
                />
              )}

              {currentStep === 5 && (
                <SystemCheck
                  agentId={agent?.id}
                  showSaveButton={false}
                  onComplete={setSystemCheckResult}
                />
              )}

              {error && (
                <div className="mt-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer nav */}
          <div className="border-t border-zinc-100 px-5 sm:px-8 py-4">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 0} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button onClick={handleNext} disabled={saving} className="btn-brand gap-2 min-w-[140px]">
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                ) : isLast ? (
                  <>Submit <CheckCircle2 className="h-4 w-4" /></>
                ) : (
                  <>Next <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
