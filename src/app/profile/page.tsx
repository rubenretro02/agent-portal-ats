'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { RequirePersonalInfo } from '@/components/RequirePersonalInfo';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { TypingTest, type TypingResult } from '@/components/onboarding/TypingTest';
import { SystemCheck } from '@/components/SystemCheck';
import type { SystemCheckResult } from '@/lib/systemCheck';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  User, Mail, Phone, MapPin, Laptop, Globe, Calendar, Edit2, Save, X,
  AtSign, Keyboard, Cpu, Gauge, Loader2,
} from 'lucide-react';

const EXPERIENCE_OPTIONS = ['No experience', 'Less than 1 year', '1-2 years', '3-5 years', '5+ years'];
const SHIFT_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Flexible'];
const HOURS_OPTIONS = ['10-20', '20-30', '30-40', '40+'];
const LANGUAGES_LIST = ['English', 'Spanish', 'French', 'Portuguese', 'German', 'Italian', 'Chinese', 'Japanese'];
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY',
  'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND',
  'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export default function ProfilePage() {
  const router = useRouter();
  const { profile, agent, isLoading, refreshProfile } = useAuthContext();

  const [editingContact, setEditingContact] = useState(false);
  const [editingWork, setEditingWork] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingWork, setSavingWork] = useState(false);
  const [contactErr, setContactErr] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const [showSystem, setShowSystem] = useState(false);

  const [contactForm, setContactForm] = useState({
    username: '', phone: '', street: '', city: '', state: '', zipCode: '',
  });
  const [workForm, setWorkForm] = useState({
    yearsExperience: '', languages: [] as string[], hoursPerWeek: '', preferredShift: '',
  });

  useEffect(() => {
    if (profile) {
      const address = (agent?.address as Record<string, string> | null) || {};
      setContactForm({
        username: (profile as unknown as { username?: string })?.username || '',
        phone: profile.phone || '',
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
      });
    }
    if (agent) {
      const experience = agent.experience as Record<string, string> | null;
      const availability = agent.availability as Record<string, string> | null;
      const langs = agent.languages as string[] | null;
      setWorkForm({
        yearsExperience: experience?.yearsExperience || '',
        languages: langs || [],
        hoursPerWeek: availability?.hoursPerWeek || '',
        preferredShift: availability?.preferredShift || '',
      });
    }
  }, [profile, agent]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-12 h-12 border-4 border-[var(--brand-blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">Please sign in</p>
      </div>
    );
  }

  const saveContact = async () => {
    setContactErr('');
    if (contactForm.username && (contactForm.username.length < 3 || !/^[a-zA-Z0-9]+$/.test(contactForm.username))) {
      setContactErr('Username must be at least 3 letters/numbers, no spaces.');
      return;
    }
    setSavingContact(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: contactForm.phone,
          ...(contactForm.username ? { username: contactForm.username.toLowerCase() } : {}),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to update');
      }
      if (agent) {
        const { adminDb } = await import('@/lib/adminDb');
        await adminDb({
          action: 'update', table: 'agents',
          data: { address: { street: contactForm.street, city: contactForm.city, state: contactForm.state, zipCode: contactForm.zipCode, country: 'USA' } },
          match: { id: agent.id },
        });
      }
      await refreshProfile();
      setEditingContact(false);
    } catch (err) {
      console.error('Error saving contact:', err);
      setContactErr(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingContact(false);
    }
  };

  const saveWork = async () => {
    if (!agent) return;
    setSavingWork(true);
    try {
      const { adminDb } = await import('@/lib/adminDb');
      await adminDb({
        action: 'update', table: 'agents',
        data: {
          experience: { yearsExperience: workForm.yearsExperience },
          languages: workForm.languages,
          availability: { hoursPerWeek: workForm.hoursPerWeek, preferredShift: workForm.preferredShift },
        },
        match: { id: agent.id },
      });
      await refreshProfile();
      setEditingWork(false);
    } catch (err) {
      console.error('Error saving work info:', err);
    } finally {
      setSavingWork(false);
    }
  };

  const saveTyping = async (result: TypingResult) => {
    if (!agent) return;
    const { adminDb } = await import('@/lib/adminDb');
    const prevScores = (agent as unknown as { scores?: Record<string, number> }).scores || {};
    await adminDb({
      action: 'update', table: 'agents',
      data: { scores: { ...prevScores, typing: result.wpm, typingAccuracy: result.accuracy } },
      match: { id: agent.id },
    });
    await refreshProfile();
  };

  const saveSystem = async (result: SystemCheckResult) => {
    if (!agent) return;
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
  };

  const toggleLanguage = (lang: string) => {
    setWorkForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang) ? prev.languages.filter(l => l !== lang) : [...prev.languages, lang],
    }));
  };

  const address = agent?.address as Record<string, string> | null;
  const equipment = agent?.equipment as Record<string, boolean | string> | null;
  const languages = agent?.languages as string[] | null;
  const availability = agent?.availability as Record<string, string> | null;
  const scores = (agent as unknown as { scores?: { typing?: number; typingAccuracy?: number } })?.scores;
  const username = (profile as unknown as { username?: string })?.username;

  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();

  return (
    <RequirePersonalInfo>
    <UnifiedLayout title="My Profile">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="border-zinc-200 overflow-hidden">
          <div className="h-24 gradient-brand" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-zinc-600">
                {initials}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-zinc-900">{profile.first_name} {profile.last_name}</h1>
                {username && <p className="text-[var(--brand-blue)] font-medium">@{username}</p>}
                <p className="text-zinc-500">{profile.email}</p>
              </div>
              {agent && (
                <span className="text-sm text-zinc-500">Agent ID: {agent.agent_id?.replace('AGENT ', '') || '00000000'}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card className="border-zinc-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-zinc-400" />
                  Contact Information
                </CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </div>
              {!editingContact ? (
                <Button variant="outline" size="sm" onClick={() => setEditingContact(true)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditingContact(false); setContactErr(''); }}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={saveContact} disabled={savingContact} className="btn-brand">
                    {savingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save</>}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-zinc-500"><AtSign className="h-4 w-4" /> Username</Label>
                {editingContact ? (
                  <Input
                    value={contactForm.username}
                    onChange={(e) => setContactForm({ ...contactForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                    placeholder="Choose a username"
                  />
                ) : (
                  <p className="text-zinc-900 py-2">{username ? `@${username}` : <span className="text-zinc-400">Not set</span>}</p>
                )}
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-zinc-500"><Mail className="h-4 w-4" /> Email</Label>
                <Input value={profile.email} disabled className="bg-zinc-50" />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-zinc-500"><Phone className="h-4 w-4" /> Phone</Label>
                {editingContact ? (
                  <Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="(555) 123-4567" />
                ) : (
                  <p className="text-zinc-900 py-2">{profile.phone || 'Not specified'}</p>
                )}
              </div>

              <Separator />

              {/* Address */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-zinc-500"><MapPin className="h-4 w-4" /> Address</Label>
                {editingContact ? (
                  <div className="space-y-3">
                    <AddressAutocomplete
                      value={contactForm.street}
                      onChange={(v) => setContactForm(prev => ({ ...prev, street: v }))}
                      onAddressSelect={(addr) => setContactForm(prev => ({
                        ...prev,
                        street: addr.street || prev.street,
                        city: addr.city || prev.city,
                        state: addr.state || prev.state,
                        zipCode: addr.zipCode || prev.zipCode,
                      }))}
                      placeholder="Start typing your address..."
                      countryCode="us"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={contactForm.city} onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })} placeholder="City" />
                      <Select value={contactForm.state} onValueChange={(v) => setContactForm({ ...contactForm, state: v })}>
                        <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Input className="max-w-[160px]" value={contactForm.zipCode} onChange={(e) => setContactForm({ ...contactForm, zipCode: e.target.value })} placeholder="ZIP" />
                  </div>
                ) : address?.street ? (
                  <div className="text-zinc-900">
                    <p>{address.street}</p>
                    <p>{address.city}, {address.state} {address.zipCode}</p>
                    <p>{address.country}</p>
                  </div>
                ) : (
                  <p className="text-zinc-400">Not specified</p>
                )}
              </div>

              {contactErr && <p className="text-sm text-red-600">{contactErr}</p>}
            </CardContent>
          </Card>

          {/* Work configuration */}
          <Card className="border-zinc-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Laptop className="h-5 w-5 text-zinc-400" />
                  Experience & Availability
                </CardTitle>
                <CardDescription>Your work configuration</CardDescription>
              </div>
              {!editingWork ? (
                <Button variant="outline" size="sm" onClick={() => setEditingWork(true)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingWork(false)}><X className="h-4 w-4" /></Button>
                  <Button size="sm" onClick={saveWork} disabled={savingWork} className="btn-brand">
                    {savingWork ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save</>}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Experience */}
              <div>
                <Label className="text-zinc-500 mb-2 block">Experience</Label>
                {editingWork ? (
                  <Select value={workForm.yearsExperience} onValueChange={(v) => setWorkForm({ ...workForm, yearsExperience: v })}>
                    <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                    <SelectContent>{EXPERIENCE_OPTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <p className="text-zinc-900">{(agent?.experience as Record<string, string> | null)?.yearsExperience || 'Not specified'}</p>
                )}
              </div>

              <Separator />

              {/* Languages */}
              <div>
                <Label className="flex items-center gap-2 text-zinc-500 mb-2"><Globe className="h-4 w-4" /> Languages</Label>
                {editingWork ? (
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES_LIST.map(lang => (
                      <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          workForm.languages.includes(lang) ? 'bg-[var(--brand-blue)] text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}>
                        {lang}
                      </button>
                    ))}
                  </div>
                ) : languages && languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">{languages.map((lang) => <Badge key={lang} variant="secondary">{lang}</Badge>)}</div>
                ) : (
                  <p className="text-zinc-400">Not specified</p>
                )}
              </div>

              <Separator />

              {/* Availability */}
              <div>
                <Label className="flex items-center gap-2 text-zinc-500 mb-2"><Calendar className="h-4 w-4" /> Availability</Label>
                {editingWork ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={workForm.hoursPerWeek} onValueChange={(v) => setWorkForm({ ...workForm, hoursPerWeek: v })}>
                      <SelectTrigger><SelectValue placeholder="Hours/week" /></SelectTrigger>
                      <SelectContent>{HOURS_OPTIONS.map(h => <SelectItem key={h} value={h}>{h} hours</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={workForm.preferredShift} onValueChange={(v) => setWorkForm({ ...workForm, preferredShift: v })}>
                      <SelectTrigger><SelectValue placeholder="Shift" /></SelectTrigger>
                      <SelectContent>{SHIFT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ) : availability ? (
                  <div className="text-zinc-900">
                    <p>Hours per week: {availability.hoursPerWeek || 'Not specified'}</p>
                    <p>Preferred shift: {availability.preferredShift || 'Not specified'}</p>
                  </div>
                ) : (
                  <p className="text-zinc-400">Not specified</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessments — re-run typing test & system check */}
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="h-5 w-5 text-zinc-400" />
              Skills & System
            </CardTitle>
            <CardDescription>Re-run your assessments anytime</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200">
              <div className="w-11 h-11 rounded-xl bg-[var(--brand-blue-soft)] flex items-center justify-center shrink-0">
                <Keyboard className="h-5 w-5 text-[var(--brand-blue)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900">Typing test</p>
                <p className="text-sm text-zinc-500">{scores?.typing ? `${scores.typing} WPM` : 'Not taken yet'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowTyping(true)}>{scores?.typing ? 'Re-run' : 'Start'}</Button>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200">
              <div className="w-11 h-11 rounded-xl bg-[var(--brand-purple-soft)] flex items-center justify-center shrink-0">
                <Cpu className="h-5 w-5 text-[var(--brand-purple)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900">System check</p>
                <p className="text-sm text-zinc-500">
                  {equipment?.internetSpeed ? `${equipment.internetSpeed} Mbps · ${equipment.cpuCores || '?'} cores` : 'Not run yet'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowSystem(true)}>{equipment?.internetSpeed ? 'Re-run' : 'Start'}</Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => router.push('/documents')}>My Documents</Button>
              <Button variant="outline" onClick={() => router.push('/opportunities')}>View Opportunities</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Typing test dialog */}
      <Dialog open={showTyping} onOpenChange={setShowTyping}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Typing test</DialogTitle>
            <DialogDescription>Type the passage exactly as shown. We measure WPM and accuracy.</DialogDescription>
          </DialogHeader>
          <TypingTest seed={agent?.id || profile.id || 'default'} onComplete={saveTyping} />
        </DialogContent>
      </Dialog>

      {/* System check dialog */}
      <Dialog open={showSystem} onOpenChange={setShowSystem}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>System check</DialogTitle>
            <DialogDescription>We run a real test of your internet, hardware and connection.</DialogDescription>
          </DialogHeader>
          <SystemCheck agentId={agent?.id} showSaveButton={false} onComplete={saveSystem} />
        </DialogContent>
      </Dialog>
    </UnifiedLayout>
    </RequirePersonalInfo>
  );
}
