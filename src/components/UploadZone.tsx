import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, FileText, Image, FileCode, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { SupportedLanguage } from "../types";

interface UploadZoneProps {
  onUploadSuccess: (fileData: { name: string; type: string; size: number; extractedText: string; charCount: number; detectedType: any; analysis: string }) => void;
  selectedLanguage: SupportedLanguage;
}

export default function UploadZone({ onUploadSuccess, selectedLanguage }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);
    
    // File validation
    const allowedExtensions = /\.(pdf|docx|txt|jpg|jpeg|png|webp)$/i;
    if (!allowedExtensions.test(file.name)) {
      setError("Unsupported file format. Please upload PDF, DOCX, TXT, or Images.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) { // 15MB size limit
      setError("File exceeds the 15MB limit. Please choose a smaller file.");
      return;
    }

    setIsProcessing(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      
      const fileDataPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("File reading failed"));
        reader.readAsDataURL(file);
      });

      const base64Data = await fileDataPromise;

      // Send to server-side extraction
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: selectedLanguage,
          file: {
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            data: base64Data,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        onUploadSuccess({
          name: result.fileName,
          type: file.type,
          size: file.size,
          extractedText: result.extractedText,
          charCount: result.charCount,
          detectedType: result.detectedType,
          analysis: result.analysis,
        });
      } else {
        throw new Error("Unable to analyze document.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while processing the document.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const selectFileManual = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="upload-zone-container" className="w-full">
      <div
        id="drop-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={isProcessing ? undefined : selectFileManual}
        className={`relative cursor-pointer transition-all duration-300 border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center outline-none ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/5 scale-[0.99] shadow-inner"
            : "border-white/10 hover:border-indigo-500/55 bg-white/[0.02] hover:bg-white/[0.04]"
        } ${isProcessing ? "opacity-75 cursor-not-allowed" : ""}`}
      >
        <input
          id="file-input"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt,image/*"
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center animate-pulse" id="processing-state animate">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-white">Extracting content...</h3>
            <p className="text-xs text-slate-400 mt-1.5">
              Analyzing text segments & creating executive summary in <span className="font-semibold text-indigo-400">{selectedLanguage}</span>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center" id="idle-upload-state animate">
            <div className="p-4 bg-white/5 border border-white/10 shadow-lg rounded-full text-slate-300 mb-4 hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-white tracking-tight">
              Drag & drop your document here
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              or <span className="text-indigo-400 font-medium underline">browse files</span> from your computer
            </p>

            {/* Acceptable Formats Bar */}
            <div className="flex items-center gap-3 mt-8 flex-wrap justify-center text-[10px] tracking-wider uppercase font-bold text-slate-400" id="supported-formats">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                <FileText className="w-3.5 h-3.5" /> PDF
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                <FileText className="w-3.5 h-3.5" /> DOCX
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                <FileCode className="w-3.5 h-3.5" /> TXT
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                <Image className="w-3.5 h-3.5" /> Image
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 mt-5 uppercase tracking-widest">Max file size: 15MB</p>
          </div>
        )}
      </div>

      {error && (
        <div
          id="upload-error-alert"
          className="mt-4 p-4 bg-rose-950/30 border border-rose-500/25 rounded-xl flex items-start gap-3 text-rose-300 animate-slideUp text-xs font-semibold"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block uppercase tracking-wider text-rose-300 mb-0.5">Processing Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
