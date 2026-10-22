import React, { useEffect, useState } from 'react';
import {
  Database,
  Layers,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Info,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { AnalyticsOverview } from '../types';

interface DashboardProps {
  onNavigateToRecords: (componentFilter?: string) => void;
  onSelectRecord: (ident: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToRecords, onSelectRecord }) => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const overview = await api.getAnalyticsOverview();
      setData(overview);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load fleet analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <RefreshCw className="w-10 h-10 text-sky-400 animate-spin" />
          <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full"></div>
        </div>
        <p className="text-sm font-medium text-slate-300">Loading historical fleet telemetry...</p>
        <span className="text-xs text-slate-500 font-mono">Aggregating 6,169 verified logbook rows</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="p-6 rounded-2xl bg-red-950/30 border border-red-800 text-red-200 space-y-3">
          <div className="flex items-center space-x-2 font-semibold text-red-300">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>Telemetry Service Offline</span>
          </div>
          <p className="text-sm text-red-300/80">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-900/60 hover:bg-red-800 text-white transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Cockpit HUD Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-sans">
              Fleet Maintenance Telemetry
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/80 text-[10px] font-mono uppercase tracking-wider flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>HISTORICAL VERIFIED</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time descriptive distributions, component defect frequencies, and action breakdown across 6,169 aircraft logs.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchDashboardData}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* 4 Glowing Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Records */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all"></div>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Total Ingested Logbooks</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
            {data.total_records.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-2">
            <span className="text-emerald-400 font-medium">100% Validated</span>
            <span>from MaintNet dataset</span>
          </div>
        </div>

        {/* Vector Embeddings */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Indexed Dense Vectors</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-indigo-300 tracking-tight">
            {data.ingestion_summary.vector_count.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span>Model: <strong className="font-mono text-slate-300">all-MiniLM-L6-v2</strong></span>
          </div>
        </div>

        {/* Monitored Subsystems */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Subsystem Categories</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-300 tracking-tight">
            {data.unique_components}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Intake, Baffle, Cylinders, Valvetrain
          </div>
        </div>

        {/* Action Types */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Action Classifications</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-300 tracking-tight">
            {data.unique_actions}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            R&R, Stop-drilled, Reamed, Torqued
          </div>
        </div>
      </div>

      {/* Visual Analytics Sections: Subsystems & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subsystems Frequency Distribution */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Reported Subsystem Defect Frequency</span>
              </h2>
              <p className="text-[11px] text-slate-400">Click any subsystem to filter records in Explorer</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Top 8 Subsystems
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {data.top_components.map((c) => (
              <button
                key={c.component}
                onClick={() => onNavigateToRecords(c.component)}
                className="w-full text-left space-y-1.5 p-2 rounded-xl hover:bg-slate-800/40 transition-colors group"
                title={`Filter Explorer by ${c.component}`}
              >
                <div className="flex justify-between text-xs">
                  <span className="text-slate-200 font-semibold group-hover:text-sky-300 flex items-center space-x-1.5">
                    <span>{c.component}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-sky-400" />
                  </span>
                  <span className="font-mono text-slate-400">
                    <strong className="text-slate-200">{c.count.toLocaleString()}</strong> ({c.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/60">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                    style={{ width: `${Math.min(c.percentage * 2.8, 100)}%` }}
                  ></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Maintenance Actions Taxonomy Breakdown */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Executed Maintenance Action Taxonomy</span>
              </h2>
              <p className="text-[11px] text-slate-400">Classification of technician remedies recorded</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Taxonomy Breakdown
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {data.top_action_types.map((a) => (
              <div key={a.action_type} className="space-y-1.5 p-2 rounded-xl">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-200 font-semibold">{a.action_type}</span>
                  <span className="font-mono text-slate-400">
                    <strong className="text-slate-200">{a.count.toLocaleString()}</strong> ({a.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/60">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                    style={{ width: `${Math.min(a.percentage * 1.8, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Records Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white">Recent Historical Logbook Entries</h2>
            <p className="text-[11px] text-slate-400">Click any row to inspect original text versus normalized representation</p>
          </div>
          <button
            onClick={() => onNavigateToRecords()}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1 font-semibold transition-colors px-3 py-1.5 rounded-lg bg-sky-950/40 border border-sky-800/60"
          >
            <span>Open All in Logbook Explorer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-28">IDENT</th>
                <th className="py-2.5 px-3 w-44">Subsystem</th>
                <th className="py-2.5 px-3">Reported Defect</th>
                <th className="py-2.5 px-3">Maintenance Action</th>
                <th className="py-2.5 px-3 w-36">Action Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono text-slate-300">
              {data.recent_records.map((r) => (
                <tr
                  key={r.ident}
                  onClick={() => onSelectRecord(r.ident)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                >
                  <td className="py-2.5 px-3 font-bold text-sky-400 group-hover:underline">#{r.ident}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700 font-sans">
                      {r.component_tag || 'GENERAL'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans max-w-xs truncate text-slate-200" title={r.problem}>
                    {r.problem}
                  </td>
                  <td className="py-2.5 px-3 font-sans max-w-sm truncate text-slate-300" title={r.action}>
                    {r.action}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] text-emerald-400 font-sans font-medium">
                      {r.action_type || 'MAINTENANCE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety & Descriptive Integrity Notice */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start space-x-3 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-slate-200">Aviation Safety Notice:</strong> {data.disclaimer} Always consult approved Aircraft Maintenance Manuals (AMM) and certified A&P personnel for aircraft release decisions.
        </p>
      </div>
    </div>
  );
};
