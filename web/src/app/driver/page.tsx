'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Map } from '../../components/Map';
import { api, useFlagged, useHospitals } from '../../lib/api';
import { RouteLeg, RouteResponse } from '../../types/api';

// Google Maps directions URL (a plain link, no API key). Sampled points of OUR flood-safe route are passed
// as waypoints so turn-by-turn navigation follows the safe path instead of re-choosing the flooded one.
function googleMapsUrl(leg: RouteLeg): string {
  const c = leg.coords;
  const origin = c[0];
  const dest = [leg.hospital_lat ?? c[c.length - 1][0], leg.hospital_lon ?? c[c.length - 1][1]];
  const n = Math.min(8, Math.max(0, c.length - 2));
  const waypoints = Array.from({ length: n }, (_, i) => c[Math.round(((i + 1) * (c.length - 1)) / (n + 1))])
    .map(([la, lo]) => `${la.toFixed(5)},${lo.toFixed(5)}`)
    .join('|');
  const q = new URLSearchParams({
    api: '1',
    origin: `${origin[0].toFixed(5)},${origin[1].toFixed(5)}`,
    destination: `${dest[0].toFixed(5)},${dest[1].toFixed(5)}`,
    travelmode: 'driving',
  });
  if (waypoints) q.set('waypoints', waypoints);
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}

function DriverView() {
  const params = useSearchParams();
  const lat = parseFloat(params.get('lat') ?? '');
  const lon = parseFloat(params.get('lon') ?? '');
  const scenario = params.get('scenario') ?? '';
  const shareParam = params.get('share');
  const share = shareParam ? parseFloat(shareParam) : null;
  const valid = Number.isFinite(lat) && Number.isFinite(lon) && scenario !== '';

  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: flagged } = useFlagged(valid ? scenario : undefined, share);
  const { data: hospitals } = useHospitals();

  useEffect(() => {
    if (!valid) return;
    api.route(lat, lon, scenario, share)
      .then(setRoute)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load the route.'));
  }, [valid, lat, lon, scenario, share]);

  const leg = route?.safe ?? null;
  const avoid = (route?.blocked_on_normal ?? []).map((b) => b.name).filter((n) => n !== 'Unnamed road');

  return (
    <div className="h-dvh flex flex-col bg-white text-[#111827]">
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#0B8A7E] text-white flex items-center justify-center font-black">+</div>
        <div>
          <div className="font-bold text-[15px] leading-tight">FloodRoute · Driver</div>
          <div className="text-[11px] text-[#6B7280]">Route sent by your dispatcher</div>
        </div>
      </div>

      <div className="flex-1 relative min-h-0">
        {valid && (
          <Map
            flaggedData={flagged}
            hospitals={hospitals}
            normalRoute={route?.normal}
            safeRoute={route?.safe}
            routeStatus={route?.status}
            blockedRoads={route?.blocked_on_normal}
            patientLocation={{ lat, lon }}
            onSelectLocation={() => undefined}
            className="w-full h-full"
          />
        )}
      </div>

      <div className="border-t border-[#E5E7EB] p-4 space-y-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        {!valid && <p className="text-[15px]">This link is incomplete. Ask the dispatcher to send it again.</p>}
        {error && <p className="text-[15px] text-[#991B1B]">{error}</p>}
        {route?.status === 'cut_off' && (
          <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B]">
            <div className="font-bold text-[17px]">No flood-safe route</div>
            <div className="text-[14px] mt-1">Do not move yet. Call your dispatcher.</div>
          </div>
        )}
        {route?.status === 'outside_area' && <p className="text-[15px]">{route.note}</p>}
        {leg && (
          <>
            <div>
              <div className="text-[13px] text-[#6B7280]">Go to</div>
              <div className="text-[22px] font-extrabold text-[#0B8A7E] leading-tight">{leg.hospital}</div>
              <div className="text-[15px] mt-1">
                about <b>{Math.round(leg.minutes)} min</b> · {leg.km} km
              </div>
            </div>
            {avoid.length > 0 && (
              <div className="p-3 rounded-xl bg-[#FEF2F2] text-[#991B1B] text-[15px]">
                <b>Avoid:</b> {avoid.slice(0, 3).join(', ')}
              </div>
            )}
            <a
              href={googleMapsUrl(leg)}
              target="_blank"
              rel="noopener noreferrer"
              className="h-14 w-full rounded-2xl bg-[#0B8A7E] text-white text-[16px] font-bold flex items-center justify-center gap-2"
            >
              Start navigation (Google Maps)
            </a>
            <p className="text-[11px] text-[#9CA3AF]">
              Planning estimate from terrain, not a live flood report. Follow traffic police updates.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function DriverPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading route…</div>}>
      <DriverView />
    </Suspense>
  );
}
