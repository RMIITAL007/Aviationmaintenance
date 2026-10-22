import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  BookA,
  Shield,
  Layers,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import { IngestionStatus } from '../types';

export const DataIngestion: React.FC = () => {
  const [status, setStatus] = useState<IngestionStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Dictionaries state
  const [dictionaries, setDictionaries] = useState<any>(null);
  const [activeDictTab, setActiveDictTab] = useState<'abbr' | 'misp' | 'unexp'>('abbr');
  const [dictSearch, setDictSearch] = useState('');

  const loadStatus = async () => {
    try {
      const [st, dicts] = await Promise.all([
        api.getIngestionStatus(),
        api.getDictionaries()
      ]);
      setStatus(st);
      setDictionaries(dicts);
    } catch (err: any) {
      console.error('Failed to load ingestion status:', err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const res = await api.uploadFile(file);
      setUploadResult(res);
      await loadStatus();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    setError(null);
    try {
      await api.reindexVectors();
      await loadStatus();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Reindexing failed');
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Data Ingestion & Normalization</h1>
        <p className="text-xs text-slate-400 mt-1">
          Import aircraft maintenance logbooks, trigger embedding indexing, and inspect technical dictionaries.
        </p>
      </div>

      {/* Top Status & Re-index Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Ingested Records</span>
            <FileSpreadsheet className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {status?.total_records.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-400">
            Source: <span className="text-slate-300 font-mono">{status?.source_files?.[0] || 'Aircraft_Annotation_DataFile.csv'}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Vector Embeddings</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {status?.vector_count.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Dense index ready for search</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="text-xs font-semibold text-white">Embedding Re-Indexing</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Rebuild vector representations using all-MiniLM-L6-v2</p>
          </div>
          <button
            onClick={handleReindex}
            disabled={reindexing}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
            <span>{reindexing ? 'Generating Embeddings...' : 'Re-Index Vectors'}</span>
          </button>
        </div>
      </div>

      {/* Upload Box */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-semibold text-white">Upload New Maintenance Logbook</h2>
        <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-xl p-8 text-center transition-colors bg-slate-950/40">
          <input
            type="file"
            id="fileInput"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center space-y-2">
            <UploadCloud className="w-10 h-10 text-sky-400" />
            <div className="text-sm font-medium text-white">
              {uploading ? 'Processing & Validating Logbook...' : 'Click to select CSV or Excel logbook'}
            </div>
            <p className="text-xs text-slate-500">
              Supports MaintNet CSV (IDENT, PROBLEM, ACTION) and Cleaned MaintNet Excel workbooks. Max 25 MB.
            </p>
          </label>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {uploadResult && (
          <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 space-y-1 font-mono">
            <div className="font-sans font-semibold text-white flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ingestion Complete: {uploadResult.filename}</span>
            </div>
            <div className="text-[11px] text-emerald-300/80">
              Rows read: {uploadResult.total_rows_read} • Imported: {uploadResult.records_imported} • Duplicates skipped: {uploadResult.duplicates_skipped}
            </div>
          </div>
        )}
      </div>

      {/* Technical Normalization Dictionaries Browser */}
      {dictionaries && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                <BookA className="w-4 h-4 text-sky-400" />
                <span>Technical Normalization Dictionaries</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configurable domain dictionaries for abbreviation expansion and misspelling correction.
              </p>
            </div>

            {/* Sub-tabs */}
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveDictTab('abbr')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeDictTab === 'abbr' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Abbreviations ({dictionaries.abbreviations_count})
              </button>
              <button
                onClick={() => setActiveDictTab('misp')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeDictTab === 'misp' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Misspellings ({dictionaries.misspellings_count})
              </button>
              <button
                onClick={() => setActiveDictTab('unexp')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1 ${
                  activeDictTab === 'unexp' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-400/80 hover:text-amber-300'
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>Safety Guardlist ({dictionaries.unexpanded_acronyms_count})</span>
              </button>
            </div>
          </div>

          {/* Dictionary search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={dictSearch}
              onChange={(e) => setDictSearch(e.target.value)}
              placeholder="Filter dictionary entries..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Dictionary Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto p-1 font-mono text-xs">
            {activeDictTab === 'abbr' &&
              Object.entries(dictionaries.abbreviations as Record<string, string>)
                .filter(([k, v]) => k.includes(dictSearch.toUpperCase()) || v.includes(dictSearch.toUpperCase()))
                .map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex justify-between items-center">
                    <span className="font-bold text-sky-400">{k}</span>
                    <span className="text-[11px] text-slate-300 font-sans">{v}</span>
                  </div>
                ))}

            {activeDictTab === 'misp' &&
              Object.entries(dictionaries.misspellings as Record<string, string>)
                .filter(([k, v]) => k.includes(dictSearch.toUpperCase()) || v.includes(dictSearch.toUpperCase()))
                .map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex justify-between items-center">
                    <span className="line-through text-red-400/80 text-[11px]">{k}</span>
                    <span className="text-emerald-400 font-medium text-[11px] font-sans">{v}</span>
                  </div>
                ))}

            {activeDictTab === 'unexp' &&
              (dictionaries.unexpanded_acronyms as string[])
                .filter((item) => item.includes(dictSearch.toUpperCase()))
                .map((acronym) => (
                  <div key={acronym} className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/60 flex items-center justify-between">
                    <span className="font-bold text-amber-300">{acronym}</span>
                    <span className="text-[10px] text-amber-200/60 font-sans uppercase">Protected Acronym</span>
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
};
