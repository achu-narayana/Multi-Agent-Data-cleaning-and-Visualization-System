import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.analytics import router as analytics_router
from routes.auth import router as auth_router
from routes.chat import router as chat_router
from routes.dataset import router as dataset_router
from database.connection import (
    connect_to_mongodb,
    close_mongodb_connection,
)


load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongodb()
    yield
    await close_mongodb_connection()


app = FastAPI(
    title="AURA Data Intelligence API",
    description="Multi-Agent Data Cleaning and Visualization Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the React/Vite frontend to communicate with FastAPI.
# Any localhost port is allowed so Vite can fall back to another port;
# extra origins (e.g. a deployed frontend) come from CORS_ORIGINS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "").split(",")
        if origin.strip()
    ],
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(auth_router)
app.include_router(dataset_router)
app.include_router(analytics_router)
app.include_router(chat_router)


@app.get("/")
async def root():
    return {
        "message": "AURA Data Intelligence API is running",
        "status": "success",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AURA Backend",
    }
