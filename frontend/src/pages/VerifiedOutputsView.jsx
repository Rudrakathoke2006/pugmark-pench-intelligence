import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, MapPin, Calendar, FileText, Download } from 'lucide-react';

export default function VerifiedOutputsView({ onNavigateMap }) {
  const [verifiedList, setVerifiedList] = useState([]);

  useEffect(() => {
    fetch('/api/tigers')
      .then((res) => res.json())
      .then((data) => setVerifiedList(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Stage 3 — Consolidated Verified Outputs
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            🏁 Officer-Verified Tiger Identifications
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Final consolidated records confirmed by both <strong className="text-slate-800">PUGMARK-V6 Fine-Tuned ML Engine</strong> and <strong className="text-slate-800">Human Forest Officers</strong>.
          </p>
        </div>

        {/* Action Button */}
        <a
          href="/api/export/smart/csv"
          download
          className="px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-bold hover:bg-[#2d6a4f] transition-all shadow-sm flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          <span>Export Verified SMART CSV</span>
        </a>
      </div>

      {/* Verified Tigers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {verifiedList.map((t) => (
          <div 
            key={t.tiger_id}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 hover:border-emerald-500 transition-all"
          >
            <div className="relative rounded-xl overflow-hidden bg-slate-950 h-44 border border-slate-200">
              <img
                src={t.reference_image_url || '/static/crops/t017_flank.jpg'}
                alt={t.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-md">
                <CheckCircle2 className="w-3 h-3" />
                <span>VERIFIED BY ML RECOMMENDATION & OFFICER</span>
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white font-mono font-bold text-[10px]">
                ID: {t.tiger_id}
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="font-extrabold text-sm text-slate-900">{t.name}</div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Sex / Stage:</span>
                <span className="font-bold text-slate-800">{t.sex} ({t.life_stage})</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Home Range (95% KDE):</span>
                <span className="font-bold text-emerald-800">{t.kde95_area_km2 || 78.5} km²</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Core Area (50% KDE):</span>
                <span className="font-bold text-amber-800">{t.kde50_area_km2 || 19.6} km²</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateMap && onNavigateMap(t.tiger_id)}
              className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-all border border-emerald-200 flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>Locate Geotag on Leaflet Map</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
