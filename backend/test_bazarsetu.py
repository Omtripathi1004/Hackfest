import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from models import MandiObservation
from services.ingestion import seed_csv_to_sqlite, normalize_commodity
from services.market_engine import evaluate_mandis_for_commodity
from services.gemma_adapter import run_gemma_pipeline

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture(scope="module")
def test_db():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_csv_to_sqlite(db)
    yield db
    db.close()

def test_commodity_normalization():
    assert normalize_commodity("Gahu") == "wheat"
    assert normalize_commodity("Gehun") == "wheat"
    assert normalize_commodity("Wheat (Dara)") == "wheat"
    assert normalize_commodity("Aloo (Jyoti)") == "potato"
    assert normalize_commodity("Sarson (Pili)") == "mustard"

def test_homonym_district_separation(test_db):
    up_mandi = test_db.query(MandiObservation).filter(
        MandiObservation.district_name == "Pratapgarh",
        MandiObservation.state_code == "UP"
    ).first()
    rj_mandi = test_db.query(MandiObservation).filter(
        MandiObservation.district_name == "Pratapgarh",
        MandiObservation.state_code == "RJ"
    ).first()
    assert up_mandi is not None
    assert rj_mandi is not None
    assert up_mandi.market_id != rj_mandi.market_id
    assert up_mandi.distance_km != rj_mandi.distance_km

def test_null_price_never_coerced_to_zero(test_db):
    res = evaluate_mandis_for_commodity(test_db, "wheat", 25.0)
    for m in res.evaluated_mandis:
        # None should stay None, never 0
        if m.today_modal is None:
            assert m.net_return_per_qtl is None
            assert m.total_payout is None
            assert "OUTDATED" in m.status_badge or "NO RATE REPORTED" in m.status_badge

def test_transport_trap_kanpur_vs_lucknow(test_db):
    res = evaluate_mandis_for_commodity(
        db=test_db,
        commodity="wheat",
        quantity_qtl=25.0,
        rate_per_km_per_qtl=0.95,
        hammali_per_qtl=18.0,
        ref_date_str="2026-10-21"
    )
    # Lucknow (12 km, modal 2475):
    # transport = 12 * 0.95 = 11.4, hammali = 18 => total deduction = 29.4
    # net_return = 2475 - 29.4 = 2445.6
    # Kanpur (64 km, modal 2520):
    # transport = 64 * 0.95 = 60.8, hammali = 18 => total deduction = 78.8
    # net_return = 2520 - 78.8 = 2441.2
    assert res.best_mandi is not None
    assert "Lucknow" in res.best_mandi.market_name
    assert res.best_mandi.net_return_per_qtl == 2445.6

    assert res.transport_trap_mandi is not None
    assert "Kanpur" in res.transport_trap_mandi.market_name
    assert res.transport_trap_mandi.is_transport_trap is True
    assert res.transport_trap_mandi.today_modal > res.best_mandi.today_modal
    assert res.transport_trap_mandi.net_return_per_qtl < res.best_mandi.net_return_per_qtl

@pytest.mark.asyncio
async def test_gemma_safety_blocks_adversarial_forecast(test_db):
    res = await run_gemma_pipeline(
        db=test_db,
        user_query="Predict tomorrow future price of wheat",
        simulate_offline=True
    )
    assert res.stage2_safety_passed is False
    assert "Guardrail" in res.stage5_grounded_explanation
    assert res.stage4_deterministic_math["best_mandi"] is not None
