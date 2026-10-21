# BAZARSETU AI — Krishi Decision Intelligence
> *"Know the Price. Compare the Profit. Decide with Confidence."*
> 
> **Hackathon Tracks**: Problem Statement #2 ("What is it selling for today?") + MLH Best Use of Gemma 4 Track.

---

## 🌾 Overview
**BAZARSETU AI** is a production-grade agricultural trade intelligence platform engineered specifically for Indian farmers, FPOs, and APMC market participants. It addresses the common pitfall where a higher gross mandi price 60+ km away produces a lower net return after freight and unloading expenses (**Transport Trap**).

---

## 🏛️ Architecture & 6-Stage Grounded Pipeline

```
[ STAGE 1: Farmer Input ] (Hindi / English / Voice Speech API)
           │
           ▼
[ STAGE 2: Gemma 4 Intent & Safety ] (Extracts Crop & Qtl; Intercepts Speculation & Future Predictions)
           │
           ▼
[ STAGE 3: SQLite DB / AGMARKNET Snapshot ] (Verified observations; 0 forced zeroes; gaps preserved)
           │
           ▼
[ STAGE 4: Deterministic Math Engine ] (Net Return = Modal Price - Freight - Hammali; Transport Trap Check)
           │
           ▼
[ STAGE 5: Gemma 4 Grounded Synthesis ] (Bilingual explanation strictly citing Stage 3 & 4 data)
           │
           ▼
[ STAGE 6: Output Presentation ] (Source-cited cards, 2G SMS digest, Web Speech API audio briefing)
```

---

## 💎 Core Product Rules (Non-Negotiables)

1. **One Number, Large, With a Direction**:
   - The selected mandi's latest modal price per quintal (`₹/Quintal`), observation date, and price movement (`+₹` / `-₹` vs. previous date) are the visual hero.
2. **Never Interpolate Missing Data**:
   - If a mandi skipped reporting, it is displayed as **"NO RATE REPORTED" (`भाव उपलब्ध नहीं`)** with an honest visual gap (`connectNulls={false}`). Never coerced to ₹0.
3. **Distinguish Stale Data Honestly**:
   - Compares observation dates against reference date (`2026-10-21`) and badges each record:
     - `RECENT REPORT AVAILABLE (0–1d)`
     - `LAST OBSERVATION IS OUTDATED (≥2d old with exact age)`
     - `NO RATE REPORTED`
     - `INSUFFICIENT DATA (<3 observations)`
4. **Transport Trap Detection**:
   - Deterministic formula:
     $$\text{Net Return/Qtl} = \text{Modal Price} - \text{Transport/Qtl} - \text{Hammali/Qtl}$$
     $$\text{Total Payout} = \text{Net Return/Qtl} \times \text{Quantity}$$
   - When a distant mandi offers a higher gross price but yields lower net cash in hand than the best mandi, it is flagged with a **TRANSPORT TRAP** warning.
5. **Zero Financial Hallucination**:
   - Gemma 4 is strictly prohibited from inventing prices, forecasting future rates, or computing arithmetic. All math is executed deterministically in TypeScript / Python.
6. **Simulate Offline Mode**:
   - Full deterministic resilience allows judges to test 100% offline functionality without external LLM dependencies.

---

## 📑 7 Integrated Application Views

1. **Market Home (`मंडी भाव व मुनाफा`)**: Giant modal numeral, direction badge, freshness pill, Web Speech API voice briefing, and "Where Should I Take My Crop?" recommendation card.
2. **Mandi Profit Radar (`मंडी मुनाफा तुलना`)**: Interactive sliders for quantity (1–150 Qtl), vehicle presets (Tractor Trolley, Pickup, Mini Truck), hammali fee, and sortable comparison table highlighting `BEST NET PROFIT` vs. `HIGHER PRICE TRAP`.
3. **Price History (`भाव इतिहास व मौन मंडी`)**: 7-day honest chart with `connectNulls={false}` preserving gaps for closed mandis, accessible textual table, and MSP & 3-yr October seasonal benchmark comparisons.
4. **Gemma 4 Assistant (`Gemma 4 कृषि सहायक`)**: One-click Hindi/English query chips + adversarial test chip, 6-stage pipeline trace, extracted JSON schema, deterministic ground-truth packet, and offline simulation toggle.
5. **Decision Lab (`क्या-अगर सिम्युलेटर`)**: What-If sliders for price shifts (-10% to +10%), moisture deduction penalties, freight rate changes, and break-even price calculation for distant mandis. Explicit `SCENARIO ONLY` badge.
6. **Alerts & 2G Digest (`अलर्ट व SMS डाइजेस्ट`)**: Price threshold alert creator + 160-character copyable Hindi/English SMS & WhatsApp digest designed for rural 2G bandwidth and feature phones.
7. **Data Health, Officer & Acceptance Suite (`डेटा हेल्थ व टेस्ट`)**: Dataset audit, Mandi Officer verification queue with mandatory human review confirmation checkbox, and interactive automated acceptance test suite.

---

## 🤖 Gemma 4 Model Card

- **Model ID**: `gemma4:e4b-it` (Edge-optimized 4-bit instruction-tuned) or `gemma4:9b-it`
- **Host / Serving**: Local Ollama (`http://localhost:11434/api/generate`)
- **Primary Function**:
  - Natural language intent extraction from farmer queries in Hindi and English.
  - Extraction of crop name and quantity into structured JSON.
  - Synthesis of clear, empathetic bilingual explanations citing verified AGMARKNET records.
- **Guardrails**:
  - Intercepts and blocks speculation requests (e.g., "predict tomorrow's price").
  - Falls back gracefully to deterministic rule-engine parser if Ollama is unreachable or toggled offline.
- **Limitations**:
  - Does not compute arithmetic or currency conversions directly.
  - Cannot speculate on unverified future market behavior.

---

## 🚀 Getting Started

### 1. Frontend Development Server (Already Running)
```bash
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

### 2. Backend FastAPI Server (Optional)
```bash
cd backend
pip install -r requirements.txt
python main.py
```
FastAPI runs on `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

### 3. Run Acceptance Tests
- **In Browser**: Navigate to Tab 7 (**Data Health & Tests**) and click **"Run Acceptance Tests"**.
- **Via Pytest**:
  ```bash
  cd backend
  pytest test_bazarsetu.py -v
  ```

---

## 🔒 Deployment Note
As requested, this project is kept strictly local and is **NOT** deployed to GitHub.
