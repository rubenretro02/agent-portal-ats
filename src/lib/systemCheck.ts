// System Check Utility - Similar to "Can You Run It"
// Detects hardware specs, internet speed, VPN, etc.

export interface SystemCheckResult {
  // Internet
  internetSpeed: {
    downloadMbps: number;
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

// Test internet speed by downloading a test file
async function testInternetSpeed(): Promise<{ downloadMbps: number; latencyMs: number }> {
  const testUrls = [
    'https://www.google.com/images/phd/px.gif', // ~35 bytes
    'https://www.cloudflare.com/cdn-cgi/trace', // ~200 bytes
  ];

  let latencyMs = 0;
  let downloadMbps = 0;

  try {
    // Test latency with small request
    const latencyStart = performance.now();
    await fetch(testUrls[0], { cache: 'no-store', mode: 'no-cors' });
    latencyMs = Math.round(performance.now() - latencyStart);

    // For a more accurate speed test, we'd need a larger file
    // This is a simplified version
    const speedStart = performance.now();
    const response = await fetch(testUrls[1], { cache: 'no-store' });
    const data = await response.text();
    const speedEnd = performance.now();

    const duration = (speedEnd - speedStart) / 1000; // seconds
    const bytes = new Blob([data]).size;
    const bits = bytes * 8;
    downloadMbps = Math.round((bits / duration / 1000000) * 100) / 100;

    // Estimate based on connection type if available
    const connection = (navigator as Navigator & { connection?: { downlink?: number; effectiveType?: string } }).connection;
    if (connection?.downlink) {
      downloadMbps = connection.downlink;
    }
  } catch (error) {
    console.error('Speed test error:', error);
  }

  return { downloadMbps: Math.max(downloadMbps, 1), latencyMs };
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

// Fetch IP info and VPN detection
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
    // Using ip-api.com (free, no API key needed, includes VPN detection)
    const response = await fetch('http://ip-api.com/json/?fields=status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,query');

    if (!response.ok) {
      // Fallback to ipify for just IP
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      return { ...defaultResult, ip: ipData.ip };
    }

    const data = await response.json();

    if (data.status === 'success') {
      return {
        ip: data.query || 'unknown',
        city: data.city || 'unknown',
        region: data.regionName || 'unknown',
        country: data.country || 'unknown',
        timezone: data.timezone || defaultResult.timezone,
        isp: data.isp || 'unknown',
        isVpn: data.proxy === true,
        isProxy: data.proxy === true,
        isHosting: data.hosting === true,
      };
    }
  } catch (error) {
    console.error('IP info fetch error:', error);

    // Try alternative API
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        ip: data.ip || 'unknown',
        city: data.city || 'unknown',
        region: data.region || 'unknown',
        country: data.country_name || 'unknown',
        timezone: data.timezone || defaultResult.timezone,
        isp: data.org || 'unknown',
        isVpn: false,
        isProxy: false,
        isHosting: false,
      };
    } catch {
      // Return default
    }
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
