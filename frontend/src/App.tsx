import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CopilotChat } from './components/CopilotChat';
import { RecordsExplorer } from './components/RecordsExplorer';
import { DataIngestion } from './components/DataIngestion';
import { EvaluationView } from './components/EvaluationView';
import { ModelSettingsModal } from './components/ModelSettingsModal';
import { SubsystemCompare } from './components/SubsystemCompare';
import { FleetAlertsView } from './components/FleetAlertsView';
import { api } from './services/api';
import { ModelSettings } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);
  const [focusedIdent, setFocusedIdent] = useState<string | null>(null);
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState<boolean>(false);
  const [modelSettings, setModelSettings] = useState<ModelSettings | null>(null);
  const [copilotPrompt, setCopilotPrompt] = useState<string | null>(null);

  const checkHealthAndStats = async () => {
    try {
      const health = await api.getHealth();
      setIsBackendHealthy(health.status === 'healthy');
      setTotalRecords(health.database?.record_count || 0);
    } catch {
      setIsBackendHealthy(false);
    }
  };

  const loadModelSettings = async () => {
    try {
      const settings = await api.getModelSettings();
      setModelSettings(settings);
    } catch (e) {
      console.warn("Failed to load model settings:", e);
    }
  };

  useEffect(() => {
    checkHealthAndStats();
    loadModelSettings();
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
    setCopilotPrompt(query);
    setActiveTab('copilot');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070b14] text-slate-100 overflow-hidden hud-grid">
      {/* Top Cockpit HUD Navbar */}
      <Navbar
        totalRecords={totalRecords}
        isBackendHealthy={isBackendHealthy}
        onOpenQuickSearch={() => setActiveTab('records')}
        onOpenModelSettings={() => setIsModelSettingsOpen(true)}
        activeModelProvider={modelSettings?.provider || 'local'}
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
            <CopilotChat
              onSelectRecord={handleSelectRecord}
              onOpenModelSettings={() => setIsModelSettingsOpen(true)}
              activeModelProvider={modelSettings?.provider || 'local'}
              initialPrompt={copilotPrompt}
              onClearInitialPrompt={() => setCopilotPrompt(null)}
            />
          )}

          {activeTab === 'compare' && (
            <SubsystemCompare
              onAskCopilot={handleAskCopilot}
              onSelectRecord={handleSelectRecord}
            />
          )}

          {activeTab === 'alerts' && (
            <FleetAlertsView
              onAskCopilot={handleAskCopilot}
              onSelectRecord={handleSelectRecord}
            />
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

      {/* AI Model Configuration Modal */}
      <ModelSettingsModal
        isOpen={isModelSettingsOpen}
        onClose={() => setIsModelSettingsOpen(false)}
        currentSettings={modelSettings}
        onSettingsUpdated={(newSettings) => setModelSettings(newSettings)}
      />
    </div>
  );
};

export default App;
