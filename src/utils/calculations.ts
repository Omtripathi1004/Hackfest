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
