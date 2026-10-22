import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  ArrowRight,
  Sparkles,
  Layers,
  Wrench,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { SubsystemComparisonItem } from '../types';

interface SubsystemCompareProps {
  onAskCopilot: (query: string) => void;
  onSelectRecord: (ident: string) => void;
}

const AVAILABLE_SUBSYSTEMS = [
  { id: 'CYLINDER & PISTON', label: 'Cylinder & Piston', color: 'from-sky-500/20 to-blue-600/10 border-sky-500/40 text-sky-400' },
  { id: 'ENGINE BAFFLE', label: 'Engine Baffle', color: 'from-amber-500/20 to-orange-600/10 border-amber-500/40 text-amber-400' },
  { id: 'IGNITION & MAGNETO', label: 'Ignition & Magneto', color: 'from-purple-500/20 to-indigo-600/10 border-purple-500/40 text-purple-400' },
  { id: 'VALVE TRAIN', label: 'Valve Train', color: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/40 text-emerald-400' },
  { id: 'FUEL & INDUCTION', label: 'Fuel & Induction', color: 'from-rose-500/20 to-red-600/10 border-rose-500/40 text-rose-400' },
  { id: 'OIL & LUBRICATION', label: 'Oil & Lubrication', color: 'from-yellow-500/20 to-amber-600/10 border-yellow-500/40 text-yellow-400' },
  { id: 'ENGINE CONTROLS', label: 'Engine Controls', color: 'from-cyan-500/20 to-sky-600/10 border-cyan-500/40 text-cyan-400' },
  { id: 'AIRFRAME & COWLING', label: 'Airframe & Cowling', color: 'from-slate-500/20 to-zinc-600/10 border-slate-500/40 text-slate-300' }
];

export const SubsystemCompare: React.FC<SubsystemCompareProps> = ({
  onAskCopilot,
  onSelectRecord
}) => {
  const [selectedSubsystems, setSelectedSubsystems] = useState<string[]>([
    'CYLINDER & PISTON',
    'ENGINE BAFFLE',
    'IGNITION & MAGNETO'
  ]);
  const [comparisonData, setComparisonData] = useState<SubsystemComparisonItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = async () => {
    if (selectedSubsystems.length === 0) {
      setComparisonData([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.compareSubsystems(selectedSubsystems);
      setComparisonData(res.comparisons);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subsystem comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [selectedSubsystems]);

  const toggleSubsystem = (id: string) => {
    if (selectedSubsystems.includes(id)) {
      if (selectedSubsystems.length > 1) {
        setSelectedSubsystems(selectedSubsystems.filter((s) => s !== id));
      }
    } else {
      if (selectedSubsystems.length < 4) {
        setSelectedSubsystems([...selectedSubsystems, id]);
      }
    }
  };

  const handleLaunchComparativeInquiry = () => {
    const compNames = selectedSubsystems.map((s) => s.toLowerCase()).join(' versus ');
    const query = `Compare historical maintenance actions and failure modes for ${compNames}. What were the primary repair methods recorded?`;
    onAskCopilot(query);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <GitCompare className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Subsystem Comparative Analysis
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-800/80">
              Multi-Subsystem Matrix
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Side-by-side technical evaluation across aircraft subsystems. Compare defect distributions, corrective action taxonomies, and cross-reference verbatim entries with AI Copilot.
          </p>
        </div>

        {/* AI Copilot Comparison Trigger */}
        <button
          onClick={handleLaunchComparativeInquiry}
          disabled={selectedSubsystems.length === 0}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-semibold text-xs shadow-[0_0_20px_-3px_rgba(56,189,248,0.4)] disabled:opacity-50 transition-all cursor-pointer flex-shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask Copilot to Compare</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subsystem Selection Chips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <span>Select Subsystems to Compare</span>
            <span className="text-[11px] font-normal text-slate-500">(Choose up to 4)</span>
          </label>
          <span className="text-xs font-mono text-sky-400">
            {selectedSubsystems.length} selected
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {AVAILABLE_SUBSYSTEMS.map((sub) => {
            const isSelected = selectedSubsystems.includes(sub.id);
            return (
              <button
                key={sub.id}
                onClick={() => toggleSubsystem(sub.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all flex items-center space-x-2 ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSelected ? 'bg-sky-400' : 'bg-slate-600'
                  }`}
                />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-mono">Aggregating historical logbook metrics across subsystems...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/70 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Columns Matrix */}
      {!loading && comparisonData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comparisonData.map((item, idx) => (
            <div
              key={item.component}
              className="p-6 rounded-2xl bg-slate-900/80 backdrop-blur border border-slate-800/90 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-sky-500/40 transition-all"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/80">
                    SUBSYSTEM #{idx + 1}
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    {item.share_percentage}% of Fleet
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight mb-1">
                  {item.component}
                </h3>
                <p className="text-xs text-slate-400">
                  Total logbook occurrences: <strong className="text-white font-mono">{item.total_records.toLocaleString()}</strong>
                </p>
              </div>

              {/* Action Breakdown Distribution */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                    Remedy Action Distribution
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    Top: {item.top_action}
                  </span>
                </div>
                <div className="space-y-2">
                  {item.action_breakdown.map((act) => (
                    <div key={act.action_type} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-300 truncate pr-2">{act.action_type}</span>
                        <span className="text-slate-400">{act.percentage}% ({act.count})</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full"
                          style={{ width: `${act.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verbatim Sample Entries */}
              <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Verbatim Historical Logs
                </span>
                <div className="space-y-2">
                  {item.sample_records.map((r: any) => (
                    <div
                      key={r.ident}
                      onClick={() => onSelectRecord(r.ident)}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors text-left group/item"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-sky-400">
                          #{r.ident}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover/item:text-sky-300 transition-colors" />
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {r.problem}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
