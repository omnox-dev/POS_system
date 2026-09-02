import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.seed import seed_database
from app.routers import kiosk, pos, inventory, dashboard, auth, kds_ws, reports

# Create tables in database
Base.metadata.create_all(bind=engine)

# Auto seed database on startup
seed_database()

app = FastAPI(
    title="Restaurant Management POS & Inventory System API",
    description="Unified backend API for Self-Ordering Kiosk, Cashier POS & Billing, Recipe Inventory Engine, Executive Dashboard, Financial Reports, KDS WebSockets, and Authentication.",
    version="2.1.0"
)

# Configure CORS for Vite React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routers
app.include_router(auth.router)
app.include_router(kds_ws.router)
app.include_router(kiosk.router)
app.include_router(pos.router)
app.include_router(inventory.router)
app.include_router(dashboard.router)
app.include_router(reports.router)

@app.get("/")
def root():
    return {
        "system": "Restaurant POS & Inventory Management System",
        "status": "Online",
        "docs_url": "/docs",
        "modules": [
            "/api/auth",
            "/ws/kds",
            "/api/kiosk",
            "/api/pos",
            "/api/inventory",
            "/api/dashboard",
            "/api/reports"
        ]
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)


