import React, { useState } from 'react';
import { Navbar } from './src/components/Navbar';
import { MarketHome } from './src/components/MarketHome';
import { ProfitRadar } from './src/components/ProfitRadar';
import { PriceHistory } from './src/components/PriceHistory';
import { GemmaAssistant } from './src/components/GemmaAssistant';
import { DecisionLab } from './src/components/DecisionLab';
import { AlertsAndDigest } from './src/components/AlertsAndDigest';
import { DataHealthAndOfficer } from './src/components/DataHealthAndOfficer';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [lang, setLang] = useState('hi');
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [selectedCropKey, setSelectedCropKey] = useState('wheat');

  return (
    <div className="min-h-screen bg-[#07130d] text-stone-100 font-sans selection:bg-[#22c55e] selection:text-[#07130d] pb-16">
      {/* Terminal Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={setLang}
        simulateOffline={simulateOffline}
        setSimulateOffline={setSimulateOffline}
      />

      {/* Main View Area */}
      <main className="max-w-7xl mx-auto px-4 pt-6">
        {currentTab === 'home' && (
          <MarketHome
            selectedCropKey={selectedCropKey}
            setSelectedCropKey={setSelectedCropKey}
            lang={lang}
          />
        )}

        {currentTab === 'radar' && (
          <ProfitRadar
            selectedCropKey={selectedCropKey}
            setSelectedCropKey={setSelectedCropKey}
            lang={lang}
          />
        )}

        {currentTab === 'history' && (
          <PriceHistory
            selectedCropKey={selectedCropKey}
            setSelectedCropKey={setSelectedCropKey}
            lang={lang}
          />
        )}

        {currentTab === 'gemma' && (
          <GemmaAssistant
            simulateOffline={simulateOffline}
            setSimulateOffline={setSimulateOffline}
            lang={lang}
          />
        )}

        {currentTab === 'decision' && (
          <DecisionLab
            selectedCropKey={selectedCropKey}
            setSelectedCropKey={setSelectedCropKey}
            lang={lang}
          />
        )}

        {currentTab === 'alerts' && (
          <AlertsAndDigest
            selectedCropKey={selectedCropKey}
            setSelectedCropKey={setSelectedCropKey}
            lang={lang}
          />
        )}

        {currentTab === 'officer' && (
          <DataHealthAndOfficer lang={lang} />
        )}
      </main>

      {/* Modern Terminal Footer */}
      <footer className="max-w-7xl mx-auto px-4 mt-16 pt-6 border-t border-[#143021] text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">BAZARSETU AI</span>
          <span>•</span>
          <span>Krishi Decision Intelligence</span>
          <span>•</span>
          <span className="text-[#22c55e] font-semibold">Agmarknet Verified 2026-10-21</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>Gemma 4 Grounded Pipeline</span>
          <span>•</span>
          <span>Deterministic Math Engine</span>
          <span>•</span>
          <span>Zero Financial Hallucination</span>
        </div>
      </footer>
    </div>
  );
}
