import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Search } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/audit/logs')
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  const filtered = logs.filter((l) => {
    return l.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
           l.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
           l.output.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Auditability &amp; Compliance
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            System Execution &amp; Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Log of pipeline predictions, threshold evaluations, and officer review decisions.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search audit logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 w-64 focus:border-emerald-600 outline-none font-medium shadow-sm"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-500 text-xs font-bold">
            <Activity className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1b4332]" />
            Loading Audit Logs...
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Stage</th>
                  <th className="py-3 px-3">Input Ref</th>
                  <th className="py-3 px-3">Pipeline Output</th>
                  <th className="py-3 px-3">Confidence</th>
                  <th className="py-3 px-3">Reason / Justification</th>
                  <th className="py-3 px-3">Model</th>
                  <th className="py-3 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filtered.map((l) => (
                  <tr key={l.log_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-[#1b4332]">{l.stage}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{l.input_ref}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {l.output}
                      {l.operator_override && (
                        <span className="ml-2 px-1.5 py-0.5 text-[9px] rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                          Human Override ({l.override_by})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-800 font-bold">{(l.confidence * 100).toFixed(0)}%</td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs">{l.reason}</td>
                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{l.model_version}</td>
                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{l.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
