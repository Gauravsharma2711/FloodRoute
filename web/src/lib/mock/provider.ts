import {
  MetaResponse,
  ScenariosResponse,
  FlaggedGeoJSON,
  Hospital,
  RouteResponse,
  ValidationResponse,
  EDAResponse,
} from '../../types/api';
import {
  MOCK_META,
  MOCK_SCENARIOS,
  MOCK_HOSPITALS,
  MOCK_FLAGGED_ROADS,
  MOCK_VALIDATION,
  MOCK_EDA,
  MOCK_BBOX,
} from './data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockBackendProvider {
  async meta(): Promise<MetaResponse> {
    await delay(300);
    return MOCK_META;
  }

  async scenarios(): Promise<ScenariosResponse> {
    await delay(350);
    return MOCK_SCENARIOS;
  }

  async flaggedGeojson(
    scenarioId: string,
    shareOverride?: number | null
  ): Promise<FlaggedGeoJSON> {
    await delay(400);
    // Find share
    let share = shareOverride;
    if (share === undefined || share === null) {
      if (scenarioId === MOCK_SCENARIOS.forecast?.id) {
        share = MOCK_SCENARIOS.forecast.flag_share;
      } else {
        const found = MOCK_SCENARIOS.replay_days.find((s) => s.id === scenarioId);
        share = found ? found.flag_share : 0.08;
      }
    }

    // Filter features based on score and share
    // Higher share means more roads flagged
    const threshold = 1 - (share ?? 0.08);
    const filtered = MOCK_FLAGGED_ROADS.features.filter((f) => f.properties.score >= Math.max(0.7, threshold));

    return {
      type: 'FeatureCollection',
      features: filtered.length > 0 ? filtered : MOCK_FLAGGED_ROADS.features.slice(0, 2),
    };
  }

  async hospitals(): Promise<Hospital[]> {
    await delay(300);
    return MOCK_HOSPITALS;
  }

  async route(
    lat: number,
    lon: number,
    scenarioId: string,
    shareOverride?: number | null
  ): Promise<RouteResponse> {
    await delay(450);

    // 1. Outside study area check
    if (
      lon < MOCK_BBOX.west ||
      lon > MOCK_BBOX.east ||
      lat < MOCK_BBOX.south ||
      lat > MOCK_BBOX.north
    ) {
      return {
        status: 'outside_area',
        note: 'Click inside the highlighted study area.',
      };
    }

    // 2. Cut-off state (e.g., Kurla basin or extreme flood scenario near low-lying points)
    // Distance to Kurla (19.0726, 72.8845)
    const distToKurla = Math.hypot(lat - 19.0726, lon - 72.8845);
    const isHeavy = scenarioId.includes('2019') || scenarioId.includes('2005') || (shareOverride ?? 0) >= 0.20;

    if (distToKurla < 0.018 || (isHeavy && distToKurla < 0.025)) {
      return {
        status: 'cut_off',
        nearest_hospital_straight_line: {
          name: 'Rajawadi Hospital',
          distance_km: 2.1,
        },
        blocked_on_normal: [
          { name: 'CST Road / Kurla West', score: 0.95 },
          { name: 'Bail Bazar Road', score: 0.89 },
        ],
        note: 'No flood-safe route. This area is cut off in this scenario.',
      };
    }

    // 3. No change state (e.g. South Mumbai / Colaba / high ground)
    const distToColaba = Math.hypot(lat - 18.9067, lon - 72.8147);
    if (distToColaba < 0.03) {
      const normalCoords: [number, number][] = [
        [lat, lon],
        [18.9150, 72.8200],
        [18.9280, 72.8250],
        [18.9398, 72.8285], // Bombay Hospital
      ];
      return {
        status: 'no_change',
        normal: {
          hospital: 'Bombay Hospital',
          coords: normalCoords,
          minutes: 18,
          km: 5.4,
        },
        safe: {
          hospital: 'Bombay Hospital',
          coords: normalCoords,
          minutes: 18,
          km: 5.4,
        },
        added_minutes: 0,
        blocked_on_normal: [],
        note: 'Normal route is not affected.',
      };
    }

    // 4. Default Ok State: Normal route blocked, safe detour provided!
    // Realistic coordinates from Dadar/Hindmata to KEM (normal) vs Sion (safe)
    const normalCoords: [number, number][] = [
      [lat, lon],
      [19.0118, 72.8427], // Through Hindmata junction (flooded)
      [19.0070, 72.8425],
      [19.0028, 72.8423], // KEM Hospital
    ];

    const safeCoords: [number, number][] = [
      [lat, lon],
      [19.0160, 72.8380], // Elevated bypass via Senapati Bapat Marg
      [19.0230, 72.8450],
      [19.0310, 72.8530],
      [19.0357, 72.8601], // Sion Hospital (LTMGH)
    ];

    return {
      status: 'ok',
      normal: {
        hospital: 'Hospital X (KEM Hospital)',
        coords: normalCoords,
        minutes: 18,
        km: 3.2,
      },
      safe: {
        hospital: 'Hospital Y (Sion Hospital)',
        coords: safeCoords,
        minutes: 32,
        km: 6.8,
      },
      added_minutes: 14,
      blocked_on_normal: [
        { name: 'Hindmata Junction', score: 0.96 },
      ],
      note: 'Send to Hospital Y (Sion Hospital); avoid Hindmata Junction.',
    };
  }

  async validation(): Promise<ValidationResponse> {
    await delay(300);
    return MOCK_VALIDATION;
  }

  async eda(): Promise<EDAResponse> {
    await delay(300);
    return MOCK_EDA;
  }
}

export const mockBackend = new MockBackendProvider();
