import { RouteResponse, Scenario } from '../types/api';

// "Send to driver": builds a plain-text message plus a link to the driver's phone view.
// Sending goes through the dispatcher's own WhatsApp / SMS app (a person taps send):
// no paid messaging API, no account, no key.

export interface DispatchContext {
  route: RouteResponse;
  scenario?: Scenario;
  patient: { lat: number; lon: number };
  share?: number | null;
}

export function driverLink({ scenario, patient, share }: DispatchContext): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const q = new URLSearchParams({
    lat: patient.lat.toFixed(5),
    lon: patient.lon.toFixed(5),
    scenario: scenario?.id ?? '',
  });
  if (share !== null && share !== undefined) q.set('share', String(share));
  return `${origin}/driver?${q.toString()}`;
}

export function driverMessage(ctx: DispatchContext): string {
  const { route, scenario, patient } = ctx;
  const lines: string[] = ['FloodRoute ambulance dispatch'];
  if (scenario) {
    lines.push(`Rain scenario: ${scenario.label} (${scenario.rain_mm} mm, ${scenario.imd_category.replace('_', ' ')})`);
  }
  lines.push(`Patient: ${patient.lat.toFixed(5)}, ${patient.lon.toFixed(5)}`);

  const avoid = (route.blocked_on_normal ?? []).map((b) => b.name).filter((n) => n !== 'Unnamed road');
  if (route.status === 'cut_off') {
    lines.push('NO flood-safe main-road route from this area. Coordinate with control before moving.');
    if (route.nearest_hospital_straight_line) {
      const n = route.nearest_hospital_straight_line;
      lines.push(`Nearest major hospital (straight line): ${n.name}, ${n.distance_km} km`);
    }
  } else if (route.safe) {
    lines.push(`GO TO: ${route.safe.hospital}`);
    lines.push(`Flood-safe route: about ${Math.round(route.safe.minutes)} min, ${route.safe.km} km`);
    if (route.status === 'ok' && route.added_minutes !== null && route.added_minutes !== undefined) {
      lines.push(`+${route.added_minutes.toFixed(1)} min vs normal route${route.normal && route.normal.hospital !== route.safe.hospital ? ` (normal choice was ${route.normal.hospital})` : ''}`);
    }
  }
  if (avoid.length) lines.push(`AVOID: ${avoid.slice(0, 3).join(', ')}`);
  if (route.status !== 'cut_off') lines.push(`Route map: ${driverLink(ctx)}`);
  lines.push('Planning estimate from terrain, not a live flood report. Follow traffic police updates.');
  return lines.join('\n');
}

export const whatsappUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
export const smsUrl = (text: string) => `sms:?&body=${encodeURIComponent(text)}`;
