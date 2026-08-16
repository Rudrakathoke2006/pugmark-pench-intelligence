import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Compass, Play, Pause, RotateCcw } from 'lucide-react';

const createCustomIcon = (zone) => {
  const color = zone === 'Core' ? '#1b4332' : zone === 'Buffer' ? '#d97706' : '#dc2626';
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
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

  // Time-Scrubber State
  const [timelineIndex, setTimelineIndex] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetch('/api/gis/layers')
      .then((res) => res.json())
      .then((json) => setLayersData(json))
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Map Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            GIS Spatial Intelligence
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Pench Tiger Reserve Spatial Map
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            UTM Zone 44N metric 95% KDE broad utilization ranges, 50% core activity areas, camera traps, and territory overlaps.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={activeTiger}
            onChange={(e) => setActiveTiger(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:border-emerald-600 outline-none font-bold shadow-sm"
          >
            <option value="ALL">All Tigers (Composite Range)</option>
            <option value="T-017">T-017 (Pench Queen)</option>
            <option value="T-023">T-023 (Chhota Male)</option>
            <option value="T-009">T-009 (Patdev Male)</option>
            <option value="T-031">T-031 (Kumbha Sub-adult)</option>
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
        </div>
      </div>

      {/* Main Map Container */}
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
                    'T-031': '#9333ea'
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
                  return (
                    <Marker
                      key={p.station_id}
                      position={[lat, lon]}
                      icon={createCustomIcon(p.zone)}
                    >
                      <Popup>
                        <div className="p-1 space-y-1 text-xs text-slate-900">
                          <div className="font-bold">{p.name} ({p.station_id})</div>
                          <div className="text-[10px] text-slate-500">Zone: <span className="text-slate-800 font-bold">{p.zone}</span></div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
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
                <div key={ov.overlap_id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{ov.tiger_a} ↔ {ov.tiger_b}</span>
                    <span className="text-[#1b4332] font-mono font-bold">{(ov.overlap_area_km2 * currentScale).toFixed(1)} km²</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>Intersection area:</span>
                    <span className="text-amber-800 font-bold">{ov.overlap_pct}% Overlap</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
