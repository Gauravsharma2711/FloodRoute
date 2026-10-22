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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim() || '';

// Internal fetcher that calls real API if API_BASE is configured, or falls back to mock
class ApiClient {
  private base: string;

  constructor(base: string) {
    this.base = base;
  }

  isRealBackendConfigured(): boolean {
    return Boolean(this.base);
  }

  async meta(): Promise<MetaResponse> {
    if (!this.base) {
      return mockBackend.meta();
    }
    try {
      const res = await fetch(`${this.base}/api/meta`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return mockBackend.meta();
    }
  }

  async scenarios(): Promise<ScenariosResponse> {
    if (!this.base) {
      return mockBackend.scenarios();
    }
    try {
      const res = await fetch(`${this.base}/api/scenarios`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return mockBackend.scenarios();
    }
  }

  async flagged(scenarioId: string, share?: number | null): Promise<FlaggedGeoJSON> {
    if (!this.base) {
      return mockBackend.flaggedGeojson(scenarioId, share);
    }
    try {
      const url = new URL(`${this.base}/api/flagged`);
      url.searchParams.set('scenario_id', scenarioId);
      if (share !== undefined && share !== null) {
        url.searchParams.set('share', share.toString());
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return mockBackend.flaggedGeojson(scenarioId, share);
    }
  }

  async hospitals(): Promise<Hospital[]> {
    if (!this.base) {
      return mockBackend.hospitals();
    }
    try {
      const res = await fetch(`${this.base}/api/hospitals`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return mockBackend.hospitals();
    }
  }

  async route(
    lat: number,
    lon: number,
    scenarioId: string,
    share?: number | null,
    signal?: AbortSignal
  ): Promise<RouteResponse> {
    if (!this.base) {
      return mockBackend.route(lat, lon, scenarioId, share);
    }
    try {
      const url = new URL(`${this.base}/api/route`);
      url.searchParams.set('lat', lat.toString());
      url.searchParams.set('lon', lon.toString());
      url.searchParams.set('scenario_id', scenarioId);
      if (share !== undefined && share !== null) {
        url.searchParams.set('share', share.toString());
      }
      const res = await fetch(url.toString(), { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw e;
      }
      return mockBackend.route(lat, lon, scenarioId, share);
    }
  }

  async validation(): Promise<ValidationResponse> {
    if (!this.base) {
      return mockBackend.validation();
    }
    try {
      const res = await fetch(`${this.base}/api/validation`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return mockBackend.validation();
    }
  }

  async eda(): Promise<EDAResponse> {
    if (!this.base) {
      return mockBackend.eda();
    }
    try {
      const res = await fetch(`${this.base}/api/eda`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return mockBackend.eda();
    }
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
