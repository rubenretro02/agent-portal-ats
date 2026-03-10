'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { SystemCheck } from '@/components/SystemCheck';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  ChevronRight,
  User,
  MapPin,
  Cpu,
  Globe,
  Briefcase,
  Save,
  Loader2,
  Edit2,
  Phone,
  Calendar,
  CircleDot,
} from 'lucide-react';
import type { SystemCheckResult } from '@/lib/systemCheck';

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'MX', name: 'Mexico' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ES', name: 'Spain' },
  { code: 'PE', name: 'Peru' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'CL', name: 'Chile' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'DO', name: 'Dominican Republic' },
];

const LANGUAGES = ['English', 'Spanish', 'Portuguese', 'French', 'German', 'Italian'];

const SHIFTS = [
  { value: 'morning', label: 'Morning (6am - 2pm)' },
  { value: 'afternoon', label: 'Afternoon (2pm - 10pm)' },
  { value: 'evening', label: 'Evening (10pm - 6am)' },
  { value: 'flexible', label: 'Flexible' },
];

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

const EXPERIENCE_YEARS = [
  { value: '0', label: 'No experience' },
  { value: '0-1', label: 'Less than 1 year' },
  { value: '1-2', label: '1-2 years' },
  { value: '2-3', label: '2-3 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '5+', label: '5+ years' },
];

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'Washington D.C.' }, { code: 'PR', name: 'Puerto Rico' },
];

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 10);
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
};

const isValidPhoneNumber = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10;
};

const isValidZipCode = (value: string, country: string): boolean => {
  if (country !== 'US') return value.length > 0;
  return /^\d{5}(-\d{4})?$/.test(value);
};

const formatZipCode = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
};

interface StepStatus {
  personal: boolean;
  address: boolean;
  experience: boolean;
  languages: boolean;
  systemCheck: boolean;
}

const parseDOB = (dob: string) => {
  if (!dob) return { month: '', day: '', year: '' };
  const parts = dob.split('-');
  if (parts.length === 3) {
    return { year: parts[0], month: parts[1], day: parts[2] };
  }
  return { month: '', day: '', year: '' };
};

interface OnboardingChecklistProps {
  onComplete?: () => void;
}

export function OnboardingChecklist({ onComplete }: OnboardingChecklistProps) {
  const { profile, agent, refreshProfile } = useAuthContext();

  // Dialog states
  const [showPersonalDialog, setShowPersonalDialog] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [showExperienceDialog, setShowExperienceDialog] = useState(false);
  const [showLanguagesDialog, setShowLanguagesDialog] = useState(false);
  const [showSystemCheckDialog, setShowSystemCheckDialog] = useState(false);

  // Form states
  const [personalForm, setPersonalForm] = useState({
    firstName: '', middleName: '', lastName: '', sex: '',
    dobMonth: '', dobDay: '', dobYear: '', phone: '',
  });
  const [addressForm, setAddressForm] = useState({
    street: '', line2: '', city: '', state: '', zipCode: '', country: 'US',
  });
  const [experienceForm, setExperienceForm] = useState({
    yearsExperience: '', previousRole: '', previousCompany: '', skills: '', certifications: '',
  });
  const [languagesForm, setLanguagesForm] = useState({
    languages: ['English'] as string[], hoursPerWeek: '', preferredShift: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const [savingStep, setSavingStep] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load form data from profile/agent when opening dialogs
  const loadPersonalForm = useCallback(() => {
    if (profile && agent) {
      const profileExt = profile as unknown as { middle_name?: string; sex?: string; date_of_birth?: string };
      const dob = parseDOB(profileExt.date_of_birth || '');
      setPersonalForm({
        firstName: profile.first_name || '',
        middleName: profileExt.middle_name || '',
        lastName: profile.last_name || '',
        sex: profileExt.sex || '',
        dobMonth: dob.month,
        dobDay: dob.day,
        dobYear: dob.year,
        phone: profile.phone || '',
      });
    }
  }, [profile, agent]);

  const loadAddressForm = useCallback(() => {
    if (agent) {
      const address = agent.address as Record<string, string> | null;
      if (address) {
        setAddressForm({
          street: address.street || '', line2: address.line2 || '',
          city: address.city || '', state: address.state || '',
          zipCode: address.zipCode || '', country: address.country || 'US',
        });
      }
    }
  }, [agent]);

  const loadExperienceForm = useCallback(() => {
    if (agent) {
      const experience = agent.experience as Record<string, string> | null;
      if (experience) {
        setExperienceForm({
          yearsExperience: experience.yearsExperience || '',
          previousRole: experience.previousRole || '',
          previousCompany: experience.previousCompany || '',
          skills: experience.skills || '',
          certifications: experience.certifications || '',
        });
      }
    }
  }, [agent]);

  const loadLanguagesForm = useCallback(() => {
    if (agent) {
      const availability = agent.availability as Record<string, string> | null;
      const langs = agent.languages as string[] | null;
      setLanguagesForm({
        languages: langs || ['English'],
        hoursPerWeek: availability?.hoursPerWeek || '',
        preferredShift: availability?.preferredShift || '',
        timezone: (agent.timezone as string) || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  }, [agent]);

  // Step completion status
  const stepStatus = useMemo((): StepStatus => {
    if (!profile || !agent) {
      return { personal: false, address: false, experience: false, languages: false, systemCheck: false };
    }
    const address = agent.address as Record<string, string> | null;
    const experience = agent.experience as Record<string, string> | null;
    const availability = agent.availability as Record<string, string> | null;
    const langs = agent.languages as string[] | null;
    const systemCheck = agent.system_check as SystemCheckResult | null;
    const profileExt = profile as unknown as { sex?: string; date_of_birth?: string };
    return {
      personal: !!(profile.first_name && profile.last_name && profileExt.sex && profileExt.date_of_birth && profile.phone),
      address: !!(address?.street && address?.city && address?.state && address?.zipCode),
      experience: !!(experience?.yearsExperience),
      languages: !!(langs && langs.length > 0 && availability?.hoursPerWeek && availability?.preferredShift),
      systemCheck: !!systemCheck,
    };
  }, [profile, agent]);

  const completedCount = Object.values(stepStatus).filter(Boolean).length;
  const totalSteps = 5;
  const progressPercent = (completedCount / totalSteps) * 100;
  const isOnboardingComplete = completedCount === totalSteps;

  // Save functions
  const savePersonalInfo = useCallback(async () => {
    if (!personalForm.firstName || !personalForm.lastName || !personalForm.middleName || !personalForm.sex || !personalForm.dobMonth || !personalForm.dobDay || !personalForm.dobYear || !personalForm.phone || !profile?.id) {
      setErrors({ personal: 'All fields are required. Use "N/A" for Middle Name if none.' });
      return;
    }
    if (!isValidPhoneNumber(personalForm.phone)) {
      setErrors({ personal: 'Please enter a valid 10-digit US phone number.' });
      return;
    }
    const dateOfBirth = `${personalForm.dobYear}-${personalForm.dobMonth}-${personalForm.dobDay}`;
    setSavingStep('personal');
    setErrors({});
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: personalForm.firstName,
          middle_name: personalForm.middleName,
          last_name: personalForm.lastName,
          sex: personalForm.sex,
          date_of_birth: dateOfBirth,
          phone: personalForm.phone,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }
      await refreshProfile();
      setShowPersonalDialog(false);
    } catch (err) {
      console.error('Error saving personal info:', err);
      setErrors({ personal: 'Failed to save' });
    } finally {
      setSavingStep(null);
    }
  }, [personalForm, profile, refreshProfile]);

  const saveAddress = useCallback(async () => {
    const { street, city, state, zipCode, country } = addressForm;
    if (!street || !city || !state || !zipCode || !agent?.id) {
      setErrors({ address: 'All fields are required' });
      return;
    }
    if (!isValidZipCode(zipCode, country)) {
      setErrors({ address: 'Please enter a valid ZIP code' });
      return;
    }
    setSavingStep('address');
    setErrors({});
    try {
      const { adminDb } = await import('@/lib/adminDb');
      const { error } = await adminDb({
        action: 'update', table: 'agents',
        data: { address: addressForm },
        match: { id: agent.id },
      });
      if (error) throw new Error(error);
      await refreshProfile();
      setShowAddressDialog(false);
    } catch (err) {
      console.error('Error saving address:', err);
      setErrors({ address: 'Failed to save' });
    } finally {
      setSavingStep(null);
    }
  }, [addressForm, agent, refreshProfile]);

  const saveExperience = useCallback(async () => {
    const { yearsExperience } = experienceForm;
    if (!yearsExperience || !agent?.id) {
      setErrors({ experience: 'Years of experience is required' });
      return;
    }
    setSavingStep('experience');
    setErrors({});
    try {
      const { adminDb } = await import('@/lib/adminDb');
      const { error } = await adminDb({
        action: 'update', table: 'agents',
        data: { experience: experienceForm },
        match: { id: agent.id },
      });
      if (error) throw new Error(error);
      await refreshProfile();
      setShowExperienceDialog(false);
    } catch (err) {
      console.error('Error saving experience:', err);
      setErrors({ experience: 'Failed to save' });
    } finally {
      setSavingStep(null);
    }
  }, [experienceForm, agent, refreshProfile]);

  const saveLanguages = useCallback(async () => {
    const { languages, hoursPerWeek, preferredShift } = languagesForm;
    if (languages.length === 0 || !hoursPerWeek || !preferredShift || !agent?.id) {
      setErrors({ languages: 'All fields are required' });
      return;
    }
    setSavingStep('languages');
    setErrors({});
    try {
      const { adminDb } = await import('@/lib/adminDb');
      const { error } = await adminDb({
        action: 'update', table: 'agents',
        data: {
          languages: languagesForm.languages,
          availability: { hoursPerWeek: languagesForm.hoursPerWeek, preferredShift: languagesForm.preferredShift },
          timezone: languagesForm.timezone,
          pipeline_status: 'screening',
          pipeline_stage: 2,
        },
        match: { id: agent.id },
      });
      if (error) throw new Error(error);
      await refreshProfile();
      setShowLanguagesDialog(false);
    } catch (err) {
      console.error('Error saving languages:', err);
      setErrors({ languages: 'Failed to save' });
    } finally {
      setSavingStep(null);
    }
  }, [languagesForm, agent, refreshProfile]);

  const handleSystemCheckComplete = useCallback(async (result: SystemCheckResult) => {
    if (agent) {
      const { adminDb } = await import('@/lib/adminDb');
      await adminDb({
        action: 'update', table: 'agents',
        data: {
          system_check: result,
          system_check_date: new Date().toISOString(),
          equipment: {
            hasComputer: true,
            hasWebcam: result.mediaDevices.hasWebcam,
            hasMicrophone: result.mediaDevices.hasMicrophone,
            internetSpeed: result.internetSpeed.downloadMbps,
            cpuCores: result.hardware.cpuCores,
            ramGB: result.hardware.ramGB,
          },
        },
        match: { id: agent.id },
      });
      await refreshProfile();
      setShowSystemCheckDialog(false);
    }
  }, [agent, refreshProfile]);

  const toggleLanguage = (lang: string) => {
    setLanguagesForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  // Helper: get summary text for each step
  const getPersonalSummary = () => {
    if (!stepStatus.personal) return 'Enter your personal details';
    return `${profile?.first_name} ${profile?.last_name}`;
  };

  const getAddressSummary = () => {
    if (!stepStatus.address) return 'Add your home address';
    const address = agent?.address as Record<string, string> | null;
    if (address) return `${address.city}, ${address.state} ${address.zipCode}`;
    return 'Add your home address';
  };

  const getExperienceSummary = () => {
    if (!stepStatus.experience) return 'Tell us about your experience';
    const exp = agent?.experience as Record<string, string> | null;
    if (exp) {
      const label = EXPERIENCE_YEARS.find(e => e.value === exp.yearsExperience)?.label || exp.yearsExperience;
      return label;
    }
    return 'Tell us about your experience';
  };

  const getSystemCheckSummary = () => {
    if (!stepStatus.systemCheck) return 'Verify your computer specs';
    return 'System verified';
  };

  const getLanguagesSummary = () => {
    if (!stepStatus.languages) return 'Set your languages & availability';
    const langs = agent?.languages as string[] | null;
    if (langs) return langs.join(', ');
    return 'Set your languages & availability';
  };

  // Notify parent when all complete
  if (isOnboardingComplete && onComplete) {
    onComplete();
  }

  const steps = [
    {
      key: 'personal',
      icon: User,
      title: 'Personal Information',
      summary: getPersonalSummary(),
      complete: stepStatus.personal,
      onOpen: () => { loadPersonalForm(); setErrors({}); setShowPersonalDialog(true); },
    },
    {
      key: 'address',
      icon: MapPin,
      title: 'Home Address',
      summary: getAddressSummary(),
      complete: stepStatus.address,
      onOpen: () => { loadAddressForm(); setErrors({}); setShowAddressDialog(true); },
    },
    {
      key: 'systemCheck',
      icon: Cpu,
      title: 'Computer Check',
      summary: getSystemCheckSummary(),
      complete: stepStatus.systemCheck,
      onOpen: () => { setShowSystemCheckDialog(true); },
    },
    {
      key: 'experience',
      icon: Briefcase,
      title: 'Experience',
      summary: getExperienceSummary(),
      complete: stepStatus.experience,
      onOpen: () => { loadExperienceForm(); setErrors({}); setShowExperienceDialog(true); },
    },
    {
      key: 'languages',
      icon: Globe,
      title: 'Languages & Availability',
      summary: getLanguagesSummary(),
      complete: stepStatus.languages,
      onOpen: () => { loadLanguagesForm(); setErrors({}); setShowLanguagesDialog(true); },
    },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="border-zinc-200 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Complete Your Profile
                </h2>
                <p className="text-teal-100 text-sm mt-0.5">
                  Fill in the required information to access opportunities
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{completedCount}/{totalSteps}</p>
                  <p className="text-xs text-teal-200">Steps done</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-teal-200 mb-1.5">
                <span>Progress</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-2 bg-teal-800/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isComplete = step.complete;
            // Find the first incomplete step
            const firstIncompleteIndex = steps.findIndex(s => !s.complete);
            const isCurrent = index === firstIncompleteIndex;

            return (
              <Card
                key={step.key}
                className={`border transition-all duration-200 cursor-pointer group ${
                  isComplete
                    ? 'border-teal-200 bg-teal-50/50 hover:bg-teal-50'
                    : isCurrent
                    ? 'border-teal-300 bg-white shadow-sm hover:shadow-md ring-1 ring-teal-100'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50'
                }`}
                onClick={step.onOpen}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Step Number / Check */}
                    <div className={`relative flex items-center justify-center w-11 h-11 rounded-full shrink-0 transition-colors ${
                      isComplete
                        ? 'bg-teal-600 text-white'
                        : isCurrent
                        ? 'bg-teal-100 text-teal-700 ring-2 ring-teal-300'
                        : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isCurrent ? (
                        <Icon className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-sm ${
                          isComplete ? 'text-teal-800' : 'text-zinc-900'
                        }`}>
                          {step.title}
                        </p>
                        {isCurrent && !isComplete && (
                          <Badge className="bg-teal-100 text-teal-700 text-[10px] px-1.5 py-0 font-medium border-0">
                            Next
                          </Badge>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${
                        isComplete ? 'text-teal-600' : 'text-zinc-500'
                      }`}>
                        {step.summary}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isComplete ? (
                        <Badge className="bg-teal-100 text-teal-700 border-0 text-xs font-medium">
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-zinc-500 text-xs font-normal">
                          Pending
                        </Badge>
                      )}
                      <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${
                        isComplete ? 'text-teal-400' : 'text-zinc-300'
                      }`} />
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="ml-[2.05rem] h-0" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ============== DIALOGS ============== */}

      {/* Personal Information Dialog */}
      <Dialog open={showPersonalDialog} onOpenChange={setShowPersonalDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-teal-600" />
              Personal Information
            </DialogTitle>
            <DialogDescription>
              Enter your personal details to continue
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={personalForm.firstName}
                  onChange={e => setPersonalForm(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="First name"
                />
              </div>
              <div>
                <Label>Middle Name *</Label>
                <Input
                  value={personalForm.middleName}
                  onChange={e => setPersonalForm(prev => ({ ...prev, middleName: e.target.value }))}
                  placeholder={'Middle name or "N/A"'}
                />
              </div>
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={personalForm.lastName}
                onChange={e => setPersonalForm(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Last name"
              />
            </div>
            <div>
              <Label>Sex *</Label>
              <Select value={personalForm.sex} onValueChange={v => setPersonalForm(prev => ({ ...prev, sex: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Date of Birth *</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <Select value={personalForm.dobMonth} onValueChange={v => setPersonalForm(prev => ({ ...prev, dobMonth: v }))}>
                  <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={personalForm.dobDay} onValueChange={v => setPersonalForm(prev => ({ ...prev, dobDay: v }))}>
                  <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                  <SelectContent>{DAYS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={personalForm.dobYear} onValueChange={v => setPersonalForm(prev => ({ ...prev, dobYear: v }))}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>{YEARS.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone Number *</Label>
              <Input
                value={personalForm.phone}
                onChange={e => setPersonalForm(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                placeholder="(555) 123-4567"
              />
            </div>
            {errors.personal && <p className="text-sm text-red-600">{errors.personal}</p>}
            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={savePersonalInfo} disabled={savingStep === 'personal'}>
              {savingStep === 'personal' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Personal Information
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-teal-600" />
              Home Address
            </DialogTitle>
            <DialogDescription>
              Enter your residential address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Country</Label>
              <Select value={addressForm.country} onValueChange={v => setAddressForm(prev => ({ ...prev, country: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Street Address *</Label>
              <AddressAutocomplete
                value={addressForm.street}
                onChange={v => setAddressForm(prev => ({ ...prev, street: v }))}
                onAddressSelect={addr => setAddressForm(prev => ({
                  ...prev,
                  street: addr.street,
                  city: addr.city,
                  state: addr.state,
                  zipCode: addr.zipCode,
                  country: addr.country || prev.country,
                }))}
                placeholder="Start typing your address..."
                countryCode={addressForm.country.toLowerCase()}
              />
            </div>
            <div>
              <Label>Apt, Suite, etc. (optional)</Label>
              <Input
                value={addressForm.line2}
                onChange={e => setAddressForm(prev => ({ ...prev, line2: e.target.value }))}
                placeholder="Apartment, suite, unit..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City *</Label>
                <Input
                  value={addressForm.city}
                  onChange={e => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div>
                <Label>State *</Label>
                {addressForm.country === 'US' ? (
                  <Select value={addressForm.state} onValueChange={v => setAddressForm(prev => ({ ...prev, state: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>{US_STATES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={addressForm.state}
                    onChange={e => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State / Province"
                  />
                )}
              </div>
            </div>
            <div>
              <Label>ZIP / Postal Code *</Label>
              <Input
                value={addressForm.zipCode}
                onChange={e => setAddressForm(prev => ({ ...prev, zipCode: addressForm.country === 'US' ? formatZipCode(e.target.value) : e.target.value }))}
                placeholder={addressForm.country === 'US' ? '12345' : 'Postal code'}
              />
            </div>
            {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={saveAddress} disabled={savingStep === 'address'}>
              {savingStep === 'address' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Address
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* System Check Dialog */}
      <Dialog open={showSystemCheckDialog} onOpenChange={setShowSystemCheckDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-teal-600" />
              Computer Check
            </DialogTitle>
            <DialogDescription>
              {'We\'ll verify your system meets the requirements for remote work'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <SystemCheck
              agentId={agent?.id}
              onComplete={handleSystemCheckComplete}
              showSaveButton={false}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Experience Dialog */}
      <Dialog open={showExperienceDialog} onOpenChange={setShowExperienceDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-teal-600" />
              Experience
            </DialogTitle>
            <DialogDescription>
              Tell us about your work experience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Years of Call Center Experience *</Label>
              <Select value={experienceForm.yearsExperience} onValueChange={v => setExperienceForm(prev => ({ ...prev, yearsExperience: v }))}>
                <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                <SelectContent>{EXPERIENCE_YEARS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Previous Role (optional)</Label>
              <Input
                value={experienceForm.previousRole}
                onChange={e => setExperienceForm(prev => ({ ...prev, previousRole: e.target.value }))}
                placeholder="e.g. Customer Service Representative"
              />
            </div>
            <div>
              <Label>Previous Company (optional)</Label>
              <Input
                value={experienceForm.previousCompany}
                onChange={e => setExperienceForm(prev => ({ ...prev, previousCompany: e.target.value }))}
                placeholder="e.g. Company ABC"
              />
            </div>
            <div>
              <Label>Skills (optional)</Label>
              <Textarea
                value={experienceForm.skills}
                onChange={e => setExperienceForm(prev => ({ ...prev, skills: e.target.value }))}
                placeholder="List relevant skills..."
                rows={3}
              />
            </div>
            <div>
              <Label>Certifications (optional)</Label>
              <Input
                value={experienceForm.certifications}
                onChange={e => setExperienceForm(prev => ({ ...prev, certifications: e.target.value }))}
                placeholder="Any relevant certifications"
              />
            </div>
            {errors.experience && <p className="text-sm text-red-600">{errors.experience}</p>}
            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={saveExperience} disabled={savingStep === 'experience'}>
              {savingStep === 'experience' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Experience
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Languages & Availability Dialog */}
      <Dialog open={showLanguagesDialog} onOpenChange={setShowLanguagesDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-teal-600" />
              Languages & Availability
            </DialogTitle>
            <DialogDescription>
              Select your languages and preferred schedule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="mb-2 block">Languages *</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      languagesForm.languages.includes(lang)
                        ? 'bg-teal-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Hours per Week *</Label>
              <Select value={languagesForm.hoursPerWeek} onValueChange={v => setLanguagesForm(prev => ({ ...prev, hoursPerWeek: v }))}>
                <SelectTrigger><SelectValue placeholder="Select hours" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10-20">10-20 hours</SelectItem>
                  <SelectItem value="20-30">20-30 hours</SelectItem>
                  <SelectItem value="30-40">30-40 hours</SelectItem>
                  <SelectItem value="40+">40+ hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preferred Shift *</Label>
              <Select value={languagesForm.preferredShift} onValueChange={v => setLanguagesForm(prev => ({ ...prev, preferredShift: v }))}>
                <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                <SelectContent>{SHIFTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Timezone</Label>
              <Input value={languagesForm.timezone} disabled className="bg-zinc-50 text-zinc-500" />
            </div>
            {errors.languages && <p className="text-sm text-red-600">{errors.languages}</p>}
            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={saveLanguages} disabled={savingStep === 'languages'}>
              {savingStep === 'languages' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Languages & Availability
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
