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
  Tag
} from 'lucide-react';
import { api } from '../services/api';
import { MaintenanceRecord, RecordListResponse } from '../types';

interface RecordsExplorerProps {
  initialIdent?: string | null;
  onClearInitialIdent?: () => void;
}

export const RecordsExplorer: React.FC<RecordsExplorerProps> = ({
  initialIdent,
  onClearInitialIdent
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

  // Fetch filter options
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

  // Handle direct lookup from other tabs (e.g. clicking citation in chat)
  useEffect(() => {
    if (initialIdent) {
      setSearchQuery(initialIdent);
      setPage(1);
      // Fetch single record to open modal immediately
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

  const handleCopyJson = () => {
    if (!selectedRecord) return;
    navigator.clipboard.writeText(JSON.stringify(selectedRecord, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Maintenance Records Explorer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, filter, and inspect {total.toLocaleString()} authentic aircraft logbook records.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {records.length} of {total.toLocaleString()} entries
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Record ID (e.g. 100004), defect terms, or action text..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
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
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
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
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
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
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table Container */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-28">Record ID</th>
                <th className="py-3 px-4 w-44">Subsystem</th>
                <th className="py-3 px-4">Reported Defect (Problem)</th>
                <th className="py-3 px-4">Maintenance Action Taken</th>
                <th className="py-3 px-4 w-36">Action Type</th>
                <th className="py-3 px-4 w-16 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-400 mb-2" />
                    <span>Loading maintenance records...</span>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    No logbook records found matching the query and filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr
                    key={r.ident}
                    onClick={() => setSelectedRecord(r)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-bold text-sky-400">{r.ident}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-sans inline-block">
                        {r.component_tag || 'GENERAL'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-200 max-w-md truncate" title={r.problem}>
                      {r.problem}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 max-w-md truncate" title={r.action}>
                      {r.action}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] text-emerald-400 font-sans">
                        {r.action_type || 'MAINTENANCE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button className="text-slate-500 group-hover:text-sky-400 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
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
              Page <strong className="text-slate-200">{page}</strong> of{' '}
              <strong className="text-slate-200">{totalPages}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  Record Detail: #{selectedRecord.ident}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Metadata Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-300 font-semibold font-mono">
                  IDENT #{selectedRecord.ident}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200">
                  Subsystem: {selectedRecord.component_tag || 'GENERAL'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-300">
                  Action: {selectedRecord.action_type || 'MAINTENANCE'}
                </span>
                {selectedRecord.performed_edit && (
                  <span className="px-2.5 py-1 rounded-md bg-purple-950 border border-purple-800 text-purple-300">
                    Edit Tag: {selectedRecord.performed_edit}
                  </span>
                )}
              </div>

              {/* Verbatim Problem */}
              <div className="space-y-1.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Verbatim Reported Defect (Original Text)
                </div>
                <div className="text-sm text-slate-100 font-sans font-medium leading-relaxed">
                  {selectedRecord.problem}
                </div>
              </div>

              {/* Verbatim Action */}
              <div className="space-y-1.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  Verbatim Maintenance Action Taken (Original Text)
                </div>
                <div className="text-sm text-slate-100 font-sans font-medium leading-relaxed">
                  {selectedRecord.action}
                </div>
              </div>

              {/* Cleaned Representation */}
              {selectedRecord.combined_clean && (
                <div className="space-y-1.5 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Normalized Search & Embedding Representation
                  </div>
                  <div className="text-xs text-slate-300 font-sans leading-relaxed">
                    {selectedRecord.combined_clean}
                  </div>
                </div>
              )}

              {/* Source Provenance */}
              <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-3">
                <span>Source File: {selectedRecord.source_filename}</span>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center space-x-1 text-sky-400 hover:text-sky-300 font-mono transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Tag className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied JSON' : 'Copy Record JSON'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
