export type SupportedLanguage = 
  | "Hindi"
  | "English"
  | "French"
  | "German"
  | "Spanish"
  | "Arabic"
  | "Chinese";

export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface AnalyzedDocument {
  name: string;
  type: string;
  size: number;
  extractedText: string;
  charCount: number;
  detectedType: "pdf" | "docx" | "image" | "text";
  analysis: string; // The beautiful Markdown analysis returned by the backend
}

export const LANGUAGES: { code: string; label: string; flag: string; localized: string }[] = [
  { code: "English", label: "English", flag: "🇺🇸", localized: "English" },
  { code: "Hindi", label: "Hindi", flag: "🇮🇳", localized: "हिन्दी" },
  { code: "Spanish", label: "Spanish", flag: "🇪🇸", localized: "Español" },
  { code: "French", label: "French", flag: "🇫🇷", localized: "Français" },
  { code: "German", label: "German", flag: "🇩🇪", localized: "Deutsch" },
  { code: "Arabic", label: "Arabic", flag: "🇸🇦", localized: "العربية" },
  { code: "Chinese", label: "Chinese", flag: "🇨🇳", localized: "中文" },
];
