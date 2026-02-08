'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Save, Loader2, AlertCircle } from 'lucide-react';

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

// Format phone number as user types
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 10);
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

interface RequirePersonalInfoProps {
  children: React.ReactNode;
}

export function RequirePersonalInfo({ children }: RequirePersonalInfoProps) {
  const { profile, refreshProfile, isLoading } = useAuthContext();
  const supabase = getSupabaseClient();

  const [showPopup, setShowPopup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  // Parse DOB into month, day, year
  const parseDOB = (dob: string) => {
    if (!dob) return { month: '', day: '', year: '' };
    const parts = dob.split('-');
    if (parts.length === 3) {
      return { year: parts[0], month: parts[1], day: parts[2] };
    }
    return { month: '', day: '', year: '' };
  };

  // Check if personal info is complete
  const isPersonalInfoComplete = useCallback(() => {
    if (!profile) return false;
    const profileExt = profile as unknown as { sex?: string; date_of_birth?: string };
    return !!(profile.first_name && profile.last_name && profileExt.sex && profileExt.date_of_birth && profile.phone);
  }, [profile]);

  // Show popup if personal info is not complete
  useEffect(() => {
    if (!isLoading && profile && !isPersonalInfoComplete()) {
      // Pre-fill form with existing data
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

      setShowPopup(true);
    }
  }, [isLoading, profile, isPersonalInfoComplete]);

  const savePersonalInfo = useCallback(async () => {
    if (!personalForm.firstName || !personalForm.lastName || !personalForm.middleName || !personalForm.sex || !personalForm.dobMonth || !personalForm.dobDay || !personalForm.dobYear || !personalForm.phone || !profile?.id) {
      setError('All fields are required including phone number. Use "N/A" for Middle Name if none.');
      return;
    }

    // Validate phone number
    if (!isValidPhoneNumber(personalForm.phone)) {
      setError('Please enter a valid 10-digit US phone number.');
      return;
    }

    // Construct date in YYYY-MM-DD format for database
    const dateOfBirth = `${personalForm.dobYear}-${personalForm.dobMonth}-${personalForm.dobDay}`;

    setSaving(true);
    setError('');

    try {
      const { error: updateError } = await supabase
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

      if (updateError) throw updateError;

      await refreshProfile();
      setShowPopup(false);
    } catch (err) {
      console.error('Error saving personal info:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [personalForm, profile, supabase, refreshProfile]);

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If personal info is complete, render children
  if (isPersonalInfoComplete()) {
    return <>{children}</>;
  }

  // Otherwise, show the page with a blocking popup
  return (
    <>
      {children}
      <Dialog open={showPopup} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Complete Your Profile
            </DialogTitle>
            <DialogDescription>
              You must complete your personal information before accessing this page.
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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select
                  value={personalForm.dobDay}
                  onValueChange={(v) => setPersonalForm(prev => ({ ...prev, dobDay: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select
                  value={personalForm.dobYear}
                  onValueChange={(v) => setPersonalForm(prev => ({ ...prev, dobYear: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              onClick={savePersonalInfo}
              disabled={saving}
              className="w-full bg-teal-500 hover:bg-teal-600"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />Save & Continue</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
