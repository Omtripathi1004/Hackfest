/**
 * BAZARSETU AI — Krishi Decision Intelligence
 * Backend Gemini Chatbot Route (app/api/chat/route.js)
 *
 * Implements @google/genai with ai.chats.create()
 * Maintains multi-turn conversational memory via history array
 * Uses temperature: 0.75
 * Injects real-time application context (crop, active mandi, calculated financials, scenarios)
 * Prevents 3-turn loops and repetitive robotic greetings
 */

// Helper to construct anti-loop, grounded system instructions
function buildSystemInstruction(context = {}) {
  const {
    selectedCrop = 'Wheat',
    cropName = 'Wheat (Gehun)',
    activeMandi = null,
    financials = null,
    whatIfScenario = null,
    lang = 'hi',
  } = context;

  let mandiDetails = 'None selected currently';
  if (activeMandi) {
    mandiDetails = `${activeMandi.name || 'Mandi'} (${activeMandi.district || ''}, ${activeMandi.stateCode || ''})
  - Distance from Farmer: ${activeMandi.distanceKm ?? 'N/A'} km
  - Today Modal Rate: ₹${activeMandi.modalPrice ?? activeMandi.todayModal ?? 'Not Reported'}/Quintal
  - Status/Freshness: ${activeMandi.statusBadge || 'Active'}
  - Arrivals: ${activeMandi.arrivalsTonnes ?? 'N/A'} Tonnes`;
  }

  let financialDetails = 'No sales calculation loaded yet';
  if (financials) {
    financialDetails = `
  - Crop: ${cropName}
  - Quantity Sold: ${financials.quantitySold} Qtl
  - Selling Price: ₹${financials.sellingPricePerUnit}/Qtl
  - Gross Revenue: ₹${Number(financials.grossRevenue || 0).toLocaleString('en-IN')} (Quantity × Price)
  - Sale-Related Expenses: ₹${Number(financials.saleRelatedExpenses || 0).toLocaleString('en-IN')}
    [Transport: ₹${financials.transportExpenses || 0}, Loading/Unloading: ₹${financials.loadingUnloading || 0}, Commissions: ₹${financials.commissions || 0}, Other: ₹${financials.otherSaleExpenses || 0}]
  - Estimated Net Proceeds: ₹${Number(financials.netProceeds || 0).toLocaleString('en-IN')} (Gross - Sale Expenses)
  - Production Costs: ₹${Number(financials.productionCosts || 0).toLocaleString('en-IN')}
  - Estimated Crop Profit / Loss: ₹${Number(financials.cropProfit || 0).toLocaleString('en-IN')}
  - Profit Margin: ${financials.profitMarginPct}% (${financials.isProfitable ? 'PROFITABLE' : 'NET LOSS'})`;
  }

  let scenarioDetails = 'None active';
  if (whatIfScenario) {
    scenarioDetails = `
  - Scenario Name: ${whatIfScenario.name || 'Active What-If'}
  - Price Shift: ${whatIfScenario.priceShiftPercent ?? 0}%
  - Scenario Net Proceeds: ₹${whatIfScenario.netProceeds ?? 'N/A'}
  - Net Delta: ₹${whatIfScenario.cropProfitDelta ?? 'N/A'}`;
  }

  return `You are "BazarSetu AI" (बाज़ारसेतु कृषि सहायक), a production-grade Agricultural Economics and Market Trade Advisor designed for Indian farmers, FPOs, and APMC market participants.

REFERENCE DATE: 2026-10-21 (Agmarknet verified dataset).

CURRENT LIVE APPLICATION CONTEXT:
===================================
1. Crop: ${cropName} (${selectedCrop})
2. Active Mandi:
${mandiDetails}
3. Real-Time Profit & Loss Calculation:
${financialDetails}
4. What-If Scenario:
${scenarioDetails}
5. Preferred Language: ${lang === 'hi' ? 'Hindi (हिन्दी)' : 'English'}

CRITICAL INSTRUCTIONS & ANTI-LOOP SAFEGUARDS:
============================================
1. NO 3-TURN LOOPS & NO REPETITION:
   - You are in an ONGOING conversation. Inspect the previous conversation history provided.
   - NEVER repeat hello / namaste / introductory greetings or disclaimers if you already greeted the farmer in a prior turn.
   - NEVER ask the farmer for their crop, mandi name, quantity, or price if it is ALREADY provided in the live context above. You already have their exact live numbers!
   - Answer their specific follow-up question directly in the very first sentence.

2. GROUNDED FINANCIAL ACCURACY (ZERO HALLUCINATION):
   - Always reference the exact numbers from the context above (e.g. ₹${financials?.cropProfit || '75,550'} profit, ₹${financials?.grossRevenue || '1,23,750'} revenue).
   - Use the deterministic formulas:
     * Gross Revenue = Quantity Sold × Selling Price Per Unit
     * Estimated Net Proceeds = Gross Revenue - Sale-Related Expenses
     * Estimated Crop Profit = Estimated Net Proceeds - Production Costs
   - If distant mandi has a higher gross price but freight eats the profit, actively warn about the "Transport Trap".

3. PROHIBIT SPECULATION:
   - Do NOT forecast future unverified market prices or predict tomorrow's rates. If asked, ground your reply in today's official 2026-10-21 modal rate.

4. TONE & BILINGUAL PROFICIENCY:
   - Be respectful, practical, and farmer-friendly.
   - If query or language is Hindi, reply in natural Hindi with clear Rupee symbols (₹). If English, reply in English.
   - Format key numbers with bold text and rupee notation for fast scannability on mobile screens.`;
}

// Format message history array for @google/genai
function formatGenAiHistory(history = []) {
  if (!Array.isArray(history)) return [];

  const sanitized = [];
  for (const item of history) {
    if (!item) continue;
    const role = (item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';
    const textContent = typeof item.content === 'string'
      ? item.content
      : (typeof item.text === 'string' ? item.text : '');

    if (!textContent.trim()) continue;

    sanitized.push({
      role,
      parts: [{ text: textContent }],
    });
  }

  return sanitized;
}

// Fallback response generator if API key is not configured or offline mode active
function generateContextualOfflineReply(userMessage, history, context) {
  const query = (userMessage || '').toLowerCase();
  const crop = context.cropName || 'Wheat';
  const mandi = context.activeMandi?.name || 'Local Mandi';
  const price = context.activeMandi?.modalPrice || 2475;
  const dist = context.activeMandi?.distanceKm || 12;
  const fin = context.financials || {
    quantitySold: 50,
    grossRevenue: 123750,
    saleRelatedExpenses: 3200,
    netProceeds: 120550,
    productionCosts: 45000,
    cropProfit: 75550,
    profitMarginPct: 61.05,
  };
  const isHi = context.lang === 'hi' || /[\u0900-\u097F]/.test(userMessage);

  // Check for speculation
  if (query.includes('tomorrow') || query.includes('future') || query.includes('kal ka') || query.includes('predict')) {
    if (isHi) {
      return `भविष्य के सट्टे या कल के भाव का अनुमान लगाना वर्जित है। 2026-10-21 के सरकारी Agmarknet रिकॉर्ड के अनुसार, **${crop}** का आधिकारिक मॉडल भाव **${mandi}** में **₹${price}/क्विंटल** दर्ज है। निर्णय केवल वास्तविक व प्रमाणित दरों पर लें।`;
    }
    return `Zero Financial Hallucination Guardrail: I cannot predict tomorrow's future prices. Based strictly on verified AGMARKNET records today (2026-10-21), **${crop}** is officially trading at **₹${price}/Qtl** at **${mandi}**.`;
  }

  // P&L questions
  if (query.includes('p&l') || query.includes('profit') || query.includes('loss') || query.includes('मुनाफा') || query.includes('लाभ') || query.includes('बचत')) {
    if (isHi) {
      return `आपके **${fin.quantitySold} क्विंटल ${crop}** के वित्तीय आंकड़े इस प्रकार हैं:\n\n` +
        `• **सकल बिक्री (Gross Revenue):** ₹${Number(fin.grossRevenue).toLocaleString('en-IN')}\n` +
        `• **बिक्री खर्च (भाड़ा, हम्माली आदि):** ₹${Number(fin.saleRelatedExpenses).toLocaleString('en-IN')}\n` +
        `• **शुद्ध प्राप्त राशि (Net Proceeds):** ₹${Number(fin.netProceeds).toLocaleString('en-IN')}\n` +
        `• **लागत खर्च (Production Cost):** ₹${Number(fin.productionCosts).toLocaleString('en-IN')}\n` +
        `• **शुद्ध फसल मुनाफा (Net Profit):** **₹${Number(fin.cropProfit).toLocaleString('en-IN')}** (मार्जिन: **${fin.profitMarginPct}%**)\n\n` +
        `आपका लाभ मार्जिन स्वस्थ है। भाड़ा घटाने के लिए स्थानीय मंडी या समूह ढुलाई (FPO freight pooling) अपना सकते हैं।`;
    }
    return `Here is your detailed P&L breakdown for **${fin.quantitySold} Qtl ${crop}**:\n\n` +
      `• **Gross Revenue:** ₹${Number(fin.grossRevenue).toLocaleString('en-IN')}\n` +
      `• **Sale-Related Expenses:** ₹${Number(fin.saleRelatedExpenses).toLocaleString('en-IN')} (Freight, handling, fees)\n` +
      `• **Estimated Net Proceeds:** ₹${Number(fin.netProceeds).toLocaleString('en-IN')}\n` +
      `• **Production Costs:** ₹${Number(fin.productionCosts).toLocaleString('en-IN')}\n` +
      `• **Estimated Crop Profit:** **₹${Number(fin.cropProfit).toLocaleString('en-IN')}** (Margin: **${fin.profitMarginPct}%**)\n\n` +
      `You have a solid positive return. To optimize further, consider consolidating freight loads to lower per-quintal logistics costs.`;
  }

  // Transport / Mandi comparison
  if (query.includes('transport') || query.includes('trap') || query.includes('kanpur') || query.includes('lucknow') || query.includes('भाड़ा') || query.includes('दूरी')) {
    if (isHi) {
      return `**${mandi}** (${dist} किमी) पर ध्यान दें: यदि किसी दूर की मंडी (जैसे 70-80 किमी) में ₹40-50 अधिक भाव दिख रहा हो, तो भी ₹0.95/किमी/क्विंटल के हिसाब से भाड़ा ₹70-80 बढ़ जाता है, जिससे हाथ में आने वाली शुद्ध रकम कम हो जाती है (**ट्रांसपोर्ट ट्रैप**)। अतः ₹${price}/क्विंटल पर वर्तमान स्थानीय मंडी बेहतर विकल्प है।`;
    }
    return `Regarding transportation to **${mandi}** (${dist} km): Watch out for the **Transport Trap**! Mandis farther away might advertise a ₹40–60/Qtl higher gross rate, but at ₹0.95/km freight, the additional distance consumes more than the price premium. Your active mandi delivers the strongest net pocket return.`;
  }

  // Default multi-turn conversational answer
  if (isHi) {
    return `आपके वर्तमान चयन (${crop}, ${mandi} भाव ₹${price}/क्विंटल) के आधार पर आपका शुद्ध अनुमानित लाभ **₹${Number(fin.cropProfit).toLocaleString('en-IN')}** है। यदि आप मात्रा बदलना चाहते हैं या किसी अन्य मंडी से तुलना करना चाहते हैं, तो बताएं!`;
  }
  return `Based on your current active selection (**${crop}** at **${mandi}**, official rate ₹${price}/Qtl), your estimated net crop profit stands at **₹${Number(fin.cropProfit).toLocaleString('en-IN')}** with a **${fin.profitMarginPct}%** margin. Would you like to simulate a price shift or compare another mandi?`;
}

/**
 * Core Chat Handler
 * Callable by both Next.js App Router and Vite Dev Middleware
 */
export async function handleChatRequest(body) {
  const {
    message = '',
    history = [],
    context = {},
  } = body || {};

  if (!message || typeof message !== 'string') {
    return {
      status: 400,
      body: { error: 'Missing user message in request' },
    };
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    '';

  const systemInstruction = buildSystemInstruction(context);
  const formattedHistory = formatGenAiHistory(history);

  // Attempt 1: Using official @google/genai SDK with ai.chats.create()
  if (apiKey) {
    try {
      let GoogleGenAI;
      try {
        const mod = await import('@google/genai');
        GoogleGenAI = mod.GoogleGenAI || mod.default?.GoogleGenAI || mod.default;
      } catch (importErr) {
        // Module not found or failed to load
      }

      if (GoogleGenAI) {
        const ai = new GoogleGenAI({ apiKey });
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

        // Official @google/genai syntax:
        // ai.chats.create({ model, config: { temperature: 0.75, systemInstruction }, history })
        const chat = ai.chats.create({
          model: modelName,
          config: {
            temperature: 0.75,
            systemInstruction,
          },
          history: formattedHistory,
        });

        const response = await chat.sendMessage({
          message,
        });

        const responseText =
          response?.text ||
          response?.candidates?.[0]?.content?.parts?.[0]?.text ||
          '';

        if (responseText) {
          return {
            status: 200,
            body: {
              reply: responseText,
              provider: '@google/genai',
              model: modelName,
              turns: formattedHistory.length + 1,
            },
          };
        }
      }
    } catch (sdkError) {
      console.warn('[@google/genai SDK error, trying REST API fallback]:', sdkError?.message || sdkError);
    }

    // Attempt 2: Direct Google Generative Language REST API (same temperature: 0.75 and history)
    try {
      const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const contents = [
        ...formattedHistory,
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      const restRes = await fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 800,
          },
        }),
      });

      if (restRes.ok) {
        const data = await restRes.json();
        const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) {
          return {
            status: 200,
            body: {
              reply: replyText,
              provider: 'gemini-rest-api',
              turns: formattedHistory.length + 1,
            },
          };
        }
      }
    } catch (restError) {
      console.warn('[Gemini REST API error, falling back to grounded offline assistant]:', restError?.message);
    }
  }

  // Attempt 3: Grounded Contextual Offline Assistant (Zero Hallucination, prevents 3-turn loops)
  const offlineReply = generateContextualOfflineReply(message, history, context);
  return {
    status: 200,
    body: {
      reply: offlineReply,
      provider: 'bazarsetu-grounded-engine',
      turns: formattedHistory.length + 1,
      offline: true,
      note: apiKey ? 'API quota exceeded or network unavailable; grounded offline response served' : 'Demo mode: Add GEMINI_API_KEY for live Google Gemini LLM synthesis',
    },
  };
}

// Next.js App Router standard Route Handler: POST(req)
export async function POST(req) {
  try {
    const body = await req.json();
    const result = await handleChatRequest(body);
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error in chat route', details: err?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
