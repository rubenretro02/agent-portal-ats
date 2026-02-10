'use client';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { profile, agent, isLoading, refreshProfile } = useAuthContext();
  const { opportunities, fetchOpportunities, appliedOpportunityIds, fetchAppliedOpportunities, applyToOpportunity } = useOpportunityStore();
  const supabase = getSupabaseClient();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  // If profile is not loaded after auth is done, redirect to login
  useEffect(() => {
    if (!isLoading && !profile) {
      redirectTimerRef.current = setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [isLoading, profile, router]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500">{isLoading ? 'Loading...' : 'Redirecting to login...'}</p>
        </div>
      </div>
    );
  }
  // Format DOB for display
  const formatDOBDisplay = () => {
    if (!profile) return 'Not set';
    const profileExt = profile as unknown as { date_of_birth?: string };
    if (!profileExt?.date_of_birth) return 'Not set';
    const dob = parseDOB(profileExt.date_of_birth);
    if (dob.month && dob.day && dob.year) {
      return `${dob.month}/${dob.day}/${dob.year}`;
    }
    return 'Not set';
  };
  // Get sex display
  const getSexDisplay = () => {
    if (!profile) return 'Not set';
    const profileExt = profile as unknown as { sex?: string };
    if (!profileExt?.sex) return 'Not set';
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
                {/* Personal Info Step - abbreviated for space */}
                <Collapsible open={openStep === 'personal'} onOpenChange={(open) => {
                  if (!isPersonalInfoComplete && open) {
                    setShowPersonalPopup(true);
                  } else {
                    setOpenStep(open ? 'personal' : null);
                  }
                }}>
                  <CollapsibleTrigger asChild>
                    <div className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${stepStatus.personal ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-zinc-50 hover:bg-zinc-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stepStatus.personal ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
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
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
