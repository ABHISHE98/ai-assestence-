import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { FileText, Image, ChevronRight, FileArchive, HelpCircle, Eye, Info, Copy, Check, RefreshCw } from "lucide-react";
import { AnalyzedDocument } from "../types";

interface DocumentPreviewProps {
  document: AnalyzedDocument;
  onClear: () => void;
  onSelectQuestion: (question: string) => void;
}

export default function DocumentPreview({ document, onClear, onSelectQuestion }: DocumentPreviewProps) {
  const [activeTab, setActiveTab] = useState<"analysis" | "raw">("analysis");
  const [copied, setCopied] = useState(false);

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
        return <FileText className="w-8 h-8 text-blue-500" />;
      case "image":
        return <Image className="w-8 h-8 text-purple-500" />;
      default:
        return <FileText className="w-8 h-8 text-slate-500" />;
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(document.extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="document-preview-card" className="bg-[#0F0F11] rounded-2xl border border-white/10 shadow-xl flex flex-col h-full overflow-hidden">
      {/* File Stats Header banner */}
      <div className="p-5 border-b border-white/5 bg-[#0C0C0E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-white/5 rounded-xl shadow-lg border border-white/10">
            {getFileIcon(document.detectedType)}
          </div>
          <div>
            <h3 className="font-bold text-white text-base leading-tight break-all max-w-[280px] sm:max-w-md" title={document.name}>
              {document.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium">
              <span className="uppercase text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-mono text-slate-300">{document.detectedType}</span>
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
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#DFDFDF] hover:text-white hover:bg-white/10 transition-all rounded-lg border border-white/10 active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Upload New
        </button>
      </div>

      {/* Tabs list bar */}
      <div className="flex border-b border-white/5 px-4 bg-[#0F0F11] shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("analysis")}
          className={`px-4 py-3.5 text-xs font-bold transition-all relative border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "analysis"
              ? "border-indigo-500 text-indigo-400 font-serif italic"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <Info className="w-3.5 h-3.5" /> Document Overview & Analysis
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("raw")}
          className={`px-4 py-3.5 text-xs font-bold transition-all relative border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "raw"
              ? "border-indigo-500 text-indigo-400 font-serif italic"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> Raw Document Text
        </button>
      </div>

      {/* Preview tab contents */}
      <div className="flex-1 overflow-y-auto p-5 min-h-0 bg-[#0C0C0E]">
        {activeTab === "analysis" ? (
          <div id="ai-document-analysis-content" className="space-y-6">
            {/* Executive summary markdown render */}
            <div className="markdown-body text-slate-300 leading-relaxed text-sm antialiased prose prose-invert prose-indigo max-w-none prose-p:leading-relaxed prose-li:my-1">
              <ReactMarkdown>{document.analysis}</ReactMarkdown>
            </div>

            {/* Visual Callout info box for suggested questions click actions */}
            <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
              <div className="flex items-start gap-2.5 text-xs text-indigo-300 font-medium leading-normal">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Tip: Click on any question in the summary above, or use the query assistant inside the chat panel to unlock deeper intelligence instantly!</span>
              </div>
            </div>
          </div>
        ) : (
          <div id="raw-document-plain-text" className="h-full flex flex-col relative">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Literal Extracted Workspace Text
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all font-semibold"
              >
                {copied ? (
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
        )}
      </div>
    </div>
  );
}
