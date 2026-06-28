'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/AuthProvider';
import BrandMark from '@/components/BrandMark';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Briefcase,
  Cpu,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  LifeBuoy,
  ChevronRight,
} from 'lucide-react';
import { TypingTest, type TypingResult } from '@/components/onboarding/TypingTest';
import { SystemCheck } from '@/components/SystemCheck';
import { buildSysHistoryEntry, type SystemCheckResult } from '@/lib/systemCheck';

// Two-level structure: parent stages each contain sub-stages. The sidebar
// shows parent stages (collapsed); the active parent expands its sub-stages.
const STAGES = [
  {
    id: 'personal',
    title: 'Personal Information',
    icon: User,
    substages: [
      { id: 'details', title: 'Personal Details', heading: "Let's start with the basics", subtitle: 'Your name, contact and date of birth.' },
      { id: 'address', title: 'Home Address', heading: 'Where do you live?', subtitle: 'We use this to match you with regional opportunities.' },
    ],
  },
  {
    id: 'work',
    title: 'Experience & Availability',
    icon: Briefcase,
    substages: [
      { id: 'experience', title: 'Experience', heading: 'Tell us about your experience', subtitle: "Don't worry if you're new, we provide training." },
      { id: 'availability', title: 'Availability', heading: 'When can you work?', subtitle: 'Set your weekly hours and preferred shift.' },
      { id: 'languages', title: 'Languages', heading: 'Languages you speak', subtitle: 'Select all that apply.' },
    ],
  },
  {
    id: 'assessments',
    title: 'Skills & System',
    icon: Cpu,
    substages: [
      { id: 'typing', title: 'Typing Test', heading: 'Quick typing check', subtitle: 'We measure your words per minute and accuracy.' },
      { id: 'systemcheck', title: 'System Check', heading: 'Computer & connection check', subtitle: 'We verify your setup meets the minimum requirements.' },
    ],
  },
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

  // Flattened sub-stage list for linear navigation, with parent context.
  const FLOW = useMemo(
    () =>
      STAGES.flatMap((st, si) =>
        st.substages.map((sub, sj) => ({
          ...sub,
          parentIndex: si,
          parentTitle: st.title,
          subIndex: sj,
        }))
      ),
    []
  );

  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const existingTyping = (agent as unknown as { scores?: { typing?: number; typingAccuracy?: number } } | null)?.scores;
  const [typingResult, setTypingResult] = useState<TypingResult | null>(
    existingTyping?.typing ? { wpm: existingTyping.typing, accuracy: existingTyping.typingAccuracy ?? 100 } : null
  );
  const [systemCheckResult, setSystemCheckResult] = useState<SystemCheckResult | null>(
    (agent as unknown as { system_check?: SystemCheckResult } | null)?.system_check ?? null
  );

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', sex: '', dobMonth: '', dobDay: '', dobYear: '',
    street: '', city: '', state: '', zipCode: '',
    yearsExperience: '', languages: [] as string[], hoursPerWeek: '', preferredShift: '',
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
      if (scores?.typing) setTypingResult(prev => prev ?? { wpm: scores.typing as number, accuracy: scores.typingAccuracy ?? 100 });
      const sysCheck = (agent as unknown as { system_check?: SystemCheckResult }).system_check;
      if (sysCheck) setSystemCheckResult(prev => prev ?? sysCheck);
    }
  }, [profile, agent]);

  // Pull the freshest profile/agent on entry so a returning applicant doesn't
  // see a stale (cached) form that requires a manual page refresh. A short
  // blank spinner hides the resume "jump" so the user lands directly on their
  // step without seeing step 1 flash first.
  const [dataReady, setDataReady] = useState(false);
  const [positionedDone, setPositionedDone] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  useEffect(() => {
    refreshProfile().finally(() => setDataReady(true));
    const t = setTimeout(() => setMinElapsed(true), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume at the first incomplete sub-stage, computed purely from the agent's
  // own saved data (NOT from any shared browser storage), so a brand-new
  // account on the same browser always starts fresh.
  const positioned = useRef(false);
  useEffect(() => {
    if (positioned.current || !dataReady) return;
    if (profile && agent) {
      const profileExt = profile as unknown as { sex?: string; date_of_birth?: string };
      const addr = agent.address as Record<string, string> | null;
      const exp = agent.experience as Record<string, string> | null;
      const avail = agent.availability as Record<string, string> | null;
      const langs = agent.languages as string[] | null;
      const sc = (agent as unknown as { scores?: { typing?: number } }).scores;
      const sysCheck = (agent as unknown as { system_check?: SystemCheckResult }).system_check;
      const done: Record<string, boolean> = {
        details: !!(profile.first_name && profile.last_name && profile.phone && profileExt.sex && profileExt.date_of_birth),
        address: !!(addr?.street && addr?.city && addr?.state && addr?.zipCode),
        experience: !!exp?.yearsExperience,
        availability: !!(avail?.hoursPerWeek && avail?.preferredShift),
        languages: !!(langs && langs.length > 0),
        typing: !!sc?.typing,
        systemcheck: !!sysCheck,
      };
      const firstIncomplete = FLOW.findIndex(s => !done[s.id]);
      if (firstIncomplete > 0) setCurrent(firstIncomplete);
    }
    positioned.current = true;
    setPositionedDone(true);
  }, [dataReady, profile, agent, FLOW]);

  const booting = !(positionedDone && minElapsed);

  const updateField = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggleLanguage = (lang: string) => {
    if (formData.languages.includes(lang)) updateField('languages', formData.languages.filter(l => l !== lang));
    else updateField('languages', [...formData.languages, lang]);
  };

  // Persist whatever is filled so far (best effort) — used by Save & exit and
  // as an autosave checkpoint between parent stages.
  const persist = async (finalize = false) => {
    try {
      // Merge-safe: only send fields that actually have a value, so a partial
      // save never wipes data captured on another step.
      const body: Record<string, unknown> = {};
      if (formData.firstName) body.first_name = formData.firstName;
      if (formData.lastName) body.last_name = formData.lastName;
      if (formData.phone) body.phone = formData.phone;
      if (formData.sex) body.sex = formData.sex;
      if (formData.dobYear && formData.dobMonth && formData.dobDay) {
        body.date_of_birth = `${formData.dobYear}-${formData.dobMonth}-${formData.dobDay}`;
      }
      if (Object.keys(body).length > 0) {
        await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (agent) {
        const { adminDb } = await import('@/lib/adminDb');
        const data: Record<string, unknown> = {};
        if (formData.street || formData.city || formData.state || formData.zipCode) {
          data.address = { street: formData.street, city: formData.city, state: formData.state, zipCode: formData.zipCode, country: 'USA' };
        }
        if (formData.yearsExperience) {
          data.experience = { yearsExperience: formData.yearsExperience };
        }
        if (formData.languages.length > 0) {
          data.languages = formData.languages;
        }
        if (formData.hoursPerWeek || formData.preferredShift) {
          data.availability = { hoursPerWeek: formData.hoursPerWeek, preferredShift: formData.preferredShift };
        }
        // Scores + assessment history all live inside the scores jsonb (no new column).
        const prevScores = (agent as unknown as { scores?: Record<string, unknown> }).scores || {};
        const scoresUpdate: Record<string, unknown> = { ...prevScores };
        let scoresChanged = false;
        if (typingResult) {
          scoresUpdate.typing = typingResult.wpm;
          scoresUpdate.typingAccuracy = typingResult.accuracy;
          scoresChanged = true;
          if (finalize) {
            const hist = Array.isArray(prevScores.typingHistory) ? prevScores.typingHistory as unknown[] : [];
            scoresUpdate.typingHistory = [...hist, { wpm: typingResult.wpm, accuracy: typingResult.accuracy, date: new Date().toISOString() }].slice(-10);
          }
        }
        if (finalize && systemCheckResult) {
          const sysHist = Array.isArray(prevScores.systemCheckHistory) ? prevScores.systemCheckHistory as unknown[] : [];
          scoresUpdate.systemCheckHistory = [...sysHist, buildSysHistoryEntry(systemCheckResult)].slice(-20);
          scoresChanged = true;
        }
        if (scoresChanged) data.scores = scoresUpdate;

        if (systemCheckResult) {
          data.system_check = systemCheckResult;
          data.system_check_date = new Date().toISOString();
          data.equipment = {
            hasComputer: true,
            hasWebcam: systemCheckResult.mediaDevices.hasWebcam,
            hasMicrophone: systemCheckResult.mediaDevices.hasMicrophone,
            internetSpeed: systemCheckResult.internetSpeed.downloadMbps,
            cpuCores: systemCheckResult.hardware.cpuCores,
            ramGB: systemCheckResult.hardware.ramGB,
          };
        }
        if (Object.keys(data).length > 0) {
          await adminDb({ action: 'update', table: 'agents', data, match: { id: agent.id } });
        }
      }
    } catch (err) {
      console.error('[Onboarding] persist error:', err);
    }
  };

  const validate = (id: string) => {
    switch (id) {
      case 'details':
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.sex || !formData.dobMonth || !formData.dobDay || !formData.dobYear) {
          setError('Please fill in all fields'); return false;
        }
        break;
      case 'address':
        if (!formData.street || !formData.city || !formData.state || !formData.zipCode) {
          setError('Please fill in all address fields'); return false;
        }
        break;
      case 'experience':
        if (!formData.yearsExperience) { setError('Please select your experience'); return false; }
        break;
      case 'availability':
        if (!formData.hoursPerWeek || !formData.preferredShift) { setError('Please complete all fields'); return false; }
        break;
      case 'languages':
        if (formData.languages.length === 0) { setError('Select at least one language'); return false; }
        break;
      case 'typing':
        if (!typingResult) { setError('Please finish the typing test to continue'); return false; }
        break;
      case 'systemcheck':
        if (!systemCheckResult) { setError('Please run the system check to continue'); return false; }
        break;
    }
    return true;
  };

  const cur = FLOW[current];

  const handleNext = async () => {
    if (!validate(cur.id)) return;
    // Save on every step so nothing is lost if the applicant leaves.
    // The final step records an assessment-history entry.
    setSaving(true);
    await persist(current === FLOW.length - 1);
    setSaving(false);

    if (current < FLOW.length - 1) {
      setCurrent(current + 1);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => router.replace('/dashboard'), 1800);
    }
  };

  const handleBack = () => {
    if (current > 0) { setCurrent(current - 1); setError(''); }
  };

  const handleSaveExit = async () => {
    setExiting(true);
    await persist();
    // Full page load so the dashboard reads the freshly saved profile.
    window.location.href = '/dashboard';
  };

  const applicantName = `${formData.firstName || profile?.first_name || ''} ${formData.lastName || profile?.last_name || ''}`.trim() || 'Your application';
  const isLast = current === FLOW.length - 1;
  const progress = Math.round(((current + 1) / FLOW.length) * 100);
  // Allow going back only within the same parent stage; once a stage is
  // completed and saved, you move forward and can't return to it.
  const canGoBack = current > 0 && FLOW[current - 1].parentIndex === cur.parentIndex;

  if (booting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <div className="w-10 h-10 border-4 border-[var(--brand-blue)] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-400">Loading your application…</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Profile complete</h1>
          <p className="text-zinc-500 mb-6">You can now apply to opportunities. Taking you to your dashboard...</p>
          <Link href="/dashboard"><Button className="btn-brand">Go to dashboard</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="h-1 gradient-brand" />

      <header className="px-5 sm:px-8 py-3 border-b border-zinc-100 flex items-center justify-between">
        <BrandMark href="/dashboard" />
        <button onClick={handleSaveExit} disabled={exiting} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors inline-flex items-center gap-1.5">
          {exiting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save &amp; exit
        </button>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar — parent stages collapsed; active parent expands its sub-stages */}
        <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 border-r border-zinc-100 p-7">
          <p className="text-lg font-bold text-zinc-900 leading-snug">Complete your profile</p>

          <div className="mt-7">
            <p className="text-xs text-zinc-400">You&apos;re working on</p>
            <p className="text-base font-bold text-zinc-900 mt-0.5">{cur.parentTitle}</p>
          </div>

          <nav className="mt-6 space-y-1">
            {STAGES.map((st, si) => {
              // Only reveal the current stage and the ones already completed.
              if (si > cur.parentIndex) return null;
              const StageIcon = st.icon;
              const parentDone = si < cur.parentIndex;
              const parentActive = si === cur.parentIndex;
              return (
                <div key={st.id}>
                  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${parentActive ? 'bg-[var(--brand-blue-soft)]' : ''}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      parentDone ? 'bg-emerald-500 text-white' : parentActive ? 'bg-[var(--brand-blue)] text-white' : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      {parentDone ? <CheckCircle2 className="h-4 w-4" /> : <StageIcon className="h-3.5 w-3.5" />}
                    </span>
                    <span className={`text-sm ${parentActive ? 'font-semibold text-[var(--brand-blue)]' : parentDone ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {st.title}
                    </span>
                  </div>
                  {parentActive && (
                    <div className="ml-[1.85rem] mt-1 mb-1 space-y-1.5 border-l border-zinc-200 pl-4">
                      {st.substages.map((sub, sj) => {
                        const subActive = sj === cur.subIndex;
                        const subDone = sj < cur.subIndex;
                        return (
                          <div key={sub.id} className={`text-xs ${subActive ? 'text-[var(--brand-blue)] font-semibold' : subDone ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            {subDone ? '✓ ' : ''}{sub.title}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="mt-auto pt-7">
            <p className="text-xs text-zinc-400 mb-1">Applicant</p>
            <p className="text-sm font-medium text-zinc-700">{applicantName}</p>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8">
              {/* Mobile progress */}
              <div className="lg:hidden mb-6">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                  <span className="font-medium text-zinc-900">{cur.parentTitle}</span>
                  <span>Step {current + 1} of {FLOW.length}</span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full gradient-brand rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Breadcrumb + support */}
              <div className="flex items-center justify-between mb-5">
                <div className="hidden sm:flex items-center gap-1.5 text-sm text-zinc-400">
                  <span>{cur.parentTitle}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-zinc-700 font-medium">{cur.title}</span>
                </div>
                <a href="mailto:support@wingcx.com" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-blue)] hover:underline ml-auto">
                  <LifeBuoy className="h-4 w-4" />
                  Get Support
                </a>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight leading-tight">{cur.heading}</h1>
              <p className="text-zinc-500 mt-2 mb-8">{cur.subtitle}</p>

              {/* Sub-stage content */}
              {cur.id === 'details' && (
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

              {cur.id === 'address' && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label>Street address *</Label>
                    <AddressAutocomplete
                      value={formData.street}
                      onChange={(v) => updateField('street', v)}
                      onAddressSelect={(addr) => setFormData(prev => ({
                        ...prev,
                        street: addr.street || prev.street,
                        city: addr.city || prev.city,
                        state: addr.state || prev.state,
                        zipCode: addr.zipCode || prev.zipCode,
                      }))}
                      placeholder="Start typing your address..."
                      countryCode="us"
                    />
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

              {cur.id === 'experience' && (
                <div className="grid grid-cols-1 gap-2.5">
                  {EXPERIENCE_OPTIONS.map(opt => {
                    const selected = formData.yearsExperience === opt;
                    return (
                      <button key={opt} type="button" onClick={() => updateField('yearsExperience', opt)}
                        className={`flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                          selected ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-soft)]' : 'border-zinc-200 hover:border-zinc-300'
                        }`}>
                        <span className={`w-4 h-4 rounded-full border-2 shrink-0 ${selected ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)]' : 'border-zinc-300'}`} />
                        <span className="text-sm text-zinc-800">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {cur.id === 'availability' && (
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
              )}

              {cur.id === 'languages' && (
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES_LIST.map(lang => (
                    <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                      className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                        formData.languages.includes(lang) ? 'bg-[var(--brand-blue)] text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}>
                      {lang}
                    </button>
                  ))}
                </div>
              )}

              {cur.id === 'typing' && (
                <TypingTest seed={agent?.id || profile?.id || 'default'} initialResult={typingResult} onComplete={setTypingResult} />
              )}

              {cur.id === 'systemcheck' && (
                <SystemCheck agentId={agent?.id} showSaveButton={false} onComplete={setSystemCheckResult} />
              )}

              {error && (
                <div className="mt-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-zinc-100 px-5 sm:px-8 py-4">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
              {canGoBack ? (
                <Button variant="outline" onClick={handleBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Previous
                </Button>
              ) : (
                <div />
              )}
              <Button onClick={handleNext} disabled={saving} className="btn-brand gap-2 min-w-[140px]">
                {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>)
                  : isLast ? (<>Submit <CheckCircle2 className="h-4 w-4" /></>)
                  : (<>Next <ArrowRight className="h-4 w-4" /></>)}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
