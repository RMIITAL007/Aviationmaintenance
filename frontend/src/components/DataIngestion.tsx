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
  Search,
  Download,
  Copy,
  Check
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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const handleDownloadSampleCsv = () => {
    const sampleCsv = `IDENT,PROBLEM,ACTION\n200001,#1 CYLINDER INTAKE GASKET LEAKING,REMOVED & REPLACED GASKET.\n200002,ENGINE IDLE OVERRIDE SPEED WAS 1350 RPM,ADJUSTED IDLE SETTING IAW MAINTENANCE MANUAL.\n200003,R/H REAR BAFFLE CRACKED AT INTERCONNECT,STOP DRILLED CRACK AND FABRICATED DOUBLER.\n200004,#3 EXHAUST VALVE STUCK IN FLIGHT,REAMED EXHAUST VALVE GUIDES IAW SI 388C.\n`;
    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_aviation_logbook.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyItem = (key: string, val: string) => {
    navigator.clipboard.writeText(`${key} -> ${val}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="p-6 md:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-sans">
              Data Ingestion & Normalization
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/80 text-[10px] font-mono font-bold">
              PIPELINE v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Import new aviation maintenance records, re-index SentenceTransformers embeddings, and manage technical dictionaries.
          </p>
        </div>

        <button
          onClick={handleDownloadSampleCsv}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-sky-400 border border-slate-800 hover:border-sky-500/40 transition-colors shadow-sm self-start sm:self-auto font-medium"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Sample CSV</span>
        </button>
      </div>

      {/* Top Status & Re-index Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Ingested Logbook Records</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">
            {status?.total_records.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Source: <span className="text-slate-300 font-mono">{status?.source_files?.[0] || 'Aircraft_Annotation_DataFile.csv'}</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Dense Vector Index</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-indigo-300">
            {status?.vector_count.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center space-x-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>all-MiniLM-L6-v2 active</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-3">
          <div>
            <div className="text-xs font-bold text-white">Embedding Re-Indexing</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Rebuild vector representations using all-MiniLM-L6-v2</p>
          </div>
          <button
            onClick={handleReindex}
            disabled={reindexing}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-900/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
            <span>{reindexing ? 'Re-Indexing 6,169 Vectors...' : 'Re-Index Vectors'}</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Card */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-lg border border-slate-800">
        <h2 className="text-sm font-bold text-white flex items-center space-x-2">
          <UploadCloud className="w-4 h-4 text-sky-400" />
          <span>Upload Maintenance Logbook File</span>
        </h2>
        
        <div className="border-2 border-dashed border-slate-700/80 hover:border-sky-500/60 rounded-2xl p-8 text-center transition-all bg-slate-950/40 hover:bg-slate-950/60 group cursor-pointer">
          <input
            type="file"
            id="fileInput"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center space-y-2.5">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white">
              {uploading ? 'Processing, Validating & Ingesting Logbook...' : 'Click or Drag & Drop Maintenance Logbook'}
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Supports standard MaintNet CSV (<code className="text-sky-300 font-mono">IDENT, PROBLEM, ACTION</code>) and Cleaned MaintNet Excel workbooks. Max file size: 25 MB.
            </p>
          </label>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {uploadResult && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 space-y-1.5 font-mono">
            <div className="font-sans font-bold text-white flex items-center space-x-1.5">
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
        <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-lg border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <BookA className="w-4 h-4 text-sky-400" />
                <span>Technical Domain Dictionaries</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Active aviation vocabulary mappings for conservative abbreviation expansion and misspelling normalization.
              </p>
            </div>

            {/* Sub-tabs */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveDictTab('abbr')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeDictTab === 'abbr' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Abbreviations ({dictionaries.abbreviations_count})
              </button>
              <button
                onClick={() => setActiveDictTab('misp')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeDictTab === 'misp' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Misspellings ({dictionaries.misspellings_count})
              </button>
              <button
                onClick={() => setActiveDictTab('unexp')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 ${
                  activeDictTab === 'unexp' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>Safety Guardlist ({dictionaries.unexpanded_acronyms_count})</span>
              </button>
            </div>
          </div>

          {/* Dictionary search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={dictSearch}
              onChange={(e) => setDictSearch(e.target.value)}
              placeholder="Search dictionary terms..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 shadow-inner"
            />
          </div>

          {/* Dictionary Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-96 overflow-y-auto p-1 font-mono text-xs">
            {activeDictTab === 'abbr' &&
              Object.entries(dictionaries.abbreviations as Record<string, string>)
                .filter(([k, v]) => k.includes(dictSearch.toUpperCase()) || v.includes(dictSearch.toUpperCase()))
                .map(([k, v]) => (
                  <div
                    key={k}
                    onClick={() => handleCopyItem(k, v)}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 flex justify-between items-center cursor-pointer transition-colors group"
                    title="Click to copy mapping"
                  >
                    <span className="font-bold text-sky-400">{k}</span>
                    <span className="text-[11px] text-slate-300 font-sans truncate ml-2">{v}</span>
                    {copiedKey === k ? (
                      <Check className="w-3 h-3 text-emerald-400 ml-1 flex-shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-600 group-hover:text-slate-400 ml-1 flex-shrink-0 opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                ))}

            {activeDictTab === 'misp' &&
              Object.entries(dictionaries.misspellings as Record<string, string>)
                .filter(([k, v]) => k.includes(dictSearch.toUpperCase()) || v.includes(dictSearch.toUpperCase()))
                .map(([k, v]) => (
                  <div
                    key={k}
                    onClick={() => handleCopyItem(k, v)}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 flex justify-between items-center cursor-pointer transition-colors group"
                    title="Click to copy correction"
                  >
                    <span className="line-through text-red-400/80 text-[11px] font-bold">{k}</span>
                    <span className="text-emerald-400 font-medium text-[11px] font-sans truncate ml-2">{v}</span>
                    {copiedKey === k ? (
                      <Check className="w-3 h-3 text-emerald-400 ml-1 flex-shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-600 group-hover:text-slate-400 ml-1 flex-shrink-0 opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                ))}

            {activeDictTab === 'unexp' &&
              (dictionaries.unexpanded_acronyms as string[])
                .filter((item) => item.includes(dictSearch.toUpperCase()))
                .map((acronym) => (
                  <div
                    key={acronym}
                    className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/60 flex items-center justify-between"
                  >
                    <span className="font-extrabold text-amber-300 text-sm">{acronym}</span>
                    <span className="text-[10px] text-amber-200/70 font-sans font-medium uppercase px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800">
                      Protected Acronym
                    </span>
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
};
