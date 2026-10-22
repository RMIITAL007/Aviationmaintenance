import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench
} from 'lucide-react';
import { api } from '../services/api';
import { SafetyAlertItem, AlertsResponse } from '../types';
import { KPICard } from './common/KPICard';

interface FleetAlertsViewProps {
  onAskCopilot: (query: string) => void;
  onSelectRecord: (ident: string) => void;
}

export const FleetAlertsView: React.FC<FleetAlertsViewProps> = ({
  onAskCopilot,
  onSelectRecord
}) => {
  const [alertsData, setAlertsData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSafetyAlerts();
      setAlertsData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch safety alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = (alertsData?.alerts || []).filter((alt) => {
    const matchesSeverity = severityFilter === 'ALL' || alt.severity === severityFilter;
    const matchesQuery =
      searchQuery.trim() === '' ||
      alt.ident.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alt.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alt.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alt.action.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesQuery;
  });

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-950/80 border-red-500/80 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse';
      case 'HIGH':
        return 'bg-amber-950/80 border-amber-500/80 text-amber-300';
      case 'ELEVATED':
        return 'bg-sky-950/80 border-sky-500/80 text-sky-300';
      case 'ADVISORY':
        return 'bg-purple-950/80 border-purple-500/80 text-purple-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  const handleInvestigateAlert = (alt: SafetyAlertItem) => {
    const query = `What were the recorded corrective actions and root causes when record #${alt.ident} reported: "${alt.problem}"?`;
    onAskCopilot(query);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Fleet Safety Alerts & Discrepancies
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800/80">
              Real-Time Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Prioritized safety anomalies derived from historical logbooks. Evaluates in-flight engine shutdowns, structural cracks, zero-compression incidents, and service bulletin compliance.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>Continuous Telemetry Active</span>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Discrepancies"
          value={alertsData?.total_alerts.toLocaleString() || '0'}
          subtitle="Anomalies detected across logbooks"
          trend="neutral"
          icon={<ShieldAlert className="w-5 h-5 text-sky-400" />}
        />
        <KPICard
          title="Critical In-Flight"
          value={alertsData?.critical_count.toLocaleString() || '0'}
          subtitle="Engine shutdown or flameout events"
          badge="CRITICAL"
          badgeColor="text-red-400 bg-red-950/80 border-red-800/80"
          trend="down"
          icon={<Flame className="w-5 h-5 text-red-400" />}
        />
        <KPICard
          title="Structural & Integrity"
          value={alertsData?.high_count.toLocaleString() || '0'}
          subtitle="Cracked parts & metal shavings"
          badge="HIGH"
          badgeColor="text-amber-400 bg-amber-950/80 border-amber-800/80"
          trend="neutral"
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
        />
        <KPICard
          title="Separation & Leaks"
          value={alertsData?.elevated_count.toLocaleString() || '0'}
          subtitle="Hardware separation & intake leaks"
          badge="ELEVATED"
          badgeColor="text-sky-400 bg-sky-950/80 border-sky-800/80"
          trend="neutral"
          icon={<Wrench className="w-5 h-5 text-sky-400" />}
        />
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Severity Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'CRITICAL', 'HIGH', 'ELEVATED', 'ADVISORY'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                severityFilter === sev
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by fault, action, or ident..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Alert Feed */}
      {loading && (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-mono">Evaluating safety anomalies across 6,169 logbooks...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/70 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && filteredAlerts.length === 0 && (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 text-slate-400 text-xs">
          No safety anomalies found matching current filters.
        </div>
      )}

      {!loading && filteredAlerts.length > 0 && (
        <div className="space-y-3.5">
          {filteredAlerts.map((alt) => (
            <div
              key={alt.id}
              className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur border border-slate-800/90 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getSeverityBadgeClass(
                      alt.severity
                    )}`}
                  >
                    {alt.severity}
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    #{alt.ident}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-semibold text-slate-300">
                    {alt.component}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[11px] text-slate-400">
                    {alt.trigger_condition}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-white leading-relaxed">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mr-1.5">
                      Reported Defect:
                    </span>
                    {alt.problem}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mr-1.5">
                      Corrective Action:
                    </span>
                    {alt.action}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2.5 flex-shrink-0">
                <button
                  onClick={() => onSelectRecord(alt.ident)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors flex items-center space-x-1"
                  title="Inspect verbatim logbook entry"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Logbook</span>
                </button>
                <button
                  onClick={() => handleInvestigateAlert(alt)}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 text-xs font-semibold transition-colors flex items-center space-x-1.5"
                  title="Consult AI Copilot regarding this discrepancy"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Investigate in Copilot</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
