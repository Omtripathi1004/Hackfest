import React, { useState, useEffect } from 'react';
import {
  Sliders,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Save,
  Edit2,
  Trash2,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Calculator,
  Percent,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { FALLBACK_SNAPSHOT } from '../src/data/fallbackSnapshot';
import {
  calculateProfitAndLoss,
  calculateScenarioDelta,
} from '../src/utils/calculations';

export function WhatIfSimulator({
  baselineInputs,
  selectedCropKey = 'wheat',
  activeMandi = null,
  onApplyScenarioToFinance,
  onOpenChatWithScenario,
  lang = 'hi',
}) {
  // Scenario Inputs state (initialized from baseline)
  const [scenarioInputs, setScenarioInputs] = useState(() => ({
    ...baselineInputs,
  }));

  const [scenarioName, setScenarioName] = useState('My Custom Scenario');
  const [editingSavedId, setEditingSavedId] = useState(null);
  const [editingNameText, setEditingNameText] = useState('');

  // Saved scenarios list
  const [savedScenarios, setSavedScenarios] = useState(() => {
    try {
      const stored = localStorage.getItem('bazarsetu_saved_scenarios');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      {
        id: 'SCEN-01',
        name: 'Monsoon Diesel Hike (Transport +20%)',
        inputs: {
          ...baselineInputs,
          transportExpenses: Math.round(baselineInputs.transportExpenses * 1.2),
        },
      },
      {
        id: 'SCEN-02',
        name: 'FPO Collective Bargaining (Price +3%)',
        inputs: {
          ...baselineInputs,
          sellingPricePerUnit: Math.round(baselineInputs.sellingPricePerUnit * 1.03),
        },
      },
    ];
  });

  // Persist saved scenarios
  useEffect(() => {
    try {
      localStorage.setItem('bazarsetu_saved_scenarios', JSON.stringify(savedScenarios));
    } catch (e) {}
  }, [savedScenarios]);

  // Sync baseline if parent baseline changes meaningfully
  useEffect(() => {
    setScenarioInputs((prev) => ({
      ...baselineInputs,
      // preserve user changes if actively editing, otherwise update
    }));
  }, [baselineInputs.crop]);

  // Reusable calculation engine from calculations.ts
  const delta = calculateScenarioDelta(baselineInputs, scenarioInputs);
  const baselineResults = delta.baseline;
  const scenarioResults = delta.scenario;

  // Quick Action Scenario Chips
  const applyChipAction = (type) => {
    setScenarioInputs((prev) => {
      const updated = { ...prev };
      switch (type) {
        case 'price_plus_3':
          updated.sellingPricePerUnit = Math.round(baselineInputs.sellingPricePerUnit * 1.03);
          setScenarioName('Price +3% (बाजार भाव +3%)');
          break;
        case 'price_minus_5':
          updated.sellingPricePerUnit = Math.round(baselineInputs.sellingPricePerUnit * 0.95);
          setScenarioName('Price -5% (बाजार भाव -5%)');
          break;
        case 'transport_plus_20':
          updated.transportExpenses = Math.round(baselineInputs.transportExpenses * 1.2);
          setScenarioName('Transport +20% (भाड़ा वृद्धि +20%)');
          break;
        case 'switch_mandi':
          // Distant mandi with higher gross price but higher transport
          updated.sellingPricePerUnit = baselineInputs.sellingPricePerUnit + 65;
          updated.transportExpenses = baselineInputs.transportExpenses + 1400;
          setScenarioName('Switch to Distant Mandi (+₹65 price, +₹1,400 freight)');
          break;
        case 'qty_plus_20':
          updated.quantitySold = baselineInputs.quantitySold + 20;
          setScenarioName('Quantity +20 Qtl (मात्रा +20 क्विंटल)');
          break;
        case 'qty_minus_10':
          updated.quantitySold = Math.max(5, baselineInputs.quantitySold - 10);
          setScenarioName('Quantity -10 Qtl (मात्रा -10 क्विंटल)');
          break;
        case 'prod_minus_10':
          updated.productionCosts = Math.round(baselineInputs.productionCosts * 0.9);
          setScenarioName('Production Cost -10% (लागत बचत 10%)');
          break;
        default:
          break;
      }
      return updated;
    });
  };

  const handleReset = () => {
    setScenarioInputs({ ...baselineInputs });
    setScenarioName('Baseline Reset (मूल स्थिति)');
  };

  const handleSaveScenario = () => {
    const newScen = {
      id: `SCEN-${Date.now().toString().slice(-4)}`,
      name: scenarioName || 'Unnamed Scenario',
      inputs: { ...scenarioInputs },
    };
    setSavedScenarios((prev) => [newScen, ...prev]);
  };

  const handleLoadSaved = (scen) => {
    setScenarioInputs({ ...scen.inputs });
    setScenarioName(scen.name);
  };

  const handleDeleteSaved = (id) => {
    setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  const handleStartRename = (scen) => {
    setEditingSavedId(scen.id);
    setEditingNameText(scen.name);
  };

  const handleSaveRename = (id) => {
    setSavedScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: editingNameText.trim() || s.name } : s))
    );
    setEditingSavedId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span className="text-[#22c55e]">🧪</span>
              <span>{lang === 'hi' ? 'क्या-अगर सिम्युलेटर (What-If Simulator)' : 'What-If Scenario Simulator'}</span>
            </h2>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              SCENARIO ONLY (काल्पनिक परिदृश्य)
            </span>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            {lang === 'hi'
              ? 'बाजार भाव में उतार-चढ़ाव, भाड़ा वृद्धि या मंडी बदलने पर अपने शुद्ध मुनाफे का अग्रिम परीक्षण करें।'
              : 'Simulate price shifts, transport spikes, or mandi switches to see side-by-side profit deltas.'}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleReset}
            className="bg-[#07130d] hover:bg-[#143021] text-stone-300 hover:text-white border border-[#1b3d2b] text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
            title="Reset scenario inputs to baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'मूल स्थिति पर रीसेट' : 'Reset to Baseline'}</span>
          </button>

          <button
            onClick={handleSaveScenario}
            className="bg-[#143021] hover:bg-emerald-900 text-emerald-200 border border-emerald-600/70 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
            title="Save this scenario"
          >
            <Save className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>{lang === 'hi' ? 'परिदृश्य सहेजें' : 'Save Scenario'}</span>
          </button>

          <button
            onClick={() => onApplyScenarioToFinance && onApplyScenarioToFinance(scenarioInputs)}
            className="bg-[#22c55e] text-[#07130d] hover:bg-[#16a34a] text-xs font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,197,94,0.3)]"
            title="Apply scenario values into P&L Centre"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'P&L केंद्र में लागू करें' : 'Apply to P&L Centre'}</span>
          </button>
        </div>
      </div>

      {/* Quick-Action Scenario Chips Bar */}
      <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-3.5 space-y-2">
        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#22c55e]" />
          <span>{lang === 'hi' ? 'त्वरित परिदृश्य चिप्स (Quick-Action Scenario Chips)' : 'Quick-Action Scenario Chips'}</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => applyChipAction('price_plus_3')}
            className="whitespace-nowrap bg-[#07130d] hover:bg-[#143021] hover:border-[#22c55e] border border-[#1b3d2b] text-xs font-bold text-emerald-300 px-3 py-1.5 rounded-xl transition"
          >
            📈 Price +3% (+₹{Math.round(baselineInputs.sellingPricePerUnit * 0.03)}/q)
          </button>
          <button
            onClick={() => applyChipAction('price_minus_5')}
            className="whitespace-nowrap bg-[#07130d] hover:bg-[#143021] hover:border-rose-500 border border-[#1b3d2b] text-xs font-bold text-rose-300 px-3 py-1.5 rounded-xl transition"
          >
            📉 Price -5% (-₹{Math.round(baselineInputs.sellingPricePerUnit * 0.05)}/q)
          </button>
          <button
            onClick={() => applyChipAction('transport_plus_20')}
            className="whitespace-nowrap bg-[#07130d] hover:bg-[#143021] hover:border-amber-500 border border-[#1b3d2b] text-xs font-bold text-amber-300 px-3 py-1.5 rounded-xl transition"
          >
            🚛 Transport +20% (डीजल वृद्धि)
          </button>
          <button
            onClick={() => applyChipAction('switch_mandi')}
            className="whitespace-nowrap bg-[#07130d] hover:bg-[#143021] hover:border-cyan-500 border border-[#1b3d2b] text-xs font-bold text-cyan-300 px-3 py-1.5 rounded-xl transition"
          >
            🔄 Switch Mandi (+₹65 Rate, +₹1.4k Freight)
          </button>
          <button
            onClick={() => applyChipAction('qty_plus_20')}
            className="whitespace-nowrap bg-[#07130d] hover:bg-[#143021] hover:border-purple-500 border border-[#1b3d2b] text-xs font-bold text-purple-300 px-3 py-1.5 rounded-xl transition"
          >
            📦 Quantity +20 Qtl
          </button>
          <button
            onClick={() => applyChipAction('qty_minus_10')}
            className="whitespace-nowrap bg-[#07130d] hover:bg-[#143021] hover:border-purple-500 border border-[#1b3d2b] text-xs font-bold text-stone-300 px-3 py-1.5 rounded-xl transition"
          >
            📦 Quantity -10 Qtl
          </button>
          <button
            onClick={() => applyChipAction('prod_minus_10')}
            className="whitespace-nowrap bg-[#07130d] hover:bg-[#143021] hover:border-emerald-500 border border-[#1b3d2b] text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-xl transition"
          >
            🌾 Production Cost -10% (लागत बचत)
          </button>
        </div>
      </div>

      {/* Main Grid: Live Slider Controls & Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Sliders & Parameter Customizer (5 columns) */}
        <div className="lg:col-span-5 bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#1b3d2b] pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#22c55e]" />
              <span>{lang === 'hi' ? 'परिदृश्य मापदंड (Scenario Parameters)' : 'Scenario Parameters'}</span>
            </h3>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="bg-[#07130d] border border-[#1b3d2b] rounded-lg px-2.5 py-1 text-[11px] font-bold text-emerald-300 focus:outline-none focus:border-[#22c55e]"
              placeholder="Scenario name..."
            />
          </div>

          {/* Slider 1: Selling Price */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-stone-300">बिक्री दर (Selling Price):</span>
              <span className="font-mono text-emerald-400">
                ₹{scenarioInputs.sellingPricePerUnit}/Qtl{' '}
                <span className="text-[10px] text-stone-400">
                  ({scenarioInputs.sellingPricePerUnit >= baselineInputs.sellingPricePerUnit ? '+' : ''}
                  {scenarioInputs.sellingPricePerUnit - baselineInputs.sellingPricePerUnit})
                </span>
              </span>
            </div>
            <input
              type="range"
              min={Math.round(baselineInputs.sellingPricePerUnit * 0.7)}
              max={Math.round(baselineInputs.sellingPricePerUnit * 1.3)}
              step="10"
              value={scenarioInputs.sellingPricePerUnit}
              onChange={(e) =>
                setScenarioInputs((prev) => ({ ...prev, sellingPricePerUnit: Number(e.target.value) }))
              }
              className="w-full accent-[#22c55e] bg-[#07130d] h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-500 font-mono">
              <span>-30%</span>
              <span>मूल: ₹{baselineInputs.sellingPricePerUnit}</span>
              <span>+30%</span>
            </div>
          </div>

          {/* Slider 2: Transport Expenses */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-stone-300">भाड़ा खर्च (Transport Expenses):</span>
              <span className="font-mono text-amber-400">
                ₹{scenarioInputs.transportExpenses}{' '}
                <span className="text-[10px] text-stone-400">
                  ({scenarioInputs.transportExpenses >= baselineInputs.transportExpenses ? '+' : ''}
                  {scenarioInputs.transportExpenses - baselineInputs.transportExpenses})
                </span>
              </span>
            </div>
            <input
              type="range"
              min={Math.round(baselineInputs.transportExpenses * 0.5)}
              max={Math.round(baselineInputs.transportExpenses * 2.0) || 5000}
              step="50"
              value={scenarioInputs.transportExpenses}
              onChange={(e) =>
                setScenarioInputs((prev) => ({ ...prev, transportExpenses: Number(e.target.value) }))
              }
              className="w-full accent-amber-500 bg-[#07130d] h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-500 font-mono">
              <span>-50%</span>
              <span>मूल: ₹{baselineInputs.transportExpenses}</span>
              <span>+100%</span>
            </div>
          </div>

          {/* Slider 3: Quantity Sold */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-stone-300">मात्रा (Quantity Sold):</span>
              <span className="font-mono text-purple-300">{scenarioInputs.quantitySold} Qtl</span>
            </div>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={scenarioInputs.quantitySold}
              onChange={(e) =>
                setScenarioInputs((prev) => ({ ...prev, quantitySold: Number(e.target.value) }))
              }
              className="w-full accent-purple-500 bg-[#07130d] h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-500 font-mono">
              <span>5 Qtl</span>
              <span>मूल: {baselineInputs.quantitySold} Qtl</span>
              <span>200 Qtl</span>
            </div>
          </div>

          {/* Slider 4: Production Costs */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-stone-300">उत्पादन लागत (Production Costs):</span>
              <span className="font-mono text-rose-300">₹{scenarioInputs.productionCosts}</span>
            </div>
            <input
              type="range"
              min={Math.round(baselineInputs.productionCosts * 0.7)}
              max={Math.round(baselineInputs.productionCosts * 1.3) || 100000}
              step="500"
              value={scenarioInputs.productionCosts}
              onChange={(e) =>
                setScenarioInputs((prev) => ({ ...prev, productionCosts: Number(e.target.value) }))
              }
              className="w-full accent-rose-500 bg-[#07130d] h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Ask Gemini Button */}
          <div className="pt-2">
            <button
              onClick={() => onOpenChatWithScenario && onOpenChatWithScenario(delta, scenarioName)}
              className="w-full bg-[#143021] border border-[#22c55e]/50 hover:bg-emerald-900 text-emerald-200 text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>{lang === 'hi' ? 'Gemini AI से इस परिदृश्य की व्याख्या करवाएं' : 'Ask Gemini to Explain Delta'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Baseline vs Scenario Side-by-Side Results (7 columns) */}
        <div className="lg:col-span-7 bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#1b3d2b] pb-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>⚖️</span>
                <span>{lang === 'hi' ? 'मूल बनाम परिदृश्य तुलना (Side-by-Side Delta)' : 'Baseline vs. Scenario Comparison'}</span>
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5">
                सटीक रुपया (₹) और प्रतिशत (%) परिवर्तन स्पष्ट रूप से प्रदर्शित
              </p>
            </div>

            {/* Profit Delta Hero Badge */}
            <div
              className={`px-3 py-1 rounded-xl text-xs font-black font-mono border ${
                delta.cropProfitDelta >= 0
                  ? 'bg-emerald-950 text-[#22c55e] border-[#22c55e]/50'
                  : 'bg-rose-950 text-rose-400 border-rose-600/70'
              }`}
            >
              मुनाफा अंतर: {delta.cropProfitDelta >= 0 ? '+' : ''}₹{Number(delta.cropProfitDelta).toLocaleString('en-IN')} (
              {delta.cropProfitDeltaPct >= 0 ? '+' : ''}
              {delta.cropProfitDeltaPct}%)
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1b3d2b] text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">मापदंड (Metric)</th>
                  <th className="py-2.5 px-3 text-right">मूल (Baseline)</th>
                  <th className="py-2.5 px-3 text-right">परिदृश्य (Scenario)</th>
                  <th className="py-2.5 px-3 text-right">अंतर (Delta ₹)</th>
                  <th className="py-2.5 px-3 text-right">अंतर (Delta %)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#143021]">
                {/* 1. Gross Revenue */}
                <tr className="hover:bg-[#07130d]/60 transition">
                  <td className="py-3 px-3 font-semibold text-white">सकल राजस्व (Gross Revenue)</td>
                  <td className="py-3 px-3 text-right font-mono">
                    ₹{Number(baselineResults.grossRevenue).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-white">
                    ₹{Number(scenarioResults.grossRevenue).toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono font-bold ${
                      delta.grossRevenueDelta >= 0 ? 'text-[#22c55e]' : 'text-rose-400'
                    }`}
                  >
                    {delta.grossRevenueDelta >= 0 ? '+' : ''}₹{Number(delta.grossRevenueDelta).toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono font-bold ${
                      delta.grossRevenueDeltaPct >= 0 ? 'text-[#22c55e]' : 'text-rose-400'
                    }`}
                  >
                    {delta.grossRevenueDeltaPct >= 0 ? '+' : ''}{delta.grossRevenueDeltaPct}%
                  </td>
                </tr>

                {/* 2. Sale-Related Expenses */}
                <tr className="hover:bg-[#07130d]/60 transition">
                  <td className="py-3 px-3 font-semibold text-stone-300">बिक्री खर्च (Sale Expenses)</td>
                  <td className="py-3 px-3 text-right font-mono text-stone-400">
                    ₹{Number(baselineResults.saleRelatedExpenses).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-stone-300">
                    ₹{Number(scenarioResults.saleRelatedExpenses).toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono font-bold ${
                      delta.saleExpensesDelta <= 0 ? 'text-[#22c55e]' : 'text-rose-400'
                    }`}
                  >
                    {delta.saleExpensesDelta >= 0 ? '+' : ''}₹{Number(delta.saleExpensesDelta).toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono font-bold ${
                      delta.saleExpensesDelta <= 0 ? 'text-[#22c55e]' : 'text-rose-400'
                    }`}
                  >
                    {delta.saleExpensesDeltaPct >= 0 ? '+' : ''}{delta.saleExpensesDeltaPct}%
                  </td>
                </tr>

                {/* 3. Estimated Net Proceeds */}
                <tr className="hover:bg-[#07130d]/60 transition">
                  <td className="py-3 px-3 font-semibold text-cyan-300">शुद्ध प्राप्ति (Net Proceeds)</td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-400">
                    ₹{Number(baselineResults.netProceeds).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-cyan-200">
                    ₹{Number(scenarioResults.netProceeds).toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono font-bold ${
                      delta.netProceedsDelta >= 0 ? 'text-[#22c55e]' : 'text-rose-400'
                    }`}
                  >
                    {delta.netProceedsDelta >= 0 ? '+' : ''}₹{Number(delta.netProceedsDelta).toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono font-bold ${
                      delta.netProceedsDeltaPct >= 0 ? 'text-[#22c55e]' : 'text-rose-400'
                    }`}
                  >
                    {delta.netProceedsDeltaPct >= 0 ? '+' : ''}{delta.netProceedsDeltaPct}%
                  </td>
                </tr>

                {/* 4. Production Costs */}
                <tr className="hover:bg-[#07130d]/60 transition">
                  <td className="py-3 px-3 font-semibold text-stone-300">उत्पादन लागत (Production Cost)</td>
                  <td className="py-3 px-3 text-right font-mono text-stone-400">
                    ₹{Number(baselineInputs.productionCosts).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-stone-300">
                    ₹{Number(scenarioInputs.productionCosts).toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono font-bold ${
                      scenarioInputs.productionCosts <= baselineInputs.productionCosts ? 'text-[#22c55e]' : 'text-rose-400'
                    }`}
                  >
                    {scenarioInputs.productionCosts >= baselineInputs.productionCosts ? '+' : ''}₹
                    {Number(scenarioInputs.productionCosts - baselineInputs.productionCosts).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-stone-400">
                    {baselineInputs.productionCosts > 0
                      ? `${(((scenarioInputs.productionCosts - baselineInputs.productionCosts) / baselineInputs.productionCosts) * 100).toFixed(1)}%`
                      : '0%'}
                  </td>
                </tr>

                {/* 5. Estimated Crop Profit / Loss (HERO ROW) */}
                <tr className="bg-[#143021]/60 font-black text-sm">
                  <td className="py-3 px-3 text-[#22c55e] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>फसल शुद्ध मुनाफा (Crop Profit)</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-300">
                    ₹{Number(baselineResults.cropProfit).toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono text-base ${
                      scenarioResults.isProfitable ? 'text-[#22c55e]' : 'text-rose-400'
                    }`}
                  >
                    ₹{Number(scenarioResults.cropProfit).toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono ${
                      delta.cropProfitDelta >= 0 ? 'text-[#22c55e]' : 'text-rose-400'
                    }`}
                  >
                    {delta.cropProfitDelta >= 0 ? '+' : ''}₹{Number(delta.cropProfitDelta).toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono ${
                      delta.cropProfitDeltaPct >= 0 ? 'text-[#22c55e]' : 'text-rose-400'
                    }`}
                  >
                    {delta.cropProfitDeltaPct >= 0 ? '+' : ''}{delta.cropProfitDeltaPct}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Saved Scenarios Manager */}
      <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1b3d2b] pb-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <span>💾</span>
            <span>{lang === 'hi' ? 'सहेजे गए परिदृश्य (Saved Scenarios Library)' : 'Saved Scenarios Library'}</span>
          </h3>
          <span className="text-xs text-stone-400">{savedScenarios.length} Scenarios Saved</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {savedScenarios.map((scen) => (
            <div
              key={scen.id}
              className="bg-[#07130d] border border-[#1b3d2b] rounded-xl p-3 flex flex-col justify-between gap-2.5 hover:border-[#22c55e]/50 transition"
            >
              <div>
                {editingSavedId === scen.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editingNameText}
                      onChange={(e) => setEditingNameText(e.target.value)}
                      className="w-full bg-[#0d2117] border border-[#22c55e] rounded px-2 py-0.5 text-xs text-white"
                    />
                    <button
                      onClick={() => handleSaveRename(scen.id)}
                      className="p-1 bg-[#22c55e] text-[#07130d] rounded"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-white truncate">{scen.name}</span>
                    <button
                      onClick={() => handleStartRename(scen)}
                      className="p-1 text-stone-400 hover:text-white"
                      title="Rename scenario"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="text-[11px] text-stone-400 mt-1">
                  दर: ₹{scen.inputs.sellingPricePerUnit}/q • भाड़ा: ₹{scen.inputs.transportExpenses} • मात्रा:{' '}
                  {scen.inputs.quantitySold}q
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#143021]">
                <button
                  onClick={() => handleLoadSaved(scen)}
                  className="bg-[#143021] hover:bg-emerald-800 text-emerald-200 text-xs font-bold px-3 py-1 rounded-lg transition"
                >
                  लोड करें (Load)
                </button>
                <button
                  onClick={() => handleDeleteSaved(scen.id)}
                  className="p-1 text-stone-400 hover:text-rose-400"
                  title="Delete scenario"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WhatIfSimulator;
