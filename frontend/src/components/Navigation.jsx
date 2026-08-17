import React from 'react';
import { 
  LayoutDashboard, 
  HardDrive, 
  Cat, 
  Map, 
  UserCheck, 
  CheckCircle2,
  AlertTriangle, 
  FileText, 
  Sliders,
  Cpu 
} from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, pendingCount, alertCount }) {
  const sections = [
    {
      title: 'OPERATE',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'ingestion', label: 'Upload & Ingestion', icon: HardDrive },
      ]
    },
    {
      title: 'REVIEW PIPELINE',
      items: [
        { id: 'ai_detections', label: '🤖 ML Model Recommendations', icon: Cpu },
        { id: 'review', label: '👤 Human Officer Review', icon: UserCheck, badge: pendingCount },
        { id: 'verified_outputs', label: '🏁 Verified Final Outputs', icon: CheckCircle2 },
        { id: 'alerts', label: 'Alerts Feed', icon: AlertTriangle, badge: alertCount, badgeColor: 'bg-amber-100 text-amber-800 border-amber-300' },
      ]
    },
    {
      title: 'EXPLORE',
      items: [
        { id: 'tigers', label: 'Tiger Catalogue', icon: Cat },
        { id: 'map', label: 'Reserve GIS Map', icon: Map },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'audit', label: 'Audit Log', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Sliders },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 z-20 shrink-0 select-none overflow-y-auto shadow-sm">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-[#1b4332] flex items-center justify-center shadow-md">
            <Cat className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-slate-900 tracking-wide flex items-center gap-1.5">
              PUGMARK
            </h1>
            <p className="text-[10px] tracking-wider text-emerald-700 uppercase font-bold">
              Pench Tiger Reserve
            </p>
          </div>
        </div>

        {/* Grouped Navigation Links */}
        <div className="space-y-4">
          {sections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                {sec.title}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#1b4332] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.badgeColor || 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Hardware / Environment Status Footer */}
      <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-200/60 text-[11px] space-y-2 mt-4">
        <div className="flex items-center justify-between text-slate-800 font-bold">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-700" />
            CPU Field Laptop
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-emerald-pulse" />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>Deployment:</span>
          <span className="text-slate-700 font-mono font-semibold">Offline / Localhost</span>
        </div>
      </div>
    </aside>
  );
}
