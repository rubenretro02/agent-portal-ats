'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { RequirePersonalInfo } from '@/components/RequirePersonalInfo';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Laptop,
  Globe,
  Calendar,
  Edit2,
  Save,
  X,
  CheckCircle2,
  Clock,
  AtSign,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, agent, isLoading, refreshProfile } = useAuthContext();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
  });

  const supabase = getSupabaseClient();

  useEffect(() => {
    if (profile) {
      setFormData({
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
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

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ phone: formData.phone })
      .eq('id', profile.id);

    if (!error) {
      await refreshProfile();
      setEditing(false);
    }
    setSaving(false);
  };

  // Parse agent data
  const address = agent?.address as Record<string, string> | null;
  const equipment = agent?.equipment as Record<string, boolean | string> | null;
  const languages = agent?.languages as string[] | null;
  const availability = agent?.availability as Record<string, string> | null;

  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();

  return (
    <RequirePersonalInfo>
    <PortalLayout title="My Profile">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="border-zinc-200 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-teal-500 to-cyan-500" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-zinc-600">
                {initials}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-zinc-900">
                  {profile.first_name} {profile.last_name}
                </h1>
                {(profile as unknown as { username?: string })?.username && (
                  <p className="text-teal-600 font-medium">@{(profile as unknown as { username?: string }).username}</p>
                )}
                <p className="text-zinc-500">{profile.email}</p>
              </div>
              {agent && (
                <span className="text-sm text-zinc-500">
                  Agent ID: {agent.ats_id?.replace(/\D/g, '').slice(-6) || '000000'}
                </span>
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
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving} className="bg-teal-500 hover:bg-teal-600">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-zinc-500">
                  <AtSign className="h-4 w-4" />
                  Username
                </Label>
                <Input value={(profile as unknown as { username?: string })?.username || 'Not set'} disabled className="bg-zinc-50" />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-zinc-500">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input value={profile.email} disabled className="bg-zinc-50" />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-zinc-500">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                {editing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <p className="text-zinc-900 py-2">{profile.phone || 'Not specified'}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-zinc-500">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                {address?.street ? (
                  <div className="text-zinc-900">
                    <p>{address.street}</p>
                    <p>{address.city}, {address.state} {address.zipCode}</p>
                    <p>{address.country}</p>
                  </div>
                ) : (
                  <p className="text-zinc-400">Not specified - <a href="/onboarding" className="text-teal-600 hover:underline">Complete onboarding</a></p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Equipment & Languages */}
          <Card className="border-zinc-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Laptop className="h-5 w-5 text-zinc-400" />
                Equipment & Languages
              </CardTitle>
              <CardDescription>Your work configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Equipment */}
              <div>
                <Label className="text-zinc-500 mb-2 block">Equipment</Label>
                {equipment ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {equipment.hasComputer ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-zinc-400" />
                      )}
                      <span className={equipment.hasComputer ? 'text-zinc-900' : 'text-zinc-400'}>
                        Computer
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {equipment.hasHeadset ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-zinc-400" />
                      )}
                      <span className={equipment.hasHeadset ? 'text-zinc-900' : 'text-zinc-400'}>
                        Headset
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {equipment.hasQuietSpace ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-zinc-400" />
                      )}
                      <span className={equipment.hasQuietSpace ? 'text-zinc-900' : 'text-zinc-400'}>
                        Quiet Space
                      </span>
                    </div>
                    {equipment.internetSpeed && (
                      <p className="text-sm text-zinc-600">
                        Internet: {equipment.internetSpeed} Mbps
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-zinc-400">Not specified - <a href="/onboarding" className="text-teal-600 hover:underline">Complete onboarding</a></p>
                )}
              </div>

              <Separator />

              {/* Languages */}
              <div>
                <Label className="flex items-center gap-2 text-zinc-500 mb-2">
                  <Globe className="h-4 w-4" />
                  Languages
                </Label>
                {languages && languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <Badge key={lang} variant="secondary">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400">Not specified</p>
                )}
              </div>

              <Separator />

              {/* Availability */}
              <div>
                <Label className="flex items-center gap-2 text-zinc-500 mb-2">
                  <Calendar className="h-4 w-4" />
                  Availability
                </Label>
                {availability ? (
                  <div className="text-zinc-900">
                    <p>Hours per week: {availability.hoursPerWeek || 'Not specified'}</p>
                    <p>Preferred shift: {availability.preferredShift || 'Not specified'}</p>
                  </div>
                ) : (
                  <p className="text-zinc-400">Not specified - <a href="/onboarding" className="text-teal-600 hover:underline">Complete onboarding</a></p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => router.push('/onboarding')}>
                Edit Onboarding
              </Button>
              <Button variant="outline" onClick={() => router.push('/documents')}>
                My Documents
              </Button>
              <Button variant="outline" onClick={() => router.push('/opportunities')}>
                View Opportunities
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
    </RequirePersonalInfo>
  );
}
