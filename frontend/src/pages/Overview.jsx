import React, { useState } from 'react';
import { 
  Search, 
  Database, 
  Building2, 
  FileText, 
  ArrowRight, 
  Cat, 
  Radio, 
  Layers, 
  Calendar
} from 'lucide-react';

export default function Overview({ overview, alerts, onNavigate, onSelectTiger }) {
  const [activeSearchTab, setActiveSearchTab] = useState('occurrences');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('tigers');
    }
  };

  return (
    <div className="space-y-10 pb-12 select-none">
      {/* 1. GBIF HERO SECTION */}
      <section className="gbif-hero-bg py-20 px-6 border-b border-emerald-900/30 relative">
        <div className="max-w-4xl mx-auto space-y-6 text-center md:text-left">
          <div className="text-xs font-semibold text-emerald-200 tracking-wider uppercase flex items-center justify-center md:justify-start gap-2">
            <span>GBIF</span>
            <span>|</span>
            <span>Global Biodiversity Information Facility — Pench Node</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Free and open access to biodiversity data
          </h1>

          {/* Quick Search Tab Bar */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-emerald-100 overflow-hidden shadow-2xl space-y-0 text-slate-800">
            <div className="flex flex-wrap border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
              {[
                { id: 'occurrences', label: 'Occurrences / Sightings' },
                { id: 'taxa', label: 'Tigers & Taxa' },
                { id: 'datasets', label: 'Camera Datasets' },
                { id: 'publishers', label: 'Camera Stations' },
                { id: 'resources', label: 'Audit Resources' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSearchTab(tab.id)}
                  className={`px-4 py-3 transition-all border-b-2 ${
                    activeSearchTab === tab.id
                      ? 'border-[#1b4332] text-[#1b4332] bg-white font-extrabold'
                      : 'border-transparent hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Bar Input */}
            <form onSubmit={handleSearchSubmit} className="flex items-center p-2 bg-white">
              <input
                type="text"
                placeholder={
                  activeSearchTab === 'occurrences' ? "Search tiger sightings e.g. T-017, Sitaghat, Turiya..." :
                  activeSearchTab === 'taxa' ? "Search tiger individuals e.g. Pench Queen, Patdev Male..." :
                  "Search GBIF Pench biodiversity database..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none font-medium"
              />
              <button
                type="submit"
                className="p-3 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white transition-all font-bold shrink-0 shadow-md"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Quick Sub-Links */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-emerald-100 pt-1">
            <button onClick={() => onNavigate('ingestion')} className="hover:text-white underline">What is PUGMARK?</button>
            <button onClick={() => onNavigate('map')} className="hover:text-white underline">About Pench Tiger Reserve</button>
            <button onClick={() => onNavigate('tigers')} className="hover:text-white underline">Browse 8 Registered Tigers</button>
          </div>
        </div>
      </section>

      {/* 2. GBIF KEY METRICS SUMMARY ROW */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-[#1b4332] shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {overview?.images?.total ? overview.images.total.toLocaleString() : "1,250"}
            </div>
            <div className="text-xs font-bold text-slate-500">Total Ingested Images</div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700 shadow-inner">
              <Layers className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {overview?.images?.kept ? overview.images.kept.toLocaleString() : "340"}
            </div>
            <div className="text-xs font-bold text-slate-500">Kept Animal Captures</div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-700 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {overview?.stations || 12}
            </div>
            <div className="text-xs font-bold text-slate-500">Camera Stations</div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto text-purple-700 shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {overview?.tigers || 4}
            </div>
            <div className="text-xs font-bold text-slate-500">Registered Individuals</div>
          </div>
        </div>
      </section>

      {/* 3. GBIF TEAL / EMERALD ANNOUNCEMENT BANNER */}
      <section className="gbif-teal-banner py-4 px-6 text-white shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left font-bold text-sm">
          <span className="flex items-center gap-2 text-white">
            <Radio className="w-5 h-5 animate-pulse text-amber-300" />
            <span>Explore the new PUGMARK Real-Time Simulated Stream!</span>
          </span>
          <button
            onClick={() => onNavigate('ingestion')}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-[#1b4332] font-extrabold text-xs shadow transition-all"
          >
            Learn more
          </button>
        </div>
      </section>

      {/* 4. "WHAT IS GBIF / PUGMARK?" EXPLANATORY SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-2">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Diagram / Network Graphic */}
          <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-24 h-24 rounded-full bg-white border-2 border-[#1b4332] flex items-center justify-center text-[#1b4332] shadow-sm">
              <Cat className="w-12 h-12" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-slate-900 text-sm">Pench Tiger Reserve Spatial Network</div>
              <div className="text-xs font-mono text-emerald-800 font-semibold">WGS84 → UTM Zone 44N Metric Projection</div>
            </div>
            <div className="flex gap-2 text-[10px] text-slate-600 font-semibold">
              <span className="px-2.5 py-1 rounded bg-white border border-slate-200">12 Camera Traps</span>
              <span className="px-2.5 py-1 rounded bg-white border border-slate-200">95% KDE Range</span>
              <span className="px-2.5 py-1 rounded bg-white border border-slate-200">50% Core Area</span>
            </div>
          </div>

          {/* Right Explanatory Text */}
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900">
              What is PUGMARK?
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              PUGMARK — the Pench Tiger Reserve Biodiversity Intelligence Infrastructure — is an international network and data infrastructure funded by the Forest Department, aimed at providing field staff, range officers, and researchers open access to tiger occurrence data about all types of camera trap captures across Pench.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Operating 100% offline without GPU or internet dependencies, PUGMARK runs automated MegaDetector V6 blank filtering, YOLOv8n flank crop localization, OpenCV SIFT open-set re-identification, and Gaussian Kernel Density Estimation (KDE).
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('map')}
                className="px-5 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs transition-all flex items-center gap-2 shadow-md"
              >
                <span>Explore Pench GIS Map</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GBIF 4-CARD INTELLIGENCE & NEWS GRID */}
      <section className="max-w-7xl mx-auto px-6 space-y-4">
        <h3 className="text-xl font-black text-slate-900">
          News &amp; Intelligence Highlights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div 
            onClick={() => onSelectTiger('T-017')}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md hover:border-emerald-500 transition-all"
          >
            <div className="w-full h-44 bg-slate-100 overflow-hidden relative">
              <img
                src="/static/crops/t017_flank.jpg?v=3"
                alt="T-017 Queen"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#1b4332] text-white font-bold text-[10px]">
                Buffer Shift
              </div>
            </div>
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#1b4332] transition-colors">
                  T-017 Pench Queen: Territorial shift detected towards Turiya Buffer
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  5.8 km shift from Sitaghat Core towards Turiya Gate village-adjacent boundary.
                </p>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 pt-2 border-t border-slate-100">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>16 August 2026</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div 
            onClick={() => onNavigate('ingestion')}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md hover:border-emerald-500 transition-all"
          >
            <div className="w-full h-44 bg-slate-100 overflow-hidden relative">
              <img
                src="/static/crops/t023_flank.jpg?v=3"
                alt="SIFT Matching"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[10px]">
                New Feature
              </div>
            </div>
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#1b4332] transition-colors">
                  New and improved SIFT FLANN Re-ID matching engine
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  LNBNN open-set feature vector matching achieves 96.0% precision on ATRW benchmark.
                </p>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 pt-2 border-t border-slate-100">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>15 August 2026</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div 
            onClick={() => onNavigate('alerts')}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md hover:border-emerald-500 transition-all"
          >
            <div className="w-full h-44 bg-slate-100 overflow-hidden relative">
              <img
                src="/static/crops/t017_flank.jpg?v=10"
                alt="Ambabarwa Camera"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-sky-600 text-white font-bold text-[10px]">
                Artefact Filter
              </div>
            </div>
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#1b4332] transition-colors">
                  New camera trap station deployment at Ambabarwa Boundary
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Expanded survey coverage verified with active tiger movement monitoring.
                </p>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 pt-2 border-t border-slate-100">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>12 August 2026</span>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div 
            onClick={() => onNavigate('ingestion')}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md hover:border-emerald-500 transition-all"
          >
            <div className="w-full h-44 bg-slate-100 overflow-hidden relative">
              <img
                src="/static/crops/t023_flank.jpg?v=10"
                alt="Data Use"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-purple-600 text-white font-bold text-[10px]">
                Data Calibration
              </div>
            </div>
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#1b4332] transition-colors">
                  ATRW Benchmark dataset calibration &amp; ground-truth validation
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Full 5-way confusion matrix breakdown for ground-truth labels.csv evaluation.
                </p>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 pt-2 border-t border-slate-100">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>10 August 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
