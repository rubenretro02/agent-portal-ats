import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side IP geolocation + VPN/proxy detection.
 *
 * Runs the lookup on the server so it works on https (no mixed-content block)
 * and reads the agent's real client IP from forwarded headers. Uses ip-api.com,
 * which returns proxy/hosting flags used for VPN detection.
 */
export const dynamic = 'force-dynamic';

interface IpResult {
  ip: string;
  city: string;
  region: string;
  country: string;
  timezone: string;
  isp: string;
  isVpn: boolean;
  isProxy: boolean;
  isHosting: boolean;
}

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || '';
}

export async function GET(request: NextRequest) {
  const ip = clientIp(request);

  const fallback: IpResult = {
    ip: ip || 'unknown',
    city: 'unknown',
    region: 'unknown',
    country: 'unknown',
    timezone: '',
    isp: 'unknown',
    isVpn: false,
    isProxy: false,
    isHosting: false,
  };

  try {
    const fields = 'status,country,regionName,city,timezone,isp,proxy,hosting,query';
    // When ip is empty (e.g. local dev) ip-api falls back to the request's IP.
    const target = ip ? `http://ip-api.com/json/${ip}?fields=${fields}` : `http://ip-api.com/json/?fields=${fields}`;
    const res = await fetch(target, { cache: 'no-store' });
    const data = await res.json();

    if (data.status === 'success') {
      const result: IpResult = {
        ip: data.query || ip || 'unknown',
        city: data.city || 'unknown',
        region: data.regionName || 'unknown',
        country: data.country || 'unknown',
        timezone: data.timezone || '',
        isp: data.isp || 'unknown',
        isVpn: data.proxy === true,
        isProxy: data.proxy === true,
        isHosting: data.hosting === true,
      };
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('[system/ip] lookup failed', error);
  }

  return NextResponse.json(fallback);
}
