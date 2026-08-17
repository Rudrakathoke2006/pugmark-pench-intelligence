import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  Globe, 
  Cat, 
  ShieldCheck,
  User,
  Menu,
  X
} from 'lucide-react';

export default function GbifNavbar({ activeTab, setActiveTab, pendingCount, alertCount, onToggleSidebar, isSidebarOpen }) {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <header className="bg-[#1b4332] text-white sticky top-0 z-40 select-none shadow-md border-b border-[#2d6a4f]">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left Side: Logo & Main Navigation */}
        <div className="flex items-center gap-6">
          {/* Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg bg-[#2d6a4f] text-white hover:bg-[#40916c] transition-all"
            title="Toggle Sidebar Navigation"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* GBIF Brand Logo */}
          <div 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-400 flex items-center justify-center font-black text-slate-950 shadow-md">
              <Cat className="w-5 h-5 text-[#1b4332]" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1 group-hover:text-emerald-300 transition-colors">
                GBIF <span className="text-emerald-200 font-normal">| Pench Biodiversity</span>
              </div>
              <div className="text-[9px] text-emerald-300 font-mono tracking-wider uppercase font-bold">
                Pench Tiger Reserve
              </div>
            </div>
          </div>

          {/* GBIF Navigation Items */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-emerald-100">
            {/* Get Data Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('getdata')}
                className="px-3 py-1.5 rounded-lg hover:bg-[#2d6a4f] hover:text-white flex items-center gap-1 transition-all"
              >
                <span>Get data</span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-200" />
              </button>
              {activeDropdown === 'getdata' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-xl p-2 space-y-1 z-50 text-xs">
                  <button onClick={() => { setActiveTab('tigers'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-slate-700 font-medium">
                    Tiger Sightings &amp; Taxa
                  </button>
                  <button onClick={() => { setActiveTab('ingestion'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-slate-700 font-medium">
                    Camera Trap Datasets
                  </button>
                  <a href="/api/export/smart/csv" download className="block w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-emerald-700 font-bold">
                    SMART CSV Export
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('tigers')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'tigers' ? 'bg-[#2d6a4f] text-white font-bold' : 'hover:bg-[#2d6a4f] hover:text-white'
              }`}
            >
              Tiger Roster
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'map' ? 'bg-[#2d6a4f] text-white font-bold' : 'hover:bg-[#2d6a4f] hover:text-white'
              }`}
            >
              Reserve Map
            </button>

            <button
              onClick={() => setActiveTab('review')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'review' ? 'bg-[#2d6a4f] text-white font-bold' : 'hover:bg-[#2d6a4f] hover:text-white'
              }`}
            >
              <span>Review Queue</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'alerts' ? 'bg-[#2d6a4f] text-white font-bold' : 'hover:bg-[#2d6a4f] hover:text-white'
              }`}
            >
              <span>Alerts</span>
              {alertCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                  {alertCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'settings' ? 'bg-[#2d6a4f] text-white font-bold' : 'hover:bg-[#2d6a4f] hover:text-white'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Right Side: Tools & Officer Login */}
        <div className="flex items-center gap-3 text-xs">
          <button 
            onClick={() => setActiveTab('overview')}
            className="p-2 rounded-lg bg-[#2d6a4f] text-white hover:bg-[#40916c] transition-all hidden md:flex items-center justify-center"
            title="Global Search"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#1b4332] font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
          >
            <User className="w-3.5 h-3.5" />
            <span>Officer Login</span>
          </button>
        </div>
      </div>
    </header>
  );
}
