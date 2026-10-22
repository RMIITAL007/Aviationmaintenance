import React from 'react';
import {
  LayoutDashboard,
  BotMessageSquare,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'copilot' | 'records' | 'ingestion' | 'evaluation';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Fleet Analytics',
      icon: LayoutDashboard,
      desc: 'Statistics & trends'
    },
    {
      id: 'copilot' as ActiveTab,
      label: 'AI Copilot',
      icon: BotMessageSquare,
      desc: 'Agentic Q&A with citations'
    },
    {
      id: 'records' as ActiveTab,
      label: 'Logbook Explorer',
      icon: FileSpreadsheet,
      desc: 'Search & inspect records'
    },
    {
      id: 'ingestion' as ActiveTab,
      label: 'Data & Dictionaries',
      icon: UploadCloud,
      desc: 'Import & normalizer rules'
    },
    {
      id: 'evaluation' as ActiveTab,
      label: 'Evaluation Suite',
      icon: CheckCircle2,
      desc: 'Retrieval & RAG benchmark'
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 flex-shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Workspace Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-start space-x-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-sky-500/15 border border-sky-500/40 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <div>
                <div className={`text-sm ${isActive ? 'text-sky-100 font-semibold' : 'text-slate-300'}`}>
                  {item.label}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1">{item.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Reference manuals note */}
      <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>Aviation Logbook Corpus</span>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-400">
          MaintNet Corpus (Akhbardeh et al.) with 6,169 verified defect & repair logs.
        </p>
      </div>
    </aside>
  );
};
