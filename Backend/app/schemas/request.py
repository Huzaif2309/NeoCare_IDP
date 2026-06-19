# app/schemas/request.py

from pydantic import BaseModel

class BabyData(BaseModel):
    baby_id: str
    name: str
    gender: str
    gestational_age_weeks: int
    birth_weight_kg: float
    birth_length_cm: float
    birth_head_circumference_cm: float
    date: str
    age_days: int
    weight_kg: float
    length_cm: float
    head_circumference_cm: float
    temperature_c: float
    heart_rate_bpm: int
    respiratory_rate_bpm: int
    oxygen_saturation: int
    feeding_type: str
    feeding_frequency_per_day: int
    urine_output_count: int
    stool_count: int
    jaundice_level_mg_dl: float
    apgar_score: float
    immunizations_done: str
    reflexes_normal: str