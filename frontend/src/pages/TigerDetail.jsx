import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Activity, 
  Compass
} from 'lucide-react';

export default function TigerDetail({ tigerId, onBack, onNavigateMap }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tigers/${tigerId}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, [tigerId]);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        <Activity className="w-8 h-8 animate-spin mx-auto mb-2 text-[#1b4332]" />
        Fetching profile for {tigerId}...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <span>{data.name}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#1b4332] text-white shadow-sm">
              {data.tiger_id}
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Pench Tiger Reserve Profile • {data.sex} • {data.life_stage} • Status: {data.status}
          </p>
        </div>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Reference Image & Profile Meta */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-full h-56 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <img
              src={data.reference_image_url || "/static/crops/t017_flank.jpg"}
              alt={data.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 font-medium">
              <span className="text-slate-500">First Observed:</span>
              <span className="font-bold text-slate-900">{data.first_seen}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 font-medium">
              <span className="text-slate-500">Last Observed:</span>
              <span className="font-bold text-emerald-800">{data.last_seen}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 font-medium">
              <span className="text-slate-500">Total Sightings:</span>
              <span className="font-bold text-amber-800">{data.sightings?.length || 0} Records</span>
            </div>
            <div className="flex justify-between py-1 font-medium">
              <span className="text-slate-500">Centroid Coordinates:</span>
              <span className="font-mono text-slate-800 font-bold">{data.occupancy?.centroid?.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Spatial Home Range Metrics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#1b4332]" />
                GIS Spatial Activity &amp; Occupancy Summary (UTM Zone 44N)
              </span>
              <button
                onClick={() => onNavigateMap(data.tiger_id)}
                className="text-xs text-[#1b4332] font-bold hover:underline"
              >
                Inspect Range on Map →
              </button>
            </h3>

            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">95% Home Range</div>
                <div className="text-2xl font-black text-[#1b4332] font-mono">{data.occupancy?.kde95_area_km2} km²</div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">50% Core Area</div>
                <div className="text-2xl font-black text-amber-800 font-mono">{data.occupancy?.kde50_area_km2} km²</div>
              </div>

              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Minimum Polygon</div>
                <div className="text-2xl font-black text-sky-900 font-mono">{data.occupancy?.mcp_area_km2} km²</div>
              </div>
            </div>
          </div>

          {/* Sighting Timeline Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Confirmed Camera Trap Sightings History
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Station</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Match Confidence</th>
                    <th className="py-2.5 px-3">Decision Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {data.sightings?.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{s.station_name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{s.timestamp}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">{(s.confidence * 100).toFixed(0)}%</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-800">{s.decision}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
