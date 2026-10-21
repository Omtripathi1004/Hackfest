import React from 'react';

export const AGMARKNET_SNAPSHOT = {
  Potato: {
    nameHi: 'आलू (Potato)',
    unit: '₹/Quintal',
    seasonalAvg: 1620,
    seasonalMin: 1250,
    seasonalMax: 2100,
    mandis: [
      {
        id: 'barabanki',
        name: 'Barabanki Mandi',
        nameHi: 'बाराबंकी मंडी',
        district: 'Barabanki',
        distanceKm: 28,
        todayModal: 1860,
        prevModal: 1775,
        lastReportedDate: 'Today, 09:30 AM',
        arrivalsTonnes: 145,
        history7d: [1710, 1740, 1730, 1775, null, 1810, 1860],
      },
      {
        id: 'lucknow',
        name: 'Lucknow (Dubagga)',
        nameHi: 'लखनऊ (दुबग्गा) मंडी',
        district: 'Lucknow',
        distanceKm: 12,
        todayModal: 1790,
        prevModal: 1740,
        lastReportedDate: 'Today, 10:15 AM',
        arrivalsTonnes: 310,
        history7d: [1680, 1700, 1720, 1740, 1740, 1760, 1790],
      },
      {
        id: 'kanpur',
        name: 'Kanpur (Chakeri)',
        nameHi: 'कानपुर मंडी',
        district: 'Kanpur',
        distanceKm: 82,
        todayModal: 1900,
        prevModal: 1920,
        lastReportedDate: 'Today, 08:45 AM',
        arrivalsTonnes: 490,
        history7d: [1950, 1940, 1930, 1920, null, 1910, 1900],
      },
      {
        id: 'sitapur',
        name: 'Sitapur Mandi',
        nameHi: 'सीतापुर मंडी',
        district: 'Sitapur',
        distanceKm: 88,
        todayModal: null,
        prevModal: 1810,
        lastReportedDate: '2 days ago (No rate reported today)',
        arrivalsTonnes: 0,
        history7d: [1750, 1780, 1800, 1810, 1810, null, null],
      },
    ],
  },
  Wheat: {
    nameHi: 'गेहूं (Wheat)',
    unit: '₹/Quintal',
    seasonalAvg: 2350,
    seasonalMin: 2125,
    seasonalMax: 2650,
    mandis: [
      {
        id: 'lucknow_w',
        name: 'Lucknow (Naveen Galla)',
        nameHi: 'लखनऊ नवीन गल्ला मंडी',
        district: 'Lucknow',
        distanceKm: 14,
        todayModal: 2480,
        prevModal: 2420,
        lastReportedDate: 'Today, 10:00 AM',
        arrivalsTonnes: 210,
        history7d: [2390, 2400, 2410, 2420, null, 2450, 2480],
      },
      {
        id: 'hardoi_w',
        name: 'Hardoi Mandi',
        nameHi: 'हरदोई मंडी',
        district: 'Hardoi',
        distanceKm: 105,
        todayModal: 2530,
        prevModal: 2500,
        lastReportedDate: 'Today, 09:15 AM',
        arrivalsTonnes: 380,
        history7d: [2460, 2480, 2490, 2500, 2510, 2520, 2530],
      },
      {
        id: 'unnao_w',
        name: 'Unnao Mandi',
        nameHi: 'उन्नाव मंडी',
        district: 'Unnao',
        distanceKm: 58,
        todayModal: null,
        prevModal: 2440,
        lastReportedDate: 'Yesterday (No rate reported today)',
        arrivalsTonnes: 0,
        history7d: [2410, 2420, 2430, 2440, 2440, 2440, null],
      },
    ],
  },
  Mustard: {
    nameHi: 'सरसों (Mustard)',
    unit: '₹/Quintal',
    seasonalAvg: 5450,
    seasonalMin: 5000,
    seasonalMax: 6100,
    mandis: [
      {
        id: 'barabanki_m',
        name: 'Barabanki Mandi',
        nameHi: 'बाराबंकी मंडी',
        district: 'Barabanki',
        distanceKm: 28,
        todayModal: 5820,
        prevModal: 5690,
        lastReportedDate: 'Today, 10:05 AM',
        arrivalsTonnes: 85,
        history7d: [5600, 5620, 5650, 5690, null, 5760, 5820],
      },
      {
        id: 'lucknow_m',
        name: 'Lucknow Mandi',
        nameHi: 'लखनऊ मंडी',
        district: 'Lucknow',
        distanceKm: 12,
        todayModal: 5710,
        prevModal: 5730,
        lastReportedDate: 'Today, 09:40 AM',
        arrivalsTonnes: 120,
        history7d: [5750, 5740, 5730, 5730, 5720, 5715, 5710],
      },
    ],
  },
};

export const VEHICLES = [
  { id: 'loader', name: 'ई-रिक्शा / छोटा लोडर (10 Qtl)', ratePerKm: 14, defaultQtl: 10 },
  { id: 'pickup', name: 'पिकअप / छोटा हाथी (25 Qtl)', ratePerKm: 22, defaultQtl: 25 },
  { id: 'tractor', name: 'ट्रैक्टर ट्रॉली (45 Qtl)', ratePerKm: 30, defaultQtl: 45 },
];

export function Sparkline({ data }) {
  const validValues = data.filter((v) => v !== null);
  const min = Math.min(...validValues) - 20;
  const max = Math.max(...validValues) + 20;
  const days = ['सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'आज'];

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-7 gap-1.5 items-end h-16 pt-2 px-1">
        {data.map((val, i) => {
          if (val === null) {
            return (
              <div key={i} className="flex flex-col items-center justify-end h-full">
                <div
                  className="w-full h-8 border border-dashed border-amber-500 bg-amber-100/60 rounded flex items-center justify-center text-[9px] font-bold text-amber-900"
                  title="Mandi Closed / No Rate Reported (Not Interpolated)"
                >
                  बंद
                </div>
              </div>
            );
          }
          const heightPct = Math.max(20, Math.round(((val - min) / (max - min)) * 100));
          return (
            <div key={i} className="flex flex-col items-center justify-end h-full">
              <span className="text-[10px] font-bold text-stone-700 mb-0.5">₹{val}</span>
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t ${i === data.length - 1 ? 'bg-emerald-700' : 'bg-stone-400'
                  }`}
              />
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold text-stone-500">
        {days.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
    </div>
  );
}