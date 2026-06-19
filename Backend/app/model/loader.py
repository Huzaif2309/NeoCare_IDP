# app/model/loader.py

from tensorflow.keras.models import load_model
import joblib

MODEL_PATH = "models/sids_dense_best.keras"
SCALER_PATH = "models/scaler.pkl"
ENCODER_PATH = "models/label_encoder.pkl"

model = load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
label_encoder = joblib.load(ENCODER_PATH)