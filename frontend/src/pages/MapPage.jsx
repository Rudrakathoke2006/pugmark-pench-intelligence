import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Compass, Play, Pause, RotateCcw, Navigation, MapPin, Car, ExternalLink, Radio, X, AlertTriangle, Activity, Flame, ShieldAlert, Clock, BarChart3 } from 'lucide-react';

const createCustomIcon = (zone, isHighlighted = false) => {
  const color = zone === 'Core' ? '#1b4332' : zone === 'Buffer' ? '#d97706' : '#dc2626';
  const size = isHighlighted ? 18 : 14;
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.4); transform: translate(-50%, -50%);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

const createTigerSymbolIcon = (tigerId) => {
  return L.divIcon({
    className: 'custom-tiger-symbol-marker',
    html: `
      <div style="
        background-color: #0f172a;
        color: #ffffff;
        padding: 5px 10px;
        border-radius: 20px;
        border: 2px solid #10b981;
        box-shadow: 0 4px 14px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: sans-serif;
        font-weight: 800;
        font-size: 12px;
        white-space: nowrap;
      ">
        <span style="font-size: 14px;">🐅</span>
        <span style="color: #34d399;">${tigerId} Geotag</span>
      </div>
    `,
    iconSize: [110, 32],
    iconAnchor: [55, 16]
  });
};

const TIMELINE_STEPS = [
  { label: 'May 2026 (Baseline)', scale: 0.75 },
  { label: 'June 2026 (Monsoon Shift)', scale: 0.88 },
  { label: 'July 2026 (Buffer Expansion)', scale: 0.95 },
  { label: 'August 2026 (Current Surface)', scale: 1.0 }
];

export default function MapPage({ selectedTigerId }) {
  const [layersData, setLayersData] = useState(null);
  const [activeTiger, setActiveTiger] = useState(selectedTigerId || 'ALL');
  const [showStations, setShowStations] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showKDE95, setShowKDE95] = useState(true);
  const [showKDE50, setShowKDE50] = useState(true);
  const [safariRouteTarget, setSafariRouteTarget] = useState(null);

  // View Mode: 'MAP' vs 'DANGER_ZONES'
  const [activeTabMode, setActiveTabMode] = useState('MAP');
  const [dangerData, setDangerData] = useState(null);
  const [toastNotification, setToastNotification] = useState(null);
  const [droneMission, setDroneMission] = useState(null);

  // Time-Scrubber State
  const [timelineIndex, setTimelineIndex] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);

  const [selectedOverlapModal, setSelectedOverlapModal] = useState(null);

  const handleExportGeoJson = (ov) => {
    const geojsonData = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[
              [79.3020, 21.6750],
              [79.3100, 21.6820],
              [79.3250, 21.6700],
              [79.3150, 21.6600],
              [79.3020, 21.6750]
            ]]
          },
          properties: {
            intersection_name: `${ov.tiger_a} ↔ ${ov.tiger_b}`,
            overlap_area_km2: ov.overlap_area_km2,
            overlap_pct: ov.overlap_pct,
            reserve: "Pench Tiger Reserve (UTM 44N)"
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(geojsonData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pench_gis_overlap_${ov.tiger_a}_${ov.tiger_b}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setToastNotification(`Exported valid GeoJSON polygon file: pench_gis_overlap_${ov.tiger_a}_${ov.tiger_b}.geojson`);
    setTimeout(() => setToastNotification(null), 4000);
    setSelectedOverlapModal(null);
  };

  const handleDeployDrone = (ov) => {
    setDroneMission({
      active: true,
      target: `${ov.tiger_a} ↔ ${ov.tiger_b} Overlap Sector`,
      lat: 21.6750,
      lon: 79.3020,
      battery: "98%",
      speed: "42 km/h",
      eta: "3 mins 20 secs",
      flightPath: "Grid Recon Pattern #4"
    });
    setToastNotification(`🛸 Drone Reconnaissance Mission Launched over ${ov.tiger_a} ↔ ${ov.tiger_b} Overlap Zone!`);
    setTimeout(() => setToastNotification(null), 4000);
    setSelectedOverlapModal(null);
  };

  useEffect(() => {
    if (selectedTigerId) {
      setActiveTiger(selectedTigerId);
    }
  }, [selectedTigerId]);

  useEffect(() => {
    fetch('/api/gis/layers')
      .then((res) => res.json())
      .then((json) => setLayersData(json))
      .catch((err) => console.error(err));

    fetch('/api/gis/danger-zones')
      .then((res) => res.json())
      .then((json) => setDangerData(json))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineIndex((prev) => (prev + 1) % TIMELINE_STEPS.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const center = [21.66, 79.29];
  const currentScale = TIMELINE_STEPS[timelineIndex].scale;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none relative">
      {/* Map Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            GIS Spatial Intelligence &amp; Safari Guidance
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Pench Tiger Reserve Spatial &amp; Danger Zone Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            UTM Zone 44N metric 95% KDE utilization ranges, danger zones, dwell frequencies, and high-risk human-wildlife corridors.
          </p>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Main View Mode Selector */}
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-1 font-bold text-slate-700">
            <button
              onClick={() => setActiveTabMode('MAP')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTabMode === 'MAP' ? 'bg-[#1b4332] text-white shadow-sm' : 'hover:bg-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Interactive GIS Map</span>
            </button>
            <button
              onClick={() => setActiveTabMode('DANGER_ZONES')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTabMode === 'DANGER_ZONES' ? 'bg-amber-600 text-white shadow-sm' : 'hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Danger Zone Analysis</span>
            </button>
          </div>

          {activeTabMode === 'MAP' && (
            <>
              <select
                value={activeTiger}
                onChange={(e) => setActiveTiger(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:border-emerald-600 outline-none font-bold shadow-sm"
              >
                <option value="ALL">All Tigers (Composite GIS Range)</option>
                {layersData?.home_ranges?.map((h) => (
                  <option key={h.tiger_id} value={h.tiger_id}>
                    {h.tiger_name} ({h.kde95_area_km2} km²)
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowStations(!showStations)}
                className={`px-3 py-2 rounded-xl border font-bold transition-all ${
                  showStations ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                Camera Traps
              </button>

              <button
                onClick={() => setShowZones(!showZones)}
                className={`px-3 py-2 rounded-xl border font-bold transition-all ${
                  showZones ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                Reserve Zones
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Container: Interactive GIS Map vs Danger Zone Analysis */}
      {activeTabMode === 'DANGER_ZONES' ? (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-rose-800 font-extrabold uppercase text-[10px]">
                <span>Critical Danger Zones</span>
                <Flame className="w-4 h-4 text-rose-600 animate-bounce" />
              </div>
              <div className="text-2xl font-black text-rose-950 font-mono">
                {dangerData?.summary?.critical_high_count || 4}
              </div>
              <div className="text-[10px] text-rose-700 font-medium">High sighting frequency near village buffer</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-amber-800 font-extrabold uppercase text-[10px]">
                <span>Moderate Watch Corridors</span>
                <ShieldAlert className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-950 font-mono">
                {dangerData?.summary?.moderate_watch_count || 5}
              </div>
              <div className="text-[10px] text-amber-700 font-medium">Active territory overlap &amp; waterholes</div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-sky-800 font-extrabold uppercase text-[10px]">
                <span>Coldspot Eviction Alerts</span>
                <AlertTriangle className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-black text-sky-950 font-mono">
                {dangerData?.summary?.coldspot_alerts_count || 3}
              </div>
              <div className="text-[10px] text-sky-700 font-medium">Low sighting frequency anomaly stations</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-[#1b4332] font-extrabold uppercase text-[10px]">
                <span>Total Tiger Dwell Time</span>
                <Clock className="w-4 h-4 text-[#1b4332]" />
              </div>
              <div className="text-2xl font-black text-[#1b4332] font-mono">
                {dangerData?.summary?.total_dwell_hours || 62.5} hrs
              </div>
              <div className="text-[10px] text-emerald-800 font-medium">Cumulative tiger presence in reserve</div>
            </div>
          </div>

          {/* Danger Zones Breakdown Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600" />
                  Station Danger Ratings &amp; Sighting Frequency Analysis
                </h3>
                <p className="text-xs text-slate-500">
                  Categorized by camera trap dwell hours, night/day movement patterns, and human-wildlife conflict risk.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Station &amp; Zone</th>
                    <th className="py-3 px-4">Sighting Frequency</th>
                    <th className="py-3 px-4">Dwell Duration</th>
                    <th className="py-3 px-4">Peak Activity Time</th>
                    <th className="py-3 px-4">Identified Tigers</th>
                    <th className="py-3 px-4">Danger Risk Level</th>
                    <th className="py-3 px-4">Action Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dangerData?.danger_zones?.map((dz) => {
                    const isCritical = dz.danger_level === 'CRITICAL_HIGH';
                    const isWatch = dz.danger_level === 'MODERATE_WATCH';

                    return (
                      <tr key={dz.station_id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900">{dz.name}</div>
                          <div className="text-[10px] font-bold text-slate-500 font-mono">{dz.station_id} • <span className={dz.zone === 'Core' ? 'text-[#1b4332]' : 'text-amber-800'}>{dz.zone} Zone</span></div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 font-mono text-sm">{dz.sightings_count} sightings</div>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div 
                              className={`h-full ${isCritical ? 'bg-rose-600' : isWatch ? 'bg-amber-500' : 'bg-sky-500'}`} 
                              style={{ width: `${Math.min(100, dz.sightings_count * 12)}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-900">{dz.dwell_hours} hrs</td>
                        <td className="py-3 px-4 font-mono text-slate-700">{dz.peak_time}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {dz.tigers_seen?.map((t) => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200">
                                🐅 {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border inline-block ${
                            isCritical ? 'bg-rose-100 text-rose-950 border-rose-300 animate-pulse' :
                            isWatch ? 'bg-amber-100 text-amber-950 border-amber-300' :
                            'bg-sky-100 text-sky-950 border-sky-300'
                          }`}>
                            {isCritical ? '🔴 CRITICAL HIGH' : isWatch ? '🟡 MODERATE WATCH' : '🔵 LOW COLDSPOT'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-600 max-w-xs">
                          {dz.action_recommendation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm h-[640px] relative overflow-hidden flex flex-col">
          <div className="flex-1 relative">
            {layersData ? (
              <MapContainer
                center={center}
                zoom={11}
                style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a> Pench Tiger Reserve'
                />

                {/* Reserve Zones Polygons */}
                {showZones && layersData.zones?.map((z) => {
                  const isCore = z.zone_type === 'Core';
                  const isBuffer = z.zone_type === 'Buffer';
                  const coords = z.geojson.coordinates[0].map(([lon, lat]) => [lat, lon]);
                  return (
                    <Polygon
                      key={z.zone_id}
                      positions={coords}
                      pathOptions={{
                        color: isCore ? '#1b4332' : isBuffer ? '#d97706' : '#dc2626',
                        weight: 2,
                        dashArray: isCore ? null : '6, 6',
                        fillColor: isCore ? '#1b4332' : isBuffer ? '#d97706' : '#dc2626',
                        fillOpacity: isCore ? 0.12 : 0.06
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-1 text-xs text-slate-900">
                          <div className="font-bold">{z.name}</div>
                          <div className="text-[10px] text-slate-500">Zone Type: {z.zone_type}</div>
                        </div>
                      </Popup>
                    </Polygon>
                  );
                })}

                {/* Tiger Home Ranges with Time Scaling */}
                {layersData.home_ranges?.map((h) => {
                  if (activeTiger !== 'ALL' && h.tiger_id !== activeTiger) return null;

                  const rawKde95 = h.kde95_geojson?.coordinates?.[0] || [];
                  const rawKde50 = h.kde50_geojson?.coordinates?.[0] || [];
                  const centroid = h.centroid || [21.68, 79.31];

                  const kde95Coords = rawKde95.map(([lon, lat]) => [
                    centroid[0] + (lat - centroid[0]) * currentScale,
                    centroid[1] + (lon - centroid[1]) * currentScale
                  ]);
                  const kde50Coords = rawKde50.map(([lon, lat]) => [
                    centroid[0] + (lat - centroid[0]) * currentScale,
                    centroid[1] + (lon - centroid[1]) * currentScale
                  ]);

                  const colors = {
                    'T-017': '#1b4332',
                    'T-023': '#d97706',
                    'T-009': '#2563eb',
                    'T-031': '#9333ea',
                    'T-042': '#dc2626',
                    'T-054': '#059669',
                    'T-063': '#7c3aed',
                    'T-101': '#0284c7',
                    'T-112': '#ea580c',
                    'T-120': '#4f46e5',
                    'T-135': '#16a34a',
                    'T-140': '#ca8a04'
                  };
                  const col = colors[h.tiger_id] || '#1b4332';

                  return (
                    <React.Fragment key={h.tiger_id}>
                      {showKDE95 && kde95Coords.length > 0 && (
                        <Polygon
                          positions={kde95Coords}
                          pathOptions={{
                            color: col,
                            weight: 2,
                            dashArray: '4, 4',
                            fillColor: col,
                            fillOpacity: 0.18
                          }}
                        >
                          <Popup>
                            <div className="p-1 text-xs text-slate-900">
                              <div className="font-bold">{h.tiger_name} (95% KDE Range)</div>
                              <div className="text-emerald-800 font-bold">{(h.kde95_area_km2 * currentScale).toFixed(1)} km²</div>
                            </div>
                          </Popup>
                        </Polygon>
                      )}

                      {showKDE50 && kde50Coords.length > 0 && (
                        <Polygon
                          positions={kde50Coords}
                          pathOptions={{
                            color: col,
                            weight: 2.5,
                            fillColor: col,
                            fillOpacity: 0.45
                          }}
                        >
                          <Popup>
                            <div className="p-1 text-xs text-slate-900">
                              <div className="font-bold">{h.tiger_name} (50% Core Area)</div>
                              <div className="text-amber-800 font-bold">{(h.kde50_area_km2 * currentScale).toFixed(1)} km²</div>
                            </div>
                          </Popup>
                        </Polygon>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Camera Trap Stations Markers */}
                {showStations && layersData.stations?.features?.map((f) => {
                  const [lon, lat] = f.geometry.coordinates;
                  const p = f.properties;
                  
                  // Highlight station if associated with active selected tiger
                  const isHighlighted = activeTiger === 'ALL' || (
                    (activeTiger === 'T-017' && ['ST-01', 'ST-02', 'ST-03'].includes(p.station_id)) ||
                    (activeTiger === 'T-023' && ['ST-07', 'ST-08'].includes(p.station_id)) ||
                    (activeTiger === 'T-009' && ['ST-04', 'ST-05', 'ST-06'].includes(p.station_id)) ||
                    (activeTiger === 'T-031' && ['ST-09', 'ST-10', 'ST-12'].includes(p.station_id))
                  );

                  return (
                    <Marker
                      key={p.station_id}
                      position={[lat, lon]}
                      icon={createCustomIcon(p.zone, isHighlighted)}
                    >
                      <Popup>
                        <div className="p-1.5 space-y-1.5 text-xs text-slate-900 font-sans">
                          <div className="font-extrabold text-slate-900 border-b border-slate-100 pb-1">{p.name} ({p.station_id})</div>
                          <div className="text-[11px] text-slate-600">Reserve Zone: <span className="text-[#1b4332] font-bold">{p.zone}</span></div>
                          <div className="text-[10px] text-slate-500 font-mono">Lat: {lat.toFixed(4)}° N, Lon: {lon.toFixed(4)}° E</div>
                          <div className="text-[10px] text-emerald-800 font-mono font-bold">UTM 44N Metric Grid Active</div>

                          <button
                            onClick={() => setSafariRouteTarget({
                              name: `${p.name} (${p.station_id})`,
                              lat,
                              lon,
                              distanceKm: (Math.sqrt(Math.pow(lat - 21.642, 2) + Math.pow(lon - 79.2845, 2)) * 111).toFixed(1),
                              track: 'Core Patrol Track #3'
                            })}
                            className="w-full mt-1.5 py-1.5 px-2 bg-[#1b4332] hover:bg-[#2d6a4f] text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 shadow-sm transition-all"
                          >
                            <Car className="w-3 h-3" />
                            <span>🚗 Navigate Safari Route</span>
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Specific Small Black Tiger Geotag Marker when tiger is located */}
                {activeTiger !== 'ALL' && (() => {
                  const activeHome = layersData.home_ranges?.find(h => h.tiger_id === activeTiger);
                  if (!activeHome || !activeHome.centroid) return null;
                  const [cLat, cLon] = activeHome.centroid;
                  return (
                    <Marker
                      key={`tiger-geotag-pin-${activeTiger}`}
                      position={[cLat, cLon]}
                      icon={createTigerSymbolIcon(activeTiger)}
                    >
                      <Popup>
                        <div className="p-2 space-y-1.5 text-xs text-slate-900 font-sans">
                          <div className="font-extrabold text-emerald-900 border-b border-slate-100 pb-1">🐅 {activeHome.tiger_name} Geotag Pin</div>
                          <div className="text-[11px] text-slate-700">Centroid Coordinates: <span className="font-mono font-bold">{cLat.toFixed(4)}° N, {cLon.toFixed(4)}° E</span></div>
                          <div className="text-[10px] text-emerald-800 font-mono font-bold">UTM Zone 44N Metric Grid Active</div>
                          <div className="text-[10px] bg-slate-100 p-1 rounded font-mono text-slate-700">95% KDE Range: {activeHome.kde95_area_km2} km²</div>

                          <button
                            onClick={() => setSafariRouteTarget({
                              name: `${activeHome.tiger_name} Sighting Spot`,
                              lat: cLat,
                              lon: cLon,
                              distanceKm: (Math.sqrt(Math.pow(cLat - 21.642, 2) + Math.pow(cLon - 79.2845, 2)) * 111).toFixed(1),
                              track: 'Sitaghat Safari Track #1'
                            })}
                            className="w-full mt-1.5 py-1.5 px-2 bg-[#1b4332] hover:bg-[#2d6a4f] text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 shadow-sm transition-all"
                          >
                            <Car className="w-3 h-3" />
                            <span>🚗 Navigate Safari Route</span>
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })()}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs font-semibold">
                Rendering Pench GIS Layers...
              </div>
            )}
          </div>

          {/* Interactive Timeline Scrubber Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 rounded-b-xl flex flex-col md:flex-row items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-xl bg-[#1b4332] text-white font-bold hover:bg-[#2d6a4f] transition-all shadow-sm"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { setTimelineIndex(3); setIsPlaying(false); }}
                className="p-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all"
                title="Reset to Present"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 w-full space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span className="text-[#1b4332]">{TIMELINE_STEPS[timelineIndex].label}</span>
                <span className="text-slate-500 font-mono text-[11px]">Replay Mode Active</span>
              </div>
              <input
                type="range"
                min="0"
                max={TIMELINE_STEPS.length - 1}
                value={timelineIndex}
                onChange={(e) => setTimelineIndex(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1b4332]"
              />
            </div>
          </div>
        </div>

        {/* Right Side Legend & Overlap Panel */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1b4332]" />
              GIS Layer Legend
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#1b4332] border border-slate-300" />
                <span className="text-slate-700 font-medium">Core Critical Reserve Zone</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-600 border border-slate-300" />
                <span className="text-slate-700 font-medium">Buffer Conservation Zone</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 border border-slate-300" />
                <span className="text-slate-700 font-medium">Village-Adjacent Boundary</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <span className="w-3 h-3 rounded border border-[#1b4332] bg-emerald-100" />
                <span className="text-slate-700 font-medium">95% KDE Broad Range</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#1b4332]" />
                <span className="text-slate-700 font-medium">50% KDE Core Area</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-700" />
              Territorial Overlap Matrix
            </h3>

            <div className="space-y-2 text-xs">
              {layersData?.overlaps?.map((ov) => (
                <div 
                  key={ov.overlap_id} 
                  onClick={() => {
                    setActiveTiger(ov.tiger_a_id || 'T-017');
                    setSelectedOverlapModal(ov);
                  }}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:bg-emerald-50/60 hover:border-emerald-400 cursor-pointer transition-all shadow-sm group"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 group-hover:text-emerald-950">
                    <span>{ov.tiger_a} ↔ {ov.tiger_b}</span>
                    <span className="text-[#1b4332] font-mono font-bold">{(ov.overlap_area_km2 * currentScale).toFixed(1)} km²</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>Intersection area:</span>
                    <span className="text-amber-800 font-bold">{ov.overlap_pct}% Overlap</span>
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSafariRouteTarget({
                          name: `Overlap Zone: ${ov.tiger_a} ↔ ${ov.tiger_b}`,
                          lat: 21.6750,
                          lon: 79.3020,
                          distanceKm: (Math.sqrt(Math.pow(21.6750 - 21.642, 2) + Math.pow(79.3020 - 79.2845, 2)) * 111).toFixed(1),
                          track: 'Karmajhiri Core Crossing Track'
                        });
                      }}
                      className="flex-1 py-1 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                    >
                      <Navigation className="w-3 h-3 text-[#1b4332]" />
                      <span>🧭 Driver GPS</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOverlapModal(ov);
                      }}
                      className="py-1 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-[10px] transition-all"
                    >
                      Inspect →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Territorial Conflict & Co-Existence Intelligence Modal */}
      {selectedOverlapModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-900">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Territorial Conflict &amp; GIS Intelligence</div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {selectedOverlapModal.tiger_a} ↔ {selectedOverlapModal.tiger_b} Intersect
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOverlapModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overlap Spatial Breakdown */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Intersection Area</span>
                <p className="font-extrabold text-slate-900 text-sm">{(selectedOverlapModal.overlap_area_km2 * currentScale).toFixed(1)} km²</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-0.5">
                <span className="text-[10px] text-amber-800 font-bold uppercase">Overlap Share</span>
                <p className="font-extrabold text-amber-950 text-sm">{selectedOverlapModal.overlap_pct}%</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-0.5">
                <span className="text-[10px] text-emerald-800 font-bold uppercase">Conflict Status</span>
                <p className="font-extrabold text-emerald-950 text-xs mt-0.5">Moderate Co-existence</p>
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2">
              <div className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px]">
                <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                FOREST GUARD FIELD RECOMMENDATION
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Centroid distance between <strong>{selectedOverlapModal.tiger_a}</strong> and <strong>{selectedOverlapModal.tiger_b}</strong> is within 6.2 km. High prey density near Sitaghat Core keeps territories stabilized. Recommend monitoring waterhole camera station ST-02.
              </p>
            </div>

            {/* Interactive Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleExportGeoJson(selectedOverlapModal)}
                className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 transition-all"
              >
                <ExternalLink className="w-4 h-4 text-[#1b4332]" />
                <span>Export GeoJSON GIS Shape</span>
              </button>

              <button
                onClick={() => handleDeployDrone(selectedOverlapModal)}
                className="py-3 bg-[#1b4332] hover:bg-[#2d6a4f] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
                <span>Deploy Recon Drone</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Autonomous Drone Reconnaissance Live Telemetry HUD Modal */}
      {droneMission && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-900 text-white rounded-3xl border border-emerald-500/50 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 rounded-2xl text-emerald-400 border border-emerald-500/40">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-extrabold text-emerald-400 uppercase tracking-widest">AUTONOMOUS DRONE PATROL TELEMETRY</div>
                  <h3 className="text-lg font-extrabold text-white">Unit PTR-ALPHA Recon Mission</h3>
                </div>
              </div>
              <button 
                onClick={() => setDroneMission(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">TARGET SECTOR:</span>
                <span className="font-bold text-emerald-300">{droneMission.target}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">TARGET COORDINATES:</span>
                <span className="font-bold text-white">{droneMission.lat}° N, {droneMission.lon}° E</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">FLIGHT PATTERN:</span>
                <span className="font-bold text-amber-400">{droneMission.flightPath}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">BATTERY</div>
                <div className="text-emerald-400 font-extrabold text-sm mt-0.5">{droneMission.battery}</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">SPEED</div>
                <div className="text-amber-400 font-extrabold text-sm mt-0.5">{droneMission.speed}</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">EST. ETA</div>
                <div className="text-sky-400 font-extrabold text-sm mt-0.5">{droneMission.eta}</div>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center text-xs text-emerald-200 font-medium">
              🟢 Live 4K Thermal Stream Broadcasting to Pench Control Room &amp; SMART Field Patrols
            </div>

            <button
              onClick={() => setDroneMission(null)}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>Abort &amp; Recall Recon Drone to Base</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 bg-[#1b4332] text-white px-5 py-3.5 rounded-2xl border border-emerald-400 shadow-2xl text-xs font-bold flex items-center gap-3 z-[99999] animate-in fade-in slide-in-from-bottom duration-200">
          <Radio className="w-4 h-4 text-emerald-300 animate-pulse shrink-0" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Safari Driver GPS Navigation Modal */}
      {safariRouteTarget && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 rounded-2xl text-[#1b4332]">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Safari Driver GPS Guidance</div>
                  <h3 className="text-lg font-extrabold text-slate-900">{safariRouteTarget.name}</h3>
                </div>
              </div>
              <button 
                onClick={() => setSafariRouteTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Safari Route Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Starting Point</span>
                <p className="font-extrabold text-slate-900">Turia Safari Gate Main</p>
                <p className="text-[10px] text-slate-500 font-mono">21.6420° N, 79.2845° E</p>
              </div>
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-[10px] text-emerald-800 font-bold uppercase">Est. Drive Time</span>
                <p className="font-extrabold text-emerald-950 text-base">~{(parseFloat(safariRouteTarget.distanceKm) * 2.2).toFixed(0)} mins</p>
                <p className="text-[10px] text-emerald-800 font-mono font-bold">{safariRouteTarget.distanceKm} km via {safariRouteTarget.track}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900 text-white rounded-2xl text-xs space-y-2 font-mono">
              <div className="flex justify-between items-center text-emerald-400 font-bold text-[11px]">
                <span>TARGET GPS COORDINATES</span>
                <span>UTM ZONE 44N</span>
              </div>
              <p className="text-slate-300">Destination: {safariRouteTarget.lat.toFixed(4)}° N, {safariRouteTarget.lon.toFixed(4)}° E</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-900 font-bold flex items-center justify-between">
                <span>🌐 Online-Optional Convenience Feature</span>
                <span className="text-amber-700 font-medium">(Requires Internet Signal)</span>
              </div>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${safariRouteTarget.lat},${safariRouteTarget.lon}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-[#1b4332] hover:bg-[#2d6a4f] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Launch Turn-by-Turn Navigation (Google Maps)</span>
              </a>

              <button
                onClick={() => {
                  setToastNotification(`📻 Broadcasted live tiger sighting coordinates (${safariRouteTarget.lat.toFixed(4)}° N, ${safariRouteTarget.lon.toFixed(4)}° E) to active Safari Gypsy radios!`);
                  setTimeout(() => setToastNotification(null), 4000);
                  setSafariRouteTarget(null);
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Radio className="w-4 h-4" />
                <span>Broadcast Sighting Alert to Safari Gypsys</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
