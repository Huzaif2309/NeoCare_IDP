# app/model/predictor.py

import numpy as np
from app.model.loader import model, scaler, label_encoder
from app.model.preprocess import preprocess_input

def predict(data: dict):
    X = preprocess_input(data, scaler)

    probs = model.predict(X)
    pred_class = np.argmax(probs, axis=1)

    label = label_encoder.inverse_transform(pred_class)

    return {
        "prediction": label[0],
        "confidence": float(np.max(probs))
    }