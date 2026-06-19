# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.predict import router as predict_router

app = FastAPI()

# allow Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)