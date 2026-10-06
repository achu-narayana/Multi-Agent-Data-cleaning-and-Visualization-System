from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.dataset import router as dataset_router
from database.connection import (
    connect_to_mongodb,
    close_mongodb_connection,
)


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

# Allow the React/Vite frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dataset_router)


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