import React, { useState } from 'react';
import { Bell, Copy, Check, MessageSquare, Smartphone, CheckCircle, Share2 } from 'lucide-react';
import { FALLBACK_SNAPSHOT } from '../data/fallbackSnapshot';
import { evaluateMandiList } from '../utils/calculations';

interface AlertsAndDigestProps {
  selectedCropKey: string;
  setSelectedCropKey: (key: string) => void;
  lang: 'hi' | 'en';
}

export const AlertsAndDigest: React.FC<AlertsAndDigestProps> = ({
  selectedCropKey,
  setSelectedCropKey,
  lang,
}) => {
  const crop = FALLBACK_SNAPSHOT[selectedCropKey] || FALLBACK_SNAPSHOT.wheat;
  const { evaluated, bestMandi } = evaluateMandiList(crop.mandis, 25);

  const [thresholdPrice, setThresholdPrice] = useState<string>('2500');
  const [alertSaved, setAlertSaved] = useState<boolean>(false);
  const [copiedHi, setCopiedHi] = useState<boolean>(false);
  const [copiedEn, setCopiedEn] = useState<boolean>(false);

  // 160-character SMS Digest generation for 2G rural networks
  // Compact, strictly factual, source-grounded
  const heroMandi = evaluated[0];
  const smsHi = `BAZARSETU:${crop.nameHi.split(' ')[0]} ${heroMandi.todayModal ? `₹${heroMandi.todayModal}` : 'बंद'}@${heroMandi.name.split(' ')[0]}.सर्वश्रेष्ठ:${bestMandi?.name.split(' ')[0]} शुद्ध₹${bestMandi?.netReturnPerQtl}.भाड़ाकटौतीसहित`;
  const smsEn = `BAZARSETU:${crop.name} modal ₹${heroMandi.todayModal}@${heroMandi.name.split(' ')[0]}.Best net:₹${bestMandi?.netReturnPerQtl}@${bestMandi?.name.split(' ')[0]} aftr frght.Agmarknet 21Oct`;

  const copyToClipboard = (text: string, isHi: boolean) => {
    navigator.clipboard.writeText(text);
    if (isHi) {
      setCopiedHi(true);
      setTimeout(() => setCopiedHi(false), 2000);
    } else {
      setCopiedEn(true);
      setTimeout(() => setCopiedEn(false), 2000);
    }
  };

  const handleSaveAlert = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertSaved(true);
    setTimeout(() => setAlertSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>📲</span>
            <span>{lang === 'hi' ? 'अलर्ट व 2G SMS डाइजेस्ट (Alerts & 2G Digest)' : 'Alerts & 2G Mandi Digest'}</span>
          </h2>
          <p className="text-xs text-stone-300 mt-1">
            {lang === 'hi'
              ? 'ग्रामीण 2G कनेक्टिविटी और फीचर फोन के लिए 160 अक्षरों का सीधा मंडी संदेश + कस्टम मूल्य थ्रेशोल्ड अलर्ट।'
              : '160-character SMS & WhatsApp digest designed for rural 2G bandwidth, feature phones, and low literacy.'}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: PRICE THRESHOLD ALERT CREATOR */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {lang === 'hi' ? 'कस्टम मूल्य थ्रेशोल्ड अलर्ट बनाएं' : 'Create Price Threshold Alert'}
            </h3>
          </div>

          <p className="text-xs text-stone-300">
            {lang === 'hi'
              ? `जब ${crop.nameHi} का शुद्ध भाव इस सीमा को पार करे, तो सूचना प्राप्त करें:`
              : `Trigger an instant alert when ${crop.name} net realization exceeds your target:`}
          </p>

          <form onSubmit={handleSaveAlert} className="space-y-4 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">
                {lang === 'hi' ? 'लक्षित भाव (Target Rate ₹/Quintal):' : 'Target Threshold Rate (₹/Qtl):'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold">₹</span>
                <input
                  type="number"
                  value={thresholdPrice}
                  onChange={(e) => setThresholdPrice(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full bg-[#07130d] border border-[#1b3d2b] text-white pl-8 pr-4 py-2.5 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#22c55e] hover:bg-emerald-400 text-[#07130d] font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>{lang === 'hi' ? 'अलर्ट सक्रिय करें (Activate Alert)' : 'Activate Price Alert'}</span>
            </button>

            {alertSaved && (
              <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                <span>
                  {lang === 'hi'
                    ? `सफल: ₹${thresholdPrice}/Qtl का अलर्ट सक्रिय हो गया है!`
                    : `Success: Alert set for ₹${thresholdPrice}/Qtl!`}
                </span>
              </div>
            )}
          </form>
        </div>

        {/* SECTION 2: 2G SMS & WHATSAPP 160-CHAR DIGEST */}
        <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {lang === 'hi' ? '2G SMS व व्हाट्सएप संदेश' : '2G SMS & WhatsApp Digest'}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-stone-400 bg-[#07130d] px-2 py-0.5 rounded border border-[#1b3d2b]">
              ≤160 Chars
            </span>
          </div>

          <p className="text-xs text-stone-300">
            {lang === 'hi'
              ? 'कीपैड फोन अथवा कमजोर नेटवर्क में एक क्लिक में किसान साथियों को भेजने योग्य संदेश:'
              : 'One-click copyable message formatted to fit within standard 160-character 2G SMS limits:'}
          </p>

          {/* Hindi Digest Box */}
          <div className="bg-[#07130d] border border-[#1b3d2b] rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center text-[10px] text-stone-400">
              <span className="font-bold text-emerald-300">हिन्दी SMS ({smsHi.length}/160 अक्षर)</span>
              <button
                onClick={() => copyToClipboard(smsHi, true)}
                className="flex items-center gap-1 text-[11px] font-bold text-[#22c55e] hover:underline"
              >
                {copiedHi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHi ? 'कॉपी हो गया!' : 'कॉपी करें'}</span>
              </button>
            </div>
            <p className="text-xs font-mono text-stone-100 bg-[#0a1b12] p-2.5 rounded-lg border border-[#143021] break-all">
              {smsHi}
            </p>
          </div>

          {/* English Digest Box */}
          <div className="bg-[#07130d] border border-[#1b3d2b] rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center text-[10px] text-stone-400">
              <span className="font-bold text-amber-300">English SMS ({smsEn.length}/160 chars)</span>
              <button
                onClick={() => copyToClipboard(smsEn, false)}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:underline"
              >
                {copiedEn ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEn ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-xs font-mono text-stone-100 bg-[#0a1b12] p-2.5 rounded-lg border border-[#143021] break-all">
              {smsEn}
            </p>
          </div>

          {/* Share on WhatsApp Button */}
          <button
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(smsHi)}`, '_blank')}
            className="w-full bg-[#1b3d2b] hover:bg-emerald-800 text-emerald-100 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-emerald-600 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>{lang === 'hi' ? 'व्हाट्सएप पर भेजें' : 'Share Digest via WhatsApp'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
