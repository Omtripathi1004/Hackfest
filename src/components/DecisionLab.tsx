import React, { useState } from 'react';
import { Sliders, FlaskConical, AlertCircle, ArrowRight, ShieldAlert, Sparkles, Scale } from 'lucide-react';
import { calculateWhatIf } from '../utils/calculations';
import { FALLBACK_SNAPSHOT } from '../data/fallbackSnapshot';

interface DecisionLabProps {
  selectedCropKey: string;
  setSelectedCropKey: (key: string) => void;
  lang: 'hi' | 'en';
}

export const DecisionLab: React.FC<DecisionLabProps> = ({
  selectedCropKey,
  setSelectedCropKey,
  lang,
}) => {
  const crop = FALLBACK_SNAPSHOT[selectedCropKey] || FALLBACK_SNAPSHOT.wheat;
  const basePrice = crop.mandis[0]?.todayModal || 2475;

  const [priceShift, setPriceShift] = useState<number>(0); // -10% to +10%
  const [distanceKm, setDistanceKm] = useState<number>(64);
  const [ratePerKm, setRatePerKm] = useState<number>(0.95);
  const [moistureDeduction, setMoistureDeduction] = useState<number>(2); // 0 to 15%
  const [quantityQtl, setQuantityQtl] = useState<number>(30);
  const [hammali, setHammali] = useState<number>(18);

  const result = calculateWhatIf({
    baseModalPrice: basePrice,
    priceShiftPercent: priceShift,
    distanceKm: distanceKm,
    ratePerKmPerQtl: ratePerKm,
    hammaliPerQtl: hammali,
    moisturePercent: moistureDeduction,
    quantityQtl: quantityQtl,
  });

  return (
    <div className="space-y-6">
      {/* Header with SCENARIO ONLY Badge */}
      <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>🧪</span>
              <span>{lang === 'hi' ? 'क्या-अगर सिम्युलेटर (Decision Lab)' : 'Decision Lab (What-If Simulator)'}</span>
            </h2>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              SCENARIO ONLY (काल्पनिक परिदृश्य)
            </span>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            {lang === 'hi'
              ? 'मंडी भाव में उतार-चढ़ाव, नमी कटौती और भाड़ा दर बदलने पर अपने शुद्ध मुनाफे का अग्रिम विश्लेषण करें।'
              : 'Simulate market price shifts, moisture penalties, and freight changes to find distant break-even targets.'}
          </p>
        </div>

        {/* Crop Selector */}
        <select
          value={selectedCropKey}
          onChange={(e) => setSelectedCropKey(e.target.value)}
          className="bg-[#07130d] border border-[#1b3d2b] text-emerald-300 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none"
        >
          {Object.keys(FALLBACK_SNAPSHOT).map((k) => (
            <option key={k} value={k}>
              {lang === 'hi' ? FALLBACK_SNAPSHOT[k].nameHi : FALLBACK_SNAPSHOT[k].name}
            </option>
          ))}
        </select>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Price Shift Slider (-10% to +10%) */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-stone-300">
              {lang === 'hi' ? '1. बाजार भाव में बदलाव (Price Shift):' : '1. Market Price Shift:'}
            </span>
            <span
              className={`font-mono text-sm ${
                priceShift > 0 ? 'text-[#22c55e]' : priceShift < 0 ? 'text-[#ef4444]' : 'text-stone-200'
              }`}
            >
              {priceShift > 0 ? `+${priceShift}%` : `${priceShift}%`} (₹{result.adjustedPrice})
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="10"
            step="1"
            value={priceShift}
            onChange={(e) => setPriceShift(Number(e.target.value))}
            className="w-full accent-[#22c55e] bg-[#07130d] h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-stone-500 font-mono">
            <span>-10% (मंदा)</span>
            <span>0% (वर्तमान)</span>
            <span>+10% (तेजी)</span>
          </div>
        </div>

        {/* Distance Slider */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-stone-300">
              {lang === 'hi' ? '2. मंडी की दूरी (Distance):' : '2. Mandi Distance:'}
            </span>
            <span className="font-mono text-sm text-[#22c55e]">{distanceKm} किमी</span>
          </div>
          <input
            type="range"
            min="5"
            max="200"
            value={distanceKm}
            onChange={(e) => setDistanceKm(Number(e.target.value))}
            className="w-full accent-[#22c55e] bg-[#07130d] h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-stone-500 font-mono">
            <span>5 km (स्थानीय)</span>
            <span>100 km</span>
            <span>200 km (दूरस्थ)</span>
          </div>
        </div>

        {/* Moisture Penalty Slider */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-stone-300">
              {lang === 'hi' ? '3. नमी / कचरा कटौती (Moisture %):' : '3. Moisture Deduction %:'}
            </span>
            <span className="font-mono text-sm text-amber-400">{moistureDeduction}% कटौती</span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            value={moistureDeduction}
            onChange={(e) => setMoistureDeduction(Number(e.target.value))}
            className="w-full accent-amber-400 bg-[#07130d] h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-stone-500 font-mono">
            <span>0% (सूखा माल)</span>
            <span>5%</span>
            <span>15% (गीला माल)</span>
          </div>
        </div>

        {/* Transport Rate Slider */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-stone-300">
              {lang === 'hi' ? '4. भाड़ा दर (Freight Rate):' : '4. Freight Rate / Km / Qtl:'}
            </span>
            <span className="font-mono text-sm text-stone-200">₹{ratePerKm}/km/q</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.05"
            value={ratePerKm}
            onChange={(e) => setRatePerKm(Number(e.target.value))}
            className="w-full accent-[#22c55e] bg-[#07130d] h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-stone-500 font-mono">
            <span>₹0.50 (किफायती)</span>
            <span>₹1.50</span>
            <span>₹3.00 (महंगा)</span>
          </div>
        </div>

        {/* Quantity Slider */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-stone-300">
              {lang === 'hi' ? '5. माल की मात्रा:' : '5. Quantity:'}
            </span>
            <span className="font-mono text-sm text-stone-200">{quantityQtl} क्विंटल</span>
          </div>
          <input
            type="range"
            min="5"
            max="150"
            value={quantityQtl}
            onChange={(e) => setQuantityQtl(Number(e.target.value))}
            className="w-full accent-[#22c55e] bg-[#07130d] h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-stone-500 font-mono">
            <span>5 Qtl</span>
            <span>75 Qtl</span>
            <span>150 Qtl</span>
          </div>
        </div>

        {/* Hammali */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-stone-300">
              {lang === 'hi' ? '6. हम्माली शुल्क:' : '6. Hammali Fee:'}
            </span>
            <span className="font-mono text-sm text-stone-200">₹{hammali}/Qtl</span>
          </div>
          <input
            type="range"
            min="0"
            max="35"
            value={hammali}
            onChange={(e) => setHammali(Number(e.target.value))}
            className="w-full accent-amber-400 bg-[#07130d] h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-stone-500 font-mono">
            <span>₹0</span>
            <span>₹18</span>
            <span>₹35</span>
          </div>
        </div>
      </div>

      {/* SIMULATED RESULTS & BREAK-EVEN CALCULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Outcome Card */}
        <div className="bg-[#0d2117] border-2 border-[#22c55e]/60 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              {lang === 'hi' ? 'परिदृश्य परिणाम (Simulated Outcome)' : 'Simulated Scenario Outcome'}
            </span>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              SCENARIO ONLY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#07130d] p-3 rounded-xl border border-[#1b3d2b]">
              <span className="text-[10px] text-stone-400 block">सकल भाव (Adjusted Gross):</span>
              <span className="text-xl font-mono font-bold text-white">₹{result.adjustedPrice}/Qtl</span>
            </div>
            <div className="bg-[#07130d] p-3 rounded-xl border border-[#1b3d2b]">
              <span className="text-[10px] text-stone-400 block">नमी के बाद भाव (After Moisture):</span>
              <span className="text-xl font-mono font-bold text-amber-300">₹{result.effectivePriceAfterMoisture}/Qtl</span>
            </div>
            <div className="bg-[#07130d] p-3 rounded-xl border border-[#1b3d2b]">
              <span className="text-[10px] text-stone-400 block">कुल कटौती (भाड़ा + हम्माली):</span>
              <span className="text-xl font-mono font-bold text-rose-400">-₹{result.totalDeduction}/Qtl</span>
            </div>
            <div className="bg-[#07130d] p-3 rounded-xl border border-emerald-600">
              <span className="text-[10px] text-emerald-300 block font-bold">शुद्ध हाथ में (Net In-Pocket):</span>
              <span className="text-2xl font-mono font-black text-[#22c55e]">₹{result.netReturnPerQtl}/Qtl</span>
            </div>
          </div>

          <div className="bg-[#07130d] p-3.5 rounded-xl border border-[#1b3d2b] flex justify-between items-center">
            <span className="text-xs font-bold text-stone-300">
              {quantityQtl} क्विंटल पर अनुमानित कुल कमाई:
            </span>
            <span className="text-2xl font-mono font-black text-amber-300">
              ₹{result.totalPayout.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Break-Even Target Card */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
              {lang === 'hi' ? 'दूर की मंडी के लिए आवश्यक न्यूनतम भाव (Break-Even Target)' : 'Required Distant Break-Even Price'}
            </h3>
          </div>

          <p className="text-xs text-stone-300">
            {lang === 'hi'
              ? `यदि आप स्थानीय मंडी (12 किमी) न जाकर इस ${distanceKm} किमी दूर वाली मंडी जाते हैं, तो आपको कम से कम इतना भाव मिलना चाहिए:`
              : `To match your local 12 km mandi profit, the distant market (${distanceKm} km) must offer at least this gross price:`}
          </p>

          <div className="bg-[#07130d] border border-amber-500/60 rounded-2xl p-5 text-center space-y-1">
            <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-bold">
              BREAK-EVEN THRESHOLD
            </span>
            <div className="text-4xl font-mono font-black text-amber-400">
              ₹{result.requiredBreakEvenAtDistant}
            </div>
            <span className="text-[11px] text-stone-300 block">
              प्रति क्विंटल (न्यूनतम आवश्यक सरकारी भाव)
            </span>
          </div>

          <div className="text-[11px] text-stone-400 bg-[#07130d] p-3 rounded-xl border border-[#1b3d2b]">
            💡 <strong>फार्मर नियम:</strong> यदि दूर वाली मंडी ₹{result.requiredBreakEvenAtDistant} से कम भाव देती है, तो वहाँ जाना नुकसानदेह है (भाड़ा जाल)।
          </div>
        </div>
      </div>
    </div>
  );
};
