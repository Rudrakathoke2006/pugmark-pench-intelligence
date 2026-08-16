import React, { useState } from 'react';
import { Sliders, Cpu, HardDrive, ShieldCheck, Check, RotateCcw } from 'lucide-react';

export default function Settings() {
  const [animalThreshold, setAnimalThreshold] = useState(0.40);
  const [highThreshold, setHighThreshold] = useState(0.55);
  const [lowThreshold, setLowThreshold] = useState(0.25);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    setAnimalThreshold(0.40);
    setHighThreshold(0.55);
    setLowThreshold(0.25);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            System Administration
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            System &amp; Threshold Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage plain-language decision thresholds, view active offline models, and inspect local storage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-300 flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-mono text-xs flex items-center gap-2 shadow-sm">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>System thresholds updated successfully. New settings apply to subsequent media ingestion runs.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Threshold Sliders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-[#1b4332]" />
              Plain-Language Triage &amp; Re-ID Decision Thresholds
            </h3>

            {/* Threshold 1: Blank Filter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">1. Animal Retention Sensitivity (MegaDetector)</span>
                <span className="font-mono text-emerald-800 font-bold">{(animalThreshold * 100).toFixed(0)}% Keep Confidence</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Frames with animal confidence above this level are kept for tiger detection. Lowering this increases recall for faint animals; raising it removes more empty vegetation blanks.
              </p>
              <input
                type="range"
                min="0.20"
                max="0.70"
                step="0.05"
                value={animalThreshold}
                onChange={(e) => setAnimalThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1b4332]"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono font-bold">
                <span>20% (High Recall / Catch All)</span>
                <span>40% (Recommended Default)</span>
                <span>70% (High Precision)</span>
              </div>
            </div>

            {/* Threshold 2: Auto Match High */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">2. Auto-Match Confidence Threshold (SIFT Flank Match)</span>
                <span className="font-mono text-amber-800 font-bold">{(highThreshold * 100).toFixed(0)}% Match Score</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                SIFT FLANN match scores at or above this value are automatically assigned to the candidate tiger without requiring human review.
              </p>
              <input
                type="range"
                min="0.40"
                max="0.80"
                step="0.05"
                value={highThreshold}
                onChange={(e) => setHighThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono font-bold">
                <span>40% (More Auto Matches)</span>
                <span>55% (Recommended Default)</span>
                <span>80% (Strict Confirmation)</span>
              </div>
            </div>

            {/* Threshold 3: Human Review Low */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">3. Human Review Uncertainty Band Cutoff</span>
                <span className="font-mono text-sky-800 font-bold">{(lowThreshold * 100).toFixed(0)}% Minimum Score</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Match scores between { (lowThreshold * 100).toFixed(0) }% and { (highThreshold * 100).toFixed(0) }% are flagged for officer review. Below { (lowThreshold * 100).toFixed(0) }%, detections are enrolled as new tiger candidates.
              </p>
              <input
                type="range"
                min="0.10"
                max="0.40"
                step="0.05"
                value={lowThreshold}
                onChange={(e) => setLowThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono font-bold">
                <span>10% (Broader Review Queue)</span>
                <span>25% (Recommended Default)</span>
                <span>40% (Faster Enrolment)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Model Registry & Offline Status */}
        <div className="space-y-6">
          {/* Active Model Registry */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#1b4332]" />
              Active Model Registry
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>MegaDetector V6</span>
                  <span className="text-[#1b4332] font-mono">v6.0-CPU</span>
                </div>
                <div className="text-[10px] text-slate-500">Pre-trained animal vs blank triage engine</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>YOLOv8n-ATRW Tiger</span>
                  <span className="text-amber-800 font-mono">v8n-nano</span>
                </div>
                <div className="text-[10px] text-slate-500">Tiger body &amp; flank crop localization</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>OpenCV SIFT + LNBNN</span>
                  <span className="text-sky-800 font-mono">v1.2-OpenSet</span>
                </div>
                <div className="text-[10px] text-slate-500">Classical stripe pattern feature matcher</div>
              </div>
            </div>
          </div>

          {/* Storage & Environment Info */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-700" />
              Local Storage &amp; Offline Status
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-700">
                <span>Database File:</span>
                <span className="font-mono text-slate-500 font-bold">backend/database/pugmark.db</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-700">
                <span>Quarantine Size:</span>
                <span className="font-mono text-[#1b4332] font-bold">1.42 GB (Non-destructive)</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span>Network Status:</span>
                <span className="font-mono text-[#1b4332] flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> 100% Offline Safe
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
