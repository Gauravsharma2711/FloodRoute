import {
  MetaResponse,
  ScenariosResponse,
  Hospital,
  FlaggedGeoJSON,
  ValidationResponse,
  EDAResponse,
} from '../../types/api';

export const MOCK_BBOX = {
  west: 72.80,
  south: 18.89,
  east: 72.93,
  north: 19.14,
};

export const MOCK_PRESETS = [
  { id: 'hindmata', name: 'Hindmata', lat: 19.0118, lon: 72.8427, description: 'Dadar East, historic depression' },
  { id: 'sion', name: 'Sion / Gandhi Market', lat: 19.0390, lon: 72.8619, description: 'Sion Circle & King\'s Circle basin' },
  { id: 'milan', name: 'Milan Subway', lat: 19.0833, lon: 72.8436, description: 'Santacruz underpass corridor' },
  { id: 'kurla', name: 'Kurla', lat: 19.0726, lon: 72.8845, description: 'Mithi river flood-plain basin' },
  { id: 'chembur', name: 'Chembur', lat: 19.0622, lon: 72.8997, description: 'Shell Colony low-lying junction' },
  { id: 'andheri', name: 'Andheri', lat: 19.1136, lon: 72.8697, description: 'Andheri Subway railway crossing' },
  { id: 'bandra', name: 'Bandra', lat: 19.0596, lon: 72.8295, description: 'Hill Road / SV Road junction' },
  { id: 'colaba', name: 'Colaba', lat: 18.9067, lon: 72.8147, description: 'South Mumbai coastal high ground' },
];

export const MOCK_META: MetaResponse = {
  city: 'Mumbai',
  bbox: MOCK_BBOX,
  data_mode: 'fixture',
  built_at: '2026-10-22T20:00:00Z',
  sources: [
    'OpenStreetMap (OSM roads & hospitals)',
    'Copernicus DEM GLO-30 (elevation)',
    'Open-Meteo Archive & Forecast (rainfall)',
    'India Meteorological Department (IMD rainfall classification)',
  ],
  presets: MOCK_PRESETS,
};

export const MOCK_SCENARIOS: ScenariosResponse = {
  forecast: {
    id: 'forecast-tomorrow',
    label: 'Tomorrow · forecast',
    date: 'Tomorrow',
    rain_mm: 110,
    imd_category: 'heavy',
    flag_share: 0.08,
    source: 'Open-Meteo Forecast',
    description: 'Anticipated low-lying road waterlogging. 8% of roads flagged.',
  },
  replay_days: [
    {
      id: 'replay-2020-08-05',
      label: '5 Aug 2020 · 187 mm',
      date: '2020-08-05',
      rain_mm: 187,
      imd_category: 'very_heavy',
      flag_share: 0.15,
      source: 'Open-Meteo Archive',
      description: 'Major monsoon surge. 15% most flood-prone roads flagged.',
    },
    {
      id: 'replay-2019-07-02',
      label: '2 Jul 2019 · 231 mm',
      date: '2019-07-02',
      rain_mm: 231,
      imd_category: 'extremely_heavy',
      flag_share: 0.25,
      source: 'Open-Meteo Archive',
      description: 'Record torrential rain. 25% most flood-prone roads flagged.',
    },
    {
      id: 'replay-2017-08-29',
      label: '29 Aug 2017 · 315 mm',
      date: '2017-08-29',
      rain_mm: 315,
      imd_category: 'extremely_heavy',
      flag_share: 0.25,
      source: 'Open-Meteo Archive',
      description: 'Massive transit disruption. 25% most flood-prone roads flagged.',
    },
    {
      id: 'replay-2019-09-04',
      label: '4 Sep 2019 · 214 mm',
      date: '2019-09-04',
      rain_mm: 214,
      imd_category: 'extremely_heavy',
      flag_share: 0.25,
      source: 'Open-Meteo Archive',
      description: 'Severe waterlogging across Dadar and Kurla corridors.',
    },
    {
      id: 'replay-2005-07-26',
      label: '26 Jul 2005 · 944 mm',
      date: '2005-07-26',
      rain_mm: 944,
      imd_category: 'extremely_heavy',
      flag_share: 0.25,
      source: 'Open-Meteo Archive',
      description: 'Historic Mumbai deluge event. Highest recorded rainfall.',
    },
  ],
  category_to_share: {
    light: 0.00,
    moderate: 0.03,
    heavy: 0.08,
    very_heavy: 0.15,
    extremely_heavy: 0.25,
  },
};

export const MOCK_HOSPITALS: Hospital[] = [
  { id: 'hosp-kem', name: 'KEM Hospital', lat: 19.0028, lon: 72.8423, emergency: true },
  { id: 'hosp-sion', name: 'Sion Hospital (LTMGH)', lat: 19.0357, lon: 72.8601, emergency: true },
  { id: 'hosp-lilavati', name: 'Lilavati Hospital', lat: 19.0514, lon: 72.8290, emergency: true },
  { id: 'hosp-nanavati', name: 'Nanavati Hospital', lat: 19.0964, lon: 72.8407, emergency: true },
  { id: 'hosp-hinduja', name: 'Hinduja Hospital', lat: 19.0336, lon: 72.8384, emergency: true },
  { id: 'hosp-rajawadi', name: 'Rajawadi Hospital', lat: 19.0768, lon: 72.8988, emergency: true },
  { id: 'hosp-bombay', name: 'Bombay Hospital', lat: 18.9398, lon: 72.8285, emergency: true },
  { id: 'hosp-reliance', name: 'Sir H. N. Reliance Hospital', lat: 18.9567, lon: 72.8197, emergency: true },
];

export const MOCK_FLAGGED_ROADS: FlaggedGeoJSON = {
  type: 'FeatureCollection',
  features: [
    // Hindmata Corridor
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [72.8405, 19.0105],
          [72.8427, 19.0118],
          [72.8445, 19.0135],
        ],
      },
      properties: {
        name: 'Hindmata Junction / Dr. B.A. Road',
        highway: 'primary',
        score: 0.96,
        rel_elev_m: -1.8,
        water_dist_m: 120,
        is_underpass: true,
        why: '1.8 m lower than surroundings · 120 m from a creek · underpass depression',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [72.8415, 19.0090],
          [72.8427, 19.0118],
          [72.8432, 19.0140],
        ],
      },
      properties: {
        name: 'Madhavdas Pasta Road',
        highway: 'secondary',
        score: 0.91,
        rel_elev_m: -1.5,
        water_dist_m: 140,
        is_underpass: false,
        why: '1.5 m lower than surroundings · natural rainwater collection bowl',
      },
    },
    // Sion / Gandhi Market
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [72.8590, 19.0370],
          [72.8619, 19.0390],
          [72.8640, 19.0410],
        ],
      },
      properties: {
        name: 'Gandhi Market / King\'s Circle',
        highway: 'primary',
        score: 0.94,
        rel_elev_m: -1.6,
        water_dist_m: 85,
        is_underpass: false,
        why: '1.6 m lower than surroundings · 85 m from storm canal · chronic water accumulation',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [72.8619, 19.0390],
          [72.8630, 19.0355],
        ],
      },
      properties: {
        name: 'Sion Circle Approach',
        highway: 'primary',
        score: 0.88,
        rel_elev_m: -1.2,
        water_dist_m: 110,
        is_underpass: false,
        why: '1.2 m lower than surroundings · 110 m from railway culvert',
      },
    },
    // Milan Subway
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [72.8410, 19.0825],
          [72.8436, 19.0833],
          [72.8460, 19.0842],
        ],
      },
      properties: {
        name: 'Milan Subway Underpass',
        highway: 'secondary',
        score: 0.98,
        rel_elev_m: -2.4,
        water_dist_m: 60,
        is_underpass: true,
        why: '2.4 m lower than surroundings · railway underpass · severe dip',
      },
    },
    // Kurla / Mithi River
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [72.8810, 19.0710],
          [72.8845, 19.0726],
          [72.8880, 19.0745],
        ],
      },
      properties: {
        name: 'CST Road / Kurla West',
        highway: 'primary',
        score: 0.95,
        rel_elev_m: -1.9,
        water_dist_m: 45,
        is_underpass: false,
        why: '1.9 m lower than surroundings · 45 m from Mithi River channel',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [72.8845, 19.0726],
          [72.8860, 19.0685],
        ],
      },
      properties: {
        name: 'Bail Bazar Road',
        highway: 'tertiary',
        score: 0.89,
        rel_elev_m: -1.4,
        water_dist_m: 70,
        is_underpass: false,
        why: '1.4 m lower than surroundings · 70 m from tidal canal',
      },
    },
    // Andheri Subway
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [72.8670, 19.1125],
          [72.8697, 19.1136],
          [72.8725, 19.1145],
        ],
      },
      properties: {
        name: 'Andheri Subway',
        highway: 'secondary',
        score: 0.97,
        rel_elev_m: -2.2,
        water_dist_m: 90,
        is_underpass: true,
        why: '2.2 m lower than surroundings · railway underpass · water accumulation point',
      },
    },
    // Chembur Shell Colony
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [72.8960, 19.0605],
          [72.8997, 19.0622],
          [72.9030, 19.0635],
        ],
      },
      properties: {
        name: 'Shell Colony Road',
        highway: 'secondary',
        score: 0.86,
        rel_elev_m: -1.1,
        water_dist_m: 130,
        is_underpass: false,
        why: '1.1 m lower than surroundings · low-lying reclaimed swamp margin',
      },
    },
  ],
};

export const MOCK_VALIDATION: ValidationResponse = {
  data_mode: 'fixture',
  n_spots: 17,
  snap_m: 150,
  auc_score: undefined,
  auc_elev_only: undefined,
  ci: undefined,
  curves: undefined,
  notes: 'n/a in fixture mode',
};

export const MOCK_EDA: EDAResponse = {
  findings: [
    {
      id: 'eda-elev',
      title: 'Elevation Depression Profile',
      caption: 'Reported waterlogging spots sit 1.4 m to 2.4 m lower than the surrounding 300 m radius median.',
    },
    {
      id: 'eda-monsoon',
      title: 'Historical Heavy Rain Concentration',
      caption: 'Very heavy (>115 mm) rainfall days concentrate heavily in late July and early August.',
    },
    {
      id: 'eda-access',
      title: 'Hospital Access Sensitivity',
      caption: 'Under 15% road flagging, average detour time to nearest accessible trauma hospital rises by 14 minutes.',
    },
  ],
};
