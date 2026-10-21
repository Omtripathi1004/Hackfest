import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  PlusCircle,
  Trash2,
  Share2,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Percent,
  Layers,
  Truck,
  Receipt,
  Download,
} from 'lucide-react';
import { FALLBACK_SNAPSHOT } from '../../src/data/fallbackSnapshot';
import { calculateProfitAndLoss } from '../../src/utils/calculations';

export function ProfitLossCentre({
  financialInputs,
  setFinancialInputs,
  financialResults,
  selectedCropKey = 'wheat',
  setSelectedCropKey,
  activeMandi = null,
  onOpenWhatIf,
  onOpenChatWithFinance,
  lang = 'hi',
}) {
  // Batch recorded sales ledger
  const [recordedSales, setRecordedSales] = useState(() => {
    try {
      const saved = localStorage.getItem('bazarsetu_recorded_sales');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Initial sample lots
    return [
      {
        id: 'LOT-2026-01',
        date: '2026-10-18',
        crop: 'wheat',
        cropName: 'Wheat (Gehun)',
        quantitySold: 40,
        sellingPrice: 2460,
        grossRevenue: 98400,
        saleExpenses: 2800,
        netProceeds: 95600,
        productionCosts: 36000,
        cropProfit: 59600,
      },
      {
        id: 'LOT-2026-02',
        date: '2026-10-20',
        crop: 'potato',
        cropName: 'Potato (Aloo)',
        quantitySold: 60,
        sellingPrice: 1820,
        grossRevenue: 109200,
        saleExpenses: 4200,
        netProceeds: 105000,
        productionCosts: 48000,
        cropProfit: 57000,
      },
    ];
  });

  // Persist recorded sales
  useEffect(() => {
    try {
      localStorage.setItem('bazarsetu_recorded_sales', JSON.stringify(recordedSales));
    } catch (e) {}
  }, [recordedSales]);

  // Handle form field changes
  const handleInputChange = (field, value) => {
    const numVal = Math.max(0, parseFloat(value) || 0);
    setFinancialInputs((prev) => ({
      ...prev,
      [field]: numVal,
    }));
  };

  // Pre-fill button using active mandi
  const handlePreFillFromMandi = () => {
    if (!activeMandi) return;
    const modalRate = activeMandi.todayModal || 2475;
    const qty = financialInputs.quantitySold || 50;
    // Freight: distance * rate (₹0.95/km/qtl) * qty
    const estTransport = Math.round(activeMandi.distanceKm * 0.95 * qty);
    const estHammali = Math.round(18 * qty);

    setFinancialInputs((prev) => ({
      ...prev,
      crop: activeMandi.cropKey || selectedCropKey,
      sellingPricePerUnit: modalRate,
      transportExpenses: estTransport,
      loadingUnloading: estHammali,
    }));
  };

  // Record current calculation into sales ledger
  const handleRecordSale = () => {
    const newLot = {
      id: `LOT-${Date.now().toString().slice(-4)}`,
      date: '2026-10-21 (Today)',
      crop: financialInputs.crop,
      cropName: FALLBACK_SNAPSHOT[financialInputs.crop]?.name || 'Wheat',
      quantitySold: financialInputs.quantitySold,
      sellingPrice: financialInputs.sellingPricePerUnit,
      grossRevenue: financialResults.grossRevenue,
      saleExpenses: financialResults.saleRelatedExpenses,
      netProceeds: financialResults.netProceeds,
      productionCosts: financialInputs.productionCosts,
      cropProfit: financialResults.cropProfit,
    };

    setRecordedSales((prev) => [newLot, ...prev]);
  };

  const handleDeleteLot = (id) => {
    setRecordedSales((prev) => prev.filter((lot) => lot.id !== id));
  };

  // Cumulative totals across recorded sales
  const cumulativeStats = recordedSales.reduce(
    (acc, lot) => {
      acc.totalQtl += Number(lot.quantitySold) || 0;
      acc.totalGross += Number(lot.grossRevenue) || 0;
      acc.totalSaleExpenses += Number(lot.saleExpenses) || 0;
      acc.totalNetProceeds += Number(lot.netProceeds) || 0;
      acc.totalCropProfit += Number(lot.cropProfit) || 0;
      return acc;
    },
    { totalQtl: 0, totalGross: 0, totalSaleExpenses: 0, totalNetProceeds: 0, totalCropProfit: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Top Title & Subtitle */}
      <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span className="text-[#22c55e]">💰</span>
              <span>{lang === 'hi' ? 'लाभ एवं हानि केंद्र (Profit & Loss Centre)' : 'Profit & Loss Centre'}</span>
            </h2>
            <span className="bg-[#143021] text-[#22c55e] border border-[#22c55e]/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              Strict Mathematical Engine
            </span>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            {lang === 'hi'
              ? 'सकल राजस्व, मंडी बिक्री खर्च और फसल लागत की सटीक गणना। वास्तविक हाथ में आने वाली शुद्ध बचत।'
              : 'Deterministic agricultural trade accounting. Calculate Gross Revenue, Net Proceeds, and Net Crop Profit.'}
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeMandi && (
            <button
              onClick={handlePreFillFromMandi}
              className="bg-[#143021] hover:bg-emerald-900 text-emerald-200 border border-emerald-600/70 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
              title="Pre-fill price and transport from active mandi"
            >
              <Truck className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>
                {lang === 'hi' ? 'सक्रिय मंडी दर भरें' : 'Pre-fill Mandi Rate'} ({activeMandi.name.split(' ')[0]})
              </span>
            </button>
          )}

          <button
            onClick={() => onOpenWhatIf && onOpenWhatIf()}
            className="bg-[#22c55e] text-[#07130d] hover:bg-[#16a34a] text-xs font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,197,94,0.3)]"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'क्या-अगर सिम्युलेटर' : 'What-If Simulator'}</span>
          </button>
        </div>
      </div>

      {/* 5 Prominent Summary Cards (As explicitly requested in Step 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Recorded Sales */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-400">
            <span>{lang === 'hi' ? 'दर्ज बिक्री (Recorded Sales)' : 'Recorded Sales'}</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {recordedSales.length} <span className="text-xs font-medium text-stone-400">Lots</span>
          </div>
          <div className="text-[11px] text-stone-400">
            {lang === 'hi' ? 'कुल मात्रा:' : 'Total Qtl:'} <strong className="text-emerald-300">{cumulativeStats.totalQtl} Qtl</strong>
          </div>
        </div>

        {/* Card 2: Gross Proceeds (Gross Revenue = Quantity Sold × Selling Price) */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-400">
            <span>{lang === 'hi' ? 'सकल राजस्व (Gross Proceeds)' : 'Gross Proceeds'}</span>
            <DollarSign className="w-4 h-4 text-[#22c55e]" />
          </div>
          <div className="text-2xl font-black text-[#22c55e] font-mono">
            ₹{Number(financialResults.grossRevenue).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-stone-400">
            = {financialInputs.quantitySold} Qtl × ₹{financialInputs.sellingPricePerUnit}/Qtl
          </div>
        </div>

        {/* Card 3: Total Expenses (Sale Expenses + Production Costs) */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-400">
            <span>{lang === 'hi' ? 'कुल खर्च (Total Expenses)' : 'Total Expenses'}</span>
            <span className="text-rose-400 text-xs font-bold">
              ₹{Number(financialResults.totalExpenses).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            ₹{Number(financialResults.totalExpenses).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-stone-400 flex items-center justify-between">
            <span>बिक्री: ₹{Number(financialResults.saleRelatedExpenses).toLocaleString('en-IN')}</span>
            <span>लागत: ₹{Number(financialInputs.productionCosts).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 4: Estimated Net Proceeds (Gross Revenue - Sale-Related Expenses) */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-400">
            <span>{lang === 'hi' ? 'शुद्ध प्राप्ति (Net Proceeds)' : 'Net Proceeds'}</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            ₹{Number(financialResults.netProceeds).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-stone-400">
            {lang === 'hi' ? 'भाड़ा व हम्माली काटकर' : 'Gross - Sale Expenses'}
          </div>
        </div>

        {/* Card 5: Estimated Crop Profit/Loss (Net Proceeds - Production Costs) */}
        <div
          className={`border rounded-2xl p-3.5 space-y-1 ${
            financialResults.isProfitable
              ? 'bg-[#0f2d1e] border-[#22c55e]/60 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
              : 'bg-rose-950/50 border-rose-600/70'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className={financialResults.isProfitable ? 'text-emerald-200' : 'text-rose-200'}>
              {lang === 'hi' ? 'फसल शुद्ध लाभ (Crop Profit)' : 'Crop Profit / Loss'}
            </span>
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                financialResults.isProfitable
                  ? 'bg-[#22c55e] text-[#07130d]'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {financialResults.profitMarginPct}% Margin
            </span>
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              financialResults.isProfitable ? 'text-[#22c55e]' : 'text-rose-400'
            }`}
          >
            {financialResults.cropProfit >= 0 ? '+' : ''}₹{Number(financialResults.cropProfit).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-stone-300 font-semibold">
            {financialResults.isProfitable
              ? `शुद्ध लाभ: ₹${financialResults.cropProfitPerUnit}/Qtl`
              : `प्रति क्विंटल हानि: ₹${Math.abs(financialResults.cropProfitPerUnit)}/Qtl`}
          </div>
        </div>
      </div>

      {/* Main Form Fields & Accounting Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Form: All Input Fields (7 columns) */}
        <div className="lg:col-span-7 bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#1b3d2b] pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>📝</span>
              <span>{lang === 'hi' ? 'बिक्री व लागत प्रविष्टि (Transaction Inputs)' : 'Transaction & Cost Inputs'}</span>
            </h3>
            <span className="text-[11px] text-stone-400">
              {lang === 'hi' ? 'संख्या दर्ज करें, गणना तुरंत होगी' : 'Reactive instant calculation'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Field 1: Crop */}
            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                1. {lang === 'hi' ? 'फसल (Crop)' : 'Crop Selected'}
              </label>
              <select
                value={financialInputs.crop}
                onChange={(e) => {
                  const newCrop = e.target.value;
                  const cData = FALLBACK_SNAPSHOT[newCrop];
                  setFinancialInputs((prev) => ({
                    ...prev,
                    crop: newCrop,
                    sellingPricePerUnit: cData?.mandis[0]?.todayModal || prev.sellingPricePerUnit,
                  }));
                  if (setSelectedCropKey) setSelectedCropKey(newCrop);
                }}
                className="w-full bg-[#07130d] border border-[#1b3d2b] rounded-xl px-3 py-2 text-xs font-bold text-emerald-300 focus:outline-none focus:border-[#22c55e]"
              >
                {Object.keys(FALLBACK_SNAPSHOT).map((k) => (
                  <option key={k} value={k}>
                    {lang === 'hi' ? FALLBACK_SNAPSHOT[k].nameHi : FALLBACK_SNAPSHOT[k].name}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 2: Quantity Sold */}
            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                2. {lang === 'hi' ? 'बेची गई मात्रा (Quantity Sold - Qtl)' : 'Quantity Sold (Quintals)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  value={financialInputs.quantitySold}
                  onChange={(e) => handleInputChange('quantitySold', e.target.value)}
                  className="w-full bg-[#07130d] border border-[#1b3d2b] rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#22c55e]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-stone-400 font-bold">Qtl</span>
              </div>
            </div>

            {/* Field 3: Selling Price */}
            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                3. {lang === 'hi' ? 'बिक्री दर (Selling Price Per Unit - ₹/Qtl)' : 'Selling Price Per Unit (₹/Qtl)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  max="50000"
                  step="10"
                  value={financialInputs.sellingPricePerUnit}
                  onChange={(e) => handleInputChange('sellingPricePerUnit', e.target.value)}
                  className="w-full bg-[#07130d] border border-[#1b3d2b] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#22c55e] focus:outline-none focus:border-[#22c55e]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-stone-400 font-bold">₹/Qtl</span>
              </div>
            </div>

            {/* Field 4: Transport Expenses */}
            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                4. {lang === 'hi' ? 'भाड़ा खर्च (Transport Expenses - ₹)' : 'Transport Expenses (₹)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="200000"
                  step="50"
                  value={financialInputs.transportExpenses}
                  onChange={(e) => handleInputChange('transportExpenses', e.target.value)}
                  className="w-full bg-[#07130d] border border-[#1b3d2b] rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-200 focus:outline-none focus:border-[#22c55e]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-stone-400 font-bold">₹</span>
              </div>
            </div>

            {/* Field 5: Loading/Unloading (Hammali) */}
            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                5. {lang === 'hi' ? 'पल्लेदारी / हम्माली (Loading/Unloading - ₹)' : 'Loading/Unloading (Hammali - ₹)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="50000"
                  step="50"
                  value={financialInputs.loadingUnloading}
                  onChange={(e) => handleInputChange('loadingUnloading', e.target.value)}
                  className="w-full bg-[#07130d] border border-[#1b3d2b] rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-200 focus:outline-none focus:border-[#22c55e]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-stone-400 font-bold">₹</span>
              </div>
            </div>

            {/* Field 6: Commissions */}
            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                6. {lang === 'hi' ? 'दलाली / आढ़त (Commissions - ₹)' : 'Mandi Commissions / Fees (₹)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="50000"
                  step="50"
                  value={financialInputs.commissions}
                  onChange={(e) => handleInputChange('commissions', e.target.value)}
                  className="w-full bg-[#07130d] border border-[#1b3d2b] rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-200 focus:outline-none focus:border-[#22c55e]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-stone-400 font-bold">₹</span>
              </div>
            </div>

            {/* Field 7: Other Sale Expenses */}
            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                7. {lang === 'hi' ? 'अन्य बिक्री खर्च (टोल, बोरी आदि - ₹)' : 'Other Sale Expenses (Toll/Bags - ₹)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="50000"
                  step="50"
                  value={financialInputs.otherSaleExpenses}
                  onChange={(e) => handleInputChange('otherSaleExpenses', e.target.value)}
                  className="w-full bg-[#07130d] border border-[#1b3d2b] rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-200 focus:outline-none focus:border-[#22c55e]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-stone-400 font-bold">₹</span>
              </div>
            </div>

            {/* Field 8: Production Costs */}
            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                8. {lang === 'hi' ? 'कुल उत्पादन लागत (Production Costs - ₹)' : 'Crop Production Costs (₹)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="500000"
                  step="500"
                  value={financialInputs.productionCosts}
                  onChange={(e) => handleInputChange('productionCosts', e.target.value)}
                  className="w-full bg-[#07130d] border border-[#1b3d2b] rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-[#22c55e]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-stone-400 font-bold">₹</span>
              </div>
              <span className="text-[9px] text-stone-500 mt-0.5 block">बीज, खाद, सिंचाई, जुताई व कटाई लागत</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#1b3d2b]">
            <button
              onClick={handleRecordSale}
              className="bg-[#22c55e] text-[#07130d] hover:bg-[#16a34a] text-xs font-black px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,197,94,0.3)]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{lang === 'hi' ? 'यह बिक्री लॉट दर्ज करें (Record Sale)' : 'Record This Sale Lot'}</span>
            </button>

            <button
              onClick={() => onOpenChatWithFinance && onOpenChatWithFinance(financialResults)}
              className="bg-[#143021] border border-[#22c55e]/50 text-emerald-200 hover:bg-emerald-900 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>{lang === 'hi' ? 'Gemini से सलाह लें' : 'Analyze with Gemini AI'}</span>
            </button>
          </div>
        </div>

        {/* Right Area: Waterfall Breakdown & Formula Proof (5 columns) */}
        <div className="lg:col-span-5 bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#1b3d2b] pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>📊</span>
              <span>{lang === 'hi' ? 'सटीक सूत्र व जलप्रपात (Formula Proof)' : 'Mathematical Step-by-Step Proof'}</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-[#07130d] px-2 py-0.5 rounded border border-[#1b3d2b]">
              Deterministic
            </span>
          </div>

          {/* Formula 1: Gross Revenue */}
          <div className="bg-[#07130d] border border-[#1b3d2b] rounded-xl p-3 space-y-1">
            <div className="text-[11px] font-bold text-stone-400">
              चरण 1: सकल राजस्व (Gross Revenue)
            </div>
            <div className="text-[11px] text-stone-300 font-mono">
              = {financialInputs.quantitySold} Qtl × ₹{financialInputs.sellingPricePerUnit}
            </div>
            <div className="text-base font-black text-[#22c55e] font-mono">
              ₹{Number(financialResults.grossRevenue).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Formula 2: Sale-Related Expenses */}
          <div className="bg-[#07130d] border border-[#1b3d2b] rounded-xl p-3 space-y-1">
            <div className="text-[11px] font-bold text-stone-400">
              चरण 2: बिक्री खर्च (Sale-Related Expenses)
            </div>
            <div className="text-[10px] text-stone-400 font-mono">
              भाड़ा (₹{financialInputs.transportExpenses}) + हम्माली (₹{financialInputs.loadingUnloading}) + आढ़त (₹{financialInputs.commissions}) + अन्य (₹{financialInputs.otherSaleExpenses})
            </div>
            <div className="text-base font-black text-rose-400 font-mono">
              - ₹{Number(financialResults.saleRelatedExpenses).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Formula 3: Estimated Net Proceeds */}
          <div className="bg-[#07130d] border border-cyan-800/40 rounded-xl p-3 space-y-1">
            <div className="text-[11px] font-bold text-cyan-300">
              चरण 3: शुद्ध प्राप्त राशि (Estimated Net Proceeds)
            </div>
            <div className="text-[10px] text-stone-400 font-mono">
              = सकल राजस्व (₹{financialResults.grossRevenue}) - बिक्री खर्च (₹{financialResults.saleRelatedExpenses})
            </div>
            <div className="text-lg font-black text-cyan-300 font-mono">
              ₹{Number(financialResults.netProceeds).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Formula 4: Estimated Crop Profit */}
          <div className="bg-[#07130d] border border-emerald-800/60 rounded-xl p-3 space-y-1">
            <div className="text-[11px] font-bold text-emerald-300">
              चरण 4: फसल शुद्ध मुनाफा (Estimated Crop Profit)
            </div>
            <div className="text-[10px] text-stone-400 font-mono">
              = शुद्ध प्राप्ति (₹{financialResults.netProceeds}) - उत्पादन लागत (₹{financialInputs.productionCosts})
            </div>
            <div
              className={`text-xl font-black font-mono ${
                financialResults.isProfitable ? 'text-[#22c55e]' : 'text-rose-400'
              }`}
            >
              {financialResults.cropProfit >= 0 ? '+' : ''}₹{Number(financialResults.cropProfit).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Recorded Sales Batch Ledger Table */}
      <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b3d2b] pb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>📋</span>
              <span>{lang === 'hi' ? 'दर्ज बिक्री बहीखाता (Recorded Sales Ledger)' : 'Recorded Sales Ledger'}</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {lang === 'hi'
                ? 'अपने सभी मंडियों के पिछले और वर्तमान लॉट का संचयी रिकॉर्ड देखें।'
                : 'Batch ledger of recorded sales across crops and mandis with cumulative profit tracking.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-300 bg-[#07130d] px-3 py-1 rounded-xl border border-[#1b3d2b]">
              कुल संचयी मुनाफा: ₹{Number(cumulativeStats.totalCropProfit).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Table of Lots */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1b3d2b] text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">लॉट आईडी / दिनांक</th>
                <th className="py-2.5 px-3">फसल</th>
                <th className="py-2.5 px-3 text-right">मात्रा</th>
                <th className="py-2.5 px-3 text-right">बिक्री दर</th>
                <th className="py-2.5 px-3 text-right">सकल राजस्व</th>
                <th className="py-2.5 px-3 text-right">बिक्री खर्च</th>
                <th className="py-2.5 px-3 text-right">शुद्ध प्राप्ति</th>
                <th className="py-2.5 px-3 text-right">शुद्ध मुनाफा</th>
                <th className="py-2.5 px-3 text-center">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#143021]">
              {recordedSales.map((lot) => (
                <tr key={lot.id} className="hover:bg-[#07130d]/80 transition">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white font-mono">{lot.id}</div>
                    <div className="text-[10px] text-stone-400">{lot.date}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-emerald-300">{lot.cropName}</td>
                  <td className="py-3 px-3 text-right font-mono">{lot.quantitySold} Qtl</td>
                  <td className="py-3 px-3 text-right font-mono">₹{lot.sellingPrice}</td>
                  <td className="py-3 px-3 text-right font-mono text-[#22c55e] font-bold">
                    ₹{Number(lot.grossRevenue).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-400">
                    -₹{Number(lot.saleExpenses).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-300">
                    ₹{Number(lot.netProceeds).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#22c55e]">
                    +₹{Number(lot.cropProfit).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleDeleteLot(lot.id)}
                      className="p-1 text-stone-400 hover:text-rose-400 transition"
                      title="Delete lot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProfitLossCentre;
