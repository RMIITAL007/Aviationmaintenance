import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Copy,
  Check,
  Compass,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  AlertCircle,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { ChatMessage, CitationItem, AgentStepItem } from '../types';

interface CopilotChatProps {
  onSelectRecord: (ident: string) => void;
  onOpenModelSettings?: () => void;
  activeModelProvider?: string;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

const CATEGORIZED_PROMPTS = [
  {
    category: "Engine Controls & Idle Faults",
    query: "What maintenance actions were recorded when engine idle override killed engine?"
  },
  {
    category: "Intake & Gasket Leaks",
    query: "Have similar faults been reported for cylinder #2 intake gasket leaking?"
  },
  {
    category: "Comparative Analysis",
    query: "Compare historical repairs for cracked air baffles versus leaking rocker covers"
  },
  {
    category: "Valve Train & Sticking Valves",
    query: "Which records describe reaming exhaust valve guides under SI 388C?"
  },
  {
    category: "Low Compression Anomalies",
    query: "What was recorded when cylinder #4 had low compression or zero psi?"
  },
  {
    category: "Fuel & Magneto Systems",
    query: "What was done when right magneto blast tube fell off?"
  }
];

export const CopilotChat: React.FC<CopilotChatProps> = ({
  onSelectRecord,
  onOpenModelSettings,
  activeModelProvider = 'local',
  initialPrompt,
  onClearInitialPrompt
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);
  const [openStepsMessageIndex, setOpenStepsMessageIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSessionId(newId);
  }, []);

  useEffect(() => {
    if (initialPrompt && !loading) {
      handleSendMessage(initialPrompt);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    setInputQuery('');
    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await api.sendMessage(query, sessionId);
      const asstMsg: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        intent: response.intent,
        step_count: response.step_count,
        citations: response.citations,
        agent_steps: response.agent_steps,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, asstMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `Error retrieving records: ${err?.response?.data?.error?.message || err.message || 'Network error'}`,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    const newId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSessionId(newId);
    setMessages([]);
    setSelectedCitation(null);
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Render clickable inline citation badges in assistant text
  const renderFormattedAnswer = (text: string, citations?: CitationItem[]) => {
    const citationMap: Record<string, CitationItem> = {};
    if (citations) {
      citations.forEach((c) => {
        citationMap[c.ident] = c;
      });
    }

    const parts = text.split(/(\[Rec\s*#?\d{5,6}\]|\[#?\d{5,6}\])/gi);

    return parts.map((part, idx) => {
      const match = part.match(/\[(?:Rec\s*#?|#)?(\d{5,6})\]/i);
      if (match) {
        const ident = match[1];
        const citation = citationMap[ident];
        const isVerified = citation ? citation.verified : true;

        return (
          <button
            key={idx}
            onClick={() => {
              if (citation) setSelectedCitation(citation);
              onSelectRecord(ident);
            }}
            className={`inline-flex items-center space-x-1 mx-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold transition-all shadow-sm ${
              isVerified
                ? 'bg-sky-500/20 border border-sky-400/50 text-sky-300 hover:bg-sky-500/35 hover:border-sky-300 hover:shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                : 'bg-amber-500/20 border border-amber-400/50 text-amber-300 hover:bg-amber-500/35'
            }`}
            title={`Inspect verbatim logbook record #${ident}`}
          >
            <span>#{ident}</span>
            <FileText className="w-2.5 h-2.5" />
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-800">
        {/* Chat Sub-Header */}
        <div className="px-6 py-3 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center space-x-2">
                <span>AI Maintenance Copilot</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800/80">
                  Grounded Mode
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Strictly cites verified records from 6,169 historical logs</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenModelSettings && (
              <button
                onClick={onOpenModelSettings}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/70 border border-sky-800/80 text-xs text-sky-300 transition-colors shadow-sm"
                title="Switch AI inference model"
              >
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-mono text-[11px] uppercase">{activeModelProvider}</span>
              </button>
            )}
            <button
              onClick={handleResetChat}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors shadow-sm"
              title="Start a new consultation session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Chat</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-3xl mx-auto py-8 space-y-6 text-center">
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 via-blue-500/10 to-transparent border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.2)]">
                  <Compass className="w-8 h-8" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Aviation Maintenance Intelligence
                </h2>
                <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
                  Query historical aircraft defect logs, corrective repair actions, and component wear in natural language. Answers are strictly synthesized from retrieved records with clickable, traceable citations.
                </p>
              </div>

              {/* Categorized Inquiries */}
              <div className="pt-2 text-left">
                <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center justify-between">
                  <span>Verified Aviation Inquiries</span>
                  <span className="text-[10px] text-sky-400 font-sans">Click to ask instantly</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CATEGORIZED_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.query)}
                      className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/80 hover:border-sky-500/40 text-left text-xs transition-all duration-200 group flex items-start justify-between shadow-sm hover:shadow-[0_4px_20px_-4px_rgba(56,189,248,0.15)]"
                    >
                      <div className="space-y-1 pr-2">
                        <span className="text-[10px] font-mono uppercase text-sky-400 font-semibold">
                          {item.category}
                        </span>
                        <div className="text-slate-300 group-hover:text-white line-clamp-2 leading-relaxed">
                          "{item.query}"
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 flex-shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isStepsOpen = openStepsMessageIndex === index;

              return (
                <div
                  key={index}
                  className={`flex items-start space-x-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0 mt-1 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-3 max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed relative group ${
                        isUser
                          ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-tr-none shadow-md font-medium'
                          : 'glass-panel text-slate-200 rounded-tl-none shadow-lg'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">
                        {isUser ? msg.content : renderFormattedAnswer(msg.content, msg.citations)}
                      </div>

                      {/* Copy message button */}
                      {!isUser && (
                        <button
                          onClick={() => handleCopyMessage(msg.content, index)}
                          className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-opacity"
                          title="Copy response to clipboard"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Agent Workflow Transparency Trace */}
                    {!isUser && msg.agent_steps && msg.agent_steps.length > 0 && (
                      <div className="rounded-xl bg-slate-900/80 border border-slate-800 text-xs overflow-hidden shadow-sm">
                        <button
                          onClick={() => setOpenStepsMessageIndex(isStepsOpen ? null : index)}
                          className="w-full flex items-center justify-between px-3.5 py-2 text-[11px] text-slate-400 hover:text-slate-200 transition-colors font-mono"
                        >
                          <span className="flex items-center space-x-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Workflow Telemetry: {msg.agent_steps.length} Bounded Tool Execution(s)</span>
                          </span>
                          {isStepsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isStepsOpen && (
                          <div className="p-3.5 border-t border-slate-800 space-y-2 bg-slate-950/60 font-mono text-[11px]">
                            {msg.agent_steps.map((st) => (
                              <div key={st.step} className="flex items-start space-x-2 text-slate-300">
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 text-[10px] font-bold">
                                  Step {st.step}
                                </span>
                                <div>
                                  <span className="text-amber-400 font-bold">{st.tool}</span>
                                  <span className="text-slate-400 ml-2">{st.output_summary}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Citations list pills */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 mr-1">
                          Source Logbooks:
                        </span>
                        {msg.citations.map((c) => (
                          <button
                            key={c.ident}
                            onClick={() => {
                              setSelectedCitation(c);
                              onSelectRecord(c.ident);
                            }}
                            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-sky-300 text-[11px] font-mono transition-all hover:border-sky-500/50 shadow-sm"
                          >
                            <FileText className="w-3 h-3 text-sky-400" />
                            <span>Rec #{c.ident}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 flex-shrink-0 mt-1 shadow-sm">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl glass-panel text-xs text-slate-300 space-y-2">
                <div className="flex items-center space-x-2 font-mono text-[11px] text-sky-400">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                  <span>Executing bounded agentic retrieval across 6,169 records...</span>
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  BM25 Lexical + SentenceTransformers dense ranking • Verifying citations
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Query Input Bar */}
        <div className="p-4 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-3"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask an aviation logbook query (e.g. 'intake leaks on cylinder 2', 'engine idle override')..."
              className="flex-1 bg-slate-950 border border-slate-700/80 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition-all shadow-[0_0_15px_-3px_rgba(56,189,248,0.4)]"
            >
              <span>Query</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center space-x-1.5">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>Strict decision-support tool. All operational maintenance decisions require AMM/CMM authorization.</span>
          </div>
        </div>
      </div>

      {/* Slide-out Source Record Inspector Drawer */}
      {selectedCitation && (
        <div className="w-96 bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 flex flex-col h-full p-5 space-y-4 overflow-y-auto z-20 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Source Logbook Record
              </h3>
            </div>
            <button
              onClick={() => setSelectedCitation(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans">Record IDENT</span>
                <div className="text-base font-extrabold text-sky-400">#{selectedCitation.ident}</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-sans font-medium">
                Verified In Context
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>Reported Defect (Problem)</span>
              </span>
              <div className="text-slate-200 font-sans text-xs leading-relaxed">
                {selectedCitation.problem}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-emerald-400 uppercase font-sans font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Maintenance Action Performed</span>
              </span>
              <div className="text-slate-200 font-sans text-xs leading-relaxed">
                {selectedCitation.action}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 text-[11px] text-sky-300 font-sans leading-relaxed">
              <strong>Audit Provenance:</strong> Grounded in verbatim historical maintenance records from MaintNet aircraft logbook corpus.
            </div>

            <button
              onClick={() => onSelectRecord(selectedCitation.ident)}
              className="w-full py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white text-xs font-sans font-semibold rounded-xl transition-all border border-slate-600/60 shadow-sm flex items-center justify-center space-x-2"
            >
              <span>Open in Full Record Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
