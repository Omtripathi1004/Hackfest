import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './src/components/Navbar';
import { MarketHome } from './src/components/MarketHome';
import { ProfitRadar } from './src/components/ProfitRadar';
import { PriceHistory } from './src/components/PriceHistory';
import { GemmaAssistant } from './src/components/GemmaAssistant';
import { AlertsAndDigest } from './src/components/AlertsAndDigest';
import { DataHealthAndOfficer } from './src/components/DataHealthAndOfficer';

// New Required Components
import { MandiMap } from './components/MandiMap';
import { ProfitLossCentre } from './app/finance/page';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { GeminiChatbot } from './components/GeminiChatbot';

import { FALLBACK_SNAPSHOT } from './src/data/fallbackSnapshot';
import { calculateProfitAndLoss } from './src/utils/calculations';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [lang, setLang] = useState('hi');
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [selectedCropKey, setSelectedCropKey] = useState('wheat');
  const [selectedMandiId, setSelectedMandiId] = useState('UP_LKO_01');

  // Chatbot drawer open/close state
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Saved / Tracked mandis list persisted in localStorage
  const [savedMandiIds, setSavedMandiIds] = useState(() => {
    try {
      const stored = localStorage.getItem('bazarsetu_saved_mandis');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return ['UP_LKO_01', 'UP_KNP_01'];
  });

  useEffect(() => {
    try {
      localStorage.setItem('bazarsetu_saved_mandis', JSON.stringify(savedMandiIds));
    } catch (e) {}
  }, [savedMandiIds]);

  const handleToggleSaveMandi = (mandiId) => {
    setSavedMandiIds((prev) =>
      prev.includes(mandiId) ? prev.filter((id) => id !== mandiId) : [...prev, mandiId]
    );
  };

  // Find active mandi object
  const activeCropData = FALLBACK_SNAPSHOT[selectedCropKey] || FALLBACK_SNAPSHOT.wheat;
  const activeMandi = useMemo(() => {
    const foundInCurrent = activeCropData.mandis.find((m) => m.id === selectedMandiId);
    if (foundInCurrent) return foundInCurrent;

    // Search across all crops if switched
    for (const cKey of Object.keys(FALLBACK_SNAPSHOT)) {
      const found = FALLBACK_SNAPSHOT[cKey].mandis.find((m) => m.id === selectedMandiId);
      if (found) return found;
    }
    return activeCropData.mandis[0] || null;
  }, [selectedCropKey, selectedMandiId, activeCropData]);

  // Financial inputs state
  const [financialInputs, setFinancialInputs] = useState(() => ({
    crop: 'wheat',
    quantitySold: 50,
    sellingPricePerUnit: 2475,
    transportExpenses: 1200,
    loadingUnloading: 900,
    commissions: 0,
    otherSaleExpenses: 300,
    productionCosts: 42000,
  }));

  // Reactive financial results computed using strict formulas
  const financialResults = useMemo(() => {
    return calculateProfitAndLoss(financialInputs);
  }, [financialInputs]);

  // Active scenario state
  const [activeScenario, setActiveScenario] = useState(null);

  // Seamless workflow: pre-fill finance from mandi selection
  const handlePreFillFinanceFromMandi = (mandi) => {
    if (!mandi) return;
    const modal = mandi.todayModal || 2475;
    const qty = financialInputs.quantitySold || 50;
    const estFreight = Math.round((mandi.distanceKm || 12) * 0.95 * qty);
    const estHammali = Math.round(18 * qty);

    setFinancialInputs((prev) => ({
      ...prev,
      crop: mandi.cropKey || selectedCropKey,
      sellingPricePerUnit: modal,
      transportExpenses: estFreight,
      loadingUnloading: estHammali,
    }));

    if (mandi.cropKey) {
      setSelectedCropKey(mandi.cropKey);
    }
    setSelectedMandiId(mandi.id);
    setCurrentTab('finance');
  };

  // Seamless workflow: apply scenario to finance
  const handleApplyScenarioToFinance = (scenInputs) => {
    setFinancialInputs({ ...scenInputs });
    setCurrentTab('finance');
  };

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
        onOpenChat={() => setIsChatbotOpen(true)}
      />

      {/* Main View Area */}
      <main className="max-w-7xl mx-auto px-4 pt-6">
        {/* Tab 1: Market Home */}
        {currentTab === 'home' && (
          <MarketHome
            selectedCropKey={selectedCropKey}
            setSelectedCropKey={setSelectedCropKey}
            lang={lang}
            onNavigateTab={(tab, mandi) => {
              if (mandi?.cropKey) setSelectedCropKey(mandi.cropKey);
              if (mandi?.id) setSelectedMandiId(mandi.id);
              if (tab === 'finance') {
                handlePreFillFinanceFromMandi(mandi);
              } else {
                setCurrentTab(tab);
              }
            }}
          />
        )}

        {/* Tab 2: Profit Radar */}
        {currentTab === 'radar' && (
          <ProfitRadar
            selectedCropKey={selectedCropKey}
            setSelectedCropKey={setSelectedCropKey}
            lang={lang}
            onPreFillFinance={handlePreFillFinanceFromMandi}
            onNavigateTab={(tab, mandi) => {
              if (mandi?.cropKey) setSelectedCropKey(mandi.cropKey);
              if (mandi?.id) setSelectedMandiId(mandi.id);
              setCurrentTab(tab);
            }}
          />
        )}

        {/* Tab 3: Interactive Mandi Map */}
        {currentTab === 'map' && (
          <MandiMap
            selectedCropKey={selectedCropKey}
            setSelectedCropKey={setSelectedCropKey}
            selectedMandiId={selectedMandiId}
            setSelectedMandiId={setSelectedMandiId}
            onNavigateTab={(tab, mandi) => {
              if (mandi?.cropKey) setSelectedCropKey(mandi.cropKey);
              if (mandi?.id) setSelectedMandiId(mandi.id);
              setCurrentTab(tab);
            }}
            onPreFillFinance={handlePreFillFinanceFromMandi}
            onOpenChatWithMandi={(mandi) => {
              if (mandi?.id) setSelectedMandiId(mandi.id);
              setIsChatbotOpen(true);
            }}
            savedMandiIds={savedMandiIds}
            onToggleSaveMandi={handleToggleSaveMandi}
            lang={lang}
          />
        )}

        {/* Tab 4: Profit & Loss Centre */}
        {currentTab === 'finance' && (
          <ProfitLossCentre
            financialInputs={financialInputs}
            setFinancialInputs={setFinancialInputs}
            financialResults={financialResults}
            selectedCropKey={selectedCropKey}
            setSelectedCropKey={setSelectedCropKey}
            activeMandi={activeMandi}
            onOpenWhatIf={() => setCurrentTab('decision')}
            onOpenChatWithFinance={() => setIsChatbotOpen(true)}
            lang={lang}
          />
        )}

        {/* Tab 5: What-If Simulator */}
        {currentTab === 'decision' && (
          <WhatIfSimulator
            baselineInputs={financialInputs}
            selectedCropKey={selectedCropKey}
            activeMandi={activeMandi}
            onApplyScenarioToFinance={handleApplyScenarioToFinance}
            onOpenChatWithScenario={(delta, name) => {
              setActiveScenario({ ...delta, name });
              setIsChatbotOpen(true);
            }}
            lang={lang}
          />
        )}

        {/* Tab 6: Price History */}
        {currentTab === 'history' && (
          <PriceHistory
            selectedCropKey={selectedCropKey}
            setSelectedCropKey={setSelectedCropKey}
            lang={lang}
          />
        )}

        {/* Tab 7: Gemma Assistant Pipeline Trace */}
        {currentTab === 'gemma' && (
          <GemmaAssistant
            simulateOffline={simulateOffline}
            setSimulateOffline={setSimulateOffline}
            lang={lang}
          />
        )}

        {/* Tab 8: Alerts & 2G Digest */}
        {currentTab === 'alerts' && (
          <AlertsAndDigest
            selectedCropKey={selectedCropKey}
            setSelectedCropKey={setSelectedCropKey}
            lang={lang}
          />
        )}

        {/* Tab 9: Data Health & Acceptance Tests */}
        {currentTab === 'officer' && (
          <DataHealthAndOfficer lang={lang} />
        )}
      </main>

      {/* Floating Gemini Chatbot Component (Persistent across all tabs with live context) */}
      <GeminiChatbot
        isOpen={isChatbotOpen}
        setIsOpen={setIsChatbotOpen}
        selectedCropKey={selectedCropKey}
        cropName={activeCropData.name}
        activeMandi={activeMandi}
        financialInputs={financialInputs}
        financialResults={financialResults}
        activeScenario={activeScenario}
        lang={lang}
      />

      {/* Modern Terminal Footer */}
      <footer className="max-w-7xl mx-auto px-4 mt-16 pt-6 border-t border-[#143021] text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-white">BAZARSETU AI</span>
          <span>•</span>
          <span>Krishi Decision Intelligence</span>
          <span>•</span>
          <span className="text-[#22c55e] font-semibold">Agmarknet Verified 2026-10-21</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] flex-wrap">
          <span>Gemini @google/genai Multi-Turn Chat</span>
          <span>•</span>
          <span>Mandi Map Radar</span>
          <span>•</span>
          <span>P&L Centre</span>
          <span>•</span>
          <span>What-If Simulator</span>
        </div>
      </footer>
    </div>
  );
}
