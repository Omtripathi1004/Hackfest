import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Truck, ShieldAlert, ArrowUpDown, Info } from 'lucide-react';
import { CropSnapshot, FALLBACK_SNAPSHOT, VEHICLE_PRESETS } from '../data/fallbackSnapshot';
import { evaluateMandiList } from '../utils/calculations';

interface ProfitRadarProps {
  selectedCropKey: string;
  setSelectedCropKey: (key: string) => void;
  lang: 'hi' | 'en';
}

export const ProfitRadar: React.FC<ProfitRadarProps> = ({
  selectedCropKey,
  setSelectedCropKey,
  lang,
}) => {
  const crop: CropSnapshot = FALLBACK_SNAPSHOT[selectedCropKey] || FALLBACK_SNAPSHOT.wheat;

  const [quantityQtl, setQuantityQtl] = useState<number>(25);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('tractor');
  const [hammaliPerQtl, setHammaliPerQtl] = useState<number>(18);
  const [sortField, setSortField] = useState<'netReturn' | 'distance' | 'grossPrice'>('netReturn');

  const selectedVehicle = VEHICLE_PRESETS.find((v) => v.id === selectedVehicleId) || VEHICLE_PRESETS[0];

  const { evaluated, bestMandi, trapMandi } = evaluateMandiList(
    crop.mandis,
    quantityQtl,
    selectedVehicle.ratePerKmPerQtl,
    hammaliPerQtl
  );

  // Sorting
  const sortedEvaluations = [...evaluated].sort((a, b) => {
    if (sortField === 'netReturn') {
      return (b.netReturnPerQtl ?? -999) - (a.netReturnPerQtl ?? -999);
    }
    if (sortField === 'distance') {
      return a.distanceKm - b.distanceKm;
    }
    if (sortField === 'grossPrice') {
      return (b.todayModal ?? -999) - (a.todayModal ?? -999);
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>📡</span>
              <span>{lang === 'hi' ? 'मंडी मुनाफा तुलना (Profit Radar)' : 'Mandi Profit Radar'}</span>
            </h2>
            <p className="text-xs text-stone-300 mt-1">
              {lang === 'hi'
                ? 'भाड़ा व हम्माली खर्च काटकर सही शुद्ध मुनाफा जानें। सावधान: अधिक भाव वाली दूर की मंडी नुकसान करा सकती है!'
                : 'Compare net in-pocket earnings after freight and unloading fees. Detect transport traps where higher gross price yields lower net profit.'}
            </p>
          </div>

          {/* Crop Selector */}
          <select
            value={selectedCropKey}
            onChange={(e) => setSelectedCropKey(e.target.value)}
            className="bg-[#07130d] border border-[#1b3d2b] text-emerald-300 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
          >
            {Object.keys(FALLBACK_SNAPSHOT).map((k) => (
              <option key={k} value={k}>
                {lang === 'hi' ? FALLBACK_SNAPSHOT[k].nameHi : FALLBACK_SNAPSHOT[k].name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quantity Slider (1-150 Qtl) */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-stone-300">
              {lang === 'hi' ? '1. माल की मात्रा:' : '1. Quantity:'}
            </span>
            <span className="text-[#22c55e] font-mono text-base">{quantityQtl} क्विंटल</span>
          </div>
          <input
            type="range"
            min="1"
            max="150"
            value={quantityQtl}
            onChange={(e) => setQuantityQtl(Number(e.target.value))}
            className="w-full accent-[#22c55e] bg-[#07130d] h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-stone-500 font-mono">
            <span>1 Qtl</span>
            <span>75 Qtl</span>
            <span>150 Qtl</span>
          </div>
        </div>

        {/* Vehicle Preset Selector */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-4 space-y-2">
          <div className="text-xs font-bold text-stone-300">
            {lang === 'hi' ? '2. वाहन प्रकार (Vehicle Preset):' : '2. Vehicle Preset:'}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {VEHICLE_PRESETS.map((v) => {
              const isSel = v.id === selectedVehicleId;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    isSel
                      ? 'bg-[#1b3d2b] border-[#22c55e] text-[#22c55e]'
                      : 'bg-[#07130d] border-[#143021] text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <div className="text-lg">{v.icon}</div>
                  <div className="text-[10px] font-bold leading-tight mt-0.5">{v.name.split(' ')[0]}</div>
                  <div className="text-[9px] text-stone-500 font-mono">₹{v.ratePerKmPerQtl}/km/q</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hammali Fee Slider */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-stone-300">
              {lang === 'hi' ? '3. हम्माली व तुलाई खर्च:' : '3. Mandi Hammali Fee:'}
            </span>
            <span className="text-amber-400 font-mono text-base">₹{hammaliPerQtl} / Qtl</span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={hammaliPerQtl}
            onChange={(e) => setHammaliPerQtl(Number(e.target.value))}
            className="w-full accent-amber-400 bg-[#07130d] h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-stone-500 font-mono">
            <span>₹0 (छूट)</span>
            <span>₹18 (मानक)</span>
            <span>₹40</span>
          </div>
        </div>
      </div>

      {/* TRANSPORT TRAP BANNER (IF DETECTED) */}
      {trapMandi && (
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 border-2 border-[#f59e0b] rounded-2xl p-4 text-amber-200 shadow-xl flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-[#f59e0b] shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <div className="text-xs font-black uppercase tracking-wider text-[#f59e0b] flex items-center gap-2">
              <span>⚠️ भाड़ा जाल चेतावनी (TRANSPORT TRAP DETECTED)</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-amber-100">
              {trapMandi.trapWarning}
            </p>
          </div>
        </div>
      )}

      {/* Sort Bar */}
      <div className="flex items-center justify-between text-xs font-bold text-stone-400 px-1">
        <div>
          {lang === 'hi' ? 'तुलनात्मक तालिका' : 'Comparative Table'} ({sortedEvaluations.length} मंडियां)
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'क्रमबद्ध करें:' : 'Sort By:'}</span>
          <button
            onClick={() => setSortField('netReturn')}
            className={`px-2.5 py-1 rounded-md text-[11px] border ${
              sortField === 'netReturn'
                ? 'bg-[#22c55e] text-[#07130d] border-[#22c55e]'
                : 'bg-[#0d2117] border-[#1b3d2b] text-stone-300'
            }`}
          >
            {lang === 'hi' ? 'शुद्ध मुनाफा' : 'Net Return'}
          </button>
          <button
            onClick={() => setSortField('grossPrice')}
            className={`px-2.5 py-1 rounded-md text-[11px] border ${
              sortField === 'grossPrice'
                ? 'bg-[#22c55e] text-[#07130d] border-[#22c55e]'
                : 'bg-[#0d2117] border-[#1b3d2b] text-stone-300'
            }`}
          >
            {lang === 'hi' ? 'मंडी भाव' : 'Gross Price'}
          </button>
          <button
            onClick={() => setSortField('distance')}
            className={`px-2.5 py-1 rounded-md text-[11px] border ${
              sortField === 'distance'
                ? 'bg-[#22c55e] text-[#07130d] border-[#22c55e]'
                : 'bg-[#0d2117] border-[#1b3d2b] text-stone-300'
            }`}
          >
            {lang === 'hi' ? 'दूरी' : 'Distance'}
          </button>
        </div>
      </div>

      {/* COMPARISON TABLE */}
      <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#07130d] border-b border-[#1b3d2b] text-stone-400 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3.5 px-4">मंडी (Market)</th>
                <th className="py-3.5 px-4 text-center">दूरी (Km)</th>
                <th className="py-3.5 px-4 text-right">सरकारी भाव (Gross)</th>
                <th className="py-3.5 px-4 text-right">भाड़ा खर्च/Qtl</th>
                <th className="py-3.5 px-4 text-right">हम्माली/Qtl</th>
                <th className="py-3.5 px-4 text-right text-emerald-400 font-black">शुद्ध हाथ में (Net Return)</th>
                <th className="py-3.5 px-4 text-right">कुल भुगतान ({quantityQtl} Qtl)</th>
                <th className="py-3.5 px-4 text-center">स्थिति / स्टेटस</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#143021]">
              {sortedEvaluations.map((m) => {
                const isBest = bestMandi && bestMandi.id === m.id;
                const isTrap = m.isTransportTrap;
                const isNull = m.todayModal === null;

                return (
                  <tr
                    key={m.id}
                    className={`transition-colors ${
                      isBest
                        ? 'bg-emerald-950/40 font-semibold'
                        : isTrap
                        ? 'bg-amber-950/30'
                        : isNull
                        ? 'opacity-60 bg-[#07130d]/50'
                        : 'hover:bg-[#12281b]'
                    }`}
                  >
                    {/* Mandi Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-100 flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {isBest && (
                          <span className="bg-[#22c55e] text-[#07130d] text-[9px] font-black px-1.5 py-0.5 rounded">
                            BEST NET
                          </span>
                        )}
                        {isTrap && (
                          <span className="bg-[#f59e0b] text-[#07130d] text-[9px] font-black px-1.5 py-0.5 rounded">
                            TRAP
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {m.nameHi} • {m.district} ({m.stateCode})
                      </div>
                    </td>

                    {/* Distance */}
                    <td className="py-3.5 px-4 text-center font-mono text-stone-300">
                      {m.distanceKm} km
                    </td>

                    {/* Gross Modal Price */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {m.todayModal !== null ? (
                        <span className="text-stone-100">₹{m.todayModal}</span>
                      ) : (
                        <span className="text-[#ef4444] text-[10px] font-bold">उपलब्ध नहीं</span>
                      )}
                    </td>

                    {/* Transport Cost */}
                    <td className="py-3.5 px-4 text-right font-mono text-rose-400">
                      -₹{m.transportCostPerQtl}
                    </td>

                    {/* Hammali */}
                    <td className="py-3.5 px-4 text-right font-mono text-stone-400">
                      -₹{m.hammaliCostPerQtl}
                    </td>

                    {/* Net Return */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      {m.netReturnPerQtl !== null ? (
                        <span
                          className={`text-sm font-black ${
                            isBest ? 'text-[#22c55e]' : isTrap ? 'text-amber-400' : 'text-stone-200'
                          }`}
                        >
                          ₹{m.netReturnPerQtl}
                        </span>
                      ) : (
                        <span className="text-stone-500">—</span>
                      )}
                    </td>

                    {/* Total Payout */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-300">
                      {m.totalPayout !== null ? `₹${m.totalPayout.toLocaleString('en-IN')}` : '—'}
                    </td>

                    {/* Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          m.statusBadge.includes('RECENT')
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : m.statusBadge.includes('OUTDATED')
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {m.statusBadge}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
