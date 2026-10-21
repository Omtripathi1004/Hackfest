from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class MandiObservationBase(BaseModel):
    state_code: str
    state_name: str
    district_name: str
    market_name: str
    market_id: str
    commodity_canonical: str
    raw_commodity_name: str
    variety: str
    arrival_date: str
    modal_price: Optional[float] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    arrivals_tonnes: float = 0.0
    distance_km: float = 0.0
    officer_verified: bool = False

class MandiObservationOut(MandiObservationBase):
    id: int

    class Config:
        from_attributes = True

class NetReturnCalculationRequest(BaseModel):
    commodity: str = "wheat"
    quantity_qtl: float = Field(25.0, ge=1.0, le=500.0)
    rate_per_km_per_qtl: float = Field(0.95, ge=0.0)
    hammali_per_qtl: float = Field(18.0, ge=0.0)
    reference_date: str = "2026-10-21"

class MandiReturnEvaluation(BaseModel):
    market_id: str
    market_name: str
    district_name: str
    state_code: str
    distance_km: float
    latest_date: Optional[str]
    days_old: Optional[int]
    status_badge: str  # RECENT REPORT AVAILABLE, LAST OBSERVATION IS OUTDATED, NO RATE REPORTED, INSUFFICIENT DATA
    today_modal: Optional[float]
    prev_modal: Optional[float]
    price_direction: Optional[str]  # UP, DOWN, FLAT, NONE
    price_diff: Optional[float]
    transport_cost_per_qtl: float
    hammali_cost_per_qtl: float
    total_deduction_per_qtl: float
    net_return_per_qtl: Optional[float]
    total_payout: Optional[float]
    is_best_net_profit: bool = False
    is_transport_trap: bool = False
    trap_warning: Optional[str] = None
    history_7d: List[Optional[float]] = []

class NetReturnResponse(BaseModel):
    commodity: str
    quantity_qtl: float
    reference_date: str
    evaluated_mandis: List[MandiReturnEvaluation]
    best_mandi: Optional[MandiReturnEvaluation]
    transport_trap_mandi: Optional[MandiReturnEvaluation]

class GemmaQueryRequest(BaseModel):
    query: str
    simulate_offline: bool = False

class GemmaQueryResponse(BaseModel):
    stage1_input: str
    stage2_extracted_intent: Dict[str, Any]
    stage2_safety_passed: bool
    stage3_retrieved_records: List[Dict[str, Any]]
    stage4_deterministic_math: Dict[str, Any]
    stage5_grounded_explanation: str
    stage5_grounded_explanation_hi: str
    stage6_source_citations: List[str]
    offline_fallback_active: bool
