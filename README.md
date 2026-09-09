# Modern Restaurant POS & Inventory Management System

A high-performance, full-stack Restaurant Point of Sale (POS), Kitchen Display System (KDS), Self-Ordering Kiosk, and Inventory Management platform built with **FastAPI** (Python) and **React** (Vite).

---

## 🌟 Key Features

- **Billing & Cashier POS Terminal**: Fast order entry, category search, item modifiers, order management, table selection & transfers, and thermal receipt preview.
- **Kitchen Display System (KDS)**: Real-time kitchen order board powered by WebSockets. Allows kitchen staff to move orders from *Pending* ➔ *Preparing* ➔ *Ready* ➔ *Served*.
- **Self-Ordering Kiosk**: Intuitive, customer-facing self-service terminal for guest ordering.
- **Inventory & Recipe Management**:
  - Track stock levels & purchase entries.
  - Link menu items to recipes & ingredient breakdown.
  - Automatic stock deduction upon order completion.
  - Wastage and expiration tracking with financial loss logs.
- **Executive Dashboard & Reports**:
  - Business Intelligence analytics on daily revenue, order counts, and top-selling items.
  - Stock valuation and operational loss reporting.
- **Role-Based Landing & Staff Login**: Secure PIN/password authentication for multi-role access (Cashier, Kitchen, Inventory Manager, Admin).

---

## 🏗️ Project Architecture

```
POS_system/
├── backend/                  # FastAPI Backend Application
│   ├── app/
│   │   ├── main.py           # Application entrypoint & CORS setup
│   │   ├── models.py         # SQLAlchemy database models
│   │   ├── schemas.py        # Pydantic data schemas
│   │   ├── crud.py           # Database CRUD operations
│   │   ├── database.py       # DB Connection & session config
│   │   └── routers/          # API Routers & Endpoints
│   │       ├── auth.py       # Authentication & staff PIN check
│   │       ├── pos.py        # Orders, billing, table transfers
│   │       ├── kds_ws.py     # Real-time WebSocket for Kitchen Display
│   │       ├── kiosk.py      # Self-service kiosk endpoints
│   │       ├── inventory.py  # Stock management & wastage tracking
│   │       ├── dashboard.py  # Executive metrics
│   │       └── reports.py    # Analytics & financial reports
│   ├── main.py               # Root uvicorn entry script
│   └── requirements.txt      # Python dependencies
│
└── frontend/                 # React + Vite Frontend Application
    ├── src/
    │   ├── views/            # Screen views & module pages
    │   │   ├── LandingPortalView.jsx
    │   │   ├── StaffLoginView.jsx
    │   │   ├── PosView.jsx
    │   │   ├── KdsView.jsx
    │   │   ├── KioskView.jsx
    │   │   ├── InventoryView.jsx
    │   │   ├── DashboardView.jsx
    │   │   └── ReportsView.jsx
    │   ├── components/       # Reusable UI components & SidebarNav
    │   ├── api/              # API Client & service handlers
    │   ├── App.jsx           # Main routing & state layout
    │   └── main.jsx          # Vite React root mounting
    ├── package.json          # Node dependencies
    └── vite.config.js        # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.9 or higher
- **Node.js**: v18 or higher (npm included)

---

### 🛠️ 1. Backend Setup (FastAPI)

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   - **Windows**:
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install backend dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize Database & Seed Data** *(Optional)*:
   ```bash
   python reroll_db.py
   ```

5. **Run the FastAPI server**:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   The backend API will be available at `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

---

### 🎨 2. Frontend Setup (React + Vite)

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start Vite development server**:
   ```bash
   npm run dev
   ```
   The web app will run locally (typically at `http://localhost:5173`).

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Lucide React (Icons), Custom CSS design system with glassmorphism & responsive layouts.
- **Backend**: FastAPI, SQLAlchemy ORM, SQLite database, Pydantic V2, WebSockets.

---

## 📜 License

This project is licensed under the MIT License.
