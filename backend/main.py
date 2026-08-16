import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database.connection import engine, Base, SessionLocal
from .database.models import Tiger
from .database.seed import seed_database
from .api.router import api_router

app = FastAPI(
    title="PUGMARK — Automated Camera-Trap Triage & Tiger Intelligence System",
    description="Pench Tiger Reserve Offline-First Intelligence Engine",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for tiger flank crops and sample captures
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount REST API
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    tiger_count = db.query(Tiger).count()
    db.close()
    if tiger_count == 0:
        print("Database empty. Seeding Pench Tiger Reserve initial dataset...")
        seed_database()

@app.get("/")
def root():
    return {
        "system": "PUGMARK",
        "reserve": "Pench Tiger Reserve",
        "status": "Online",
        "mode": "Offline-First CPU Intelligence Engine"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
