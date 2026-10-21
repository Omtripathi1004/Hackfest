import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  Volume2,
  RotateCcw,
  Bot,
  User,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Info,
  Mic,
  MicOff,
} from 'lucide-react';
import { speakText, stopSpeech } from '../src/utils/speech';

export function GeminiChatbot({
  isOpen,
  setIsOpen,
  selectedCropKey = 'wheat',
  cropName = 'Wheat (Gehun)',
  activeMandi = null,
  financialInputs = null,
  financialResults = null,
  activeScenario = null,
  lang = 'hi',
}) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content:
        lang === 'hi'
          ? `नमस्ते! मैं आपका बाज़ारसेतु AI सहायक हूँ। मुझे आपके चुने हुए **${cropName}** और **${activeMandi?.name || 'सक्रिय मंडी'}** का पूरा डेटा प्राप्त है। आप मंडी भाव, भाड़ा खर्च, शुद्ध मुनाफा या 'क्या-अगर' परिदृश्य पर कोई भी सवाल पूछ सकते हैं!`
          : `Hello! I am your BazarSetu AI Krishi Assistant. I am connected with live data for **${cropName}** and **${activeMandi?.name || 'your selected Mandi'}**. Ask me about modal rates, transport costs, net profit, or What-If simulations!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechIdx, setActiveSpeechIdx] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Context-aware prompt suggestions
  const SUGGESTED_PROMPTS = [
    {
      label: lang === 'hi' ? '📊 शुद्ध मुनाफा विश्लेषण' : '📊 Analyze My P&L',
      prompt:
        lang === 'hi'
          ? 'मेरी फसल के सकल राजस्व, कुल खर्च और शुद्ध मुनाफे का सरल विश्लेषण करें।'
          : 'Break down my gross revenue, total expenses, and estimated net profit.',
    },
    {
      label: lang === 'hi' ? '🚛 भाड़ा जाल (Transport Trap) जाँच' : '🚛 Check Transport Trap',
      prompt:
        lang === 'hi'
          ? 'क्या दूर की मंडी का अधिक भाव भाड़े के कारण नुकसानदेह हो सकता है?'
          : 'Can a higher gross price at a distant mandi result in lower net profit?',
    },
    {
      label: lang === 'hi' ? '💡 खर्च घटाने के उपाय' : '💡 Ways to Cut Expenses',
      prompt:
        lang === 'hi'
          ? 'भाड़ा और हम्माली का खर्च कम करके शुद्ध मुनाफा कैसे बढ़ाया जा सकता है?'
          : 'How can I optimize freight and handling to increase my net pocket profit?',
    },
    {
      label: lang === 'hi' ? '🧪 5% भाव गिरने पर क्या होगा?' : '🧪 If Price Drops 5%',
      prompt:
        lang === 'hi'
          ? 'यदि मंडी भाव में 5% की गिरावट आ जाए, तो मेरे शुद्ध मुनाफे पर क्या प्रभाव पड़ेगा?'
          : 'What will be the impact on my net profit if the mandi price falls by 5%?',
    },
  ];

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update messages with user message immediately
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputText('');
    setIsLoading(true);

    try {
      // Build real-time context payload to inject into system instructions
      const payload = {
        message: text,
        // Send FULL prior history array so the model maintains turn memory & avoids loops
        history: updatedHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        context: {
          selectedCrop: selectedCropKey,
          cropName: cropName,
          activeMandi: activeMandi
            ? {
                id: activeMandi.id,
                name: activeMandi.name,
                nameHi: activeMandi.nameHi,
                district: activeMandi.district,
                stateCode: activeMandi.stateCode,
                distanceKm: activeMandi.distanceKm,
                modalPrice: activeMandi.todayModal,
                statusBadge: activeMandi.statusBadge,
                arrivalsTonnes: activeMandi.arrivalsTonnes,
              }
            : null,
          financials: financialResults
            ? {
                quantitySold: financialInputs?.quantitySold ?? 50,
                sellingPricePerUnit: financialInputs?.sellingPricePerUnit ?? 2475,
                grossRevenue: financialResults.grossRevenue,
                transportExpenses: financialInputs?.transportExpenses ?? 1200,
                loadingUnloading: financialInputs?.loadingUnloading ?? 900,
                commissions: financialInputs?.commissions ?? 0,
                otherSaleExpenses: financialInputs?.otherSaleExpenses ?? 0,
                saleRelatedExpenses: financialResults.saleRelatedExpenses,
                productionCosts: financialInputs?.productionCosts ?? 40000,
                netProceeds: financialResults.netProceeds,
                cropProfit: financialResults.cropProfit,
                profitMarginPct: financialResults.profitMarginPct,
                isProfitable: financialResults.isProfitable,
              }
            : null,
          whatIfScenario: activeScenario || null,
          lang: lang,
        },
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const replyContent = data.reply || (lang === 'hi' ? 'उत्तर प्राप्त नहीं हो सका।' : 'No response received.');

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: replyContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: data.provider,
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content:
            lang === 'hi'
              ? 'क्षमा करें, नेटवर्क में त्रुटि आई। कृपया पुनः प्रयास करें।'
              : 'Sorry, there was an issue connecting to the assistant. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported by your browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      setInputText(speechText);
      handleSendMessage(speechText);
    };

    recognition.start();
  };

  const handleAudioPlayback = (idx, text) => {
    if (activeSpeechIdx === idx) {
      stopSpeech();
      setActiveSpeechIdx(null);
    } else {
      setActiveSpeechIdx(idx);
      // Clean markdown tags for natural speech
      const cleaned = text.replace(/[*_#`]/g, '');
      speakText(cleaned, lang === 'hi' ? 'hi-IN' : 'en-IN');
    }
  };

  const handleClearHistory = () => {
    stopSpeech();
    setMessages([
      {
        role: 'model',
        content:
          lang === 'hi'
            ? `बातचीत रीसेट हो गई है। मैं **${cropName}** और **${activeMandi?.name || 'सक्रिय मंडी'}** के लिए तैयार हूँ। आपका क्या प्रश्न है?`
            : `Conversation reset. I am ready with context for **${cropName}** and **${activeMandi?.name || 'your active mandi'}**. How can I help?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* Floating Trigger Badge (Always visible across all tabs when drawer is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 bg-[#22c55e] text-[#07130d] hover:bg-[#16a34a] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,197,94,0.45)] px-4 py-2.5 rounded-full flex items-center gap-2.5 font-black text-xs group"
          title="Open Gemini Krishi Assistant Chatbot"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 animate-spin text-[#07130d]" style={{ animationDuration: '6s' }} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-950 rounded-full animate-ping" />
          </div>
          <span>{lang === 'hi' ? 'Gemini कृषि सहायक' : 'Gemini AI Assistant'}</span>
          <span className="bg-[#07130d] text-[#22c55e] text-[10px] px-2 py-0.5 rounded-full font-bold">
            {cropName.split(' ')[0]}
          </span>
        </button>
      )}

      {/* Slide-in Chat Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-[#07130d] border-l border-[#1b3d2b] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="bg-[#0d2117] border-b border-[#1b3d2b] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#22c55e] text-[#07130d] flex items-center justify-center font-black shadow-[0_0_12px_rgba(34,197,94,0.35)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">
                  {lang === 'hi' ? 'Gemini 4 कृषि सलाहकार' : 'Gemini Krishi Assistant'}
                </h3>
                <span className="bg-[#143021] text-[#22c55e] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#22c55e]/40">
                  @google/genai
                </span>
              </div>
              <p className="text-[10px] text-stone-300">
                {lang === 'hi' ? 'मल्टी-टर्न मेमोरी • 0 लूप बग्स • Agmarknet सत्यापित' : 'Multi-turn Memory • Zero Loops • Agmarknet Grounded'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearHistory}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-[#143021] rounded-lg transition"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                stopSpeech();
                setIsOpen(false);
              }}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-[#143021] rounded-lg transition"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Context Banner (Shows the user what the bot currently knows) */}
        <div className="bg-[#091810] border-b border-[#143021] px-3.5 py-2 flex items-center justify-between text-[11px] text-stone-300">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="truncate">
              <strong>{cropName.split(' ')[0]}</strong> • {activeMandi ? activeMandi.name : 'All Mandis'}
              {financialResults ? ` • Net: ₹${Number(financialResults.cropProfit).toLocaleString('en-IN')}` : ''}
            </span>
          </div>
          <span className="text-[9px] text-emerald-400 font-mono font-bold bg-[#0d2117] px-2 py-0.5 rounded border border-[#1b3d2b]">
            T=0.75
          </span>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#143021] border border-[#22c55e]/40 text-[#22c55e]'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#22c55e] text-[#07130d] font-semibold rounded-tr-none'
                      : msg.isError
                      ? 'bg-rose-950/80 border border-rose-600 text-rose-200 rounded-tl-none'
                      : 'bg-[#0d2117] border border-[#1b3d2b] text-stone-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Message Footer: Timestamp & Audio Action */}
                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-white/10 text-[10px] text-stone-400">
                    <span>{msg.timestamp}</span>
                    {!isUser && !msg.isError && (
                      <button
                        onClick={() => handleAudioPlayback(idx, msg.content)}
                        className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition ${
                          activeSpeechIdx === idx
                            ? 'bg-[#22c55e] text-[#07130d] font-bold'
                            : 'hover:text-emerald-300 hover:bg-[#143021]'
                        }`}
                        title="Speak response in audio"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{activeSpeechIdx === idx ? 'Stop' : 'Listen'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#143021] border border-[#22c55e]/40 text-[#22c55e] flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="bg-[#0d2117] border border-[#1b3d2b] text-stone-300 rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-stone-400 ml-1">
                  {lang === 'hi' ? 'सटीक गणना और ग्राउंडेड उत्तर तैयार हो रहा है...' : 'Synthesizing grounded reply...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Action Chips */}
        <div className="p-2 border-t border-[#143021] bg-[#091810]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {SUGGESTED_PROMPTS.map((chip, i) => (
              <button
                key={i}
                disabled={isLoading}
                onClick={() => handleSendMessage(chip.prompt)}
                className="whitespace-nowrap bg-[#0d2117] hover:bg-[#143021] hover:border-[#22c55e] text-stone-300 hover:text-white border border-[#1b3d2b] px-2.5 py-1 rounded-full text-[10px] font-semibold transition"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Input Area */}
        <div className="p-3 bg-[#0d2117] border-t border-[#1b3d2b]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`p-2 rounded-xl border transition ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : 'bg-[#07130d] text-stone-300 border-[#1b3d2b] hover:text-[#22c55e]'
              }`}
              title="Voice dictation"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                lang === 'hi'
                  ? 'मंडी भाव, भाड़ा खर्च, या P&L पर सवाल पूछें...'
                  : 'Ask about mandi rates, freight costs, or P&L...'
              }
              disabled={isLoading}
              className="flex-1 bg-[#07130d] border border-[#1b3d2b] rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-[#22c55e] text-[#07130d] disabled:opacity-40 hover:bg-[#16a34a] p-2 rounded-xl transition font-bold"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[9px] text-stone-500 mt-1.5 px-1">
            <span>Powered by Google Gemini 2.5/1.5 & Agmarknet Engine</span>
            <span>Zero Loops • Memory Persistent</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default GeminiChatbot;
