import re
import json
import httpx
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from services.ingestion import normalize_commodity
from services.market_engine import evaluate_mandis_for_commodity
from schemas import GemmaQueryResponse

OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "gemma4:e4b-it"

SAFETY_BLOCKED_KEYWORDS = [
    "predict tomorrow",
    "forecast",
    "future price",
    "kal ka bhav kya hoga",
    "aane wale kal",
    "bhav kya banega",
    "bhav badhega ya ghatega",
    "invent price",
    "speculate"
]

async def call_ollama(prompt: str, model: str = DEFAULT_MODEL) -> Optional[str]:
    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            resp = await client.post(
                OLLAMA_GENERATE_URL,
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("response")
    except Exception:
        return None
    return None

async def run_gemma_pipeline(
    db: Session,
    user_query: str,
    simulate_offline: bool = False
) -> GemmaQueryResponse:
    # STAGE 1: INPUT
    raw_query = user_query.strip()

    # STAGE 2: INTENT + JSON EXTRACT & SAFETY GUARDRAIL
    query_lower = raw_query.lower()
    is_adversarial_forecast = any(kw in query_lower for kw in SAFETY_BLOCKED_KEYWORDS)

    detected_crop = "wheat"
    detected_qty = 25.0

    # Pattern match fallback
    if "aloo" in query_lower or "potato" in query_lower or "आलू" in query_lower:
        detected_crop = "potato"
    elif "sarson" in query_lower or "mustard" in query_lower or "सरसों" in query_lower:
        detected_crop = "mustard"
    elif "dhan" in query_lower or "paddy" in query_lower or "धान" in query_lower:
        detected_crop = "paddy"
    elif "pyaz" in query_lower or "onion" in query_lower or "प्याज" in query_lower or "kanda" in query_lower:
        detected_crop = "onion"
    elif "tamatar" in query_lower or "tomato" in query_lower or "टमाटर" in query_lower:
        detected_crop = "tomato"

    qty_match = re.search(r'(\d+)\s*(qtl|quintal|क्विंटल|बोरी)?', query_lower)
    if qty_match:
        try:
            detected_qty = float(qty_match.group(1))
            detected_qty = max(1.0, min(detected_qty, 300.0))
        except ValueError:
            pass

    offline_active = simulate_offline

    if not simulate_offline and not is_adversarial_forecast:
        prompt = (
            f"You are a strict data extraction assistant. Extract crop canonical name "
            f"(wheat, potato, mustard, paddy, onion, tomato) and quantity_qtl (number) "
            f"from the farmer query: \"{raw_query}\". Return JSON ONLY: "
            f'{{"crop": "wheat", "quantity_qtl": 25}}'
        )
        ollama_res = await call_ollama(prompt)
        if ollama_res:
            try:
                parsed = json.loads(ollama_res)
                if "crop" in parsed:
                    detected_crop = normalize_commodity(parsed["crop"])
                if "quantity_qtl" in parsed:
                    detected_qty = float(parsed["quantity_qtl"])
            except Exception:
                offline_active = True
        else:
            offline_active = True
    else:
        offline_active = True

    # STAGE 3: SQLITE DB RECORD RETRIEVAL & STAGE 4: DETERMINISTIC MATH
    eval_result = evaluate_mandis_for_commodity(
        db=db,
        commodity=detected_crop,
        quantity_qtl=detected_qty
    )

    best = eval_result.best_mandi
    trap = eval_result.transport_trap_mandi

    # STAGE 5: GEMMA 4 GROUNDED BILINGUAL SYNTHESIS
    if is_adversarial_forecast:
        explanation_en = (
            f"Zero Financial Hallucination Guardrail: I cannot predict future prices or speculate on tomorrow's market. "
            f"Based strictly on verified AGMARKNET observations today (2026-10-21), {detected_crop.capitalize()} is selling for "
            f"₹{best.today_modal if best else 'N/A'}/qtl at {best.market_name if best else 'local mandi'}."
        )
        explanation_hi = (
            f"गार्डरेल चेतावनी: भविष्य के भाव का अनुमान लगाना वर्जित है। केवल 2026-10-21 के सरकारी Agmarknet रिकॉर्ड के अनुसार, "
            f"{detected_crop} का वास्तविक भाव ₹{best.today_modal if best else 'N/A'}/क्विंटल है।"
        )
    elif best:
        explanation_en = (
            f"Best Net-Pocket Mandi for {detected_qty} Qtl {detected_crop.capitalize()} is {best.market_name} ({best.district_name}). "
            f"Official Agmarknet modal rate is ₹{best.today_modal}/qtl. After deducting ₹{best.transport_cost_per_qtl}/qtl freight "
            f"({best.distance_km} km) and ₹{best.hammali_cost_per_qtl}/qtl hammali, you take home ₹{best.net_return_per_qtl}/qtl "
            f"(Total payout: ₹{best.total_payout:,.2f})."
        )
        if trap:
            explanation_en += (
                f" CAUTION: Avoid {trap.market_name} (Gross ₹{trap.today_modal}/qtl) — distance costs make your net return "
                f"₹{trap.net_return_per_qtl}/qtl (Transport Trap)!"
            )

        explanation_hi = (
            f"{detected_qty} क्विंटल {detected_crop} के लिए सर्वाधिक फायदेमंद मंडी {best.market_name} है। "
            f"सरकारी भाव ₹{best.today_modal}/क्विंटल है। दूरी ({best.distance_km} किमी) का भाड़ा व हम्माली काटकर "
            f"शुद्ध हाथ में ₹{best.net_return_per_qtl}/क्विंटल (कुल ₹{best.total_payout:,.0f}) मिलेंगे।"
        )
        if trap:
            explanation_hi += (
                f" चेतावनी: {trap.market_name} में सकल भाव ₹{trap.today_modal} दिखता है, पर ज्यादा दूरी के कारण यह 'भाड़ा जाल' (Transport Trap) है!"
            )
    else:
        explanation_en = f"No active reporting mandis found for {detected_crop} on 2026-10-21."
        explanation_hi = f"{detected_crop} के लिए 2026-10-21 को कोई सक्रिय मंडी रिपोर्ट प्राप्त नहीं हुई।"

    # STAGE 6: SOURCE-CITED CARD
    citations = [
        "Government of India AGMARKNET Daily Mandi Feed (Snapshot v2026_10_21)",
        f"Verified SQLite Records ({len(eval_result.evaluated_mandis)} active mandis evaluated)",
        "Deterministic Freight Engine (₹0.95/km/qtl + ₹18/qtl Hammali)"
    ]

    return GemmaQueryResponse(
        stage1_input=raw_query,
        stage2_extracted_intent={
            "commodity": detected_crop,
            "quantity_qtl": detected_qty,
            "adversarial_forecast_detected": is_adversarial_forecast
        },
        stage2_safety_passed=not is_adversarial_forecast,
        stage3_retrieved_records=[
            {
                "market": m.market_name,
                "district": m.district_name,
                "state": m.state_code,
                "modal_price": m.today_modal,
                "distance_km": m.distance_km,
                "status": m.status_badge
            } for m in eval_result.evaluated_mandis[:4]
        ],
        stage4_deterministic_math={
            "best_mandi": best.market_name if best else None,
            "best_net_return": best.net_return_per_qtl if best else None,
            "total_payout": best.total_payout if best else None,
            "transport_trap_detected": trap.market_name if trap else None,
            "formula": "Net Return = Modal Price - (Distance * RatePerKm) - Hammali"
        },
        stage5_grounded_explanation=explanation_en,
        stage5_grounded_explanation_hi=explanation_hi,
        stage6_source_citations=citations,
        offline_fallback_active=offline_active
    )
