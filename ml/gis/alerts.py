"""
WHERE: ml/gis/alerts.py
WHY: Auditability is a hard PS requirement -- this rules out a black-box anomaly
     model in favor of transparent, inspectable geometric/statistical rules that
     state exactly what changed and why. Deliberately NOT another ML model.
ALGORITHM: geodesic distance vs. rolling baseline + set-difference + point-in-polygon
     + historical-frequency-adjusted absence check, each with survey-artefact filtering.
"""
from dataclasses import dataclass
from datetime import date, datetime
import math

try:
    from geopy.distance import geodesic
except ImportError:
    geodesic = None

from shapely.geometry import Point, Polygon

RANGE_SHIFT_BUFFER_KM = 5.0
RANGE_SHIFT_CORE_KM2 = 17.5  # midpoint of the PS's 15-20 km^2 core threshold


@dataclass
class Alert:
    alert_type: str
    severity: str
    magnitude: float
    magnitude_unit: str
    reason: str
    is_survey_artefact: bool = False


def geodesic_km(p1: tuple[float, float], p2: tuple[float, float]) -> float:
    if geodesic is not None:
        try:
            return float(geodesic(p1, p2).km)
        except Exception:
            pass
    # Haversine fallback formula
    R = 6371.0
    dlat = math.radians(p2[0] - p1[0])
    dlon = math.radians(p2[1] - p1[1])
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(p1[0])) * math.cos(math.radians(p2[0])) * math.sin(dlon / 2)**2
    return float(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


def check_range_shift(historical_centroid: tuple[float, float], current_centroid: tuple[float, float], zone: str,
                       historical_core_area_km2: float, current_core_area_km2: float) -> Alert | None:
    if zone.lower() == "buffer":
        dist_km = geodesic_km(historical_centroid, current_centroid)
        if dist_km > RANGE_SHIFT_BUFFER_KM:
            return Alert("range_shift", "high", dist_km, "km",
                         f"Buffer-zone centroid shifted {dist_km:.1f} km, exceeding the 5 km rule")
    else:  # core -- area-change rule, not distance
        area_change = abs(current_core_area_km2 - historical_core_area_km2)
        if area_change > RANGE_SHIFT_CORE_KM2:
            return Alert("range_shift", "high", area_change, "km2",
                         f"Core home-range area changed by {area_change:.1f} km2")
    return None


def check_new_station(historical_stations: set[str], current_stations: set[str],
                       station_install_dates: dict[str, date], previous_survey_end: date) -> list[Alert]:
    new_stations = current_stations - historical_stations
    alerts = []
    for s in new_stations:
        install_date = station_install_dates.get(s, date.min)
        is_artefact = install_date > previous_survey_end if previous_survey_end else False
        alerts.append(Alert(
            "new_station", "medium" if not is_artefact else "low", 1, "count",
            f"First capture at station {s}" + (" (new camera -- survey artefact)" if is_artefact else ""),
            is_survey_artefact=is_artefact,
        ))
    return alerts


def check_buffer_movement(capture_points: list[tuple[float, float]],
                           historical_points: list[tuple[float, float]],
                           buffer_polygon: Polygon) -> Alert | None:
    new_in_buffer = [p for p in capture_points if Point(p[1], p[0]).within(buffer_polygon)]
    old_in_buffer = [p for p in historical_points if Point(p[1], p[0]).within(buffer_polygon)]
    if new_in_buffer and not old_in_buffer:
        return Alert("buffer_movement", "high", len(new_in_buffer), "count",
                     "First captures inside buffer/village-adjacent zone")
    return None


def check_prolonged_absence(last_seen: date, today: date,
                             historical_capture_gaps_days: list[int]) -> Alert | None:
    expected_gap = max(historical_capture_gaps_days, default=30)
    threshold = expected_gap * 3
    absence_days = (today - last_seen).days
    if absence_days > threshold:
        return Alert("prolonged_absence", "medium", absence_days, "days",
                     f"No capture for {absence_days}d, exceeding this tiger's usual {expected_gap}d rhythm x3")
    return None
