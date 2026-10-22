import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Sparkles,
  Key,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Sliders,
  ShieldCheck,
  Check
} from 'lucide-react';
import { ModelSettings } from '../types';
import { api } from '../services/api';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: ModelSettings | null;
  onSettingsUpdated: (newSettings: ModelSettings) => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsUpdated
}) => {
  const [provider, setProvider] = useState<string>('local');
  const [modelName, setModelName] = useState<string>('HuggingFaceTB/SmolLM2-360M-Instruct');
  const [apiKey, setApiKey] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.1);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentSettings) {
      setProvider(currentSettings.provider);
      setModelName(currentSettings.model_name || 'HuggingFaceTB/SmolLM2-360M-Instruct');
      setTemperature(currentSettings.temperature ?? 0.1);
      setBaseUrl(currentSettings.base_url || '');
      setApiKey('');
    }
  }, [currentSettings, isOpen]);

  if (!isOpen) return null;

  const handleProviderSelect = (p: string) => {
    setProvider(p);
    if (p === 'local') {
      setModelName('HuggingFaceTB/SmolLM2-360M-Instruct');
    } else if (p === 'gemini') {
      setModelName('gemini-1.5-flash');
    } else if (p === 'openai') {
      setModelName('gpt-4o-mini');
      setBaseUrl('https://api.openai.com/v1');
    } else if (p === 'ollama') {
      setModelName('llama3.2');
      setBaseUrl('http://localhost:11434');
    } else if (p === 'mock') {
      setModelName('Deterministic Synthesizer');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: any = {
        provider,
        model_name: modelName,
        temperature,
      };

      if (apiKey.trim()) {
        payload.api_key = apiKey.trim();
      }
      if (baseUrl.trim()) {
        payload.base_url = baseUrl.trim();
      }

      const updated = await api.updateModelSettings(payload);
      onSettingsUpdated(updated);
      setSuccessMsg(`Inference model successfully updated to ${provider.toUpperCase()}`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to update model settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Inference Engine & Model Configuration</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  MPS / Apple Silicon Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure your AI generation runtime (local on-device neural, zero-hallucination synthesizer, or cloud LLMs)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Notifications */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/70 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/70 text-red-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Model Provider Cards Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2.5">
              Select Inference Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Local Neural Model */}
              <div
                onClick={() => handleProviderSelect('local')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  provider === 'local'
                    ? 'bg-sky-950/40 border-sky-500 shadow-[0_0_15px_-3px_rgba(56,189,248,0.3)]'
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <Zap className={`w-4 h-4 ${provider === 'local' ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span className="font-semibold text-xs text-white">Local Neural Model</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-900/60 text-sky-300 border border-sky-700/50">
                    ON-DEVICE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Hugging Face SmolLM2-360M-Instruct running directly on local CPU / Apple Silicon. 100% offline, private.
                </p>
              </div>

              {/* Option 2: Deterministic Synthesizer */}
              <div
                onClick={() => handleProviderSelect('mock')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  provider === 'mock'
                    ? 'bg-sky-950/40 border-sky-500 shadow-[0_0_15px_-3px_rgba(56,189,248,0.3)]'
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className={`w-4 h-4 ${provider === 'mock' ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="font-semibold text-xs text-white">Verified Synthesizer</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                    ZERO-HALLUCINATION
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Deterministic technical evidence assembler with strict citation verification and sub-millisecond response.
                </p>
              </div>

              {/* Option 3: Google Gemini */}
              <div
                onClick={() => handleProviderSelect('gemini')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  provider === 'gemini'
                    ? 'bg-sky-950/40 border-sky-500 shadow-[0_0_15px_-3px_rgba(56,189,248,0.3)]'
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <Sparkles className={`w-4 h-4 ${provider === 'gemini' ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className="font-semibold text-xs text-white">Google Gemini</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700/50">
                    GEMINI-1.5
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  High-speed multimodal reasoning via Gemini Flash API for deep cross-record synthesis.
                </p>
              </div>

              {/* Option 4: OpenAI / Compatible */}
              <div
                onClick={() => handleProviderSelect('openai')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  provider === 'openai'
                    ? 'bg-sky-950/40 border-sky-500 shadow-[0_0_15px_-3px_rgba(56,189,248,0.3)]'
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <Globe className={`w-4 h-4 ${provider === 'openai' ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="font-semibold text-xs text-white">OpenAI / Open-Router</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                    GPT-4O-MINI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Industry standard endpoint for GPT-4o, DeepSeek, or any custom OpenAI-compatible gateway.
                </p>
              </div>

              {/* Option 5: Local Ollama */}
              <div
                onClick={() => handleProviderSelect('ollama')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all sm:col-span-2 ${
                  provider === 'ollama'
                    ? 'bg-sky-950/40 border-sky-500 shadow-[0_0_15px_-3px_rgba(56,189,248,0.3)]'
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <Server className={`w-4 h-4 ${provider === 'ollama' ? 'text-purple-400' : 'text-slate-400'}`} />
                    <span className="font-semibold text-xs text-white">Local Ollama Instance</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                    DAEMON
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Connect to a running Ollama service on localhost (e.g. llama3.2, mistral, qwen2.5).
                </p>
              </div>
            </div>
          </div>

          {/* Provider Specific Parameters */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-sky-400">
              <Sliders className="w-3.5 h-3.5" />
              <span>Provider Parameters</span>
            </div>

            {/* Model Name */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Model Identifier
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. HuggingFaceTB/SmolLM2-360M-Instruct or gpt-4o-mini"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* API Key (if Gemini or OpenAI) */}
            {(provider === 'gemini' || provider === 'openai') && (
              <div>
                <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between mb-1">
                  <span>API Key</span>
                  {currentSettings?.masked_key && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      Currently: {currentSettings.masked_key}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={currentSettings?.masked_key ? "Leave blank to keep existing key" : "Enter API key..."}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Base URL (if Ollama or OpenAI) */}
            {(provider === 'ollama' || provider === 'openai') && (
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Base Endpoint URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'https://api.openai.com/v1'}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            )}

            {/* Temperature Slider */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Inference Temperature (Lower = More Grounded & Factual)</span>
                <span className="font-mono text-sky-400">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="text-[11px] text-slate-400">
            Active: <span className="text-white font-mono uppercase">{provider}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-[0_0_15px_-3px_rgba(56,189,248,0.4)] disabled:opacity-50 transition-all flex items-center space-x-1.5"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply & Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
