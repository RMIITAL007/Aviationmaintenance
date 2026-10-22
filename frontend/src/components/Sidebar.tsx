import React from 'react';
import {
  LayoutDashboard,
  BotMessageSquare,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  BookOpen,
  ChevronRight,
  GitCompare,
  Bell
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'copilot' | 'compare' | 'alerts' | 'records' | 'ingestion' | 'evaluation';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  recordCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, recordCount }) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Fleet Analytics',
      badge: 'Live',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80',
      icon: LayoutDashboard,
      desc: 'Subsystem distributions & trends'
    },
    {
      id: 'copilot' as ActiveTab,
      label: 'AI Copilot',
      badge: 'RAG',
      badgeColor: 'text-sky-400 bg-sky-950/60 border-sky-800/80',
      icon: BotMessageSquare,
      desc: 'Grounded inquiry with citations'
    },
    {
      id: 'compare' as ActiveTab,
      label: 'Subsystem Compare',
      badge: 'Matrix',
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/80',
      icon: GitCompare,
      desc: 'Cross-component failure matrix'
    },
    {
      id: 'alerts' as ActiveTab,
      label: 'Safety Alerts',
      badge: '53 Crit',
      badgeColor: 'text-red-400 bg-red-950/60 border-red-800/80',
      icon: Bell,
      desc: 'Real-time safety discrepancies'
    },
    {
      id: 'records' as ActiveTab,
      label: 'Logbook Explorer',
      badge: recordCount > 0 ? `${(recordCount / 1000).toFixed(1)}k` : '6.1k',
      badgeColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/80',
      icon: FileSpreadsheet,
      desc: 'Search & inspect 6,169 records'
    },
    {
      id: 'ingestion' as ActiveTab,
      label: 'Data & Dictionaries',
      badge: '101 Abbr',
      badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800/80',
      icon: UploadCloud,
      desc: 'Import & normalizer dictionaries'
    },
    {
      id: 'evaluation' as ActiveTab,
      label: 'Evaluation Suite',
      badge: '20 Tests',
      badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-800/80',
      icon: CheckCircle2,
      desc: 'Empirical Recall@K & MRR audit'
    }
  ];

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-md border-r border-slate-800/80 flex flex-col justify-between p-4 flex-shrink-0 z-20">
      <div className="space-y-1.5">
        <div className="px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
          Aviation Cockpit Systems
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full group relative flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-200 border ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500/15 to-blue-500/5 border-sky-500/40 text-white shadow-[0_0_15px_-4px_rgba(56,189,248,0.25)]'
                  : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'bg-slate-900 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{item.desc}</div>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border ml-2 flex-shrink-0 ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}

              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-sky-400 rounded-r"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dataset Provenance Footer Card */}
      <div className="p-3.5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 space-y-2 shadow-inner">
        <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs">
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>MaintNet Corpus</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
          6,169 verified historical aircraft maintenance defect & repair entries.
        </p>
        <div className="pt-1 flex items-center justify-between text-[9px] text-slate-500 font-mono">
          <span>Akhbardeh et al.</span>
          <span>COLING 2020</span>
        </div>
      </div>
    </aside>
  );
};
