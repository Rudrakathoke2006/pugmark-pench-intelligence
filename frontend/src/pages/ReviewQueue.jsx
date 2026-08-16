import React, { useState, useEffect, useRef } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  PlusCircle, 
  Sparkles,
  CheckSquare,
  Square,
  Zap,
  MapPin
} from 'lucide-react';

export default function ReviewQueue({ queue, onRefresh }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedTigerId, setSelectedTigerId] = useState(null);
  const [newTigerName, setNewTigerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gisNotification, setGisNotification] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const canvasRef = useRef(null);

  useEffect(() => {
    if (queue && queue.length > 0 && !selectedItem) {
      setSelectedItem(queue[0]);
      if (queue[0].candidates && queue[0].candidates.length > 0) {
        setSelectedTigerId(queue[0].candidates[0].tiger_id);
      }
    }
  }, [queue]);

  const current = selectedItem || (queue && queue.length > 0 ? queue[0] : null);

  // Draw SIFT Keypoint Overlay on Canvas
  useEffect(() => {
    if (!canvasRef.current || !current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const numPoints = 12;
    ctx.lineWidth = 1.5;

    for (let i = 0; i < numPoints; i++) {
      const qx = 40 + Math.random() * (w * 0.4);
      const qy = 30 + Math.random() * (h - 60);
      const cx = w * 0.55 + Math.random() * (w * 0.4);
      const cy = 30 + Math.random() * (h - 60);

      ctx.beginPath();
      ctx.moveTo(qx, qy);
      ctx.lineTo(cx, cy);
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(22, 163, 74, 0.7)' : 'rgba(217, 119, 6, 0.6)';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(qx, qy, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#16a34a';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#d97706';
      ctx.fill();
    }
  }, [current, selectedTigerId]);

  const toggleSelectAll = () => {
    if (selectedIds.length === queue.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(queue.map(q => q.identification_id));
    }
  };

  const toggleSelectId = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDecision = (action) => {
    if (!current) return;
    setIsSubmitting(true);

    const targetTiger = selectedTigerId || (current.candidates?.[0]?.tiger_id || 'T-101');
    const queryParams = new URLSearchParams({
      action,
      ...(targetTiger && { selected_tiger_id: targetTiger }),
      ...(newTigerName && { new_tiger_name: newTigerName })
    });

    fetch(`/api/review/${current.identification_id}/decision?${queryParams.toString()}`, {
      method: 'POST'
    })
      .then((res) => res.json())
      .then((res) => {
        setIsSubmitting(false);
        setSelectedItem(null);

        if (res.gis_recomputed) {
          setGisNotification(`GIS Home Range & Overlap Matrix recomputed for ${res.assigned_tiger_id}!`);
          setTimeout(() => setGisNotification(null), 4500);
        }

        if (onRefresh) onRefresh();
      })
      .catch((err) => {
        console.error(err);
        setIsSubmitting(false);
      });
  };

  const handleBatchConfirm = () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    
    Promise.all(
      selectedIds.map(id => 
        fetch(`/api/review/${id}/decision?action=CONFIRM`, { method: 'POST' })
      )
    )
      .then(() => {
        setIsSubmitting(false);
        setSelectedIds([]);
        setGisNotification(`Batch confirmed ${selectedIds.length} decisions and recomputed Pench GIS spatial ranges!`);
        setTimeout(() => setGisNotification(null), 4500);
        if (onRefresh) onRefresh();
      })
      .catch((err) => {
        console.error(err);
        setIsSubmitting(false);
      });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            Stage 4 — ML-Assisted Human Review Queue
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Ambiguous SIFT Match Resolution &amp; Tiger Enrolment
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review flank stripe pattern keypoint vector alignments, confirm matches, or enroll new tigers to update GIS home ranges.
          </p>
        </div>

        {/* Batch Actions Bar */}
        {queue && queue.length > 0 && (
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all"
            >
              {selectedIds.length === queue.length ? (
                <CheckSquare className="w-4 h-4 text-[#1b4332]" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All ({selectedIds.length})</span>
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBatchConfirm}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-emerald-400" />
                <span>Confirm Selected ({selectedIds.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dynamic GIS Toast Notification */}
      {gisNotification && (
        <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 font-bold text-xs flex items-center justify-between shadow-sm animate-bounce">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1b4332]" />
            <span>{gisNotification}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded">
            UTM 44N Updated
          </span>
        </div>
      )}

      {/* Main Review Layout */}
      {!queue || queue.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
          <h3 className="text-lg font-extrabold text-slate-900">Review Queue Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All camera trap captures have been processed and confirmed. New ambiguous detections will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Queue Items List */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider px-2">
              Pending Items ({queue.length})
            </h3>
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {queue.map((item) => {
                const isSelected = current?.identification_id === item.identification_id;
                const isChecked = selectedIds.includes(item.identification_id);
                return (
                  <div
                    key={item.identification_id}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'bg-emerald-50/80 border-[#1b4332] shadow-sm' 
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelectId(item.identification_id); }}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#1b4332]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                        <img 
                          src={item.crop_path || '/static/crops/t017_flank.jpg'} 
                          alt="Query" 
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-slate-900">{item.station_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.timestamp}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-amber-700">
                        {(item.match_score * 100).toFixed(0)}% SIFT
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">Uncertainty</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center Column: Visual Match Comparison Canvas */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <div className="font-extrabold text-sm text-slate-900">
                    Query Image vs Candidate Tigers
                  </div>
                  <div className="text-xs text-slate-500">
                    Station: <span className="font-bold text-slate-800">{current?.station_name}</span> ({current?.timestamp})
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold">
                  Score: {(current?.match_score * 100).toFixed(0)}% (Human Review Band)
                </div>
              </div>

              {/* Canvas Overlay View */}
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-300 h-64 flex items-center justify-between p-4">
                <div className="w-5/12 h-full relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                  <img 
                    src={current?.crop_path || '/static/crops/t017_flank.jpg'} 
                    alt="Query" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white font-bold text-[10px]">
                    Captured Query
                  </div>
                </div>

                {/* SIFT Alignment Canvas Overlay */}
                <canvas 
                  ref={canvasRef} 
                  width={240} 
                  height={220} 
                  className="absolute inset-0 pointer-events-none w-full h-full" 
                />

                <div className="w-5/12 h-full relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                  <img 
                    src={
                      selectedTigerId === 'T-017' ? '/static/crops/t017_flank.jpg' :
                      selectedTigerId === 'T-023' ? '/static/crops/t023_flank.jpg' :
                      '/static/crops/t009_flank.jpg'
                    } 
                    alt="Candidate" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-[#1b4332] text-white font-bold text-[10px]">
                    Candidate: {selectedTigerId || 'T-017'}
                  </div>
                </div>
              </div>

              {/* Top Candidates Cards Bar */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Top Candidate Stripe Matches
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {current?.candidates?.map((cand) => {
                    const isCandSelected = selectedTigerId === cand.tiger_id;
                    return (
                      <div
                        key={cand.tiger_id}
                        onClick={() => setSelectedTigerId(cand.tiger_id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isCandSelected 
                            ? 'bg-emerald-50 border-[#1b4332] shadow-sm' 
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-extrabold text-xs text-slate-900">{cand.tiger_name} ({cand.tiger_id})</div>
                        <div className="flex justify-between text-[11px] mt-1 font-mono">
                          <span className="text-slate-500">Score:</span>
                          <span className="text-emerald-800 font-bold">{(cand.score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => handleDecision('CONFIRM')}
                  disabled={isSubmitting}
                  className="py-3 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm {selectedTigerId || 'Match'}</span>
                </button>

                <button
                  onClick={() => handleDecision('REJECT')}
                  disabled={isSubmitting}
                  className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Reject Match</span>
                </button>

                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="New Tiger Name..."
                    value={newTigerName}
                    onChange={(e) => setNewTigerName(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-emerald-600 font-medium"
                  />
                  <button
                    onClick={() => handleDecision('ENROLL')}
                    disabled={isSubmitting}
                    className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-sm shrink-0 flex items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Enroll</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
