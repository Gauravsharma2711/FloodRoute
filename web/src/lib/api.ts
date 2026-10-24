import useSWR from 'swr';
import {
  MetaResponse,
  ScenariosResponse,
  FlaggedGeoJSON,
  Hospital,
  RouteResponse,
  ValidationResponse,
  EDAResponse,
} from '../types/api';
import { mockBackend } from './mock/provider';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').trim().replace(/\/+$/, '');

// Mock data is used ONLY when no API base is configured (the UI then shows the
// "SYNTHETIC UI FIXTURE" ribbon from meta.data_mode). If a real API is configured and a
// call fails, the error is thrown so the UI shows an error state: synthetic data must
// never appear in place of real data.
class ApiClient {
  private base: string;

  constructor(base: string) {
    this.base = base;
  }

  // "auto" = same host the page was opened on, port 8000. Lets phones on the same Wi-Fi use the
  // laptop's API (open the app at http://<laptop-ip>:3000) without editing any config.
  private get resolvedBase(): string {
    if (this.base === 'auto') {
      return typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : '';
    }
    return this.base;
  }

  isRealBackendConfigured(): boolean {
    return Boolean(this.base);
  }

  private async getJson<T>(
    path: string,
    params: Record<string, string | number | null | undefined> = {},
    signal?: AbortSignal
  ): Promise<T> {
    const url = new URL(`${this.resolvedBase}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    let res: Response;
    try {
      res = await fetch(url.toString(), { signal });
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') throw e;
      throw new Error('Cannot reach the FloodRoute server. It may be waking up: please try again in a moment.');
    }
    if (!res.ok) throw new Error(`The FloodRoute server answered with an error (HTTP ${res.status}).`);
    return (await res.json()) as T;
  }

  meta(): Promise<MetaResponse> {
    return this.base ? this.getJson('/api/meta') : mockBackend.meta();
  }

  scenarios(): Promise<ScenariosResponse> {
    return this.base ? this.getJson('/api/scenarios') : mockBackend.scenarios();
  }

  flagged(scenarioId: string, share?: number | null): Promise<FlaggedGeoJSON> {
    return this.base
      ? this.getJson('/api/flagged', { scenario_id: scenarioId, share })
      : mockBackend.flaggedGeojson(scenarioId, share);
  }

  hospitals(): Promise<Hospital[]> {
    return this.base ? this.getJson('/api/hospitals') : mockBackend.hospitals();
  }

  route(lat: number, lon: number, scenarioId: string, share?: number | null, signal?: AbortSignal): Promise<RouteResponse> {
    return this.base
      ? this.getJson('/api/route', { lat, lon, scenario_id: scenarioId, share }, signal)
      : mockBackend.route(lat, lon, scenarioId, share);
  }

  validation(): Promise<ValidationResponse> {
    return this.base ? this.getJson('/api/validation') : mockBackend.validation();
  }

  eda(): Promise<EDAResponse> {
    return this.base ? this.getJson('/api/eda') : mockBackend.eda();
  }
}

export const api = new ApiClient(API_BASE);

// --- SWR Hooks ---

export function useMeta() {
  return useSWR<MetaResponse>('/api/meta', () => api.meta(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}

export function useScenarios() {
  return useSWR<ScenariosResponse>('/api/scenarios', () => api.scenarios(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}

export function useFlagged(scenarioId?: string, share?: number | null) {
  const key = scenarioId ? ['/api/flagged', scenarioId, share ?? 'default'] : null;
  return useSWR<FlaggedGeoJSON>(
    key,
    () => api.flagged(scenarioId!, share),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );
}

export function useHospitals() {
  return useSWR<Hospital[]>('/api/hospitals', () => api.hospitals(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}

export function useValidation() {
  return useSWR<ValidationResponse>('/api/validation', () => api.validation(), {
    revalidateOnFocus: false,
  });
}

export function useEDA() {
  return useSWR<EDAResponse>('/api/eda', () => api.eda(), {
    revalidateOnFocus: false,
  });
}
