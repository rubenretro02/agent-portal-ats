'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { SystemCheck } from '@/components/SystemCheck';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  User,
  MapPin,
  Cpu,
  Globe,
  ChevronRight,
  ChevronLeft,
  Save,
  Home,
  Edit2,
  Phone,
  Mail,
  Wifi,
  Monitor,
  Camera,
  Mic,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import type { SystemCheckResult } from '@/lib/systemCheck';

interface OnboardingData {
  phone: string;
  dateOfBirth: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  languages: string[];
  hoursPerWeek: string;
  preferredShift: string;
  timezone: string;
}

const initialData: OnboardingData = {
  phone: '',
  dateOfBirth: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'US',
  languages: ['English'],
  hoursPerWeek: '',
  preferredShift: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
};

const STEPS = [
  { id: 'personal', title: 'Personal Information', icon: User },
  { id: 'address', title: 'Address', icon: MapPin },
  { id: 'system-check', title: 'System Check', icon: Cpu },
  { id: 'languages', title: 'Languages & Availability', icon: Globe },
];

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'MX', name: 'México' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ES', name: 'España' },
  { code: 'PE', name: 'Perú' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'CL', name: 'Chile' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'DO', name: 'Dominican Republic' },
];

const LANGUAGES = [
  'English',
  'Spanish',
  'Portuguese',
  'French',
  'German',
  'Italian',
  'Mandarin',
  'Japanese',
];

const SHIFTS = [
  { value: 'morning', label: 'Morning (6am - 2pm)', labelEs: 'Mañana (6am - 2pm)' },
  { value: 'afternoon', label: 'Afternoon (2pm - 10pm)', labelEs: 'Tarde (2pm - 10pm)' },
  { value: 'evening', label: 'Evening (10pm - 6am)', labelEs: 'Noche (10pm - 6am)' },
  { value: 'flexible', label: 'Flexible', labelEs: 'Flexible' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, agent, isLoading: authLoading, refreshProfile } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>(initialData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [language] = useState<'en' | 'es'>('es');
  const [systemCheckResult, setSystemCheckResult] = useState<SystemCheckResult | null>(null);
  const [systemCheckComplete, setSystemCheckComplete] = useState(false);

  const supabase = getSupabaseClient();

  // Check if onboarding is complete
  const isOnboardingComplete = useMemo(() => {
    if (!agent || !profile) return false;

    const address = agent.address as Record<string, string> | null;
    const availability = agent.availability as Record<string, string> | null;
    const langs = agent.languages as string[] | null;
    const systemCheck = agent.system_check as SystemCheckResult | null;

    const hasPhone = !!profile.phone;
    const hasAddress = !!(address?.street && address?.city && address?.state);
    const hasSystemCheck = !!systemCheck;
    const hasLanguages = !!(langs && langs.length > 0);
    const hasAvailability = !!(availability?.hoursPerWeek && availability?.preferredShift);

    return hasPhone && hasAddress && hasSystemCheck && hasLanguages && hasAvailability;
  }, [agent, profile]);

  // Load existing data if any
  useEffect(() => {
    if (agent) {
      const address = agent.address as Record<string, string> | null;
      const availability = agent.availability as Record<string, string> | null;
      const langs = agent.languages as string[] | null;
      const existingSystemCheck = agent.system_check as SystemCheckResult | null;

      if (existingSystemCheck) {
        setSystemCheckResult(existingSystemCheck);
        setSystemCheckComplete(true);
      }

      setFormData({
        phone: profile?.phone || '',
        dateOfBirth: '',
        street: address?.street || '',
        city: address?.city || '',
        state: address?.state || '',
        zipCode: address?.zipCode || '',
        country: address?.country || 'US',
        languages: langs || ['English'],
        hoursPerWeek: availability?.hoursPerWeek || '',
        preferredShift: availability?.preferredShift || '',
        timezone: (agent.timezone as string) || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
      });
    }
  }, [agent, profile]);

  const updateFormData = useCallback((field: keyof OnboardingData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const toggleLanguage = useCallback((lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!formData.phone) newErrors.phone = language === 'es' ? 'Teléfono requerido' : 'Phone required';
        break;
      case 1:
        if (!formData.street) newErrors.street = language === 'es' ? 'Calle requerida' : 'Street required';
        if (!formData.city) newErrors.city = language === 'es' ? 'Ciudad requerida' : 'City required';
        if (!formData.state) newErrors.state = language === 'es' ? 'Estado requerido' : 'State required';
        if (!formData.zipCode) newErrors.zipCode = language === 'es' ? 'Código postal requerido' : 'ZIP code required';
        break;
      case 2:
        if (!systemCheckComplete) newErrors.systemCheck = language === 'es' ? 'Ejecuta el test de sistema' : 'Run the system check';
        break;
      case 3:
        if (formData.languages.length === 0) newErrors.languages = language === 'es' ? 'Selecciona al menos un idioma' : 'Select at least one language';
        if (!formData.hoursPerWeek) newErrors.hoursPerWeek = language === 'es' ? 'Horas por semana requeridas' : 'Hours per week required';
        if (!formData.preferredShift) newErrors.preferredShift = language === 'es' ? 'Turno preferido requerido' : 'Preferred shift required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, language, systemCheckComplete]);

  const handleSystemCheckComplete = useCallback(async (result: SystemCheckResult) => {
    setSystemCheckResult(result);
    setSystemCheckComplete(true);

    // Save system check immediately to agent profile
    if (agent) {
      await supabase
        .from('agents')
        .update({
          system_check: result,
          system_check_date: new Date().toISOString(),
          // Also update equipment based on detected specs
          equipment: {
            hasComputer: true,
            hasWebcam: result.mediaDevices.hasWebcam,
            hasMicrophone: result.mediaDevices.hasMicrophone,
            internetSpeed: result.internetSpeed.downloadMbps,
            cpuCores: result.hardware.cpuCores,
            ramGB: result.hardware.ramGB,
            screenResolution: `${result.screen.width}x${result.screen.height}`,
            browser: `${result.browser.name} ${result.browser.version}`,
            platform: result.hardware.platform,
            isVpn: result.ipInfo.isVpn,
          },
        })
        .eq('id', agent.id);
    }
  }, [agent, supabase]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleSave = useCallback(async () => {
    if (!validateStep(currentStep)) return;
    if (!agent) return;

    setSaving(true);

    try {
      if (profile) {
        await supabase
          .from('profiles')
          .update({ phone: formData.phone })
          .eq('id', profile.id);
      }

      const { error } = await supabase
        .from('agents')
        .update({
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
          languages: formData.languages,
          availability: {
            hoursPerWeek: formData.hoursPerWeek,
            preferredShift: formData.preferredShift,
          },
          timezone: formData.timezone,
          pipeline_status: 'screening',
          pipeline_stage: 2,
        })
        .eq('id', agent.id);

      if (error) {
        console.error('Error saving onboarding:', error);
        setErrors({ save: error.message });
      } else {
        await refreshProfile();
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Save error:', err);
      setErrors({ save: 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  }, [agent, profile, formData, currentStep, validateStep, supabase, refreshProfile, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile || !agent) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-zinc-500 mb-4">
              {language === 'es' ? 'No se encontró el perfil' : 'Profile not found'}
            </p>
            <Button onClick={() => router.push('/login')}>
              {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show completed view if onboarding is done
  if (isOnboardingComplete) {
    const address = agent.address as Record<string, string> | null;
    const availability = agent.availability as Record<string, string> | null;
    const langs = agent.languages as string[] | null;
    const systemCheck = agent.system_check as SystemCheckResult | null;

    const shiftLabel = SHIFTS.find(s => s.value === availability?.preferredShift)?.labelEs || availability?.preferredShift;

    return (
      <PortalLayout title="Onboarding">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Success Header */}
          <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900">
                    Onboarding Complete
                  </h1>
                  <p className="text-zinc-600">
                    Your profile is complete. You can view and edit your information from the profile page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-zinc-400" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-600">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-900 font-medium">{profile.phone}</span>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-zinc-900">
                  <p>{address?.street}</p>
                  <p>{address?.city}, {address?.state} {address?.zipCode}</p>
                  <p className="text-zinc-500">{COUNTRIES.find(c => c.code === address?.country)?.name || address?.country}</p>
                </div>
              </CardContent>
            </Card>

            {/* System Check Results */}
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-zinc-400" />
                  System Specs (Verified)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {systemCheck && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <Wifi className="h-4 w-4 text-cyan-500" />
                      <span className="text-zinc-900">Internet: {systemCheck.internetSpeed.downloadMbps} Mbps</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Monitor className="h-4 w-4 text-blue-500" />
                      <span className="text-zinc-900">Screen: {systemCheck.screen.width}x{systemCheck.screen.height}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Cpu className="h-4 w-4 text-purple-500" />
                      <span className="text-zinc-900">{systemCheck.hardware.cpuCores} CPU Cores</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Camera className={`h-4 w-4 ${systemCheck.mediaDevices.hasWebcam ? 'text-emerald-500' : 'text-red-400'}`} />
                      <span className={systemCheck.mediaDevices.hasWebcam ? 'text-zinc-900' : 'text-zinc-400'}>
                        Webcam: {systemCheck.mediaDevices.hasWebcam ? 'Detected' : 'Not found'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mic className={`h-4 w-4 ${systemCheck.mediaDevices.hasMicrophone ? 'text-emerald-500' : 'text-red-400'}`} />
                      <span className={systemCheck.mediaDevices.hasMicrophone ? 'text-zinc-900' : 'text-zinc-400'}>
                        Microphone: {systemCheck.mediaDevices.hasMicrophone ? 'Detected' : 'Not found'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {systemCheck.ipInfo.isVpn ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Shield className="h-4 w-4 text-emerald-500" />
                      )}
                      <span className={systemCheck.ipInfo.isVpn ? 'text-amber-600' : 'text-zinc-900'}>
                        {systemCheck.ipInfo.isVpn ? 'VPN Detected' : 'Direct Connection'}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Languages & Availability */}
            <Card className="border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-zinc-400" />
                  Languages & Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Languages</p>
                  <div className="flex flex-wrap gap-1">
                    {langs?.map(lang => (
                      <Badge key={lang} variant="secondary" className="text-xs">{lang}</Badge>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-zinc-500">Hours/Week</p>
                    <p className="font-medium">{availability?.hoursPerWeek}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Shift</p>
                    <p className="font-medium">{shiftLabel}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Button */}
          <Card className="border-zinc-200">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-zinc-600">
                  Need to update your information?
                </p>
                <Link href="/profile">
                  <Button className="bg-teal-500 hover:bg-teal-600">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit in Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  // Show onboarding form if not complete
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const StepIcon = STEPS[currentStep].icon;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-white">
              AP
            </div>
            <span className="text-xl font-bold text-zinc-900">AgentHub</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        {/* Progress Section */}
        <Card className="mb-6 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white overflow-hidden">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-2">
              Complete Your Profile
            </h1>
            <p className="text-zinc-400 mb-4">
              We need some additional information to activate your account
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">
                  Step {currentStep + 1} of {STEPS.length}
                </span>
                <span className="font-medium text-teal-400">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-zinc-700" />
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between mt-6">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-teal-500 text-white'
                          : isCurrent
                          ? 'bg-teal-500/30 text-teal-400 ring-2 ring-teal-500'
                          : 'bg-zinc-700 text-zinc-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`hidden sm:block w-12 md:w-20 h-0.5 ${
                          isCompleted ? 'bg-teal-500' : 'bg-zinc-700'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card className="border-zinc-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <StepIcon className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <CardTitle>
                  {STEPS[currentStep].title}
                </CardTitle>
                <CardDescription>
                  {currentStep === 0 && 'Basic contact information'}
                  {currentStep === 1 && 'Your residence address'}
                  {currentStep === 2 && 'Automated hardware and internet verification'}
                  {currentStep === 3 && 'Languages and work schedule'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Personal Info */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input value={profile.first_name} disabled className="bg-zinc-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input value={profile.last_name} disabled className="bg-zinc-50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email} disabled className="bg-zinc-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Address */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">
                    {language === 'es' ? 'Dirección (Calle)' : 'Street Address'} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="street"
                    placeholder={language === 'es' ? '123 Calle Principal, Apt 4B' : '123 Main St, Apt 4B'}
                    value={formData.street}
                    onChange={(e) => updateFormData('street', e.target.value)}
                    className={errors.street ? 'border-red-500' : ''}
                  />
                  {errors.street && <p className="text-xs text-red-500">{errors.street}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      {language === 'es' ? 'Ciudad' : 'City'} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="Miami"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">
                      {language === 'es' ? 'Estado/Provincia' : 'State/Province'} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="state"
                      placeholder={language === 'es' ? 'Florida' : 'FL'}
                      value={formData.state}
                      onChange={(e) => updateFormData('state', e.target.value)}
                      className={errors.state ? 'border-red-500' : ''}
                    />
                    {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">
                      {language === 'es' ? 'Código Postal' : 'ZIP Code'} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="zipCode"
                      placeholder="33101"
                      value={formData.zipCode}
                      onChange={(e) => updateFormData('zipCode', e.target.value)}
                      className={errors.zipCode ? 'border-red-500' : ''}
                    />
                    {errors.zipCode && <p className="text-xs text-red-500">{errors.zipCode}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">{language === 'es' ? 'País' : 'Country'}</Label>
                    <Select value={formData.country} onValueChange={(v) => updateFormData('country', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: System Check - Automated */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Info Banner */}
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Cpu className="h-5 w-5 text-cyan-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-cyan-900">Automated System Verification</p>
                      <p className="text-sm text-cyan-700 mt-1">
                        This test automatically detects your hardware specs, internet speed, and equipment.
                        Results are verified and cannot be modified manually.
                      </p>
                    </div>
                  </div>
                </div>

                {/* System Check Component */}
                <SystemCheck
                  agentId={agent.id}
                  onComplete={handleSystemCheckComplete}
                  showSaveButton={false}
                />

                {/* Show compact results after completion */}
                {systemCheckComplete && systemCheckResult && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium text-emerald-900">System Check Complete</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-cyan-500" />
                        <span>{systemCheckResult.internetSpeed.downloadMbps} Mbps</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-purple-500" />
                        <span>{systemCheckResult.hardware.cpuCores} Cores</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Camera className={`h-4 w-4 ${systemCheckResult.mediaDevices.hasWebcam ? 'text-emerald-500' : 'text-red-400'}`} />
                        <span>{systemCheckResult.mediaDevices.hasWebcam ? 'Webcam OK' : 'No Webcam'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mic className={`h-4 w-4 ${systemCheckResult.mediaDevices.hasMicrophone ? 'text-emerald-500' : 'text-red-400'}`} />
                        <span>{systemCheckResult.mediaDevices.hasMicrophone ? 'Mic OK' : 'No Mic'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {errors.systemCheck && (
                  <p className="text-sm text-red-500">{errors.systemCheck}</p>
                )}
              </div>
            )}

            {/* Step 4: Languages & Availability */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    {language === 'es' ? 'Idiomas que Dominas' : 'Languages You Speak'} <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {LANGUAGES.map((lang) => (
                      <div
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all text-center ${
                          formData.languages.includes(lang)
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <span className="text-sm font-medium">{lang}</span>
                      </div>
                    ))}
                  </div>
                  {errors.languages && <p className="text-xs text-red-500">{errors.languages}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hoursPerWeek">
                      {language === 'es' ? 'Horas Disponibles por Semana' : 'Available Hours per Week'} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.hoursPerWeek}
                      onValueChange={(v) => updateFormData('hoursPerWeek', v)}
                    >
                      <SelectTrigger className={errors.hoursPerWeek ? 'border-red-500' : ''}>
                        <SelectValue placeholder={language === 'es' ? 'Seleccionar' : 'Select'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10-20">10-20 {language === 'es' ? 'horas' : 'hours'}</SelectItem>
                        <SelectItem value="20-30">20-30 {language === 'es' ? 'horas' : 'hours'}</SelectItem>
                        <SelectItem value="30-40">30-40 {language === 'es' ? 'horas' : 'hours'}</SelectItem>
                        <SelectItem value="40+">40+ {language === 'es' ? 'horas' : 'hours'}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.hoursPerWeek && <p className="text-xs text-red-500">{errors.hoursPerWeek}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredShift">
                      {language === 'es' ? 'Turno Preferido' : 'Preferred Shift'} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.preferredShift}
                      onValueChange={(v) => updateFormData('preferredShift', v)}
                    >
                      <SelectTrigger className={errors.preferredShift ? 'border-red-500' : ''}>
                        <SelectValue placeholder={language === 'es' ? 'Seleccionar' : 'Select'} />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIFTS.map(shift => (
                          <SelectItem key={shift.value} value={shift.value}>
                            {language === 'es' ? shift.labelEs : shift.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.preferredShift && <p className="text-xs text-red-500">{errors.preferredShift}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{language === 'es' ? 'Zona Horaria' : 'Timezone'}</Label>
                  <Input
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => updateFormData('timezone', e.target.value)}
                    placeholder="America/New_York"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errors.save && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {errors.save}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Anterior' : 'Previous'}
              </Button>

              {currentStep < STEPS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={currentStep === 2 && !systemCheckComplete}
                  className="bg-teal-500 hover:bg-teal-600"
                >
                  {language === 'es' ? 'Siguiente' : 'Next'}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-teal-500 hover:bg-teal-600"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {language === 'es' ? 'Guardando...' : 'Saving...'}
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Completar Perfil' : 'Complete Profile'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
