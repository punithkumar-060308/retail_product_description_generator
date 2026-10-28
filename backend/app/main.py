"""
Main FastAPI application entry point.
Configures CORS, environment variables, routing, and server lifecycle.
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env if present
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from .db.database import Base, engine
from .db.mongo import init_mongo_indexes, is_mongo_configured, ping_mongo
from .api.routes import router
from .api.auth_routes import auth_router

# Create database tables automatically
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if is_mongo_configured():
        connection = ping_mongo()
        if not connection["connected"]:
            raise RuntimeError(connection["reason"])
        init_mongo_indexes()
    yield


app = FastAPI(
    title="Retail Product Description Generator API",
    description="High-converting, grounded GenAI product copy generator with multi-tone support and bulk CSV processing.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for local React/Vite development and general access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(router)
app.include_router(auth_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
