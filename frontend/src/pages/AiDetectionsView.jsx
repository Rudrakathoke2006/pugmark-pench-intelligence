import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu, Eye, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

export default function AiDetectionsView({ onNavigate }) {
  const [detections, setDetections] = useState([]);
  const [filterSpecies, setFilterSpecies] = useState('ALL');

  useEffect(() => {
    fetch('/api/review/queue')
      .then((res) => res.json())
      .then((data) => setDetections(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
            Stage 1 — Fine-Tuned ML Model Inference &amp; Recommendations
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            🤖 ML Model Recommendations
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated recommendations from <strong className="text-slate-800">PUGMARK-V6 Fine-Tuned Bengal Tiger Intelligence Engine</strong> prior to human officer verification.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2">
          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:border-amber-600 outline-none font-bold shadow-sm"
          >
            <option value="ALL">All ML Model Predictions</option>
            <option value="TIGER">Bengal Tiger (T-017 / T-023 / T-009 / T-031)</option>
            <option value="HUMAN">Human Review Band (35% - 70%)</option>
          </select>

          <button
            onClick={() => onNavigate('review')}
            className="px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-bold hover:bg-[#2d6a4f] transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Proceed to Human Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Detections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {detections.length > 0 ? (
          detections.map((item, idx) => {
            const cand = item.candidates?.[0];
            const isMultiTigers = item.decision === 'MULTIPLE-TIGERS-REVIEW' || item.tiger_id === 'Multiple Tigers Detected';

            return (
              <div 
                key={item.identification_id || idx}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 hover:border-amber-400 transition-all"
              >
                <div className="relative rounded-xl overflow-hidden bg-slate-950 h-44 border border-slate-200">
                  <img
                    src={item.crop_path || '/static/crops/t017_flank.jpg'}
                    alt="AI Crop"
                    className="w-full h-full object-cover"
                  />
                  {item.decision === 'QUARANTINE' || item.tiger_count === 0 ? (
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-slate-800 text-slate-200 font-extrabold text-[10px] flex items-center gap-1 shadow-md">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>NO TIGER PRESENT IN THIS FRAME</span>
                    </div>
                  ) : isMultiTigers ? (
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-amber-600 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-md">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>MULTIPLE TIGERS DETECTED (2+)</span>
                    </div>
                  ) : (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500/90 text-white font-extrabold text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>ML Recommended: {cand?.name || cand?.tiger_id || 'T-017'}</span>
                    </div>
                  )}

                  {item.decision !== 'QUARANTINE' && item.tiger_count !== 0 && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-emerald-400 font-mono font-bold text-[10px]">
                      {isMultiTigers ? 'Multi-Animal Review' : `${(item.match_score * 100).toFixed(0)}% SIFT Alignment`}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-900">{item.station_name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{item.timestamp}</span>
                  </div>

                  <div className={`p-2 rounded-lg border text-[11px] font-medium space-y-1 ${
                    item.decision === 'QUARANTINE'
                      ? 'bg-slate-100 border-slate-200 text-slate-700'
                      : isMultiTigers 
                      ? 'bg-amber-100/80 border-amber-300 text-amber-950' 
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <div className="font-bold flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-amber-700" />
                      Model: PUGMARK-V6 Fine-Tuned ML Engine
                    </div>
                    <p className="text-[10px] text-slate-700">
                      {item.decision === 'QUARANTINE' || item.tiger_count === 0
                        ? "No tiger present in this frame — MegaDetector pre-filter triage halted further identification pipeline."
                        : isMultiTigers
                        ? "Multiple tigers detected in video footage. Automatic single-tiger recommendation disabled — routed to Officer Review Queue."
                        : `Stripe pattern vector matches target ${cand?.name || cand?.tiger_id || 'T-017'}. SIFT Flank Stripe Pattern Match Score: ${(item.match_score * 100).toFixed(0)}%.`
                      }
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('review')}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 font-bold text-xs transition-all border border-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Send to Officer Verification</span>
                </button>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs font-semibold bg-white rounded-2xl border border-slate-200">
            No pending raw AI model detections. All records ingested!
          </div>
        )}
      </div>

      {/* Bottom Next Step Navigation Banner */}
      <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-amber-50/90 p-5 rounded-2xl border border-amber-200 shadow-sm">
        <div>
          <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Stage 1 Predictions Complete — Ready for Stage 2 Human Officer Verification</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Proceed to the Human Officer Review Queue to confirm matches, reject non-tiger frames, or enroll new tigers into the GIS catalogue.
          </p>
        </div>

        <button
          onClick={() => onNavigate('review')}
          className="px-5 py-3 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-2 shrink-0"
        >
          <span>Proceed to Human Officer Review (Next Step)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
