// System Check Utility - Similar to "Can You Run It"
// Detects hardware specs, internet speed, VPN, etc.

export interface SystemCheckResult {
  // Internet
  internetSpeed: {
    downloadMbps: number;
    uploadMbps: number;
    latencyMs: number;
    connectionType: string;
    effectiveType: string;
  };

  // IP & Location
  ipInfo: {
    ip: string;
    city: string;
    region: string;
    country: string;
    timezone: string;
    isp: string;
    isVpn: boolean;
    isProxy: boolean;
    isHosting: boolean;
  };

  // Hardware
  hardware: {
    cpuCores: number;
    ramGB: number | null; // Only available in Chrome
    platform: string;
    userAgent: string;
    isMobile: boolean;
    isTablet: boolean;
  };

  // Screen
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelRatio: number;
    orientation: string;
  };

  // Browser
  browser: {
    name: string;
    version: string;
    language: string;
    languages: string[];
    cookiesEnabled: boolean;
    doNotTrack: boolean;
    online: boolean;
  };

  // Audio/Video
  mediaDevices: {
    hasWebcam: boolean;
    hasMicrophone: boolean;
    hasSpeakers: boolean;
  };

  // Timestamp
  timestamp: string;
  checkDuration: number;
}

// Detect browser name and version
function detectBrowser(): { name: string; version: string } {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = '';

  if (ua.includes('Firefox/')) {
    name = 'Firefox';
    version = ua.split('Firefox/')[1]?.split(' ')[0] || '';
  } else if (ua.includes('Edg/')) {
    name = 'Edge';
    version = ua.split('Edg/')[1]?.split(' ')[0] || '';
  } else if (ua.includes('Chrome/')) {
    name = 'Chrome';
    version = ua.split('Chrome/')[1]?.split(' ')[0] || '';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    name = 'Safari';
    version = ua.split('Version/')[1]?.split(' ')[0] || '';
  } else if (ua.includes('Opera') || ua.includes('OPR/')) {
    name = 'Opera';
    version = ua.split('OPR/')[1]?.split(' ')[0] || '';
  }

  return { name, version };
}

// Detect if mobile or tablet
function detectDeviceType(): { isMobile: boolean; isTablet: boolean } {
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTablet = /ipad|tablet|playbook|silk/i.test(ua) ||
    (isMobile && Math.min(window.screen.width, window.screen.height) > 600);

  return { isMobile: isMobile && !isTablet, isTablet };
}

// Real internet speed test using Cloudflare's open speed endpoints.
// Measures latency, download (~8MB) and upload (~4MB) against speed.cloudflare.com.
async function testInternetSpeed(): Promise<{ downloadMbps: number; uploadMbps: number; latencyMs: number }> {
  let latencyMs = 0;
  let downloadMbps = 0;
  let uploadMbps = 0;

  // Latency — time a tiny payload round trip.
  try {
    const lStart = performance.now();
    await fetch('https://speed.cloudflare.com/__down?bytes=1000', { cache: 'no-store' });
    latencyMs = Math.round(performance.now() - lStart);
  } catch { /* ignore */ }

  // Download — pull a sizeable payload and measure throughput.
  try {
    const bytes = 8_000_000; // 8 MB
    const dStart = performance.now();
    const res = await fetch(`https://speed.cloudflare.com/__down?bytes=${bytes}`, { cache: 'no-store' });
    const blob = await res.blob();
    const seconds = (performance.now() - dStart) / 1000;
    if (seconds > 0) downloadMbps = Math.round((blob.size * 8 / seconds / 1_000_000) * 10) / 10;
  } catch (error) {
    console.error('Download speed test error:', error);
  }

  // Upload — push a payload and measure throughput.
  try {
    const upSize = 4_000_000; // 4 MB
    const payload = new Uint8Array(upSize);
    const uStart = performance.now();
    await fetch('https://speed.cloudflare.com/__up', { method: 'POST', body: payload, cache: 'no-store' });
    const seconds = (performance.now() - uStart) / 1000;
    if (seconds > 0) uploadMbps = Math.round((upSize * 8 / seconds / 1_000_000) * 10) / 10;
  } catch (error) {
    console.error('Upload speed test error:', error);
  }

  // Fallback to the browser's reported downlink if the download test failed.
  if (downloadMbps === 0) {
    const connection = (navigator as Navigator & { connection?: { downlink?: number } }).connection;
    if (connection?.downlink) downloadMbps = connection.downlink;
  }

  return { downloadMbps, uploadMbps, latencyMs };
}

// Get connection info
function getConnectionInfo(): { connectionType: string; effectiveType: string } {
  const connection = (navigator as Navigator & {
    connection?: { type?: string; effectiveType?: string }
  }).connection;

  return {
    connectionType: connection?.type || 'unknown',
    effectiveType: connection?.effectiveType || 'unknown',
  };
}

// Fetch IP info and VPN detection.
// Goes through our own /api/system/ip route so the lookup runs server-side
// (no mixed-content block on https) and can read the agent's real client IP
// plus proxy/VPN/hosting flags.
async function fetchIpInfo(): Promise<SystemCheckResult['ipInfo']> {
  const defaultResult: SystemCheckResult['ipInfo'] = {
    ip: 'unknown',
    city: 'unknown',
    region: 'unknown',
    country: 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isp: 'unknown',
    isVpn: false,
    isProxy: false,
    isHosting: false,
  };

  try {
    const response = await fetch('/api/system/ip', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      return {
        ip: data.ip || 'unknown',
        city: data.city || 'unknown',
        region: data.region || 'unknown',
        country: data.country || 'unknown',
        timezone: data.timezone || defaultResult.timezone,
        isp: data.isp || 'unknown',
        isVpn: !!data.isVpn,
        isProxy: !!data.isProxy,
        isHosting: !!data.isHosting,
      };
    }
  } catch (error) {
    console.error('IP info fetch error:', error);
  }

  return defaultResult;
}

// Check media devices
async function checkMediaDevices(): Promise<SystemCheckResult['mediaDevices']> {
  const result = {
    hasWebcam: false,
    hasMicrophone: false,
    hasSpeakers: false,
  };

  try {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();

      for (const device of devices) {
        if (device.kind === 'videoinput') result.hasWebcam = true;
        if (device.kind === 'audioinput') result.hasMicrophone = true;
        if (device.kind === 'audiooutput') result.hasSpeakers = true;
      }
    }
  } catch (error) {
    console.error('Media devices check error:', error);
  }

  return result;
}

// Main system check function
export async function runSystemCheck(): Promise<SystemCheckResult> {
  const startTime = performance.now();

  // Run parallel checks
  const [speedTest, ipInfo, mediaDevices] = await Promise.all([
    testInternetSpeed(),
    fetchIpInfo(),
    checkMediaDevices(),
  ]);

  const connectionInfo = getConnectionInfo();
  const browserInfo = detectBrowser();
  const deviceType = detectDeviceType();

  const result: SystemCheckResult = {
    internetSpeed: {
      downloadMbps: speedTest.downloadMbps,
      uploadMbps: speedTest.uploadMbps,
      latencyMs: speedTest.latencyMs,
      connectionType: connectionInfo.connectionType,
      effectiveType: connectionInfo.effectiveType,
    },

    ipInfo,

    hardware: {
      cpuCores: navigator.hardwareConcurrency || 1,
      ramGB: (navigator as Navigator & { deviceMemory?: number }).deviceMemory || null,
      platform: navigator.platform || 'unknown',
      userAgent: navigator.userAgent,
      ...deviceType,
    },

    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: window.screen.orientation?.type || 'unknown',
    },

    browser: {
      ...browserInfo,
      language: navigator.language,
      languages: [...navigator.languages],
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1',
      online: navigator.onLine,
    },

    mediaDevices,

    timestamp: new Date().toISOString(),
    checkDuration: Math.round(performance.now() - startTime),
  };

  return result;
}

// Compact, flat snapshot of a system check stored in the agent's assessment
// history. Holds every field an auditor needs to compare runs (same machine,
// same IP, same connection, etc.).
export interface SystemCheckHistoryEntry {
  date: string;
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  cpuCores: number;
  ramGB: number | null;
  screenW: number;
  screenH: number;
  browser: string;
  platform: string;
  ip: string;
  isp: string;
  city: string;
  region: string;
  country: string;
  hasWebcam: boolean;
  hasMicrophone: boolean;
  isVpn: boolean;
}

export function buildSysHistoryEntry(r: SystemCheckResult): SystemCheckHistoryEntry {
  return {
    date: new Date().toISOString(),
    downloadMbps: r.internetSpeed.downloadMbps,
    uploadMbps: r.internetSpeed.uploadMbps,
    latencyMs: r.internetSpeed.latencyMs,
    cpuCores: r.hardware.cpuCores,
    ramGB: r.hardware.ramGB,
    screenW: r.screen.width,
    screenH: r.screen.height,
    browser: `${r.browser.name} ${r.browser.version}`.trim(),
    platform: r.hardware.platform,
    ip: r.ipInfo.ip,
    isp: r.ipInfo.isp,
    city: r.ipInfo.city,
    region: r.ipInfo.region,
    country: r.ipInfo.country,
    hasWebcam: r.mediaDevices.hasWebcam,
    hasMicrophone: r.mediaDevices.hasMicrophone,
    isVpn: r.ipInfo.isVpn || r.ipInfo.isProxy,
  };
}

// Check if system meets job requirements
export interface JobRequirements {
  minInternetSpeed?: number; // Mbps
  minRam?: number; // GB
  minCpuCores?: number;
  minScreenWidth?: number;
  minScreenHeight?: number;
  requiresWebcam?: boolean;
  requiresMicrophone?: boolean;
  noVpn?: boolean;
  allowedCountries?: string[];
}

export interface RequirementCheckResult {
  passed: boolean;
  checks: {
    name: string;
    required: string;
    actual: string;
    passed: boolean;
  }[];
}

export function checkRequirements(
  systemCheck: SystemCheckResult,
  requirements: JobRequirements
): RequirementCheckResult {
  const checks: RequirementCheckResult['checks'] = [];

  // Internet speed
  if (requirements.minInternetSpeed) {
    const passed = systemCheck.internetSpeed.downloadMbps >= requirements.minInternetSpeed;
    checks.push({
      name: 'Internet Speed',
      required: `${requirements.minInternetSpeed} Mbps`,
      actual: `${systemCheck.internetSpeed.downloadMbps} Mbps`,
      passed,
    });
  }

  // RAM
  if (requirements.minRam && systemCheck.hardware.ramGB) {
    const passed = systemCheck.hardware.ramGB >= requirements.minRam;
    checks.push({
      name: 'RAM',
      required: `${requirements.minRam} GB`,
      actual: `${systemCheck.hardware.ramGB} GB`,
      passed,
    });
  }

  // CPU Cores
  if (requirements.minCpuCores) {
    const passed = systemCheck.hardware.cpuCores >= requirements.minCpuCores;
    checks.push({
      name: 'CPU Cores',
      required: `${requirements.minCpuCores} cores`,
      actual: `${systemCheck.hardware.cpuCores} cores`,
      passed,
    });
  }

  // Screen size
  if (requirements.minScreenWidth) {
    const passed = systemCheck.screen.width >= requirements.minScreenWidth;
    checks.push({
      name: 'Screen Width',
      required: `${requirements.minScreenWidth}px`,
      actual: `${systemCheck.screen.width}px`,
      passed,
    });
  }

  if (requirements.minScreenHeight) {
    const passed = systemCheck.screen.height >= requirements.minScreenHeight;
    checks.push({
      name: 'Screen Height',
      required: `${requirements.minScreenHeight}px`,
      actual: `${systemCheck.screen.height}px`,
      passed,
    });
  }

  // Webcam
  if (requirements.requiresWebcam) {
    checks.push({
      name: 'Webcam',
      required: 'Yes',
      actual: systemCheck.mediaDevices.hasWebcam ? 'Yes' : 'No',
      passed: systemCheck.mediaDevices.hasWebcam,
    });
  }

  // Microphone
  if (requirements.requiresMicrophone) {
    checks.push({
      name: 'Microphone',
      required: 'Yes',
      actual: systemCheck.mediaDevices.hasMicrophone ? 'Yes' : 'No',
      passed: systemCheck.mediaDevices.hasMicrophone,
    });
  }

  // VPN check
  if (requirements.noVpn) {
    const passed = !systemCheck.ipInfo.isVpn && !systemCheck.ipInfo.isProxy;
    checks.push({
      name: 'No VPN/Proxy',
      required: 'No VPN',
      actual: systemCheck.ipInfo.isVpn || systemCheck.ipInfo.isProxy ? 'VPN Detected' : 'No VPN',
      passed,
    });
  }

  // Country check
  if (requirements.allowedCountries && requirements.allowedCountries.length > 0) {
    const passed = requirements.allowedCountries.includes(systemCheck.ipInfo.country);
    checks.push({
      name: 'Location',
      required: requirements.allowedCountries.join(', '),
      actual: systemCheck.ipInfo.country,
      passed,
    });
  }

  return {
    passed: checks.every(c => c.passed),
    checks,
  };
}
