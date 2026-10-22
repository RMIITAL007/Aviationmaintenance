import React, { useState, useEffect } from 'react';
import {
  Plane,
  ShieldAlert,
  Database,
  Layers,
  Github,
  Clock,
  Sparkles,
  Search
} from 'lucide-react';

interface NavbarProps {
  totalRecords: number;
  isBackendHealthy: boolean;
  onOpenQuickSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalRecords,
  isBackendHealthy,
  onOpenQuickSearch
}) => {
  const [zuluTime, setZuluTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setZuluTime(now.toUTCString().slice(17, 25) + ' Z');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-6 z-30 sticky top-0">
      {/* Brand & Identity */}
      <div className="flex items-center space-x-3.5">
        <div className="relative group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-[0_0_15px_-3px_rgba(56,189,248,0.25)] group-hover:border-sky-400 transition-all">
            <Plane className="w-5 h-5 transform -rotate-45" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950"></span>
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-base tracking-tight text-white flex items-center space-x-1.5">
              <span>MAINTENANCE</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                COPILOT
              </span>
            </span>
            <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-800/80 flex items-center space-x-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>AGENTIC RAG</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Aviation Technical Logbook Decision-Support System
          </p>
        </div>
      </div>

      {/* Middle & Right Cockpit Telemetry Controls */}
      <div className="flex items-center space-x-3">
        {/* Quick Search Trigger */}
        {onOpenQuickSearch && (
          <button
            onClick={onOpenQuickSearch}
            className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-all shadow-inner"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="pr-4">Quick search records...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Operational Boundary Notice */}
        <div className="hidden xl:flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/30 border border-amber-800/40 text-amber-300/90 text-xs shadow-inner">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-[11px]">Decision-Support Only • Not an Autonomous Repair Authority</span>
        </div>

        {/* Zulu Time HUD Indicator */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-sky-300 font-medium">{zuluTime || '00:00:00 Z'}</span>
        </div>

        {/* Database & Vector Index Telemetry Badge */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400 text-[11px]">
            <strong className="text-white font-mono">{totalRecords.toLocaleString()}</strong> Logs
          </span>
          <span className="text-slate-600">|</span>
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400 text-[11px]">
            <strong className="text-indigo-300 font-mono">{totalRecords.toLocaleString()}</strong> Vectors
          </span>
        </div>

        {/* API Status Badge */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <span className={`w-2 h-2 rounded-full ${isBackendHealthy ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-400'}`}></span>
          <span className="text-[11px] font-mono text-slate-300 hidden sm:inline">
            {isBackendHealthy ? 'API ONLINE' : 'API OFFLINE'}
          </span>
        </div>

        {/* GitHub Repo Link */}
        <a
          href="https://github.com/RMIITAL007/Aviationmaintenance"
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title="View GitHub Repository"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};
