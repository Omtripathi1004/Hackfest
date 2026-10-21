import React from 'react';
import { Database, Wifi, ShieldAlert, Globe, Radio } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: 'hi' | 'en';
  setLang: (lang: 'hi' | 'en') => void;
  simulateOffline: boolean;
  setSimulateOffline: (offline: boolean) => void;
}

export const TABS = [
  { id: 'home', labelEn: 'Market Home', labelHi: 'मंडी भाव व मुनाफा', icon: '🌾' },
  { id: 'radar', labelEn: 'Profit Radar', labelHi: 'मंडी मुनाफा तुलना', icon: '📡' },
  { id: 'history', labelEn: 'Price History', labelHi: 'भाव इतिहास व मौन मंडी', icon: '📈' },
  { id: 'gemma', labelEn: 'Gemma 4 Assistant', labelHi: 'Gemma 4 कृषि सहायक', icon: '✨' },
  { id: 'decision', labelEn: 'Decision Lab', labelHi: 'क्या-अगर सिम्युलेटर', icon: '🧪' },
  { id: 'alerts', labelEn: 'Alerts & 2G Digest', labelHi: 'अलर्ट व SMS डाइजेस्ट', icon: '📲' },
  { id: 'officer', labelEn: 'Data Health & Tests', labelHi: 'डेटा हेल्थ व टेस्ट', icon: '🛡️' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  simulateOffline,
  setSimulateOffline,
}) => {
  return (
    <header className="bg-[#07130d] border-b border-[#1b3d2b] sticky top-0 z-40 text-stone-100">
      <div className="max-w-7xl mx-auto px-3 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-[#22c55e] text-[#07130d] font-black px-2.5 py-1 rounded text-sm tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.35)]">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>BAZARSETU AI</span>
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-300 tracking-wide uppercase">
              {lang === 'hi' ? 'कृषि निर्णय बुद्धिमत्ता' : 'Krishi Decision Intelligence'}
            </div>
            <div className="text-[10px] text-stone-400 hidden sm:block">
              "Know the Price. Compare the Profit. Decide with Confidence."
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Snapshot Status Badge */}
          <div className="flex items-center gap-1.5 text-[11px] bg-[#0d2117] px-2.5 py-1 rounded-full border border-[#1b3d2b] text-emerald-300">
            <Database className="w-3.5 h-3.5 text-[#22c55e]" />
            <span className="font-semibold">Snapshot v2026_10_21</span>
          </div>

          {/* Simulate Offline Toggle */}
          <button
            onClick={() => setSimulateOffline(!simulateOffline)}
            className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
              simulateOffline
                ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                : 'bg-[#0d2117] border-[#1b3d2b] text-stone-300 hover:border-emerald-500'
            }`}
            title="Toggle Gemma 4 Offline mode to test zero-hallucination deterministic fallback"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${simulateOffline ? 'text-rose-400' : 'text-amber-400'}`} />
            <span>{simulateOffline ? 'Offline Mode Active' : 'Simulate Offline'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
            className="flex items-center gap-1 text-xs font-bold bg-[#1b3d2b] hover:bg-emerald-800 text-emerald-100 px-3 py-1 rounded-full border border-emerald-600 transition"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'English' : 'हिन्दी'}</span>
          </button>
        </div>
      </div>

      {/* 7 View Tabs */}
      <nav className="bg-[#0a1b12] border-t border-[#143021] overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-2 flex gap-1 py-1.5">
          {TABS.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-[#22c55e] text-[#07130d] font-bold shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                    : 'text-stone-300 hover:text-white hover:bg-[#12281b]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{lang === 'hi' ? tab.labelHi : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
