"""Synthetic fixture backend for UI development and testing."""
from typing import Any, Dict, List, Optional
import math

class FixtureBackend:
    """FixtureBackend returns clearly synthetic mock data adhering to DATA_CONTRACT.md."""

    def meta(self) -> Dict[str, Any]:
        return {
            "city": "Mumbai",
            "bbox": {
                "west": 72.80,
                "south": 18.89,
                "east": 72.93,
                "north": 19.14
            },
            "data_mode": "fixture",
            "built_at": "2026-10-23T00:00:00Z",
            "sources": [
                "SYNTHETIC UI FIXTURE (Demo Mode)",
                "OpenStreetMap (Demo)",
                "Copernicus GLO-30 (Demo)",
                "Open-Meteo (Demo)"
            ],
            "presets": [
                {
                    "id": "hindmata",
                    "name": "Hindmata Junction",
                    "lat": 19.0101,
                    "lon": 72.8421,
                    "description": "Chronic flood basin · Status: OK (+14 min)"
                },
                {
                    "id": "sion",
                    "name": "Sion / Gandhi Market",
                    "lat": 19.0349,
                    "lon": 72.8600,
                    "description": "Central depression · Status: OK (+18 min)"
                },
                {
                    "id": "milan_subway",
                    "name": "Milan Subway",
                    "lat": 19.0905,
                    "lon": 72.8426,
                    "description": "Rail underpass · Status: OK (+11 min)"
                },
                {
                    "id": "kurla",
                    "name": "Kurla (LBS Marg)",
                    "lat": 19.0680,
                    "lon": 72.8790,
                    "description": "Mithi river flood zone · Status: CUT OFF"
                },
                {
                    "id": "colaba",
                    "name": "Colaba Causeway",
                    "lat": 18.9100,
                    "lon": 72.8250,
                    "description": "South elevated ridge · Status: NO CHANGE"
                },
                {
                    "id": "chembur",
                    "name": "Chembur Circle",
                    "lat": 19.0541,
                    "lon": 72.8946,
                    "description": "Eastern corridor hub · Status: OK (+9 min)"
                },
                {
                    "id": "andheri",
                    "name": "Andheri West",
                    "lat": 19.1200,
                    "lon": 72.8350,
                    "description": "Suburban hub · Status: OK (+15 min)"
                },
                {
                    "id": "bandra",
                    "name": "Bandra West",
                    "lat": 19.0550,
                    "lon": 72.8300,
                    "description": "Coastal link · Status: OK (+7 min)"
                }
            ]
        }

    def scenarios(self) -> Dict[str, Any]:
        replay_days = [
            {
                "id": "replay_2020_08_05",
                "label": "2020-08-05",
                "date": "2020-08-05",
                "rain_mm": 160.0,
                "imd_category": "very_heavy",
                "flag_share": 0.15,
                "source": "Historical Reanalysis",
                "description": "160 mm gale deluge across island city"
            },
            {
                "id": "replay_2005_07_26",
                "label": "2005-07-26",
                "date": "2005-07-26",
                "rain_mm": 380.0,
                "imd_category": "extremely_heavy",
                "flag_share": 0.25,
                "source": "Historical Reanalysis",
                "description": "Catastrophic cloudburst flooding"
            },
            {
                "id": "replay_2019_07_02",
                "label": "2019-07-02",
                "date": "2019-07-02",
                "rain_mm": 185.0,
                "imd_category": "very_heavy",
                "flag_share": 0.15,
                "source": "Historical Reanalysis",
                "description": "Widespread transit blockage"
            },
            {
                "id": "replay_2021_07_16",
                "label": "2021-07-16",
                "date": "2021-07-16",
                "rain_mm": 110.0,
                "imd_category": "heavy",
                "flag_share": 0.08,
                "source": "Historical Reanalysis",
                "description": "Heavy monsoon inundation"
            },
            {
                "id": "replay_2023_07_21",
                "label": "2023-07-21",
                "date": "2023-07-21",
                "rain_mm": 88.0,
                "imd_category": "heavy",
                "flag_share": 0.08,
                "source": "Historical Reanalysis",
                "description": "Persistent coastal spells"
            },
            {
                "id": "replay_2022_07_05",
                "label": "2022-07-05",
                "date": "2022-07-05",
                "rain_mm": 45.0,
                "imd_category": "moderate",
                "flag_share": 0.03,
                "source": "Historical Reanalysis",
                "description": "Moderate localized waterlogging"
            }
        ]
        
        forecast = {
            "id": "forecast_tomorrow",
            "label": "Tomorrow's Forecast",
            "date": "2026-10-24",
            "rain_mm": 142.5,
            "imd_category": "very_heavy",
            "flag_share": 0.15,
            "source": "Open-Meteo Forecast",
            "fetched_at": "2026-10-23T00:00:00Z",
            "description": "Forecasted very heavy monsoon spells"
        }
        
        return {
            "replay_days": replay_days,
            "forecast": forecast,
            "category_to_share": {
                "light": 0.00,
                "moderate": 0.03,
                "heavy": 0.08,
                "very_heavy": 0.15,
                "extremely_heavy": 0.25
            }
        }

    def flagged_geojson(self, scenario_id: str, share_override: Optional[float] = None) -> Dict[str, Any]:
        """Return synthetic flagged road segments."""
        # A curated set of synthetic road linestrings across central/island Mumbai
        synthetic_roads = [
            {
                "name": "Dr Babasaheb Ambedkar Road (Hindmata)",
                "highway": "primary",
                "score": 0.94,
                "rel_elev_m": -2.1,
                "water_dist_m": 120.0,
                "is_underpass": True,
                "why": "2.1 m below surroundings · 120 m from culvert · railway underpass",
                "coords": [[72.8405, 19.0080], [72.8421, 19.0101], [72.8435, 19.0130]]
            },
            {
                "name": "Sion Circle / Gandhi Market Highway",
                "highway": "trunk",
                "score": 0.91,
                "rel_elev_m": -1.8,
                "water_dist_m": 85.0,
                "is_underpass": False,
                "why": "1.8 m below surroundings · 85 m from creek basin",
                "coords": [[72.8580, 19.0320], [72.8600, 19.0349], [72.8625, 19.0380]]
            },
            {
                "name": "Milan Subway Road",
                "highway": "secondary",
                "score": 0.89,
                "rel_elev_m": -3.2,
                "water_dist_m": 310.0,
                "is_underpass": True,
                "why": "3.2 m below surroundings · railway subway underpass",
                "coords": [[72.8400, 19.0900], [72.8426, 19.0905], [72.8450, 19.0910]]
            },
            {
                "name": "Lal Bahadur Shastri (LBS) Marg",
                "highway": "primary",
                "score": 0.96,
                "rel_elev_m": -2.6,
                "water_dist_m": 45.0,
                "is_underpass": False,
                "why": "2.6 m below surroundings · 45 m from Mithi river channel",
                "coords": [[72.8750, 19.0650], [72.8790, 19.0680], [72.8830, 19.0710]]
            },
            {
                "name": "Eastern Express Highway (Kurla Junction)",
                "highway": "motorway",
                "score": 0.86,
                "rel_elev_m": -1.4,
                "water_dist_m": 90.0,
                "is_underpass": False,
                "why": "1.4 m below surroundings · 90 m from drainage creek",
                "coords": [[72.8820, 19.0620], [72.8850, 19.0660], [72.8870, 19.0700]]
            },
            {
                "name": "Senapati Bapat Marg (Elphinstone)",
                "highway": "secondary",
                "score": 0.78,
                "rel_elev_m": -0.9,
                "water_dist_m": 420.0,
                "is_underpass": False,
                "why": "0.9 m below surroundings · low road depression",
                "coords": [[72.8310, 19.0010], [72.8335, 19.0050], [72.8360, 19.0090]]
            },
            {
                "name": "Santacruz-Chembur Link Road (Low Section)",
                "highway": "primary",
                "score": 0.82,
                "rel_elev_m": -1.5,
                "water_dist_m": 150.0,
                "is_underpass": False,
                "why": "1.5 m below surroundings · 150 m from Mithi tributary",
                "coords": [[72.8650, 19.0700], [72.8700, 19.0720], [72.8750, 19.0730]]
            },
            {
                "name": "Swami Vivekanand (SV) Road (Bandra)",
                "highway": "primary",
                "score": 0.75,
                "rel_elev_m": -0.8,
                "water_dist_m": 280.0,
                "is_underpass": False,
                "why": "0.8 m below surroundings · natural storm drainage path",
                "coords": [[72.8360, 19.0520], [72.8380, 19.0570], [72.8400, 19.0620]]
            }
        ]

        features = []
        for r in synthetic_roads:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": r["coords"]
                },
                "properties": {
                    "name": r["name"],
                    "highway": r["highway"],
                    "score": r["score"],
                    "rel_elev_m": r["rel_elev_m"],
                    "water_dist_m": r["water_dist_m"],
                    "is_underpass": r["is_underpass"],
                    "why": r["why"]
                }
            })

        return {
            "type": "FeatureCollection",
            "features": features
        }

    def hospitals(self) -> List[Dict[str, Any]]:
        return [
            {"id": "kem", "name": "KEM Hospital (Parel)", "lat": 19.0028, "lon": 72.8427, "emergency": True},
            {"id": "sion", "name": "Lokmanya Tilak Municipal General Hospital (Sion)", "lat": 19.0384, "lon": 72.8597, "emergency": True},
            {"id": "nair", "name": "BYL Nair Charitable Hospital (Mumbai Central)", "lat": 18.9715, "lon": 72.8228, "emergency": True},
            {"id": "hinduja", "name": "P.D. Hinduja Hospital (Mahim)", "lat": 19.0322, "lon": 72.8398, "emergency": True},
            {"id": "lilavati", "name": "Lilavati Hospital (Bandra)", "lat": 19.0514, "lon": 72.8291, "emergency": True},
            {"id": "tata", "name": "Tata Memorial Hospital (Parel)", "lat": 19.0051, "lon": 72.8435, "emergency": True},
            {"id": "cooper", "name": "RN Cooper Hospital (Juhu)", "lat": 19.1084, "lon": 72.8361, "emergency": True},
            {"id": "saifee", "name": "Saifee Hospital (Charni Road)", "lat": 18.9535, "lon": 72.8182, "emergency": True},
            {"id": "gt", "name": "GT Hospital (Fort)", "lat": 18.9442, "lon": 72.8309, "emergency": True},
            {"id": "rajawadi", "name": "Rajawadi Hospital (Ghatkopar)", "lat": 19.0792, "lon": 72.9064, "emergency": True}
        ]

    def route(self, lat: float, lon: float, scenario_id: str, share_override: Optional[float] = None) -> Dict[str, Any]:
        """Simulate routing with 4 distinct statuses based on coordinate / preset location."""
        # 1. Outside Area check
        if lat < 18.89 or lat > 19.14 or lon < 72.80 or lon > 72.93:
            return {
                "status": "outside_area",
                "normal": None,
                "safe": None,
                "added_minutes": None,
                "blocked_on_normal": [],
                "note": "Location is outside the study area. Please click inside Mumbai island city or suburbs."
            }

        # 2. Cut-off simulation (near Kurla, lat ~ 19.068, lon ~ 72.879)
        if math.isclose(lat, 19.0680, abs_tol=0.015) and math.isclose(lon, 72.8790, abs_tol=0.015):
            return {
                "status": "cut_off",
                "normal": {
                    "hospital": "Rajawadi Hospital (Ghatkopar)",
                    "coords": [
                        [lat, lon],
                        [19.0710, 72.8830],
                        [19.0750, 72.8950],
                        [19.0792, 72.9064]
                    ],
                    "minutes": 12.0,
                    "km": 3.8
                },
                "safe": None,
                "added_minutes": None,
                "blocked_on_normal": [
                    {"name": "Lal Bahadur Shastri (LBS) Marg", "score": 0.96},
                    {"name": "Santacruz-Chembur Link Road", "score": 0.82}
                ],
                "note": "No flood-safe route. All corridors surrounding this area are likely submerged.",
                "nearest_hospital_straight_line": {
                    "name": "Rajawadi Hospital (Ghatkopar)",
                    "distance_km": 3.2
                }
            }

        # 3. No Change simulation (Colaba / South Mumbai, lat < 18.93)
        if lat < 18.93:
            normal_leg = {
                "hospital": "GT Hospital (Fort)",
                "coords": [
                    [lat, lon],
                    [18.9250, 72.8280],
                    [18.9350, 72.8300],
                    [18.9442, 72.8309]
                ],
                "minutes": 8.0,
                "km": 3.1
            }
            return {
                "status": "no_change",
                "normal": normal_leg,
                "safe": normal_leg,
                "added_minutes": 0.0,
                "blocked_on_normal": [],
                "note": "Normal route is not affected. High ground elevation keeps routes clear."
            }

        # 4. Standard OK status with Detour (e.g. Hindmata, Sion, Milan Subway, or random map click)
        # Normal route uses direct road which is blocked
        normal_leg = {
            "hospital": "KEM Hospital (Parel)",
            "coords": [
                [lat, lon],
                [lat - 0.004, lon + 0.002],
                [19.0060, 72.8420],
                [19.0028, 72.8427]
            ],
            "minutes": 9.0,
            "km": 2.8
        }
        
        # Safe route takes clear corridor to alternative / safe hospital
        safe_leg = {
            "hospital": "P.D. Hinduja Hospital (Mahim)",
            "coords": [
                [lat, lon],
                [lat + 0.005, lon - 0.006],
                [19.0200, 72.8350],
                [19.0280, 72.8380],
                [19.0322, 72.8398]
            ],
            "minutes": 23.0,
            "km": 6.5
        }

        return {
            "status": "ok",
            "normal": normal_leg,
            "safe": safe_leg,
            "added_minutes": 14.0,
            "blocked_on_normal": [
                {"name": "Dr Babasaheb Ambedkar Road", "score": 0.94},
                {"name": "Hindmata Flyover Underpass", "score": 0.91}
            ],
            "note": "Send to P.D. Hinduja Hospital via Senapati Bapat Marg; avoid Dr Babasaheb Ambedkar Road."
        }

    def validation(self) -> Dict[str, Any]:
        return {
            "data_mode": "fixture",
            "notes": "n/a in fixture mode"
        }

    def eda(self) -> Dict[str, Any]:
        return {
            "findings": [
                {
                    "id": "eda_1",
                    "title": "Terrain Elevation Distribution vs Reported Waterlogging",
                    "caption": "Synthetic EDA: Reported chronic flood points sit in local low-lying depressions."
                },
                {
                    "id": "eda_2",
                    "title": "Rainfall Seasonality & Extreme Day Frequency",
                    "caption": "Synthetic EDA: Historical extreme rain events are concentrated between June and August."
                },
                {
                    "id": "eda_3",
                    "title": "Hospital Access Loss Under Heavy Rain Scenarios",
                    "caption": "Synthetic EDA: Deluge days severely compromise ambulance response times across central corridors."
                }
            ]
        }

    def city_view(self, scenario_id: str, fix_top_n: int = 0) -> Dict[str, Any]:
        return {
            "scenario_id": scenario_id,
            "fix_top_n": fix_top_n,
            "trips_recovered_pct": min(100.0, fix_top_n * 8.5),
            "critical_roads": [
                {"name": "Dr Babasaheb Ambedkar Road", "criticality_score": 98.5, "cut_off_trips": 142},
                {"name": "LBS Marg (Kurla Section)", "criticality_score": 94.2, "cut_off_trips": 118},
                {"name": "Milan Subway Road", "criticality_score": 88.0, "cut_off_trips": 94},
                {"name": "Sion Circle Link Road", "criticality_score": 82.4, "cut_off_trips": 76}
            ]
        }
