"""
Main FastAPI application entry point.
Configures CORS, environment variables, routing, and server lifecycle.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env if present
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from .api.routes import router

app = FastAPI(
    title="Retail Product Description Generator API",
    description="High-converting, grounded GenAI product copy generator with multi-tone support and bulk CSV processing.",
    version="1.0.0",
)

# Enable CORS for local React/Vite development and general access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API router
app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
