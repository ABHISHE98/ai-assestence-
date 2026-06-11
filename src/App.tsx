import React, { useState, useEffect } from "react";
import { Sparkles, FileText, Globe, HelpCircle, ShieldAlert, CheckCircle2, ChevronRight, BookOpen, Layers, MessageSquare, Eye, Copy, Check, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { SupportedLanguage, Message, AnalyzedDocument, LANGUAGES } from "./types";
import UploadZone from "./components/UploadZone";
import LanguageSelector from "./components/LanguageSelector";
import ChatPanel from "./components/ChatPanel";

const SAMPLE_DOCS = [
  {
    name: "Employee_Handbook_Policies_2026.txt",
    type: "text/plain",
    size: 2450,
    detectedType: "text" as const,
    extractedText: `EMPLOYEE POLICIES & GUIDELINES (REVISED JUNE 2026)
1. WORKING HOURS & ATTENDANCE
Standard business hours are from 9:00 AM to 6:00 PM local time. CORE collaboration hours are between 10:00 AM and 4:00 PM, during which all full-time salary staff must be accessible on Slack and available for scheduled meetings.

2. REMOTE WORK BENEFIT
Our company offers a flexible "Work from Anywhere" (WFA) policy. Full-time team members can elect to work remotely up to three (3) days per week. Remote staff must have an active, high-speed fiber internet connection of at least 100 Mbps. Monday and Thursday are MANDATORY in-office days for general project alignment, team lunches, and cross-functional task review.

3. REIMBURSEMENT & STIPENDS
- Technology Allowance: Every full-time hire is provided a workspace refresh stipend of $800 USD every two (2) years to purchase certified ergonomic chairs, noise-canceling headsets, or secondary displays.
- Internet Stipend: A recurring $50 USD monthly cash allowance is provided directly in payroll to offset remote broadband costs.

4. PAID TIME OFF (PTO) POLICY
Standard team members accrue 22 business days of paid vacation per calendar year. No more than 5 unused PTO days can be rolled over to the subsequent fiscal year. PTO requests exceeding four consecutive business days require at least 14 days of advance notice submitted through the BambooHR portal.

5. SECURITY IMPLEMENTATIONS
Employees must use company-assigned VPNs at all times when accessing intellectual property, source repositories, or clients' data records. Sharing security keys, 2FA credentials, or holding visual Zoom meetings detailing proprietary dashboards in highly populated public locations like coffee shops or airport lounges is strictly prohibited.`,
  },
  {
    name: "Acme_Corp_Financial_Q3_Performance.txt",
    type: "text/plain",
    size: 3120,
    detectedType: "text" as const,
    extractedText: `ACME CORPORATION -- Q3 2026 FINANCIAL STRATEGY & INVENTORY PERFORMANCE REPORT

1. EXECUTIVE METRICS & INCOME STATEMENT (Q3 Ending Sept 2026)
- Gross Consolidated Revenue: $14.2 Million USD (An increase of 11.2% compared of Q2 2026 where revenue was $12.7 Million).
- Net Net Income margins: $3.1 Million USD (A solid 21.8% profit margin, outpacing our Q3 target of 19.5%).
- Total Operating Capital Expenditure (CapEx): $2.4 Million. This was directed towards automated warehouse assembly in Frankfurt, Germany.

2. LOGISTICS & REGIONAL SALES SPLIT
- North America (NA): Accounted for 52% of overall product shipments. Main driver was the Acme UltraMax Widget launch.
- EMEA (Europe, Middle East, Africa): Accounted for 28% of shipments. Saw stable 6% growth month-over-month.
- APAC (Asia-Pacific): Accounted for 20% of shipments. High shipping overheads in Melbourne led to minor margin dilution of 1.4% inside the region.

3. SUPPLY CHAINS & INVENTORY STOCKS
Acme holds $4.2 Million worth of finished goods ready in stock. Current average distribution cycle turnaround is 14 business days. The shipping container disruption in Singapore harbor has temporarily increased outbound transit costs by 8.5% over our calculated logistics baseline. 

4. Q4 OUTLOOK & STRATEGICAL MILESTONES
- Acme aims to initiate pilot logistics pathways in Tokyo by November 15, 2026. This is projected to expand regional APAC margins by 3.0% by early 2027.
- Hiring freezes are enacted for middle-tier non-technical management roles to preserve capital. Core engineering hires remain ongoing.`,
  }
];

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("English");
  const [document, setDocument] = useState<AnalyzedDocument | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sysStatusMsg, setSysStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "overview" | "raw">("chat");
  const [copiedRaw, setCopiedRaw] = useState(false);

  const getFormatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-8 h-8 text-rose-500" />;
      case "docx":
        return <FileText className="w-8 h-8 text-indigo-400" />;
      case "image":
        return <FileText className="w-8 h-8 text-purple-500" />;
      default:
        return <FileText className="w-8 h-8 text-slate-400" />;
    }
  };

  const handleCopyRawText = () => {
    if (document) {
      navigator.clipboard.writeText(document.extractedText);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    }
  };

  // Re-generate executive summary / re-analyze if language is changed while a document is loaded
  const handleLanguageChange = async (newLang: SupportedLanguage) => {
    setSelectedLanguage(newLang);
    
    if (document) {
      setIsGenerating(true);
      setSysStatusMsg(null);
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: newLang,
            file: {
              name: document.name,
              type: document.type,
              size: document.size,
              data: btoa(unescape(encodeURIComponent(document.extractedText))),
            },
          }),
        });

        if (!response.ok) throw new Error("Could not transform summary to new language.");
        const result = await response.json();
        if (result.success) {
          setDocument((prev) => prev ? {
            ...prev,
            analysis: result.analysis,
          } : null);
          setSysStatusMsg({ type: "success", text: `Summary successfully re-analyzed in ${newLang}!` });
        }
      } catch (err: any) {
        console.error(err);
        setSysStatusMsg({ type: "error", text: "Failed to recalculate summary in chosen language." });
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleDocumentUploaded = (docData: {
    name: string;
    type: string;
    size: number;
    extractedText: string;
    charCount: number;
    detectedType: any;
    analysis: string;
  }) => {
    setDocument({
      name: docData.name,
      type: docData.type,
      size: docData.size,
      extractedText: docData.extractedText,
      charCount: docData.charCount,
      detectedType: docData.detectedType,
      analysis: docData.analysis,
    });
    // Reset conversation history for the new document
    setMessages([]);
    setActiveTab("chat");
    setSysStatusMsg({ type: "success", text: `"${docData.name}" processed and analyzed successfully!` });
  };

  const handleClearDocument = () => {
    setDocument(null);
    setMessages([]);
    setSysStatusMsg(null);
  };

  const handleLoadSample = async (sampleIdx: number) => {
    setIsGenerating(true);
    setSysStatusMsg(null);
    const sample = SAMPLE_DOCS[sampleIdx];
    
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: selectedLanguage,
          file: {
            name: sample.name,
            type: sample.type,
            size: sample.size,
            data: btoa(unescape(encodeURIComponent(sample.extractedText))),
          },
        }),
      });

      if (!response.ok) throw new Error("Could not parse sample document.");
      const result = await response.json();
      
      if (result.success) {
        handleDocumentUploaded({
          name: result.fileName,
          type: sample.type,
          size: sample.size,
          extractedText: result.extractedText,
          charCount: result.charCount,
          detectedType: result.detectedType,
          analysis: result.analysis,
        });
      }
    } catch (err: any) {
      console.error(err);
      setSysStatusMsg({ type: "error", text: "Error loading the sample document workspace." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!document || isGenerating) return;
    
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsGenerating(true);
    setSysStatusMsg(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentText: document.extractedText,
          history: messages, // Send existing chat history
          message: text,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "model",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error("Failed to generate response.");
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "model",
        content: `⚠️ **Endpoint Error Dialogue:** ${err.message || "An unexpected issue happened while consulting the document model."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  // Listen to visual content link clicks to ask suggested questions instantly
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If user clicks on an element containing list questions, capture it
      if (target && target.tagName === "LI" && document && !isGenerating) {
        const parent = target.closest("#ai-document-analysis-content");
        if (parent) {
          const literalText = target.innerText.replace(/^\d+[\.\)]\s*/, "").trim();
          // Ensure it looks like a question or phrase
          if (literalText.endsWith("?") || literalText.length > 15) {
            handleSendMessage(literalText);
            setActiveTab("chat");
          }
        }
      }
    };
    window.addEventListener("click", handleDocumentClick);
    return () => window.removeEventListener("click", handleDocumentClick);
  }, [document, messages, isGenerating, selectedLanguage]);

  return (
    <div id="ai-document-assistant-root" className="min-h-screen bg-[#0A0A0B] flex flex-col font-sans text-slate-300 antialiased selection:bg-indigo-500/20 selection:text-indigo-200">
      
      {/* Top Professional App Navbar */}
      <header className="bg-[#0F0F11] border-b border-white/10 sticky top-0 z-30 shrink-0 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center text-white font-bold">
              L
            </div>
            <div>
              <h1 className="text-md sm:text-xl font-semibold tracking-tight text-white font-serif italic flex items-center gap-2">
                Lexa AI <span className="text-3xs tracking-widest font-sans font-bold uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">Assistant</span>
              </h1>
              <p className="text-3xs sm:text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">Strict Context Mode • Secured workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector in Navbar */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest hidden md:inline-block">System Language:</span>
              <LanguageSelector
                selected={selectedLanguage}
                onChange={handleLanguageChange}
                disabled={isGenerating}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-0">
        
        {/* Active System Status Notification Bar */}
        {sysStatusMsg && (
          <div
            id="system-status-toast"
            className={`mb-6 px-4 py-3 rounded-xl border flex items-center gap-2.5 shadow-lg text-xs font-semibold animate-slideUp transition-all duration-300 ${
              sysStatusMsg.type === "success"
                ? "bg-[#0F0F11] text-indigo-400 border-indigo-500/30"
                : "bg-rose-950/40 text-rose-300 border-rose-500/20"
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${sysStatusMsg.type === "success" ? "text-indigo-400" : "text-rose-400"} shrink-0`} />
            <span className="flex-1">{sysStatusMsg.text}</span>
            <button
              type="button"
              onClick={() => setSysStatusMsg(null)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Panels Layout */}
        {!document ? (
          /* Empty Workspace - Presenting Upload Option & Premium Start Cards */
          <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-12 max-w-2xl mx-auto w-full animate-fadeIn" id="initial-dashboard-welcome">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#0F0F11] border border-white/10 shadow-xl rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Instantly Chat with any Document
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                Upload your files or select a sample report. The sandbox automatically transcribes content and builds custom insights in your target language.
              </p>
            </div>

            {/* Core Upload Zone */}
            <div className="w-full bg-[#0F0F11] p-6 rounded-3xl border border-white/10 shadow-2xl">
              <UploadZone
                selectedLanguage={selectedLanguage}
                onUploadSuccess={handleDocumentUploaded}
              />
            </div>

            {/* Quick Testing Shortcuts Options list cards */}
            <div className="w-full mt-8" id="quick-start-samples">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Quick Trial Sample Documents
                </span>
                <span className="text-[9px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  No upload required
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SAMPLE_DOCS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => handleLoadSample(idx)}
                    className="flex items-start text-left p-4 bg-[#0F0F11] hover:bg-white/5 hover:border-white/20 border border-white/10 rounded-2xl hover:shadow-lg transition-all duration-200 group relative disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <div className="p-2.5 bg-white/5 group-hover:bg-indigo-500/10 rounded-xl mr-3 border border-white/5 transition-colors">
                      <FileText className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 leading-tight truncate">
                        {sample.name.replace(/_/g, " ").replace(".txt", "")}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        Test parsing, auto layout summaries, query lists, and formatting.
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
            
            <p className="text-center text-[10px] text-slate-600 mt-12 uppercase tracking-widest">
              Secured in Browser Sandbox • No permanent storage tracking
            </p>
          </div>
        ) : (
          /* Document Loaded Workspace — Full Width Tabbed Separation */
          <div className="flex-1 flex flex-col min-h-0 animate-fadeIn" id="document-workspace-root">
            {/* 1. Document Header with Stats */}
            <div className="p-5 bg-[#0F0F11] border border-white/10 rounded-2xl mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-white/5 rounded-xl shadow-lg border border-white/10">
                  {getFileIcon(document.detectedType)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight break-all max-w-[280px] sm:max-w-md" title={document.name}>
                    {document.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-medium whitespace-nowrap">
                    <span className="uppercase text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-mono text-slate-300">
                      {document.detectedType}
                    </span>
                    <span className="h-1 w-1 bg-slate-700 rounded-full" />
                    <span>{getFormatSize(document.size)}</span>
                    <span className="h-1 w-1 bg-slate-700 rounded-full" />
                    <span className="font-mono">{document.charCount.toLocaleString()} chars</span>
                  </div>
                </div>
              </div>

              <button
                id="upload-new-document-button"
                type="button"
                onClick={handleClearDocument}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#DFDFDF] hover:text-white hover:bg-white/10 transition-all rounded-lg border border-white/10 active:scale-95 cursor-pointer animate-fadeIn"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Upload New
              </button>
            </div>

            {/* 2. Top Navigation Tabs Bar */}
            <div className="flex border-b border-white/10 mb-4 bg-[#0F0F11]/40 p-1.5 rounded-xl border border-white/5 shrink-0 select-none">
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-3 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "chat"
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-serif italic font-semibold"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Chat Assist
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`flex-1 py-3 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-serif italic font-semibold"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Document Overview
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("raw")}
                className={`flex-1 py-3 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "raw"
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-serif italic font-semibold"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Raw Text
              </button>
            </div>

            {/* 3. Conditional Tab Views (Complete separation) */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col min-h-0 animate-fadeIn" id="tab-content-chat">
                <ChatPanel
                  documentText={document.extractedText}
                  messages={messages}
                  language={selectedLanguage}
                  onSendMessage={handleSendMessage}
                  isGenerating={isGenerating}
                  onClearHistory={handleClearHistory}
                />
              </div>
            )}

            {activeTab === "overview" && (
              <div className="flex-1 bg-[#0F0F11] rounded-2xl border border-white/10 shadow-2xl p-6 overflow-y-auto max-h-[700px] animate-fadeIn" id="tab-content-overview">
                <div id="ai-document-analysis-content" className="space-y-6">
                  {/* Executive summary markdown render */}
                  <div className="markdown-body text-slate-300 leading-relaxed text-sm antialiased prose prose-invert prose-indigo max-w-none prose-p:leading-relaxed prose-li:my-1">
                    <ReactMarkdown>{document.analysis}</ReactMarkdown>
                  </div>

                  {/* Visual Callout info box */}
                  <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                    <div className="flex items-start gap-2.5 text-xs text-indigo-300 font-medium leading-normal">
                      <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>
                        Tip: Click on any question in the summary above to automatically ask the chat assistant and open the chat view instantly!
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "raw" && (
              <div className="flex-1 bg-[#0F0F11] rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col min-h-[400px] animate-fadeIn" id="tab-content-raw">
                <div id="raw-document-plain-text" className="h-full flex flex-col relative flex-1 min-h-0">
                  <div className="flex justify-between items-center mb-3 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Literal Extracted Workspace Text
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyRawText}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all font-semibold cursor-pointer"
                    >
                      {copiedRaw ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Raw Text
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex-1 bg-[#0A0A0B] rounded-xl p-4 overflow-y-auto border border-white/5 min-h-[300px]">
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-text font-medium">
                      {document.extractedText}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
