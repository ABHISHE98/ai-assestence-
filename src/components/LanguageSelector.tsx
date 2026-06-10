import React, { useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { SupportedLanguage, LANGUAGES } from "../types";

interface LanguageSelectorProps {
  selected: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
  disabled?: boolean;
}

export default function LanguageSelector({ selected, onChange, disabled = false }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLang = LANGUAGES.find((l) => l.code === selected) || LANGUAGES[0];

  return (
    <div id="language-selector-wrapper" className="relative shrink-0">
      <button
        id="lang-select-button"
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-[#0F0F11] hover:bg-white/5 transition-all text-xs font-semibold text-slate-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/25 ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <Globe className="w-4 h-4 text-slate-500" />
        <span className="flex items-center gap-1.5 text-slate-300">
          <span>{currentLang.flag}</span>
          <span className="hidden sm:inline">{currentLang.label}</span>
          <span className="text-slate-500 font-normal sm:ml-0.5">({currentLang.localized})</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && !disabled && (
        <>
          {/* Transparent click backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          <div
            id="lang-dropdown-options"
            className="absolute right-0 mt-3 w-56 rounded-xl bg-[#0F0F11] border border-white/10 shadow-2xl py-1.5 z-50 animate-slideDown"
          >
            <div className="px-3.5 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
              Output Language
            </div>
            
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === selected;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    onChange(lang.code as SupportedLanguage);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors hover:bg-white/5 ${
                    isSelected ? "text-indigo-400 bg-indigo-500/10 font-bold" : "text-slate-300 font-medium"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span className="text-slate-350">{lang.label}</span>
                    <span className="text-slate-500 text-2xs leading-none">({lang.localized})</span>
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
