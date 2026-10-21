import { MandiRecord } from '../data/fallbackSnapshot';

export interface EvaluatedMandi extends MandiRecord {
  transportCostPerQtl: number;
  hammaliCostPerQtl: number;
  totalDeductionPerQtl: number;
  netReturnPerQtl: number | null;
  totalPayout: number | null;
  priceDiff: number | null;
  priceDirection: 'UP' | 'DOWN' | 'FLAT' | 'NONE';
  statusBadge: string;
  isBestNetProfit: boolean;
  isTransportTrap: boolean;
  trapWarning?: string;
  daysOld: number;
}

export function evaluateMandiList(
  mandis: MandiRecord[],
  quantityQtl: number,
  ratePerKmPerQtl: number = 0.95,
  hammaliPerQtl: number = 18.0,
  referenceDateStr: string = '2026-10-21'
): {
  evaluated: EvaluatedMandi[];
  bestMandi: EvaluatedMandi | null;
  trapMandi: EvaluatedMandi | null;
} {
  const refDate = new Date(referenceDateStr).getTime();

  const evaluated: EvaluatedMandi[] = mandis.map((m) => {
    const transportCost = Number((m.distanceKm * ratePerKmPerQtl).toFixed(2));
    const totalDeduction = Number((transportCost + hammaliPerQtl).toFixed(2));

    // Calculate observation freshness
    const obsDateMatch = m.lastReportedDate.match(/(\d{4}-\d{2}-\d{2})/);
    const obsDateStr = obsDateMatch ? obsDateMatch[1] : '2026-10-21';
    const obsDate = new Date(obsDateStr).getTime();
    const daysOld = Math.max(0, Math.round((refDate - obsDate) / (1000 * 60 * 60 * 24)));

    let statusBadge = 'RECENT REPORT AVAILABLE (0d)';
    if (m.todayModal === null) {
      if (daysOld >= 2) {
        statusBadge = `LAST OBSERVATION IS OUTDATED (${daysOld}d OLD)`;
      } else {
        statusBadge = 'NO RATE REPORTED';
      }
    } else if (daysOld === 1) {
      statusBadge = 'RECENT REPORT AVAILABLE (1d)';
    } else if (daysOld >= 2) {
      statusBadge = `LAST OBSERVATION IS OUTDATED (${daysOld}d OLD)`;
    }

    const nonNullCount = m.history7d.filter((v) => v !== null).length;
    if (nonNullCount < 3 && statusBadge.startsWith('RECENT')) {
      statusBadge = 'INSUFFICIENT DATA (<3 observations)';
    }

    let netReturn: number | null = null;
    let totalPayout: number | null = null;
    let priceDiff: number | null = null;
    let priceDirection: 'UP' | 'DOWN' | 'FLAT' | 'NONE' = 'NONE';

    if (m.todayModal !== null && daysOld <= 1) {
      netReturn = Number((m.todayModal - totalDeduction).toFixed(2));
      totalPayout = Number((netReturn * quantityQtl).toFixed(2));

      if (m.prevModal !== null) {
        priceDiff = m.todayModal - m.prevModal;
        if (priceDiff > 0) priceDirection = 'UP';
        else if (priceDiff < 0) priceDirection = 'DOWN';
        else priceDirection = 'FLAT';
      }
    }

    return {
      ...m,
      transportCostPerQtl: transportCost,
      hammaliCostPerQtl: hammaliPerQtl,
      totalDeductionPerQtl: totalDeduction,
      netReturnPerQtl: netReturn,
      totalPayout: totalPayout,
      priceDiff,
      priceDirection,
      statusBadge,
      isBestNetProfit: false,
      isTransportTrap: false,
      daysOld,
    };
  });

  // Find best mandi by net return
  const eligible = evaluated.filter((m) => m.netReturnPerQtl !== null);
  eligible.sort((a, b) => (b.netReturnPerQtl ?? 0) - (a.netReturnPerQtl ?? 0));

  let bestMandi: EvaluatedMandi | null = null;
  if (eligible.length > 0) {
    bestMandi = eligible[0];
    bestMandi.isBestNetProfit = true;
  }

  // Detect Transport Trap
  let trapMandi: EvaluatedMandi | null = null;
  if (bestMandi && bestMandi.todayModal) {
    for (const m of eligible) {
      if (
        m.todayModal !== null &&
        m.netReturnPerQtl !== null &&
        m.todayModal > bestMandi.todayModal &&
        m.netReturnPerQtl < bestMandi.netReturnPerQtl
      ) {
        m.isTransportTrap = true;
        const diffGross = m.todayModal - bestMandi.todayModal;
        const diffNet = Number((bestMandi.netReturnPerQtl - m.netReturnPerQtl).toFixed(2));
        m.trapWarning = `TRANSPORT TRAP: Gross rate is +₹${diffGross}/q higher, but distance (${m.distanceKm} km) eats ₹${m.transportCostPerQtl}/q in freight, leaving you ₹${diffNet}/q POORER than ${bestMandi.name}!`;
        if (!trapMandi) trapMandi = m;
      }
    }
  }

  // Sort: Best net return first, then active, then stale
  evaluated.sort((a, b) => {
    if (a.netReturnPerQtl !== null && b.netReturnPerQtl !== null) {
      return b.netReturnPerQtl - a.netReturnPerQtl;
    }
    if (a.netReturnPerQtl !== null) return -1;
    if (b.netReturnPerQtl !== null) return 1;
    return a.daysOld - b.daysOld;
  });

  return { evaluated, bestMandi, trapMandi };
}

export interface WhatIfParams {
  baseModalPrice: number;
  priceShiftPercent: number; // -10 to +10
  distanceKm: number;
  ratePerKmPerQtl: number;
  hammaliPerQtl: number;
  moisturePercent: number; // 0 to 15% deduction
  quantityQtl: number;
}

export function calculateWhatIf(params: WhatIfParams) {
  const adjustedPrice = params.baseModalPrice * (1 + params.priceShiftPercent / 100);
  const moistureFactor = 1 - params.moisturePercent / 100;
  const effectivePriceAfterMoisture = adjustedPrice * moistureFactor;
  const transportCost = params.distanceKm * params.ratePerKmPerQtl;
  const totalDeduction = transportCost + params.hammaliPerQtl;

  const netReturnPerQtl = Number((effectivePriceAfterMoisture - totalDeduction).toFixed(2));
  const totalPayout = Number((netReturnPerQtl * params.quantityQtl).toFixed(2));

  // Break-even price required at a distant mandi (e.g. 80km) to match local (12km)
  const localDeduction = 12 * params.ratePerKmPerQtl + params.hammaliPerQtl;
  const localNetTarget = params.baseModalPrice - localDeduction;
  const distantTransport = params.distanceKm * params.ratePerKmPerQtl;
  const requiredBreakEvenAtDistant = Number((localNetTarget + distantTransport + params.hammaliPerQtl).toFixed(2));

  return {
    adjustedPrice: Math.round(adjustedPrice),
    effectivePriceAfterMoisture: Math.round(effectivePriceAfterMoisture),
    transportCost: Number(transportCost.toFixed(2)),
    totalDeduction: Number(totalDeduction.toFixed(2)),
    netReturnPerQtl,
    totalPayout,
    requiredBreakEvenAtDistant,
  };
}

// ============================================================================
// DEDICATED PROFIT & LOSS CENTRE AND WHAT-IF FINANCIAL ENGINE
// Strict formulas:
// Gross Revenue = Quantity Sold × Selling Price Per Unit
// Sale-Related Expenses = Transport Expenses + Loading/Unloading + Commissions + Other Sale Expenses
// Estimated Net Proceeds = Gross Revenue - Sale-Related Expenses
// Estimated Crop Profit = Estimated Net Proceeds - Production Costs
// ============================================================================

export interface FinancialInputs {
  crop: string;
  quantitySold: number;
  sellingPricePerUnit: number;
  transportExpenses: number;
  loadingUnloading: number;
  commissions: number;
  otherSaleExpenses: number;
  productionCosts: number;
}

export interface FinancialResults {
  grossRevenue: number;
  saleRelatedExpenses: number;
  totalExpenses: number;
  netProceeds: number;
  cropProfit: number;
  profitMarginPct: number;
  isProfitable: boolean;
  revenuePerUnit: number;
  saleExpensesPerUnit: number;
  netProceedsPerUnit: number;
  productionCostPerUnit: number;
  cropProfitPerUnit: number;
}

export function calculateProfitAndLoss(inputs: FinancialInputs): FinancialResults {
  const qty = Math.max(0, Number(inputs.quantitySold) || 0);
  const price = Math.max(0, Number(inputs.sellingPricePerUnit) || 0);
  const transport = Math.max(0, Number(inputs.transportExpenses) || 0);
  const loading = Math.max(0, Number(inputs.loadingUnloading) || 0);
  const comm = Math.max(0, Number(inputs.commissions) || 0);
  const other = Math.max(0, Number(inputs.otherSaleExpenses) || 0);
  const prodCost = Math.max(0, Number(inputs.productionCosts) || 0);

  // Exact formulas:
  // 1. Gross Revenue = Quantity Sold × Selling Price Per Unit
  const grossRevenue = Number((qty * price).toFixed(2));

  // 2. Sale-Related Expenses = Transport + Loading/Unloading + Commissions + Other Sale Expenses
  const saleRelatedExpenses = Number((transport + loading + comm + other).toFixed(2));

  // 3. Estimated Net Proceeds = Gross Revenue - Sale-Related Expenses
  const netProceeds = Number((grossRevenue - saleRelatedExpenses).toFixed(2));

  // 4. Estimated Crop Profit = Estimated Net Proceeds - Production Costs
  const cropProfit = Number((netProceeds - prodCost).toFixed(2));

  const totalExpenses = Number((saleRelatedExpenses + prodCost).toFixed(2));
  const profitMarginPct = grossRevenue > 0 ? Number(((cropProfit / grossRevenue) * 100).toFixed(2)) : 0;
  const isProfitable = cropProfit >= 0;

  return {
    grossRevenue,
    saleRelatedExpenses,
    totalExpenses,
    netProceeds,
    cropProfit,
    profitMarginPct,
    isProfitable,
    revenuePerUnit: qty > 0 ? Number((grossRevenue / qty).toFixed(2)) : 0,
    saleExpensesPerUnit: qty > 0 ? Number((saleRelatedExpenses / qty).toFixed(2)) : 0,
    netProceedsPerUnit: qty > 0 ? Number((netProceeds / qty).toFixed(2)) : 0,
    productionCostPerUnit: qty > 0 ? Number((prodCost / qty).toFixed(2)) : 0,
    cropProfitPerUnit: qty > 0 ? Number((cropProfit / qty).toFixed(2)) : 0,
  };
}

export interface ScenarioDelta {
  baseline: FinancialResults;
  scenario: FinancialResults;
  grossRevenueDelta: number;
  grossRevenueDeltaPct: number;
  saleExpensesDelta: number;
  saleExpensesDeltaPct: number;
  netProceedsDelta: number;
  netProceedsDeltaPct: number;
  cropProfitDelta: number;
  cropProfitDeltaPct: number;
}

export function calculateScenarioDelta(baseline: FinancialInputs, scenario: FinancialInputs): ScenarioDelta {
  const baseRes = calculateProfitAndLoss(baseline);
  const scenRes = calculateProfitAndLoss(scenario);

  const calcPct = (diff: number, base: number) => {
    if (base === 0) return diff === 0 ? 0 : diff > 0 ? 100 : -100;
    return Number(((diff / Math.abs(base)) * 100).toFixed(2));
  };

  const grossRevenueDelta = Number((scenRes.grossRevenue - baseRes.grossRevenue).toFixed(2));
  const saleExpensesDelta = Number((scenRes.saleRelatedExpenses - baseRes.saleRelatedExpenses).toFixed(2));
  const netProceedsDelta = Number((scenRes.netProceeds - baseRes.netProceeds).toFixed(2));
  const cropProfitDelta = Number((scenRes.cropProfit - baseRes.cropProfit).toFixed(2));

  return {
    baseline: baseRes,
    scenario: scenRes,
    grossRevenueDelta,
    grossRevenueDeltaPct: calcPct(grossRevenueDelta, baseRes.grossRevenue),
    saleExpensesDelta,
    saleExpensesDeltaPct: calcPct(saleExpensesDelta, baseRes.saleRelatedExpenses),
    netProceedsDelta,
    netProceedsDeltaPct: calcPct(netProceedsDelta, baseRes.netProceeds),
    cropProfitDelta,
    cropProfitDeltaPct: calcPct(cropProfitDelta, baseRes.cropProfit),
  };
}
