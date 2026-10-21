from datetime import datetime
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import MandiObservation
from schemas import MandiReturnEvaluation, NetReturnResponse

REFERENCE_DATE_STR = "2026-10-21"

def parse_date(d_str: str) -> datetime:
    return datetime.strptime(d_str, "%Y-%m-%d")

def evaluate_mandis_for_commodity(
    db: Session,
    commodity: str,
    quantity_qtl: float = 25.0,
    rate_per_km_per_qtl: float = 0.95,
    hammali_per_qtl: float = 18.0,
    ref_date_str: str = REFERENCE_DATE_STR
) -> NetReturnResponse:
    ref_date = parse_date(ref_date_str)

    # Fetch unique market IDs for this commodity
    records = db.query(MandiObservation).filter(
        MandiObservation.commodity_canonical == commodity.lower()
    ).all()

    # Group by market_id
    market_map: Dict[str, List[MandiObservation]] = {}
    for r in records:
        market_map.setdefault(r.market_id, []).append(r)

    evaluations: List[MandiReturnEvaluation] = []

    for m_id, obs_list in market_map.items():
        # Sort by arrival_date desc
        obs_sorted = sorted(obs_list, key=lambda x: x.arrival_date, reverse=True)
        latest_obs = obs_sorted[0]
        obs_count = len(obs_sorted)

        # 7-day history aligned with dates up to ref_date
        # Reference dates: [2026-10-15 to 2026-10-21] (7 dates)
        date_series = [
            "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18",
            "2026-10-19", "2026-10-20", "2026-10-21"
        ]
        price_by_date = {o.arrival_date: o.modal_price for o in obs_sorted}
        history_7d = [price_by_date.get(d, None) for d in date_series]

        # Calculate staleness
        obs_date = parse_date(latest_obs.arrival_date)
        days_old = (ref_date - obs_date).days

        # Status badge determination
        if latest_obs.modal_price is None or (days_old > 0 and ref_date_str not in price_by_date):
            if days_old >= 2:
                status_badge = f"LAST OBSERVATION IS OUTDATED ({days_old}d OLD)"
            else:
                status_badge = "NO RATE REPORTED"
        elif days_old == 0:
            status_badge = "RECENT REPORT AVAILABLE (0d)"
        elif days_old == 1:
            status_badge = "RECENT REPORT AVAILABLE (1d)"
        elif days_old >= 2:
            status_badge = f"LAST OBSERVATION IS OUTDATED ({days_old}d OLD)"
        else:
            status_badge = "INSUFFICIENT DATA (<3 observations)"

        if obs_count < 3 and status_badge.startswith("RECENT"):
            status_badge = "INSUFFICIENT DATA (<3 observations)"

        # Price today vs prev
        today_modal = latest_obs.modal_price if days_old == 0 else None
        prev_modal = None
        if len(obs_sorted) > 1:
            prev_modal = obs_sorted[1].modal_price

        price_direction = "NONE"
        price_diff = None
        if today_modal is not None and prev_modal is not None:
            price_diff = today_modal - prev_modal
            if price_diff > 0:
                price_direction = "UP"
            elif price_diff < 0:
                price_direction = "DOWN"
            else:
                price_direction = "FLAT"

        # Costs
        transport_cost = latest_obs.distance_km * rate_per_km_per_qtl
        total_deduction = transport_cost + hammali_per_qtl

        if today_modal is not None:
            net_return = round(today_modal - total_deduction, 2)
            total_payout = round(net_return * quantity_qtl, 2)
        else:
            net_return = None
            total_payout = None

        evaluations.append(MandiReturnEvaluation(
            market_id=m_id,
            market_name=latest_obs.market_name,
            district_name=latest_obs.district_name,
            state_code=latest_obs.state_code,
            distance_km=latest_obs.distance_km,
            latest_date=latest_obs.arrival_date,
            days_old=days_old,
            status_badge=status_badge,
            today_modal=today_modal,
            prev_modal=prev_modal,
            price_direction=price_direction,
            price_diff=price_diff,
            transport_cost_per_qtl=round(transport_cost, 2),
            hammali_cost_per_qtl=hammali_per_qtl,
            total_deduction_per_qtl=round(total_deduction, 2),
            net_return_per_qtl=net_return,
            total_payout=total_payout,
            history_7d=history_7d
        ))

    # Determine best mandi (highest net_return_per_qtl)
    active_evals = [e for e in evaluations if e.net_return_per_qtl is not None]
    best_mandi = None
    if active_evals:
        active_evals.sort(key=lambda x: x.net_return_per_qtl, reverse=True)
        best_mandi = active_evals[0]
        best_mandi.is_best_net_profit = True

    # Detect Transport Trap
    # Higher gross price than best mandi, but lower net return due to distance
    trap_mandi = None
    if best_mandi:
        for e in active_evals:
            if e.today_modal and best_mandi.today_modal:
                if e.today_modal > best_mandi.today_modal and e.net_return_per_qtl < best_mandi.net_return_per_qtl:
                    e.is_transport_trap = True
                    diff_gross = round(e.today_modal - best_mandi.today_modal, 2)
                    diff_net = round(best_mandi.net_return_per_qtl - e.net_return_per_qtl, 2)
                    e.trap_warning = (
                        f"TRANSPORT TRAP: Gross rate is +₹{diff_gross}/q higher at {e.market_name}, "
                        f"but distance ({e.distance_km} km) eats ₹{e.transport_cost_per_qtl}/q in freight, "
                        f"leaving you ₹{diff_net}/q POORER than {best_mandi.market_name}!"
                    )
                    if not trap_mandi:
                        trap_mandi = e

    # Sort evaluations: Best net profit first, then others, then stale/unreported last
    def sort_key(item: MandiReturnEvaluation):
        if item.net_return_per_qtl is not None:
            return (0, -item.net_return_per_qtl)
        return (1, item.days_old if item.days_old is not None else 999)

    evaluations.sort(key=sort_key)

    return NetReturnResponse(
        commodity=commodity,
        quantity_qtl=quantity_qtl,
        reference_date=ref_date_str,
        evaluated_mandis=evaluations,
        best_mandi=best_mandi,
        transport_trap_mandi=trap_mandi
    )
