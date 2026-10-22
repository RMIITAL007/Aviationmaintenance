import React from 'react';
import { Plane, ShieldAlert, Activity, Database } from 'lucide-react';

interface NavbarProps {
  totalRecords: number;
  isBackendHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ totalRecords, isBackendHealthy }) => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-20">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <Plane className="w-6 h-6 transform -rotate-45" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-tight text-white">Maintenance Copilot</span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              Agentic RAG
            </span>
          </div>
          <p className="text-xs text-slate-400">Aviation Maintenance Logbook Decision-Support</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Safety Boundary Banner */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>Decision-Support Only • Non-Autonomous Authorization</span>
        </div>

        {/* Database records badge */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span><strong className="text-white font-mono">{totalRecords.toLocaleString()}</strong> Records</span>
        </div>

        {/* System Health */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
          <span className={`w-2 h-2 rounded-full ${isBackendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
          <span className="text-slate-300">{isBackendHealthy ? 'API Active' : 'API Offline'}</span>
        </div>
      </div>
    </header>
  );
};
