'use client';

import { useState, useEffect } from 'react';
import { runSystemCheck, type SystemCheckResult } from '@/lib/systemCheck';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Wifi,
  Cpu,
  Monitor,
  Globe,
  Mic,
  Camera,
  Volume2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Shield,
  MapPin,
  Clock,
  Zap,
  HardDrive,
  Chrome,
} from 'lucide-react';

interface SystemCheckProps {
  agentId?: string;
  onComplete?: (result: SystemCheckResult) => void;
  showSaveButton?: boolean;
  compact?: boolean;
}

export function SystemCheck({ agentId, onComplete, showSaveButton = true, compact = false }: SystemCheckProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentCheck, setCurrentCheck] = useState('');
  const [result, setResult] = useState<SystemCheckResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const runCheck = async () => {
    setStatus('running');
    setProgress(0);
    setSaved(false);

    try {
      // Simulate progress steps
      const steps = [
        { progress: 10, label: 'Checking internet connection...' },
        { progress: 30, label: 'Testing download speed...' },
        { progress: 50, label: 'Detecting IP & location...' },
        { progress: 70, label: 'Scanning hardware...' },
        { progress: 85, label: 'Checking media devices...' },
        { progress: 95, label: 'Finalizing results...' },
      ];

      for (const step of steps) {
        setProgress(step.progress);
        setCurrentCheck(step.label);
        await new Promise(r => setTimeout(r, 400));
      }

      const checkResult = await runSystemCheck();
      setResult(checkResult);
      setProgress(100);
      setCurrentCheck('Complete!');
      setStatus('complete');

      onComplete?.(checkResult);
    } catch (error) {
      console.error('System check error:', error);
      setStatus('error');
    }
  };

  const saveToProfile = async () => {
    if (!result || !agentId) return;

    setSaving(true);
    const supabase = getSupabaseClient();

    try {
      // Save system check to agent profile
      // Cast needed because system_check columns were added via SQL migration
      const { error } = await supabase
        .from('agents')
        .update({
          system_check: result,
          system_check_date: new Date().toISOString(),
        } as never)
        .eq('id', agentId);

      if (!error) {
        setSaved(true);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const getSpeedRating = (mbps: number) => {
    if (mbps >= 50) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    if (mbps >= 25) return { label: 'Good', color: 'text-cyan-600', bg: 'bg-cyan-100' };
    if (mbps >= 10) return { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (status === 'idle') {
    return (
      <Card className="border-zinc-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Cpu className="h-8 w-8 text-cyan-600" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">System Requirements Check</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
              We'll check your internet speed, hardware specs, and equipment to ensure you meet job requirements.
            </p>
            <Button onClick={runCheck} className="bg-cyan-600 hover:bg-cyan-700">
              <Zap className="h-4 w-4 mr-2" />
              Run System Check
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'running') {
    return (
      <Card className="border-zinc-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Loader2 className="h-8 w-8 text-cyan-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Scanning Your System...</h3>
            <p className="text-sm text-zinc-500 mb-4">{currentCheck}</p>
            <Progress value={progress} className="h-2 max-w-xs mx-auto" />
            <p className="text-xs text-zinc-400 mt-2">{progress}%</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Check Failed</h3>
          <p className="text-sm text-red-600 mb-4">Unable to complete system check. Please try again.</p>
          <Button onClick={runCheck} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const speedRating = getSpeedRating(result.internetSpeed.downloadMbps);

  if (compact) {
    return (
      <Card className="border-zinc-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-zinc-900">System Check Results</h3>
            <Badge className={speedRating.bg + ' ' + speedRating.color}>{speedRating.label}</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-cyan-500" />
              <span>{result.internetSpeed.downloadMbps} Mbps</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-500" />
              <span>{result.hardware.cpuCores} Cores</span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-blue-500" />
              <span>{result.screen.width}x{result.screen.height}</span>
            </div>
            <div className="flex items-center gap-2">
              {result.ipInfo.isVpn ? (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              ) : (
                <Shield className="h-4 w-4 text-emerald-500" />
              )}
              <span>{result.ipInfo.isVpn ? 'VPN' : 'Direct'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-cyan-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">System Check Complete</h3>
                <p className="text-sm text-zinc-500">
                  Completed in {result.checkDuration}ms • {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={runCheck}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Re-run
              </Button>
              {showSaveButton && agentId && (
                <Button
                  size="sm"
                  onClick={saveToProfile}
                  disabled={saving || saved}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Saved
                    </>
                  ) : (
                    'Save to Profile'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Internet Speed */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wifi className="h-5 w-5 text-cyan-500" />
              Internet Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-zinc-900">{result.internetSpeed.downloadMbps}</span>
                <Badge className={speedRating.bg + ' ' + speedRating.color}>{speedRating.label}</Badge>
              </div>
              <p className="text-sm text-zinc-500">Mbps Download Speed</p>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-zinc-500">Latency</p>
                  <p className="font-medium">{result.internetSpeed.latencyMs}ms</p>
                </div>
                <div>
                  <p className="text-zinc-500">Type</p>
                  <p className="font-medium">{result.internetSpeed.effectiveType}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hardware */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-5 w-5 text-purple-500" />
              Hardware
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-zinc-900">{result.hardware.cpuCores}</p>
                  <p className="text-sm text-zinc-500">CPU Cores</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900">
                    {result.hardware.ramGB ? `${result.hardware.ramGB}GB` : 'N/A'}
                  </p>
                  <p className="text-sm text-zinc-500">RAM</p>
                </div>
              </div>
              <Separator />
              <div className="text-sm">
                <p className="text-zinc-500">Platform</p>
                <p className="font-medium truncate">{result.hardware.platform}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Screen */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-500" />
              Display
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-zinc-900">
                  {result.screen.width} x {result.screen.height}
                </p>
                <p className="text-sm text-zinc-500">Screen Resolution</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-zinc-500">Color Depth</p>
                  <p className="font-medium">{result.screen.colorDepth}-bit</p>
                </div>
                <div>
                  <p className="text-zinc-500">Pixel Ratio</p>
                  <p className="font-medium">{result.screen.pixelRatio}x</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IP & Location */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-rose-500" />
              Location & IP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900">{result.ipInfo.city}</p>
                  <p className="text-sm text-zinc-500">{result.ipInfo.region}, {result.ipInfo.country}</p>
                </div>
                {result.ipInfo.isVpn || result.ipInfo.isProxy ? (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    VPN
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                    <Shield className="h-3 w-3 mr-1" />
                    Direct
                  </Badge>
                )}
              </div>
              <Separator />
              <div className="text-sm">
                <p className="text-zinc-500">ISP</p>
                <p className="font-medium truncate">{result.ipInfo.isp}</p>
              </div>
              <div className="text-sm">
                <p className="text-zinc-500">IP Address</p>
                <p className="font-medium font-mono text-xs">{result.ipInfo.ip}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Devices */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-5 w-5 text-amber-500" />
              Media Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-zinc-400" />
                  <span>Webcam</span>
                </div>
                {result.mediaDevices.hasWebcam ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-zinc-400" />
                  <span>Microphone</span>
                </div>
                {result.mediaDevices.hasMicrophone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-zinc-400" />
                  <span>Speakers</span>
                </div>
                {result.mediaDevices.hasSpeakers ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Browser */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Chrome className="h-5 w-5 text-green-500" />
              Browser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-lg font-bold text-zinc-900">{result.browser.name}</p>
                <p className="text-sm text-zinc-500">Version {result.browser.version}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-zinc-500">Language</p>
                  <p className="font-medium">{result.browser.language}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Online</p>
                  <p className="font-medium">{result.browser.online ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
