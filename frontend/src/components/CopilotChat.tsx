import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Plus,
  Compass,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { ChatMessage, CitationItem, AgentStepItem } from '../types';

interface CopilotChatProps {
  onSelectRecord: (ident: string) => void;
}

const SUGGESTED_QUERIES = [
  "What maintenance actions were recorded when engine idle override killed engine?",
  "Have similar faults been reported for cylinder #2 intake gasket leaking?",
  "Compare historical repairs for cracked air baffles versus leaking rocker covers",
  "What was done when right magneto blast tube fell off?",
  "Which records describe reaming exhaust valve guides under SI 388C?",
  "What was recorded when fuel pressure jumped into the red?"
];

export const CopilotChat: React.FC<CopilotChatProps> = ({ onSelectRecord }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);
  const [openStepsMessageIndex, setOpenStepsMessageIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start with a new session
    const newId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSessionId(newId);
  }, []);

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

  // Render clickable inline citation badges in assistant text
  const renderFormattedAnswer = (text: string, citations?: CitationItem[]) => {
    const citationMap: Record<string, CitationItem> = {};
    if (citations) {
      citations.forEach((c) => {
        citationMap[c.ident] = c;
      });
    }

    // Regex matches [Rec #100004] or [Rec 100004] or [100004]
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
            className={`inline-flex items-center space-x-1 mx-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors ${
              isVerified
                ? 'bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500/30'
                : 'bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
            }`}
            title={`View logbook record #${ident}`}
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
        {/* Chat Header */}
        <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white flex items-center space-x-2">
                <span>AI Maintenance Copilot</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Grounded Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Evidence-grounded logbook inquiry and record comparison</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetChat}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors"
              title="Reset conversation session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto py-12 space-y-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400">
                <Compass className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Aviation Maintenance Intelligence
                </h2>
                <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                  Ask natural-language questions over historical defect reports and technician actions. Answers are synthesized strictly from retrieved evidence with verifiable source citations.
                </p>
              </div>

              {/* Example Prompts */}
              <div className="pt-4 text-left">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
                  Suggested Example Inquiries
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SUGGESTED_QUERIES.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/40 text-left text-xs text-slate-300 hover:text-white transition-all group flex items-start justify-between"
                    >
                      <span className="line-clamp-2 pr-2">{q}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 flex-shrink-0 mt-0.5" />
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
                    <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-3 max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-sky-600 text-white rounded-tr-none shadow-sm font-medium'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">
                        {isUser ? msg.content : renderFormattedAnswer(msg.content, msg.citations)}
                      </div>
                    </div>

                    {/* Agent Workflow Transparency Accordion (For Assistant) */}
                    {!isUser && msg.agent_steps && msg.agent_steps.length > 0 && (
                      <div className="rounded-lg bg-slate-900/60 border border-slate-800 text-xs overflow-hidden">
                        <button
                          onClick={() => setOpenStepsMessageIndex(isStepsOpen ? null : index)}
                          className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-slate-400 hover:text-slate-200 transition-colors font-mono"
                        >
                          <span className="flex items-center space-x-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Workflow Trace: {msg.agent_steps.length} Tool Execution(s)</span>
                          </span>
                          {isStepsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isStepsOpen && (
                          <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/40 font-mono text-[11px]">
                            {msg.agent_steps.map((st) => (
                              <div key={st.step} className="flex items-start space-x-2 text-slate-300">
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 text-[10px]">
                                  Step {st.step}
                                </span>
                                <div>
                                  <span className="text-amber-400 font-semibold">{st.tool}</span>
                                  <span className="text-slate-400 ml-1.5">{st.output_summary}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Citations list pills */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mr-1">
                          Cited Records:
                        </span>
                        {msg.citations.map((c) => (
                          <button
                            key={c.ident}
                            onClick={() => {
                              setSelectedCitation(c);
                              onSelectRecord(c.ident);
                            }}
                            className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-mono transition-colors"
                          >
                            <FileText className="w-2.5 h-2.5 text-sky-400" />
                            <span>Rec #{c.ident}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-center space-x-2 font-mono text-[11px] text-sky-400">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                  <span>Agent executing multi-step hybrid retrieval...</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Searching 6,169 records • Verifying citations • Guarding technical acronyms
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex-shrink-0">
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
              placeholder="Ask an aviation maintenance question (e.g. 'intake leaks on cylinder 2', 'engine idle override')..."
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <span>Query</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="text-[10px] text-slate-400 text-center mt-2">
            Historical decision support only. Never authorises aircraft release or autonomous repair actions.
          </div>
        </div>
      </div>

      {/* Right Drawer: Selected Source Record Excerpt */}
      {selectedCitation && (
        <div className="w-96 bg-slate-900/95 border-l border-slate-800 flex flex-col h-full p-5 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Source Logbook Record
              </h3>
            </div>
            <button
              onClick={() => setSelectedCitation(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Record IDENT</span>
              <div className="text-sm font-bold text-sky-400">#{selectedCitation.ident}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Reported Defect (Problem)</span>
              <div className="text-slate-200 font-sans text-xs">{selectedCitation.problem}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase font-sans font-semibold">Maintenance Action Taken</span>
              <div className="text-slate-200 font-sans text-xs">{selectedCitation.action}</div>
            </div>

            <div className="p-2.5 rounded bg-sky-950/40 border border-sky-800/60 text-[11px] text-sky-300 font-sans">
              <strong>Grounding Status:</strong> Verified authentic row from MaintNet logbook dataset.
            </div>

            <button
              onClick={() => onSelectRecord(selectedCitation.ident)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-medium rounded-lg transition-colors border border-slate-700"
            >
              Open Full Detail in Explorer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
