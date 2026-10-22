import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  FileText,
  X,
  Check,
  Tag,
  Sparkles,
  BotMessageSquare,
  Compass,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { MaintenanceRecord, RecordListResponse } from '../types';

interface RecordsExplorerProps {
  initialIdent?: string | null;
  onClearInitialIdent?: () => void;
  onAskCopilot?: (query: string) => void;
}

const QUICK_TOPICS = [
  { label: "Intake Gasket Leaks", query: "intake gasket leaking" },
  { label: "Cracked Baffles", query: "baffle cracked" },
  { label: "Loose Rocker Covers", query: "rocker box cover loose" },
  { label: "Low Compression", query: "low compression" },
  { label: "Stuck Exhaust Valves", query: "stuck exhaust valve" },
  { label: "Engine Idle Shutdown", query: "engine idle override" }
];

export const RecordsExplorer: React.FC<RecordsExplorerProps> = ({
  initialIdent,
  onClearInitialIdent,
  onAskCopilot
}) => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('ALL');
  const [selectedActionType, setSelectedActionType] = useState('ALL');
  const [componentsList, setComponentsList] = useState<string[]>([]);
  const [actionTypesList, setActionTypesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [comps, acts] = await Promise.all([
          api.getComponents(),
          api.getActionTypes()
        ]);
        setComponentsList(comps);
        setActionTypesList(acts);
      } catch (err) {
        console.error('Error fetching filter lists:', err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (initialIdent) {
      setSearchQuery(initialIdent);
      setPage(1);
      api.getRecordDetail(initialIdent)
        .then((rec) => setSelectedRecord(rec))
        .catch(() => {});
      if (onClearInitialIdent) onClearInitialIdent();
    }
  }, [initialIdent]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data: RecordListResponse = await api.getRecords({
        page,
        page_size: pageSize,
        query: searchQuery.trim() || undefined,
        component: selectedComponent === 'ALL' ? undefined : selectedComponent,
        action_type: selectedActionType === 'ALL' ? undefined : selectedActionType
      });
      setRecords(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, pageSize, selectedComponent, selectedActionType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const handleSelectTopic = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleCopyJson = () => {
    if (!selectedRecord) return;
    navigator.clipboard.writeText(JSON.stringify(selectedRecord, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActionBadgeColor = (actionType?: string) => {
    if (!actionType) return 'bg-slate-800 text-slate-300 border-slate-700';
    const a = actionType.toUpperCase();
    if (a.includes('REPLACE')) return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
    if (a.includes('STOP')) return 'bg-amber-950/80 text-amber-400 border-amber-800/80';
    if (a.includes('REAM')) return 'bg-purple-950/80 text-purple-400 border-purple-800/80';
    if (a.includes('TIGHTEN') || a.includes('TORQUE')) return 'bg-sky-950/80 text-sky-400 border-sky-800/80';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-sans">
              Maintenance Logbook Explorer
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800/80 text-[10px] font-mono font-bold">
              6,169 ROWS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and inspect authentic verbatim records alongside normalized technical representations.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          Showing {records.length} of <strong className="text-white">{total.toLocaleString()}</strong> entries
        </div>
      </div>

      {/* Quick Topic Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono uppercase text-slate-400 font-bold mr-1">
          Quick Filters:
        </span>
        {QUICK_TOPICS.map((topic) => (
          <button
            key={topic.label}
            onClick={() => handleSelectTopic(topic.query)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              searchQuery === topic.query
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            {topic.label}
          </button>
        ))}
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setPage(1);
            }}
            className="text-[11px] text-red-400 hover:text-red-300 ml-2 underline"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl space-y-3 shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Record ID (e.g. 100004), defect terms, or action text..."
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors shadow-inner"
            />
          </div>

          {/* Subsystem Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedComponent}
              onChange={(e) => {
                setSelectedComponent(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 shadow-inner"
            >
              <option value="ALL">All Subsystems</option>
              {componentsList.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>

          {/* Action Type Filter */}
          <select
            value={selectedActionType}
            onChange={(e) => {
              setSelectedActionType(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 shadow-inner"
          >
            <option value="ALL">All Action Types</option>
            {actionTypesList.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-900/30"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-28">IDENT</th>
                <th className="py-3 px-4 w-44">Subsystem</th>
                <th className="py-3 px-4">Reported Defect</th>
                <th className="py-3 px-4">Maintenance Action</th>
                <th className="py-3 px-4 w-36">Action Type</th>
                <th className="py-3 px-4 w-24 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-sans">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-2" />
                    <span className="text-sm font-medium">Scanning maintenance records...</span>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-sans space-y-2">
                    <Compass className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <div className="text-sm font-bold text-slate-300">No matching logbook records found</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try adjusting search terms or clearing subsystem filters.
                    </p>
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr
                    key={r.ident}
                    onClick={() => setSelectedRecord(r)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-extrabold text-sky-400 group-hover:underline">#{r.ident}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700/80 font-sans inline-block">
                        {r.component_tag || 'GENERAL'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-200 max-w-xs truncate" title={r.problem}>
                      {r.problem}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 max-w-sm truncate" title={r.action}>
                      {r.action}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium border ${getActionBadgeColor(r.action_type)}`}>
                        {r.action_type || 'MAINTENANCE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button className="px-2 py-1 rounded bg-slate-800/80 group-hover:bg-sky-500/20 text-slate-400 group-hover:text-sky-300 transition-all border border-slate-700 group-hover:border-sky-500/40 text-[11px] font-sans flex items-center space-x-1 mx-auto">
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-sans">
          <div className="flex items-center space-x-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Page <strong className="text-white font-mono">{page}</strong> of{' '}
              <strong className="text-white font-mono">{totalPages}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-extrabold text-white font-mono">
                  LOGBOOK RECORD DETAIL: #{selectedRecord.ident}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs font-sans">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-300 font-extrabold font-mono">
                  IDENT #{selectedRecord.ident}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
                  Subsystem: {selectedRecord.component_tag || 'GENERAL'}
                </span>
                <span className={`px-2.5 py-1 rounded-lg border ${getActionBadgeColor(selectedRecord.action_type)}`}>
                  Action: {selectedRecord.action_type || 'MAINTENANCE'}
                </span>
                {selectedRecord.performed_edit && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-950 border border-purple-800 text-purple-300 font-mono">
                    Edit: {selectedRecord.performed_edit}
                  </span>
                )}
              </div>

              {/* Verbatim Problem */}
              <div className="space-y-1.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Verbatim Reported Defect (Original Raw Text)
                </div>
                <div className="text-sm text-slate-100 font-medium leading-relaxed">
                  {selectedRecord.problem}
                </div>
              </div>

              {/* Verbatim Action */}
              <div className="space-y-1.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Verbatim Maintenance Action Taken (Original Raw Text)
                </div>
                <div className="text-sm text-slate-100 font-medium leading-relaxed">
                  {selectedRecord.action}
                </div>
              </div>

              {/* Cleaned Representation */}
              {selectedRecord.combined_clean && (
                <div className="space-y-1.5 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    Normalized Search & Vector Embedding Representation
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed font-mono">
                    {selectedRecord.combined_clean}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 pt-4 gap-3">
                {onAskCopilot && (
                  <button
                    onClick={() => {
                      const q = `What corrective actions were taken for fault in record ${selectedRecord.ident}: "${selectedRecord.problem}"?`;
                      setSelectedRecord(null);
                      onAskCopilot(q);
                    }}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <BotMessageSquare className="w-3.5 h-3.5" />
                    <span>Ask AI Copilot About This Record</span>
                  </button>
                )}

                <button
                  onClick={handleCopyJson}
                  className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Tag className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Record JSON'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
