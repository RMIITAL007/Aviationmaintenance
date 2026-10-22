import React, { useEffect, useState } from 'react';
import {
  Database,
  Layers,
  Wrench,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { AnalyticsOverview } from '../types';

interface DashboardProps {
  onNavigateToRecords: () => void;
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
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading historical fleet maintenance statistics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="p-6 rounded-xl bg-red-950/30 border border-red-800 text-red-200 space-y-3">
          <div className="flex items-center space-x-2 font-semibold text-red-300">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>Unable to load dashboard data</span>
          </div>
          <p className="text-sm text-red-300/80">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-red-900/60 hover:bg-red-800 text-white transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Top Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Fleet Maintenance Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical defect patterns, component failure frequencies, and maintenance actions.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="self-start sm:self-auto flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Maintenance Records</span>
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {data.total_records.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1">
            <span className="text-emerald-400 font-medium">100% Verified</span>
            <span>from MaintNet dataset</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Indexed Semantic Vectors</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {data.ingestion_summary.vector_count.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Model: <span className="font-mono text-slate-300">all-MiniLM-L6-v2</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Subsystem Categories</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {data.unique_components}
          </div>
          <div className="text-[11px] text-slate-400">
            Intake, Baffles, Cylinders, Valvetrain
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Action Classifications</span>
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {data.unique_actions}
          </div>
          <div className="text-[11px] text-slate-400">
            R&R, Stop-drilled, Reamed, Torqued
          </div>
        </div>
      </div>

      {/* Analytics Charts & Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Failing Components */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Most Frequently Reported Subsystems
            </h2>
            <span className="text-xs font-mono text-slate-400">Historical Count</span>
          </div>
          <div className="space-y-3">
            {data.top_components.map((c) => (
              <div key={c.component} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{c.component}</span>
                  <span className="font-mono text-slate-400">
                    {c.count.toLocaleString()} ({c.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(c.percentage * 2.5, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Maintenance Actions */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Frequent Maintenance Action Types
            </h2>
            <span className="text-xs font-mono text-slate-400">Frequency</span>
          </div>
          <div className="space-y-3">
            {data.top_action_types.map((a) => (
              <div key={a.action_type} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{a.action_type}</span>
                  <span className="font-mono text-slate-400">
                    {a.count.toLocaleString()} ({a.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(a.percentage * 2, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Logbook Entries Table */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Recent Maintenance Records</h2>
            <p className="text-xs text-slate-400">Sample of latest logbook entries in repository</p>
          </div>
          <button
            onClick={onNavigateToRecords}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1 font-medium transition-colors"
          >
            <span>View All in Explorer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Record ID</th>
                <th className="py-2.5 px-3">Subsystem</th>
                <th className="py-2.5 px-3">Reported Defect</th>
                <th className="py-2.5 px-3">Maintenance Action</th>
                <th className="py-2.5 px-3">Action Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {data.recent_records.map((r) => (
                <tr
                  key={r.ident}
                  onClick={() => onSelectRecord(r.ident)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-sky-400">{r.ident}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-sans">
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
                    <span className="text-[10px] text-emerald-400 font-sans">
                      {r.action_type || 'MAINTENANCE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Regulatory / Descriptive Statistics Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start space-x-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Statistical Boundary:</strong> {data.disclaimer}
        </p>
      </div>
    </div>
  );
};

function CheckCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
