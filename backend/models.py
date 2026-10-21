from sqlalchemy import Column, Integer, String, Float, Date, Boolean
from database import Base

class MandiObservation(Base):
    __tablename__ = "mandi_observations"

    id = Column(Integer, primary_key=True, index=True)
    state_code = Column(String(5), index=True)
    state_name = Column(String(50))
    district_name = Column(String(50), index=True)
    market_name = Column(String(100), index=True)
    market_id = Column(String(50), index=True)
    commodity_canonical = Column(String(50), index=True)
    raw_commodity_name = Column(String(100))
    variety = Column(String(50))
    arrival_date = Column(String(10), index=True)  # YYYY-MM-DD
    modal_price = Column(Float, nullable=True)     # None if no rate reported
    min_price = Column(Float, nullable=True)
    max_price = Column(Float, nullable=True)
    arrivals_tonnes = Column(Float, default=0.0)
    distance_km = Column(Float, default=0.0)
    is_verified = Column(Boolean, default=True)
    officer_verified = Column(Boolean, default=False)
