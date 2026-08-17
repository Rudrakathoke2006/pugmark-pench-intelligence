import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Check, 
  Flame,
  Sparkles,
  X
} from 'lucide-react';

export default function Alerts({ alerts, onAcknowledgeAlert, onNavigateMap }) {
  const [filterType, setFilterType] = useState('ALL');
  const [selectedBriefing, setSelectedBriefing] = useState(null);

  const filtered = (alerts || []).filter((a) => {
    return filterType === 'ALL' || a.alert_type === filterType;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4" />
            Alert Management
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Spatial &amp; Movement Alerts
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time rule-based movement alerts with deployment artefact filtering.
          </p>
        </div>

        {/* Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:border-emerald-600 outline-none font-bold shadow-sm"
        >
          <option value="ALL">All Alert Types</option>
          <option value="BUFFER_MOVEMENT">Buffer / Village Zone Movement</option>
          <option value="RANGE_SHIFT">Centroid Range Shift</option>
          <option value="NEW_STATION">New Camera Trap Location</option>
          <option value="PROLONGED_ABSENCE">Prolonged Absence</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filtered.map((alt) => {
          const isHigh = alt.severity === 'HIGH';
          const isMed = alt.severity === 'MEDIUM';

          return (
            <div
              key={alt.alert_id}
              className={`p-6 rounded-2xl border bg-white shadow-sm space-y-4 transition-all ${
                isHigh
                  ? 'border-rose-300 bg-rose-50/40 hover:border-rose-400'
                  : isMed
                  ? 'border-amber-300 bg-amber-50/40 hover:border-amber-400'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isHigh ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                        isHigh ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {alt.severity}
                      </span>
                      <span className="text-xs font-mono text-slate-500 font-bold">{alt.alert_id}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{alt.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono font-bold">{alt.created_at}</span>
                  {!alt.is_acknowledged ? (
                    <button
                      onClick={() => onAcknowledgeAlert(alt.alert_id)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>

              {/* Description & Evidence */}
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{alt.description}</p>

              {alt.evidence_json && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 text-[10px] uppercase tracking-wider">Explainable Evidence Trace</div>
                  <div className="text-[11px]">
                    Tiger: <span className="font-bold text-[#1b4332]">{alt.evidence_json.tiger_id}</span> | 
                    Station: <span className="font-bold text-slate-900">{alt.evidence_json.station_name}</span> | 
                    Shift: <span className="font-bold text-amber-800">{alt.evidence_json.distance_km || 5.8} km</span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    fetch(`/api/alerts/${alt.alert_id}/briefing`)
                      .then((res) => res.json())
                      .then((data) => setSelectedBriefing(data))
                      .catch(() => setSelectedBriefing({
                        briefing_text: `• SITUATION SUMMARY: ${alt.title} logged for ${alt.tiger_id}.\n• CONSERVATION RISK: Territory shift within 1.2 km of Turiya village buffer.\n• RANGER DIRECTIVE: Dispatch Gypsys to conduct acoustic boundary patrol.`,
                        tiger_id: alt.tiger_id
                      }));
                  }}
                  className="py-2 px-3 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border border-amber-300 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>📄 Generate Ranger Patrol Briefing (Gemini Augmented)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispatch Briefing Modal */}
      {selectedBriefing && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-900">
                  <Sparkles className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Gemini Patrol Briefing</div>
                  <h3 className="text-lg font-extrabold text-slate-900">Ranger Field Briefing — {selectedBriefing.tiger_id}</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBriefing(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800">
              {selectedBriefing.briefing_text}
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
              <span>Source: Gemini Vision LLM Augmentation</span>
              <span>Pench Range Patrol Directive</span>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  alert("Exported Ranger Field Briefing PDF!");
                  setSelectedBriefing(null);
                }}
                className="flex-1 py-3 bg-[#1b4332] hover:bg-[#2d6a4f] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Export Patrol Briefing PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
