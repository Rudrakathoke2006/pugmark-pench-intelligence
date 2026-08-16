import React, { useState } from 'react';
import { Cat, Search, ChevronRight, Calendar } from 'lucide-react';

export default function Tigers({ tigers, onSelectTiger }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sexFilter, setSexFilter] = useState('ALL');

  const filtered = (tigers || []).filter((t) => {
    const matchesName = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.tiger_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSex = sexFilter === 'ALL' || t.sex.toUpperCase() === sexFilter;
    return matchesName && matchesSex;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Cat className="w-4 h-4" />
            Pench Tiger Catalogue
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Individual Tiger Roster
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Catalogue maintaining flank stripe descriptors, 95% KDE home ranges, 50% core areas, and sighting records.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Tiger ID or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 w-60 focus:border-emerald-600 outline-none font-medium shadow-sm"
            />
          </div>

          <select
            value={sexFilter}
            onChange={(e) => setSexFilter(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:border-emerald-600 outline-none font-bold shadow-sm"
          >
            <option value="ALL">All Sexes</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
          </select>
        </div>
      </div>

      {/* Tigers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((t) => (
          <div
            key={t.tiger_id}
            onClick={() => onSelectTiger(t.tiger_id)}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 cursor-pointer group shadow-sm hover:shadow-md hover:border-emerald-500 transition-all"
          >
            {/* Reference Image / Flank Crop */}
            <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
              <img
                src={t.reference_image_url || "/static/crops/t017_flank.jpg"}
                alt={t.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
              />
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-[#1b4332] text-white font-bold text-xs shadow-sm">
                {t.tiger_id}
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[10px] border border-emerald-300 font-bold">
                {t.observations} Sightings
              </div>
            </div>

            {/* Title & Demographics */}
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#1b4332] transition-colors flex items-center justify-between">
                <span>{t.name}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1b4332] group-hover:translate-x-1 transition-all" />
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{t.sex}</span>
                <span>•</span>
                <span>{t.life_stage}</span>
              </div>
            </div>

            {/* Spatial Stats Cards */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
              <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <div className="text-[10px] text-slate-500 uppercase font-bold">95% Home Range</div>
                <div className="font-extrabold text-[#1b4332] text-xs">{t.kde95_area_km2} km²</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                <div className="text-[10px] text-slate-500 uppercase font-bold">50% Core Area</div>
                <div className="font-extrabold text-amber-800 text-xs">{t.kde50_area_km2} km²</div>
              </div>
            </div>

            {/* Sighting Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Last Seen:
              </span>
              <span className="text-slate-700 font-bold">{t.last_seen}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
