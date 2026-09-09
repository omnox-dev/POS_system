<div align="center">

  # 🍽️ RESTAURANT POS & INVENTORY MANAGEMENT SYSTEM
  ### *A High-Performance, Full-Stack Restaurant OS with Real-Time KDS, Self-Kiosk & Recipe Inventory Engine*

  [![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Build-Vite%204-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![SQLite](https://img.shields.io/badge/Database-SQLite%20%2B%20SQLAlchemy-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
  [![WebSockets](https://img.shields.io/badge/RealTime-WebSockets-FF6C37?style=for-the-badge&logo=socketdotio&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
  [![License](https://img.shields.io/badge/License-MIT-blue.style=for-the-badge)](#-license)

  <p align="center">
    <a href="#-system-architecture">Architecture</a> •
    <a href="#-key-modules--features">Modules</a> •
    <a href="#-quick-demo-credentials">Demo PINs</a> •
    <a href="#-rest-api--websocket-reference">API Docs</a> •
    <a href="#-getting-started">Installation</a>
  </p>

</div>

---

## 📸 System Overview

An enterprise-grade, full-stack restaurant software platform designed for high-volume billing, real-time kitchen orchestration, guest self-ordering, recipe-level stock tracking, and executive analytics.

```
                  ┌─────────────────────────────────────────┐
                  │    MAIN PORTAL & ROLE ROUTER (App.jsx)  │
                  └────────────────────┬────────────────────┘
                                       │
     ┌──────────────────┬──────────────┴───────┬──────────────────┐
     ▼                  ▼                      ▼                  ▼
┌─────────┐      ┌──────────────┐      ┌──────────────┐   ┌──────────────┐
│ CASHIER │      │ KITCHEN KDS  │      │  SELF KIOSK  │   │ INVENTORY &  │
│ POS BILL│      │ (WebSockets) │      │ (Guest Mode) │   │ REPORTS BI   │
└─────────┘      └──────────────┘      └──────────────┘   └──────────────┘
```

---

## ⚡ Key Modules & Features

### 🛒 1. Billing Terminal (Cashier POS)
- **Fast Order Entry & Search**: Instant filtering by item categories, keywords, and price.
- **Table Management & Transfers**: Live floor table map with seating status and a dedicated **Table Transfer Modal**.
- **80mm Thermal Receipt Generator**: Built-in thermal print receipt preview with tax breakdown, table number, and order itemization.
- **Custom Modifiers**: Item customization (extra cheese, spicy level, notes).

### 🍳 2. Kitchen Display System (KDS)
- **Real-Time Synchronization**: Instant order updates pushed via native **WebSockets** (`/ws/kds`).
- **Live Ticket Pipeline**: Visual status progression from `Pending` ➔ `Preparing` ➔ `Ready` ➔ `Served`.
- **Preparation Timers & Alert Badges**: Elapsed time indicators for kitchen efficiency management.

### 📱 3. Customer Self-Ordering Kiosk
- **Guest-Facing Interface**: Visual dish cards, category tabs, and interactive cart modal.
- **Direct Order Dispatch**: Sends kitchen tickets instantly without needing cashier intervention.

### 📦 4. Inventory & Recipe Engine
- **Stock Purchases**: Register incoming raw material batches with cost per unit.
- **Recipe Linkage**: Deduct raw ingredients automatically from stock upon order placement.
- **Wastage & Expiration Log**: Track stock loss due to spoilage, breakage, or expiry with financial impact logs.
- **Low Stock Threshold Alerts**: Automatic warnings for ingredients below safety reorder levels.

### 📊 5. Executive BI & Operational Reports
- **Real-Time KPIs**: Total sales, revenue trends, top-selling items, and active order counts.
- **Stock Valuation Reports**: Total inventory assets valued at cost.
- **Financial Loss Reports**: Detailed cost analysis of kitchen wastage and expired stock.

### 🔒 6. Staff RBAC & Quick PIN Auth
- **Multi-Role Support**: Cashier, Kitchen Staff, Inventory Manager, and Admin.
- **In-App Quick Switch**: Instant role switching popup using 4-digit PIN authentication.

---

## 🔑 Quick Demo Credentials

For testing and demonstration, use the pre-configured 4-digit staff PINs:

| Role | Access Level | Demo PIN | Default Module |
| :--- | :--- | :---: | :--- |
| **Cashier** | POS Billing, Table Transfer, Checkout | `1234` | Billing POS |
| **Kitchen Staff** | Live KDS Order Board & Status Updates | `5678` | KDS Display |
| **Admin / Manager** | Inventory, Stock Valuation, Reports, Dashboard | `9999` | Full Control |

---

## 🏗️ Technical Architecture & Tech Stack

```
POS_system/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint & router registration
│   │   ├── database.py       # SQLAlchemy engine & session factory
│   │   ├── models.py         # DB Schemas: User, Order, Item, Stock, Recipe, Wastage
│   │   ├── schemas.py        # Pydantic validation schemas
│   │   ├── crud.py           # Data access layer & business logic
│   │   ├── seed.py           # Initial menu & stock seed data
│   │   └── routers/
│   │       ├── auth.py       # Staff PIN verification & authentication
│   │       ├── pos.py        # Categories, items, orders, table transfer
│   │       ├── kds_ws.py     # Real-time WebSocket broadcasting server
│   │       ├── kiosk.py      # Customer ordering endpoints
│   │       ├── inventory.py  # Stock ledger, purchases, wastage
│   │       ├── dashboard.py  # Key business performance metrics
│   │       └── reports.py    # Financial loss & valuation reports
│   ├── reroll_db.py          # Database reset & re-seeding utility
│   ├── requirements.txt      # Python dependencies
│   └── main.py               # Root uvicorn starter
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js     # Axios/Fetch API wrapper & WebSocket client
    │   ├── components/
    │   │   └── SidebarNav.jsx # Resizable left navigation sidebar
    │   ├── views/
    │   │   ├── LandingPortalView.jsx  # Main entry hub
    │   │   ├── StaffLoginView.jsx     # Onscreen numeric keypad login
    │   │   ├── PosView.jsx            # Billing terminal & thermal receipt
    │   │   ├── KdsView.jsx            # Kitchen display screen
    │   │   ├── KioskView.jsx          # Self-ordering kiosk
    │   │   ├── InventoryView.jsx      # Stock & recipe manager
    │   │   ├── DashboardView.jsx      # Analytics overview
    │   │   └── ReportsView.jsx        # Financial loss & stock reports
    │   ├── App.jsx           # Core router & modal state manager
    │   └── main.jsx          # React DOM mounting
    ├── package.json          # Vite + React dependencies
    └── vite.config.js        # Vite build setup
```

---

## 📡 REST API & WebSocket Reference

### 🔌 API Routes Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate staff via PIN or credentials |
| `GET` | `/api/pos/categories` | Fetch menu categories with item counts |
| `GET` | `/api/pos/items` | Fetch all menu items with pricing & availability |
| `POST` | `/api/pos/orders` | Create a new cashier order & trigger stock deduction |
| `POST` | `/api/pos/transfer-table` | Transfer active order to another table |
| `WS` | `/ws/kds` | Live WebSocket stream for real-time kitchen tickets |
| `GET` | `/api/kiosk/menu` | Customer kiosk menu listing |
| `POST` | `/api/kiosk/order` | Submit kiosk order directly to kitchen |
| `GET` | `/api/inventory/stock` | View raw ingredient stock ledger & reorder alerts |
| `POST` | `/api/inventory/purchases` | Log stock purchase entries |
| `POST` | `/api/inventory/wastage` | Log expired or damaged inventory loss |
| `GET` | `/api/dashboard/stats` | Executive business stats & KPIs |
| `GET` | `/api/reports/sales` | Sales and revenue breakdown report |
| `GET` | `/api/reports/stock-valuation` | Total inventory valuation analysis |
| `GET` | `/api/reports/wastage-loss` | Financial loss audit log |

---

## 🚀 Getting Started

### 📋 Requirements
- **Python**: `3.9+`
- **Node.js**: `18.0+`
- **npm**: `9.0+`

---

### 🐍 1. Backend Installation & Startup

```bash
# Navigate to backend folder
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install required Python packages
pip install -r requirements.txt

# Reset and seed sample database (optional)
python reroll_db.py

# Start FastAPI development server
python -m uvicorn main:app --reload --port 8000
```
> 💡 *The Swagger interactive API documentation will be available live at `http://localhost:8000/docs`.*

---

### ⚛️ 2. Frontend Installation & Startup

```bash
# Open a new terminal and navigate to frontend folder
cd frontend

# Install Node modules
npm install

# Start Vite React dev server
npm run dev
```
> 💡 *The web application will launch locally at `http://localhost:5173`.*

---

## 🖨️ Thermal Receipt Printing Preview

The POS Billing module includes a pixel-accurate **80mm thermal receipt generator** supporting:
- Restaurant header, GST/Tax registration format.
- Table & cashier metadata.
- Itemized pricing, taxes, discounts, and payment mode indicators.
- Instant print triggering via browser print engine.

---

## 📄 License

This repository is licensed under the **MIT License**. Feel free to use, modify, and distribute for commercial or personal projects.
