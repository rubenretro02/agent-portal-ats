'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { SystemCheck } from '@/components/SystemCheck';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { useOpportunityStore } from '@/store/supabaseStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  User,
  MapPin,
  Cpu,
  Globe,
  Save,
  Loader2,
  Search,
  Filter,
  DollarSign,
  Clock,
  Users,
  ArrowRight,
  Briefcase,
  X,
  Edit2,
  Phone,
  Calendar,
} from 'lucide-react';
import type { SystemCheckResult } from '@/lib/systemCheck';

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'MX', name: 'México' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ES', name: 'España' },
  { code: 'PE', name: 'Perú' },
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

// Generate months, days, years for DOB picker
const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
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

// US States
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'Washington D.C.' },
  { code: 'PR', name: 'Puerto Rico' },
];

// Format phone number as user types
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  // Limit to 10 digits (US format)
  const limited = digits.slice(0, 10);

  // Format as (XXX) XXX-XXXX
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
};

// Validate phone number (must be 10 digits)
const isValidPhoneNumber = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10;
};

// Validate US ZIP code (5 digits or 5+4 format)
const isValidZipCode = (value: string, country: string): boolean => {
  if (country !== 'US') return value.length > 0;
  // US ZIP: 5 digits or 5+4 format (12345 or 12345-6789)
  return /^\d{5}(-\d{4})?$/.test(value);
};

// Format ZIP code
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

export default function DashboardPage() {
  const { profile, agent, isLoading, refreshProfile } = useAuthContext();
  const { opportunities, fetchOpportunities, appliedOpportunityIds, fetchAppliedOpportunities, applyToOpportunity } = useOpportunityStore();
  const supabase = getSupabaseClient();

  // Open step tracking
  const [openStep, setOpenStep] = useState<string | null>(null);

  // Popup states for each section
  const [showPersonalPopup, setShowPersonalPopup] = useState(false);
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [showExperiencePopup, setShowExperiencePopup] = useState(false);
  const [showLanguagesPopup, setShowLanguagesPopup] = useState(false);

  // Form states for each step
  const [personalForm, setPersonalForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    sex: '',
    dobMonth: '',
    dobDay: '',
    dobYear: '',
    phone: '',
  });

  const [addressForm, setAddressForm] = useState({
    street: '', line2: '', city: '', state: '', zipCode: '', country: 'US'
  });

  const [experienceForm, setExperienceForm] = useState({
    yearsExperience: '',
    previousRole: '',
    previousCompany: '',
    skills: '',
    certifications: '',
  });

  const [languagesForm, setLanguagesForm] = useState({
    languages: ['English'] as string[],
    hoursPerWeek: '',
    preferredShift: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  // Saving states
  const [savingStep, setSavingStep] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Opportunities states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  // Parse DOB into month, day, year
  const parseDOB = (dob: string) => {
    if (!dob) return { month: '', day: '', year: '' };
    const parts = dob.split('-');
    if (parts.length === 3) {
      return { year: parts[0], month: parts[1], day: parts[2] };
    }
    return { month: '', day: '', year: '' };
  };

  // Load existing data
  useEffect(() => {
    if (profile && agent) {
      const profileExt = profile as unknown as { middle_name?: string; sex?: string; date_of_birth?: string; username?: string };
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

      // Show popup ONLY if personal info is not complete (first time user)
      const isComplete = !!(profile.first_name && profile.last_name && profileExt.sex && profileExt.date_of_birth && profile.phone);
      if (!isComplete) {
        setShowPersonalPopup(true);
      }

      const address = agent.address as Record<string, string> | null;
      if (address) {
        setAddressForm({
          street: address.street || '',
          line2: address.line2 || '',
          city: address.city || '',
          state: address.state || '',
          zipCode: address.zipCode || '',
          country: address.country || 'US'
        });
      }

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

      const availability = agent.availability as Record<string, string> | null;
      const langs = agent.languages as string[] | null;
      setLanguagesForm({
        languages: langs || ['English'],
        hoursPerWeek: availability?.hoursPerWeek || '',
        preferredShift: availability?.preferredShift || '',
        timezone: (agent.timezone as string) || Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
  }, [profile, agent]);

  // Fetch opportunities when onboarding is complete
  useEffect(() => {
    fetchOpportunities();
    fetchAppliedOpportunities();
  }, [fetchOpportunities, fetchAppliedOpportunities]);

  // Calculate step completion status
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
  const isOnboardingComplete = completedCount === totalSteps;
  const progressPercent = (completedCount / totalSteps) * 100;

  // Check if personal info is complete
  const isPersonalInfoComplete = stepStatus.personal;

  // Save Personal Info
  const savePersonalInfo = useCallback(async () => {
    if (!personalForm.firstName || !personalForm.lastName || !personalForm.middleName || !personalForm.sex || !personalForm.dobMonth || !personalForm.dobDay || !personalForm.dobYear || !personalForm.phone || !profile?.id) {
      setErrors({ personal: 'All fields are required including phone number. Use "N/A" for Middle Name if none.' });
      return;
    }

    // Validate phone number
    if (!isValidPhoneNumber(personalForm.phone)) {
      setErrors({ personal: 'Please enter a valid 10-digit US phone number.' });
      return;
    }

    // Construct date in YYYY-MM-DD format for database
    const dateOfBirth = `${personalForm.dobYear}-${personalForm.dobMonth}-${personalForm.dobDay}`;

    setSavingStep('personal');
    setErrors({});

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: personalForm.firstName,
          middle_name: personalForm.middleName,
          last_name: personalForm.lastName,
          sex: personalForm.sex,
          date_of_birth: dateOfBirth,
          phone: personalForm.phone,
        } as never)
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      setShowPersonalPopup(false);
    } catch (err) {
      console.error('Error saving personal info:', err);
      setErrors({ personal: 'Failed to save' });
    } finally {
      setSavingStep(null);
    }
  }, [personalForm, profile, supabase, refreshProfile]);

  // Save Address
  const saveAddress = useCallback(async () => {
    const { street, city, state, zipCode, country } = addressForm;
    if (!street || !city || !state || !zipCode || !agent?.id) {
      setErrors({ address: 'All fields are required' });
      return;
    }

    // Validate ZIP code for US
    if (!isValidZipCode(zipCode, country)) {
      setErrors({ address: 'Please enter a valid ZIP code (12345 or 12345-6789)' });
      return;
    }

    setSavingStep('address');
    setErrors({});

    try {
      const { error } = await supabase
        .from('agents')
        .update({ address: addressForm })
        .eq('id', agent.id);

      if (error) throw error;

      await refreshProfile();
      setShowAddressPopup(false);
    } catch (err) {
      console.error('Error saving address:', err);
      setErrors({ address: 'Failed to save' });
    } finally {
      setSavingStep(null);
    }
  }, [addressForm, agent, supabase, refreshProfile]);

  // Save Experience
  const saveExperience = useCallback(async () => {
    const { yearsExperience } = experienceForm;
    if (!yearsExperience || !agent?.id) {
      setErrors({ experience: 'Years of experience is required' });
      return;
    }

    setSavingStep('experience');
    setErrors({});

    try {
      const { error } = await supabase
        .from('agents')
        .update({ experience: experienceForm })
        .eq('id', agent.id);

      if (error) throw error;

      await refreshProfile();
      setShowExperiencePopup(false);
    } catch (err) {
      console.error('Error saving experience:', err);
      setErrors({ experience: 'Failed to save' });
    } finally {
      setSavingStep(null);
    }
  }, [experienceForm, agent, supabase, refreshProfile]);

  // Save Languages & Availability
  const saveLanguages = useCallback(async () => {
    const { languages, hoursPerWeek, preferredShift } = languagesForm;
    if (languages.length === 0 || !hoursPerWeek || !preferredShift || !agent?.id) {
      setErrors({ languages: 'All fields are required' });
      return;
    }

    setSavingStep('languages');
    setErrors({});

    try {
      const { error } = await supabase
        .from('agents')
        .update({
          languages: languagesForm.languages,
          availability: {
            hoursPerWeek: languagesForm.hoursPerWeek,
            preferredShift: languagesForm.preferredShift
          },
          timezone: languagesForm.timezone,
          pipeline_status: 'screening',
          pipeline_stage: 2,
        })
        .eq('id', agent.id);

      if (error) throw error;

      await refreshProfile();
      setShowLanguagesPopup(false);
    } catch (err) {
      console.error('Error saving languages:', err);
      setErrors({ languages: 'Failed to save' });
    } finally {
      setSavingStep(null);
    }
  }, [languagesForm, agent, supabase, refreshProfile]);

  // Handle system check complete
  const handleSystemCheckComplete = useCallback(async (result: SystemCheckResult) => {
    if (agent) {
      await supabase
        .from('agents')
        .update({
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
        } as never)
        .eq('id', agent.id);

      await refreshProfile();
      setOpenStep(null);
    }
  }, [agent, supabase, refreshProfile]);

  const toggleLanguage = (lang: string) => {
    setLanguagesForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  // Filter opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(o => {
      const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.client.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || o.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [opportunities, searchQuery, categoryFilter]);

  // Handle apply
  const handleApply = async (opportunityId: string) => {
    setApplying(true);
    await applyToOpportunity(opportunityId, []);
    setApplying(false);
    setSelectedOpportunity(null);
  };

  const selectedOpp = opportunities.find(o => o.id === selectedOpportunity);

  // Handle edit button clicks
  const handleEditPersonalInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPersonalPopup(true);
  };

  const handleEditAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddressPopup(true);
  };

  const handleEditExperience = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowExperiencePopup(true);
  };

  const handleEditLanguages = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLanguagesPopup(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Format DOB for display
  const formatDOBDisplay = () => {
    const profileExt = profile as unknown as { date_of_birth?: string };
    if (!profileExt.date_of_birth) return 'Not set';
    const dob = parseDOB(profileExt.date_of_birth);
    if (dob.month && dob.day && dob.year) {
      return `${dob.month}/${dob.day}/${dob.year}`;
    }
    return 'Not set';
  };

  // Get sex display
  const getSexDisplay = () => {
    const profileExt = profile as unknown as { sex?: string };
    if (!profileExt.sex) return 'Not set';
    return profileExt.sex.charAt(0).toUpperCase() + profileExt.sex.slice(1);
  };

  // Get shift label
  const getShiftLabel = (value: string) => {
    const shift = SHIFTS.find(s => s.value === value);
    return shift?.label || value;
  };

  // Get experience label
  const getExperienceLabel = (value: string) => {
    const exp = EXPERIENCE_YEARS.find(e => e.value === value);
    return exp?.label || value;
  };

  return (
    <PortalLayout title={isOnboardingComplete ? "Available Opportunities" : "Complete Your Profile"}>
      <div className="space-y-6">
        {/* Onboarding Alert - Only show if not complete */}
        {!isOnboardingComplete && (
          <>
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-amber-900">Complete your profile</p>
                      <p className="text-sm text-amber-700">We need additional information to activate your account</p>
                    </div>
                  </div>
                  <Badge className="bg-amber-200 text-amber-800">
                    {completedCount}/{totalSteps} Complete
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Onboarding Steps */}
            <Card className="border-zinc-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Profile Setup</CardTitle>
                  <span className="text-sm text-zinc-500">{completedCount} of {totalSteps} completed</span>
                </div>
                <Progress value={progressPercent} className="h-2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {/* Step 1: Personal Info */}
                <Collapsible open={openStep === 'personal'} onOpenChange={(open) => {
                  if (!isPersonalInfoComplete && open) {
                    setShowPersonalPopup(true);
                  } else {
                    setOpenStep(open ? 'personal' : null);
                  }
                }}>
                  <CollapsibleTrigger asChild>
                    <div className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                      stepStatus.personal ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-zinc-50 hover:bg-zinc-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          stepStatus.personal ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'
                        }`}>
                          {stepStatus.personal ? <CheckCircle2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className={`font-medium ${stepStatus.personal ? 'text-emerald-700' : 'text-zinc-900'}`}>Personal Information</p>
                          <p className="text-sm text-zinc-500">{stepStatus.personal ? `${profile?.first_name} ${profile?.last_name}` : 'Enter your personal details'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {stepStatus.personal ? <Badge className="bg-emerald-100 text-emerald-700">Complete</Badge> : <Badge variant="secondary">Pending</Badge>}
                        {openStep === 'personal' ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 border-t border-zinc-100 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-zinc-500">Full Name</p>
                          <p className="font-medium text-zinc-900">
                            {profile?.first_name} {(profile as unknown as { middle_name?: string })?.middle_name !== 'N/A' ? (profile as unknown as { middle_name?: string })?.middle_name : ''} {profile?.last_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Sex</p>
                          <p className="font-medium text-zinc-900">{getSexDisplay()}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Date of Birth</p>
                          <p className="font-medium text-zinc-900">{formatDOBDisplay()}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Phone</p>
                          <p className="font-medium text-zinc-900">{profile?.phone || 'Not set'}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleEditPersonalInfo}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Personal Information
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Step 2: Address */}
                <Collapsible open={openStep === 'address'} onOpenChange={(open) => {
                  if (!stepStatus.address && open) {
                    setShowAddressPopup(true);
                  } else {
                    setOpenStep(open ? 'address' : null);
                  }
                }}>
                  <CollapsibleTrigger asChild>
                    <div className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                      stepStatus.address ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-zinc-50 hover:bg-zinc-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          stepStatus.address ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'
                        }`}>
                          {stepStatus.address ? <CheckCircle2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className={`font-medium ${stepStatus.address ? 'text-emerald-700' : 'text-zinc-900'}`}>Address</p>
                          <p className="text-sm text-zinc-500">{stepStatus.address ? `${(agent?.address as Record<string, string>)?.city}, ${(agent?.address as Record<string, string>)?.state}` : 'Add your location'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {stepStatus.address ? <Badge className="bg-emerald-100 text-emerald-700">Complete</Badge> : <Badge variant="secondary">Pending</Badge>}
                        {openStep === 'address' ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 border-t border-zinc-100 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-zinc-500">Street</p>
                          <p className="font-medium text-zinc-900">{(agent?.address as Record<string, string>)?.street || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Apt/Suite</p>
                          <p className="font-medium text-zinc-900">{(agent?.address as Record<string, string>)?.line2 || '-'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">City</p>
                          <p className="font-medium text-zinc-900">{(agent?.address as Record<string, string>)?.city || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">State</p>
                          <p className="font-medium text-zinc-900">{(agent?.address as Record<string, string>)?.state || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">ZIP / Country</p>
                          <p className="font-medium text-zinc-900">{(agent?.address as Record<string, string>)?.zipCode || 'Not set'}, {(agent?.address as Record<string, string>)?.country || 'US'}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleEditAddress}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Address
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Step 3: Experience */}
                <Collapsible open={openStep === 'experience'} onOpenChange={(open) => {
                  if (!stepStatus.experience && open) {
                    setShowExperiencePopup(true);
                  } else {
                    setOpenStep(open ? 'experience' : null);
                  }
                }}>
                  <CollapsibleTrigger asChild>
                    <div className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                      stepStatus.experience ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-zinc-50 hover:bg-zinc-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          stepStatus.experience ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'
                        }`}>
                          {stepStatus.experience ? <CheckCircle2 className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className={`font-medium ${stepStatus.experience ? 'text-emerald-700' : 'text-zinc-900'}`}>Work Experience</p>
                          <p className="text-sm text-zinc-500">{stepStatus.experience ? `${getExperienceLabel((agent?.experience as Record<string, string>)?.yearsExperience || '')}` : 'Add your work history'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {stepStatus.experience ? <Badge className="bg-emerald-100 text-emerald-700">Complete</Badge> : <Badge variant="secondary">Pending</Badge>}
                        {openStep === 'experience' ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 border-t border-zinc-100 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-zinc-500">Years of Experience</p>
                          <p className="font-medium text-zinc-900">{getExperienceLabel((agent?.experience as Record<string, string>)?.yearsExperience || '') || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Previous Role</p>
                          <p className="font-medium text-zinc-900">{(agent?.experience as Record<string, string>)?.previousRole || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Previous Company</p>
                          <p className="font-medium text-zinc-900">{(agent?.experience as Record<string, string>)?.previousCompany || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Skills</p>
                          <p className="font-medium text-zinc-900 truncate">{(agent?.experience as Record<string, string>)?.skills || 'Not set'}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleEditExperience}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Experience
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Step 4: Languages & Availability */}
                <Collapsible open={openStep === 'languages'} onOpenChange={(open) => {
                  if (!stepStatus.languages && open) {
                    setShowLanguagesPopup(true);
                  } else {
                    setOpenStep(open ? 'languages' : null);
                  }
                }}>
                  <CollapsibleTrigger asChild>
                    <div className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                      stepStatus.languages ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-zinc-50 hover:bg-zinc-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          stepStatus.languages ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'
                        }`}>
                          {stepStatus.languages ? <CheckCircle2 className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className={`font-medium ${stepStatus.languages ? 'text-emerald-700' : 'text-zinc-900'}`}>Languages & Availability</p>
                          <p className="text-sm text-zinc-500">{stepStatus.languages ? `${(agent?.languages as string[])?.join(', ')}` : 'Set your work preferences'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {stepStatus.languages ? <Badge className="bg-emerald-100 text-emerald-700">Complete</Badge> : <Badge variant="secondary">Pending</Badge>}
                        {openStep === 'languages' ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 border-t border-zinc-100 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-zinc-500">Languages</p>
                          <p className="font-medium text-zinc-900">{(agent?.languages as string[])?.join(', ') || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Hours per Week</p>
                          <p className="font-medium text-zinc-900">{(agent?.availability as Record<string, string>)?.hoursPerWeek || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Preferred Shift</p>
                          <p className="font-medium text-zinc-900">{getShiftLabel((agent?.availability as Record<string, string>)?.preferredShift || '') || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Timezone</p>
                          <p className="font-medium text-zinc-900">{(agent?.timezone as string) || 'Not set'}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleEditLanguages}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Languages & Availability
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Step 5: System Check (Last) */}
                <Collapsible open={openStep === 'systemCheck'} onOpenChange={(open) => setOpenStep(open ? 'systemCheck' : null)}>
                  <CollapsibleTrigger asChild>
                    <div className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                      stepStatus.systemCheck ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-zinc-50 hover:bg-zinc-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          stepStatus.systemCheck ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'
                        }`}>
                          {stepStatus.systemCheck ? <CheckCircle2 className="h-5 w-5" /> : <Cpu className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className={`font-medium ${stepStatus.systemCheck ? 'text-emerald-700' : 'text-zinc-900'}`}>System Check</p>
                          <p className="text-sm text-zinc-500">{stepStatus.systemCheck ? 'Hardware verified' : 'Verify your equipment'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {stepStatus.systemCheck ? <Badge className="bg-emerald-100 text-emerald-700">Complete</Badge> : <Badge variant="secondary">Pending</Badge>}
                        {openStep === 'systemCheck' ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 border-t border-zinc-100">
                      <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                        <p className="text-sm text-cyan-800">This automated test detects your hardware specs and equipment. Results cannot be modified manually.</p>
                      </div>
                      <SystemCheck agentId={agent?.id} onComplete={handleSystemCheckComplete} showSaveButton={false} compact={stepStatus.systemCheck} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </>
        )}

        {/* Opportunities Section - Show after onboarding is complete */}
        {isOnboardingComplete && (
          <>
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="customer_service">Customer Service</SelectItem>
                  <SelectItem value="technical_support">Technical Support</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Opportunities Grid */}
            {filteredOpportunities.length === 0 ? (
              <Card className="border-zinc-200">
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                  <p className="text-zinc-500">No opportunities found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOpportunities.map((opportunity) => {
                  const isApplied = appliedOpportunityIds.includes(opportunity.id);
                  const compensation = opportunity.compensation as Record<string, unknown> | null;
                  const training = opportunity.training as Record<string, unknown> | null;

                  return (
                    <Card key={opportunity.id} className="border-zinc-200 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-100 transition-all duration-300 ease-out transform hover:scale-[1.03] cursor-pointer group">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-zinc-900 truncate group-hover:text-teal-700 transition-colors duration-300">{opportunity.name}</h3>
                            <p className="text-sm text-zinc-500">{opportunity.client}</p>
                          </div>
                          {isApplied ? (
                            <Badge variant="secondary">Applied</Badge>
                          ) : (
                            <Badge className="bg-teal-500 group-hover:bg-teal-600 transition-colors duration-300">Open</Badge>
                          )}
                        </div>

                        <p className="text-sm text-zinc-600 line-clamp-2 mb-4">
                          {opportunity.description || 'No description'}
                        </p>

                        {opportunity.tags && opportunity.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {opportunity.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full">{tag}</span>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 text-center mb-4">
                          <div className="bg-zinc-50 rounded-lg p-2 group-hover:bg-emerald-50 transition-colors duration-300">
                            <DollarSign className="h-4 w-4 text-emerald-500 mx-auto mb-1 group-hover:scale-110 transition-transform duration-300" />
                            <p className="text-sm font-medium">${String(compensation?.baseRate || 0)}</p>
                            <p className="text-xs text-zinc-500">/hour</p>
                          </div>
                          <div className="bg-zinc-50 rounded-lg p-2 group-hover:bg-cyan-50 transition-colors duration-300">
                            <Users className="h-4 w-4 text-cyan-500 mx-auto mb-1 group-hover:scale-110 transition-transform duration-300" />
                            <p className="text-sm font-medium">{opportunity.capacity?.openPositions || 0}</p>
                            <p className="text-xs text-zinc-500">open</p>
                          </div>
                          <div className="bg-zinc-50 rounded-lg p-2 group-hover:bg-amber-50 transition-colors duration-300">
                            <Clock className="h-4 w-4 text-amber-500 mx-auto mb-1 group-hover:scale-110 transition-transform duration-300" />
                            <p className="text-sm font-medium">{String(training?.duration || 0)}h</p>
                            <p className="text-xs text-zinc-500">training</p>
                          </div>
                        </div>

                        {isApplied ? (
                          <div className="flex items-center justify-center gap-2 py-2 text-zinc-500">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">Applied</span>
                          </div>
                        ) : (
                          <Button
                            className="w-full bg-teal-500 hover:bg-teal-600 group-hover:shadow-md transition-all duration-300"
                            onClick={() => setSelectedOpportunity(opportunity.id)}
                          >
                            Apply Now <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Personal Info Popup Dialog */}
        <Dialog open={showPersonalPopup} onOpenChange={(open) => {
          if (!open && isPersonalInfoComplete) {
            setShowPersonalPopup(false);
          } else if (!open && !isPersonalInfoComplete) {
            setShowPersonalPopup(false);
          } else {
            setShowPersonalPopup(open);
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {isPersonalInfoComplete ? 'Edit Personal Information' : 'Complete Your Profile'}
              </DialogTitle>
              <DialogDescription>
                {isPersonalInfoComplete
                  ? 'Update your personal information below.'
                  : 'Please fill in your personal information to continue. All fields are required.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={personalForm.firstName}
                    onChange={(e) => setPersonalForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name *</Label>
                  <Input
                    value={personalForm.middleName}
                    onChange={(e) => setPersonalForm(prev => ({ ...prev, middleName: e.target.value }))}
                    placeholder="N/A if none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={personalForm.lastName}
                    disabled={!!(profile as unknown as { last_name?: string })?.last_name}
                    className={(profile as unknown as { last_name?: string })?.last_name ? 'bg-zinc-50' : ''}
                    onChange={(e) => setPersonalForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sex *</Label>
                <Select
                  value={personalForm.sex}
                  onValueChange={(v) => setPersonalForm(prev => ({ ...prev, sex: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date of Birth * (MM/DD/YYYY)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={personalForm.dobMonth}
                    onValueChange={(v) => setPersonalForm(prev => ({ ...prev, dobMonth: v }))}
                    disabled={!!(profile as unknown as { date_of_birth?: string })?.date_of_birth}
                  >
                    <SelectTrigger className={(profile as unknown as { date_of_birth?: string })?.date_of_birth ? 'bg-zinc-50' : ''}>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select
                    value={personalForm.dobDay}
                    onValueChange={(v) => setPersonalForm(prev => ({ ...prev, dobDay: v }))}
                    disabled={!!(profile as unknown as { date_of_birth?: string })?.date_of_birth}
                  >
                    <SelectTrigger className={(profile as unknown as { date_of_birth?: string })?.date_of_birth ? 'bg-zinc-50' : ''}>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select
                    value={personalForm.dobYear}
                    onValueChange={(v) => setPersonalForm(prev => ({ ...prev, dobYear: v }))}
                    disabled={!!(profile as unknown as { date_of_birth?: string })?.date_of_birth}
                  >
                    <SelectTrigger className={(profile as unknown as { date_of_birth?: string })?.date_of_birth ? 'bg-zinc-50' : ''}>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {(profile as unknown as { date_of_birth?: string })?.date_of_birth && (
                  <p className="text-xs text-zinc-500">Date of birth cannot be changed after saving.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Phone Number * (US Format)</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                  className={personalForm.phone && !isValidPhoneNumber(personalForm.phone) ? 'border-red-300' : ''}
                />
                {personalForm.phone && !isValidPhoneNumber(personalForm.phone) && (
                  <p className="text-xs text-red-500">Please enter a valid 10-digit US phone number</p>
                )}
              </div>
              {errors.personal && <p className="text-sm text-red-500">{errors.personal}</p>}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPersonalPopup(false)}
                  className="flex-1"
                >
                  {isPersonalInfoComplete ? 'Cancel' : 'Later'}
                </Button>
                <Button
                  onClick={savePersonalInfo}
                  disabled={savingStep === 'personal'}
                  className="flex-1 bg-teal-500 hover:bg-teal-600"
                >
                  {savingStep === 'personal' ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Save</>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Address Popup Dialog */}
        <Dialog open={showAddressPopup} onOpenChange={setShowAddressPopup}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {stepStatus.address ? 'Edit Address' : 'Add Your Address'}
              </DialogTitle>
              <DialogDescription>
                Enter your current residential address.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select value={addressForm.country} onValueChange={(v) => setAddressForm(prev => ({ ...prev, country: v, state: '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Street Address *</Label>
                <AddressAutocomplete
                    value={addressForm.street}
                    onChange={(value) => setAddressForm(prev => ({ ...prev, street: value }))}
                    onAddressSelect={(addr) => {
                      setAddressForm(prev => ({
                        ...prev,
                        street: addr.street,
                        line2: addr.line2 || prev.line2,
                        city: addr.city,
                        state: addr.state,
                        zipCode: addr.zipCode,
                        country: addr.country,
                      }));
                    }}
                    placeholder="Start typing your address..."
                    countryCode={addressForm.country.toLowerCase()}
                  />
              </div>
              <div className="space-y-2">
                <Label>Apt, Suite, Unit, etc. (Optional)</Label>
                <Input placeholder="Apt 4B, Suite 100, Unit 5" value={addressForm.line2} onChange={(e) => setAddressForm(prev => ({ ...prev, line2: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input placeholder="Miami" value={addressForm.city} onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{addressForm.country === 'US' ? 'State *' : 'State/Province *'}</Label>
                  {addressForm.country === 'US' ? (
                    <Select value={addressForm.state} onValueChange={(v) => setAddressForm(prev => ({ ...prev, state: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input placeholder="State/Province" value={addressForm.state} onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))} />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{addressForm.country === 'US' ? 'ZIP Code *' : 'Postal Code *'}</Label>
                <Input
                  placeholder={addressForm.country === 'US' ? '33101 or 33101-1234' : 'Postal code'}
                  value={addressForm.zipCode}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, zipCode: addressForm.country === 'US' ? formatZipCode(e.target.value) : e.target.value }))}
                  className={addressForm.zipCode && !isValidZipCode(addressForm.zipCode, addressForm.country) ? 'border-red-300' : ''}
                />
                {addressForm.country === 'US' && addressForm.zipCode && !isValidZipCode(addressForm.zipCode, addressForm.country) && (
                  <p className="text-xs text-red-500">Enter a valid US ZIP code (12345 or 12345-6789)</p>
                )}
              </div>
              {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowAddressPopup(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={saveAddress} disabled={savingStep === 'address'} className="flex-1 bg-teal-500 hover:bg-teal-600">
                  {savingStep === 'address' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save</>}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Experience Popup Dialog */}
        <Dialog open={showExperiencePopup} onOpenChange={setShowExperiencePopup}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {stepStatus.experience ? 'Edit Work Experience' : 'Add Work Experience'}
              </DialogTitle>
              <DialogDescription>
                Tell us about your professional background and skills.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Years of Call Center / Customer Service Experience *</Label>
                <Select value={experienceForm.yearsExperience} onValueChange={(v) => setExperienceForm(prev => ({ ...prev, yearsExperience: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select experience level" /></SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_YEARS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Previous Role</Label>
                  <Input placeholder="Customer Service Rep" value={experienceForm.previousRole} onChange={(e) => setExperienceForm(prev => ({ ...prev, previousRole: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Previous Company</Label>
                  <Input placeholder="Company Name" value={experienceForm.previousCompany} onChange={(e) => setExperienceForm(prev => ({ ...prev, previousCompany: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Key Skills</Label>
                <Textarea
                  placeholder="e.g., Customer service, CRM software, Problem solving, Bilingual..."
                  value={experienceForm.skills}
                  onChange={(e) => setExperienceForm(prev => ({ ...prev, skills: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Certifications (Optional)</Label>
                <Input placeholder="e.g., Six Sigma, COPC, etc." value={experienceForm.certifications} onChange={(e) => setExperienceForm(prev => ({ ...prev, certifications: e.target.value }))} />
              </div>
              {errors.experience && <p className="text-sm text-red-500">{errors.experience}</p>}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowExperiencePopup(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={saveExperience} disabled={savingStep === 'experience'} className="flex-1 bg-teal-500 hover:bg-teal-600">
                  {savingStep === 'experience' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save</>}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Languages & Availability Popup Dialog */}
        <Dialog open={showLanguagesPopup} onOpenChange={setShowLanguagesPopup}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {stepStatus.languages ? 'Edit Languages & Availability' : 'Languages & Availability'}
              </DialogTitle>
              <DialogDescription>
                Set your language skills and work availability preferences.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Languages You Speak *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map(lang => (
                    <div key={lang} onClick={() => toggleLanguage(lang)} className={`p-2 rounded-lg border cursor-pointer text-center text-sm transition-all ${languagesForm.languages.includes(lang) ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-zinc-200 hover:border-zinc-300'}`}>
                      {lang}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hours per Week *</Label>
                  <Select value={languagesForm.hoursPerWeek} onValueChange={(v) => setLanguagesForm(prev => ({ ...prev, hoursPerWeek: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10-20">10-20 hours</SelectItem>
                      <SelectItem value="20-30">20-30 hours</SelectItem>
                      <SelectItem value="30-40">30-40 hours</SelectItem>
                      <SelectItem value="40+">40+ hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preferred Shift *</Label>
                  <Select value={languagesForm.preferredShift} onValueChange={(v) => setLanguagesForm(prev => ({ ...prev, preferredShift: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {SHIFTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input value={languagesForm.timezone} disabled className="bg-zinc-50" />
                <p className="text-xs text-zinc-500">Automatically detected from your browser.</p>
              </div>
              {errors.languages && <p className="text-sm text-red-500">{errors.languages}</p>}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowLanguagesPopup(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={saveLanguages} disabled={savingStep === 'languages'} className="flex-1 bg-teal-500 hover:bg-teal-600">
                  {savingStep === 'languages' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save</>}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Apply Dialog */}
        <Dialog open={!!selectedOpportunity} onOpenChange={() => setSelectedOpportunity(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedOpp?.name}</DialogTitle>
              <DialogDescription>{selectedOpp?.client}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">{selectedOpp?.description}</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-zinc-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-emerald-600">${String((selectedOpp?.compensation as Record<string, unknown>)?.baseRate || 0)}</p>
                  <p className="text-xs text-zinc-500">per hour</p>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-cyan-600">{selectedOpp?.capacity?.openPositions || 0}</p>
                  <p className="text-xs text-zinc-500">positions</p>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-amber-600">{String((selectedOpp?.training as Record<string, unknown>)?.duration || 0)}h</p>
                  <p className="text-xs text-zinc-500">training</p>
                </div>
              </div>
              <Button
                className="w-full bg-teal-500 hover:bg-teal-600"
                onClick={() => selectedOpportunity && handleApply(selectedOpportunity)}
                disabled={applying}
              >
                {applying ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Applying...</>
                ) : (
                  <>Confirm Application <ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  );
}
