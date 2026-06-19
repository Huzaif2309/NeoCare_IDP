def map_to_model_input(infant, vitals, sensor_data):
    # Ensure we safely have sensor fallbacks if the hardware stream hasn't started yet
    sensors = sensor_data or {}

    return {
        "baby_id": str(infant["id"]),
        "name": infant.get("name"),
        "gender": infant.get("gender"),
        "gestational_age_weeks": infant.get("gestational_age_weeks"),
        "birth_weight_kg": infant.get("birth_weight_kg", 0.0),
        "birth_length_cm": infant.get("birth_length_cm", 0.0),
        "birth_head_circumference_cm": infant.get("birth_head_circumference_cm", 0.0),

        # Date of the assessment frame
        "date": str(sensors.get("recorded_at") or vitals.get("created_at")),

        # Clinical Caregiver Log Data
        "age_days": vitals.get("age_days", 0),
        "weight_kg": vitals.get("weight_kg"),
        "length_cm": vitals.get("length_cm"),
        "head_circumference_cm": vitals.get("head_circumference_cm"),
        "feeding_type": vitals.get("feeding_type", "Breastfeeding"),
        "feeding_frequency_per_day": vitals.get("feeding_frequency_per_day", 0),
        "urine_output_count": vitals.get("urine_output_count", 0),
        "stool_count": vitals.get("stool_count", 0),
        "jaundice_level_mg_dl": vitals.get("jaundice_level_mg_dl", 0.0),
        "apgar_score": vitals.get("apgar_score", 0.0),
        "immunizations_done": vitals.get("immunizations_done", "No"),
        "reflexes_normal": vitals.get("reflexes_normal", "Yes"),

        # Real-time IoT Sensor Data Split
        "temperature_c": sensors.get("temperature_c", 36.5),
        "heart_rate_bpm": sensors.get("heart_rate_bpm", 130),
        "respiratory_rate_bpm": sensors.get("respiratory_rate_bpm", 40),
        
        # Mapping fallback for oxygen/movement variance
        "oxygen_saturation": sensors.get("oxygen_saturation", 98)  
    }