from fastapi import APIRouter, HTTPException
from app.db.queries import (
    get_infant,
    get_latest_vitals,
    get_latest_sensor_data
)
from app.model.mapper import map_to_model_input
from app.model.predictor import predict

router = APIRouter()

@router.post("/predict/{infant_id}")
def predict_infant(infant_id: str):
    # 1. Pull core identity profile
    infant = get_infant(infant_id)
    if not infant:
        raise HTTPException(
            status_code=404,
            detail="Infant identity record not found"
        )

    # 2. Pull diagnostic logs matrix
    vitals = get_latest_vitals(infant_id)
    if not vitals:
        raise HTTPException(
            status_code=404,
            detail="No background baseline vitals found for this patient"
        )

    # 3. Pull streaming hardware telemetry
    sensor_data = get_latest_sensor_data(infant_id)
    if not sensor_data:
        # If your model strictly depends on real-time features, block here.
        # Otherwise, pass None and let the mapper apply baseline fallbacks.
        raise HTTPException(
            status_code=404,
            detail="Active IoT telemetry stream sequence frame missing"
        )

    # 4. Map hybrid tables into model input schema
    model_input = map_to_model_input(
        infant,
        vitals,
        sensor_data
    )

    # 5. Compute Prediction
    result = predict(model_input)

    return {
        "infant_id": infant_id,
        "prediction": result
    }