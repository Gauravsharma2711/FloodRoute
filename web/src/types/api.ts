// API Types mirroring docs/DATA_CONTRACT.md section 3 & 3b

export type RouteStatus = 'ok' | 'cut_off' | 'no_change' | 'outside_area';

export type IMDCategory = 'light' | 'moderate' | 'heavy' | 'very_heavy' | 'extremely_heavy';

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface PresetLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  description?: string;
}

export interface MetaResponse {
  city: string;
  bbox: BoundingBox;
  data_mode: 'real' | 'fixture';
  built_at?: string;
  sources: string[];
  presets: PresetLocation[];
}

export interface Scenario {
  id: string;
  label: string;
  date: string;
  rain_mm: number;
  imd_category: IMDCategory;
  flag_share: number;
  source?: string;
  fetched_at?: string;
  description?: string;
}

export interface ScenariosResponse {
  replay_days: Scenario[];
  forecast: Scenario | null;
  category_to_share: Record<IMDCategory, number>;
}

export interface FlaggedRoadProperties {
  name: string;
  highway: string;
  score: number;
  rel_elev_m: number;
  water_dist_m: number;
  is_underpass: boolean;
  why: string;
}

export interface FlaggedRoadFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lon, lat]
  };
  properties: FlaggedRoadProperties;
}

export interface FlaggedGeoJSON {
  type: 'FeatureCollection';
  features: FlaggedRoadFeature[];
}

export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lon: number;
  emergency: boolean | null;
}

export interface RouteLeg {
  hospital: string;
  coords: [number, number][]; // [[lat, lon], ...]
  minutes: number;
  km: number;
}

export interface BlockedRoad {
  name: string;
  score: number;
}

export interface RouteResponse {
  status: RouteStatus;
  normal?: RouteLeg | null;
  safe?: RouteLeg | null;
  added_minutes?: number | null;
  blocked_on_normal?: BlockedRoad[];
  note: string;
  nearest_hospital_straight_line?: {
    name: string;
    distance_km: number;
  };
}

export interface ValidationCurve {
  flag_share: number;
  recall_score: number;
  recall_elev_only: number;
  expected_random: number;
  lift_score: number;
  lift_elev_only: number;
}

export interface ValidationResponse {
  data_mode: 'real' | 'fixture';
  n_spots?: number;
  snap_m?: number;
  auc_score?: number;
  auc_elev_only?: number;
  ci?: {
    low: number;
    high: number;
  };
  curves?: ValidationCurve[];
  sensitivity?: {
    weights: Record<string, number>;
    share_grid: number[];
  };
  notes?: string;
}

export interface EDAFinding {
  id: string;
  title: string;
  caption: string;
  image_url?: string;
}

export interface EDAResponse {
  findings: EDAFinding[];
}
