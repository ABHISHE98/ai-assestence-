import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, Loader2, RefreshCw, Landmark, Calendar, Terminal, Info, ClipboardCopy, FileQuestion } from "lucide-react";
import { Message, SupportedLanguage } from "../types";

interface ChatPanelProps {
  documentText: string;
  messages: Message[];
  language: SupportedLanguage;
  onSendMessage: (text: string) => Promise<void>;
  isGenerating: boolean;
  onClearHistory: () => void;
}

export default function ChatPanel({
  documentText,
  messages,
  language,
  onSendMessage,
  isGenerating,
  onClearHistory,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGenerating) return;
    onSendMessage(inputValue.trim());
    setInputValue("");
  };

  const currentSuggestedChips = [
    { label: "Summarize top takeaway", prompt: "What are the most critical takeaways from this document?" },
    { label: "Extract dates & events", prompt: "List all specific dates, chronological events, and timeline indicators mentioned in the document as a clean list." },
    { label: "List key numerical facts", prompt: "Extract all numbers, percentages, financial quotes, and calculations from this document in a summarized format." },
  ];

  const handleChipClick = (prompt: string) => {
    if (isGenerating) return;
    onSendMessage(prompt);
  };

  return (
    <div id="ai-chat-panel" className="bg-[#0F0F11] rounded-2xl border border-white/10 shadow-xl flex flex-col h-full overflow-hidden">
      {/* Chat header area */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0C0C0E] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-455 border border-indigo-500/20">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm leading-none">Document Chat Assistant</h3>
            <span className="text-[10px] text-emerald-400 mt-1 inline-flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
              Answering solely from context
            </span>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="text-xs text-slate-400 hover:text-white transition-colors font-bold flex items-center gap-1 cursor-pointer"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Constraints context banner */}
      <div className="bg-indigo-500/5 px-4 py-2 border-b border-white/5 text-[10px] text-indigo-300 flex items-center gap-2 shrink-0 font-medium uppercase tracking-wider">
        <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>Answers are strictly limited to facts inside the document. Replies in <span className="font-bold underline">{language}</span>.</span>
      </div>

      {/* Messages dialogue history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0C0C0E]" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center" id="empty-chat-state">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 mb-4 shadow-lg">
              <FileQuestion className="w-10 h-10 text-slate-400" />
            </div>
            <h4 className="font-bold text-white text-sm tracking-tight">Ask your document anything</h4>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
              Ask questions about clauses, findings, figures, or summaries. AI will research the context in real-time.
            </p>

            {/* Quick suggested chips */}
            <div className="mt-6 w-full max-w-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block text-left mb-2.5">
                Suggested Shortcuts
              </span>
              {currentSuggestedChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChipClick(chip.prompt)}
                  className="w-full text-left px-3.5 py-2.5 text-xs bg-[#0F0F11] hover:bg-white/5 hover:border-white/20 border border-white/10 rounded-xl font-medium text-slate-300 transition-all shadow-lg block active:scale-[0.99] cursor-pointer animate-fadeIn"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-sm shadow-lg ${
                      isUser
                        ? "bg-indigo-600/90 text-white rounded-tr-none border border-indigo-500/20 font-medium"
                        : "bg-[#0F0F11] text-slate-200 rounded-tl-none border border-white/10"
                    }`}
                  >
                    {!isUser && (
                      <div className="markdown-body text-slate-200 leading-relaxed text-sm antialiased prose prose-invert prose-indigo select-text">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                    {isUser && <span className="whitespace-pre-wrap leading-relaxed block">{msg.content}</span>}
                    <div
                      className={`text-[9px] mt-1.5 text-right font-mono ${
                        isUser ? "text-indigo-200" : "text-slate-500"
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {isGenerating && (
              <div className="flex justify-start animate-pulse" id="typing-loader">
                <div className="bg-[#0F0F11] border border-white/10 rounded-2xl rounded-tl-none p-4 max-w-[85%] text-slate-400 text-xs flex items-center gap-2.5 shadow-lg">
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>Synthesizing answer from document content...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input box area */}
      <div className="p-3.5 border-t border-white/5 bg-[#0F0F11] shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <input
            id="chat-query-input-field"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask a question in ${language}...`}
            disabled={isGenerating}
            className="flex-1 px-4 py-3 bg-[#161618] border border-white/10 rounded-xl text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-white font-medium disabled:opacity-60"
          />
          <button
            id="chat-send-submit-button"
            type="submit"
            disabled={!inputValue.trim() || isGenerating}
            className="px-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/5 text-white disabled:text-slate-600 rounded-xl transition-all font-semibold flex items-center justify-center border border-transparent shadow-lg active:scale-95 disabled:scale-100 shrink-0 cursor-pointer"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
