import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CopilotChat } from './components/CopilotChat';
import { RecordsExplorer } from './components/RecordsExplorer';
import { DataIngestion } from './components/DataIngestion';
import { EvaluationView } from './components/EvaluationView';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);
  const [focusedIdent, setFocusedIdent] = useState<string | null>(null);

  const checkHealthAndStats = async () => {
    try {
      const health = await api.getHealth();
      setIsBackendHealthy(health.status === 'healthy');
      setTotalRecords(health.database?.record_count || 0);
    } catch {
      setIsBackendHealthy(false);
    }
  };

  useEffect(() => {
    checkHealthAndStats();
    const interval = setInterval(checkHealthAndStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectRecord = (ident: string) => {
    setFocusedIdent(ident);
    setActiveTab('records');
  };

  const handleNavigateToRecords = (componentFilter?: string) => {
    setActiveTab('records');
  };

  const handleAskCopilot = (query: string) => {
    setActiveTab('copilot');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070b14] text-slate-100 overflow-hidden hud-grid">
      {/* Top Cockpit HUD Navbar */}
      <Navbar
        totalRecords={totalRecords}
        isBackendHealthy={isBackendHealthy}
        onOpenQuickSearch={() => setActiveTab('records')}
      />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="scanline"></div>

        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          recordCount={totalRecords}
        />

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto bg-[#070b14]/90 relative z-10">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigateToRecords={handleNavigateToRecords}
              onSelectRecord={handleSelectRecord}
            />
          )}

          {activeTab === 'copilot' && (
            <CopilotChat onSelectRecord={handleSelectRecord} />
          )}

          {activeTab === 'records' && (
            <RecordsExplorer
              initialIdent={focusedIdent}
              onClearInitialIdent={() => setFocusedIdent(null)}
              onAskCopilot={handleAskCopilot}
            />
          )}

          {activeTab === 'ingestion' && <DataIngestion />}

          {activeTab === 'evaluation' && <EvaluationView />}
        </main>
      </div>
    </div>
  );
};

export default App;
