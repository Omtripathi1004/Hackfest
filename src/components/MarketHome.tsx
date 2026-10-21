import React, { useState } from 'react';
import { Volume2, Share2, TrendingUp, TrendingDown, Clock, ShieldCheck, MapPin, Truck, Sparkles } from 'lucide-react';
import { CropSnapshot, FALLBACK_SNAPSHOT } from '../data/fallbackSnapshot';
import { evaluateMandiList, EvaluatedMandi } from '../utils/calculations';
import { speakText } from '../utils/speech';

interface MarketHomeProps {
  selectedCropKey: string;
  setSelectedCropKey: (key: string) => void;
  lang: 'hi' | 'en';
  onNavigateTab?: (tab: string, mandi?: any) => void;
}

export const MarketHome: React.FC<MarketHomeProps> = ({
  selectedCropKey,
  setSelectedCropKey,
  lang,
  onNavigateTab,
}) => {
  const crop: CropSnapshot = FALLBACK_SNAPSHOT[selectedCropKey] || FALLBACK_SNAPSHOT.wheat;
  const [selectedMandiId, setSelectedMandiId] = useState<string>(crop.mandis[0]?.id || '');
  const [quantityQtl, setQuantityQtl] = useState<number>(25);

  const { evaluated, bestMandi } = evaluateMandiList(crop.mandis, quantityQtl);
  const heroMandi: EvaluatedMandi = evaluated.find((m) => m.id === selectedMandiId) || evaluated[0];

  const handleVoiceReadout = () => {
    if (!heroMandi) return;
    const cropName = lang === 'hi' ? crop.nameHi : crop.name;
    const diffText =
      heroMandi.priceDiff !== null
        ? heroMandi.priceDiff >= 0
          ? `कल से ${heroMandi.priceDiff} रुपये बढ़कर`
          : `कल से ${Math.abs(heroMandi.priceDiff)} रुपये घटकर`
        : '';

    const textHi = `आज ${cropName} का भाव ${heroMandi.nameHi} में ${
      heroMandi.todayModal ? `${heroMandi.todayModal} रुपये प्रति क्विंटल है ${diffText}` : 'उपलब्ध नहीं है'
    }। ${
      bestMandi && bestMandi.id === heroMandi.id
        ? 'यह मंडी आज आपके लिए सबसे अधिक शुद्ध मुनाफा दे रही है।'
        : bestMandi
        ? `सर्वाधिक शुद्ध कमाई के लिए आप ${bestMandi.nameHi} जा सकते हैं, जहाँ भाड़ा काटकर शुद्ध ₹${bestMandi.netReturnPerQtl} बचेंगे।`
        : ''
    }`;

    const textEn = `Today's modal rate for ${crop.name} at ${heroMandi.name} is ${
      heroMandi.todayModal ? `₹${heroMandi.todayModal} per quintal` : 'not reported'
    }. ${
      bestMandi
        ? `Best net profit is at ${bestMandi.name} netting ₹${bestMandi.netReturnPerQtl} per quintal after freight.`
        : ''
    }`;

    speakText(lang === 'hi' ? textHi : textEn, lang === 'hi' ? 'hi-IN' : 'en-IN');
  };

  const handleWhatsAppShare = () => {
    if (!heroMandi) return;
    const msg = `🌾 *BAZARSETU AI मंडी भाव (${crop.nameHi})*\n📍 मंडी: ${heroMandi.name}\n💰 आज का भाव: ${
      heroMandi.todayModal ? `₹${heroMandi.todayModal}/Qtl` : 'मंडी बंद/भाव नहीं'
    }\n🚚 भाड़ा व हम्माली काटकर शुद्ध: ₹${heroMandi.netReturnPerQtl || 'N/A'}/Qtl\n⭐ सर्वाधिक शुद्ध मुनाफा: ${
      bestMandi ? `${bestMandi.name} (₹${bestMandi.netReturnPerQtl}/Qtl)` : 'N/A'
    }\n🔗 BAZARSETU AI Krishi Decision Intelligence`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Crop Pills Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {Object.keys(FALLBACK_SNAPSHOT).map((key) => {
          const c = FALLBACK_SNAPSHOT[key];
          const isSelected = key === selectedCropKey;
          return (
            <button
              key={key}
              onClick={() => {
                setSelectedCropKey(key);
                setSelectedMandiId(c.mandis[0]?.id || '');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#22c55e] text-[#07130d] shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-[1.02]'
                  : 'bg-[#0d2117] text-stone-300 border border-[#1b3d2b] hover:border-emerald-600'
              }`}
            >
              <span>{lang === 'hi' ? c.nameHi : c.name}</span>
            </button>
          );
        })}
      </div>

      {/* Mandi Switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-stone-400">
          {lang === 'hi' ? 'मंडी चुनें:' : 'Select Market:'}
        </span>
        {evaluated.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMandiId(m.id)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selectedMandiId === m.id
                ? 'bg-[#1b3d2b] border-[#22c55e] text-[#22c55e]'
                : 'bg-[#0d2117] border-[#143021] text-stone-400 hover:text-stone-200'
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* HERO SECTION: ONE NUMBER, LARGE, WITH A DIRECTION */}
      <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#22c55e]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Main Price Block */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {heroMandi.name} ({heroMandi.district}, {heroMandi.stateCode})
              </span>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  heroMandi.statusBadge.includes('RECENT')
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                    : heroMandi.statusBadge.includes('OUTDATED')
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                    : 'bg-rose-950/80 border-rose-500 text-rose-300'
                }`}
              >
                {heroMandi.statusBadge}
              </span>
            </div>

            {/* Giant Numeral */}
            <div className="flex items-baseline gap-4 flex-wrap">
              {heroMandi.todayModal !== null ? (
                <>
                  <div className="text-5xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_10px_rgba(34,197,94,0.2)]">
                    ₹{heroMandi.todayModal.toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-stone-400">
                    / क्विंटल (Modal Price)
                  </div>
                </>
              ) : (
                <div className="text-3xl sm:text-4xl font-black text-[#ef4444] border border-[#ef4444]/40 bg-rose-950/40 px-4 py-2 rounded-2xl">
                  {lang === 'hi' ? 'भाव उपलब्ध नहीं (NO RATE REPORTED)' : 'NO RATE REPORTED TODAY'}
                </div>
              )}

              {/* Price Direction Badge */}
              {heroMandi.priceDiff !== null && (
                <div
                  className={`flex items-center gap-1 font-bold text-sm px-3 py-1.5 rounded-xl border ${
                    heroMandi.priceDiff > 0
                      ? 'bg-emerald-950/80 text-[#22c55e] border-emerald-500'
                      : heroMandi.priceDiff < 0
                      ? 'bg-rose-950/80 text-[#ef4444] border-rose-500'
                      : 'bg-stone-900 text-stone-300 border-stone-700'
                  }`}
                >
                  {heroMandi.priceDiff > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : heroMandi.priceDiff < 0 ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : null}
                  <span>
                    {heroMandi.priceDiff > 0 ? '+₹' : '-₹'}
                    {Math.abs(heroMandi.priceDiff)}
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal">
                    {lang === 'hi' ? 'कल से' : 'vs prev'}
                  </span>
                </div>
              )}
            </div>

            {/* Observation Timestamp */}
            <div className="flex items-center gap-3 text-xs text-stone-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                {lang === 'hi' ? 'निरीक्षण तिथि:' : 'Observed:'} <strong className="text-stone-200">{heroMandi.lastReportedDate}</strong>
              </span>
              <span>•</span>
              <span>
                {lang === 'hi' ? 'दूरी:' : 'Distance:'} <strong className="text-stone-200">{heroMandi.distanceKm} किमी</strong>
              </span>
              <span>•</span>
              <span>
                {lang === 'hi' ? 'आवक:' : 'Arrivals:'} <strong className="text-stone-200">{heroMandi.arrivalsTonnes} टन</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-auto">
            <button
              onClick={handleVoiceReadout}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-[#22c55e] hover:bg-emerald-400 text-[#07130d] font-black px-6 py-3.5 rounded-2xl text-sm transition-all shadow-[0_0_20px_rgba(34,197,94,0.35)]"
            >
              <Volume2 className="w-4 h-4" />
              <span>{lang === 'hi' ? '🔊 सुनें (Listen)' : '🔊 Voice Briefing'}</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-[#1b3d2b] hover:bg-emerald-800 text-emerald-200 font-bold px-6 py-3 rounded-2xl text-xs border border-emerald-600 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'व्हाट्सएप शेयर' : 'Share WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* "WHERE SHOULD I TAKE MY CROP?" NET-PROFIT SUMMARY CARD */}
      {bestMandi && (
        <div className="bg-gradient-to-r from-[#0d2117] via-[#102b1f] to-[#0d2117] border-2 border-[#22c55e] rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 bg-[#22c55e] text-[#07130d] font-black text-xs px-3 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                {lang === 'hi' ? 'मैं अपनी फसल कहाँ ले जाऊँ? (सिफारिश)' : 'Where Should I Take My Crop?'}
              </div>
              <h3 className="text-2xl font-black text-white">
                {bestMandi.name} ({bestMandi.nameHi})
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
                {lang === 'hi'
                  ? `भाड़ा (₹${bestMandi.transportCostPerQtl}/क्विंटल) और हम्माली (₹${bestMandi.hammaliCostPerQtl}/क्विंटल) काटने के बाद भी आपके हाथ में सर्वाधिक शुद्ध बचत यहीं बचेगी।`
                  : `Even after freight (₹${bestMandi.transportCostPerQtl}/q) and hammali (₹${bestMandi.hammaliCostPerQtl}/q), this mandi yields your maximum net in-hand payout.`}
              </p>
              {onNavigateTab && (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => onNavigateTab('map', bestMandi)}
                    className="bg-[#07130d] hover:bg-[#143021] text-emerald-300 border border-emerald-600/50 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <span>🗺️ {lang === 'hi' ? 'मानचित्र पर देखें' : 'View on Map'}</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('finance', bestMandi)}
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-[#07130d] text-xs font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    <span>💰 {lang === 'hi' ? 'P&L केंद्र में गणना करें' : 'Calculate P&L'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[#07130d] border border-[#1b3d2b] rounded-2xl p-4 text-right min-w-[220px]">
              <span className="text-[11px] font-bold text-stone-400 block uppercase">
                {lang === 'hi' ? 'शुद्ध हाथ में (Net In-Pocket)' : 'Net In-Pocket Return'}
              </span>
              <span className="text-3xl sm:text-4xl font-mono font-black text-[#22c55e] block">
                ₹{bestMandi.netReturnPerQtl}
              </span>
              <span className="text-[10px] text-stone-400 block">/ क्विंटल (Net Rate)</span>
              <div className="text-xs font-bold text-amber-300 mt-2 border-t border-[#1b3d2b] pt-1.5">
                {lang === 'hi' ? 'कुल कमाई:' : 'Total Payout:'} ₹{bestMandi.totalPayout?.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
