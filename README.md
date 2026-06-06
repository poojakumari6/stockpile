# Stockpile — Inventory & Order Management System

A production-ready, fully containerized full-stack application for managing
**products, customers, orders, and inventory**.

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Frontend | React (Vite) + React Router, served by nginx |
| Backend  | Python · FastAPI · SQLAlchemy · Pydantic     |
| Database | PostgreSQL 16                                |
| Infra    | Docker + Docker Compose                      |

---

## Table of contents

1. [Architecture](#architecture)
2. [Quick start (Docker Compose)](#quick-start-docker-compose)
3. [Running services individually](#running-services-individually)
4. [API reference](#api-reference)
5. [Business rules](#business-rules)
6. [Building & pushing the backend image to Docker Hub](#building--pushing-the-backend-image-to-docker-hub)
7. [Deployment](#deployment)
8. [Project structure](#project-structure)
9. [Submission checklist](#submission-checklist)

---

## Architecture

```
                +-------------------+         +--------------------+
  Browser  ───▶ |  Frontend (nginx) | ──API──▶ |  Backend (FastAPI) | ──▶ PostgreSQL
                |  React / Vite     |  HTTP    |  uvicorn           |     (named volume)
                +-------------------+         +--------------------+
```

- The frontend is a static SPA. The backend base URL is injected at **build
  time** via `VITE_API_URL`.
- The backend reads all configuration (DB credentials, CORS origins) from
  **environment variables** — no secrets are hardcoded.
- PostgreSQL data persists in a **named Docker volume** (`iom_pgdata`).

---

## Quick start (Docker Compose)

> Requires Docker and the Docker Compose plugin.

```bash
# 1. Clone the repo
git clone <your-repo-url> stockpile && cd stockpile

# 2. Create your environment file and set a real password
cp .env.example .env
#   edit .env -> change POSTGRES_PASSWORD

# 3. Build and start everything
docker compose up --build
```

Then open:

| Service          | URL                              |
| ---------------- | -------------------------------- |
| Frontend         | http://localhost:3000            |
| Backend API      | http://localhost:8000            |
| API docs (Swagger) | http://localhost:8000/docs     |

Tables are created automatically on first start. Stop with `Ctrl+C`, or
`docker compose down`. To wipe the database too: `docker compose down -v`.

---

## Running services individually

### Backend (without Docker)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # point POSTGRES_HOST at a reachable Postgres
uvicorn app.main:app --reload --port 8000
```

### Frontend (without Docker)

```bash
cd frontend
npm install
cp .env.example .env          # set VITE_API_URL=http://localhost:8000
npm run dev                   # http://localhost:5173
```

---

## API reference

Base URL: `/` (e.g. `http://localhost:8000`). Interactive docs at `/docs`.

### Products

| Method | Path             | Description            | Success |
| ------ | ---------------- | ---------------------- | ------- |
| POST   | `/products`      | Create a product       | 201     |
| GET    | `/products`      | List all products      | 200     |
| GET    | `/products/{id}` | Get a product by ID    | 200     |
| PUT    | `/products/{id}` | Update a product       | 200     |
| DELETE | `/products/{id}` | Delete a product       | 204     |

```jsonc
// POST /products
{ "name": "Water Bottle", "sku": "WB-500", "price": 12.50, "quantity": 40 }
```

### Customers

| Method | Path              | Description           | Success |
| ------ | ----------------- | --------------------- | ------- |
| POST   | `/customers`      | Create a customer     | 201     |
| GET    | `/customers`      | List all customers    | 200     |
| GET    | `/customers/{id}` | Get a customer by ID  | 200     |
| DELETE | `/customers/{id}` | Delete a customer     | 204     |

```jsonc
// POST /customers
{ "full_name": "Priya Sharma", "email": "priya@example.com", "phone": "+91 98765 43210" }
```

### Orders

| Method | Path           | Description                   | Success |
| ------ | -------------- | ----------------------------- | ------- |
| POST   | `/orders`      | Create an order               | 201     |
| GET    | `/orders`      | List all orders               | 200     |
| GET    | `/orders/{id}` | Get order details by ID       | 200     |
| DELETE | `/orders/{id}` | Cancel/delete an order        | 204     |

```jsonc
// POST /orders  — total_amount is computed by the backend, not sent by the client
{
  "customer_id": 1,
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
```

### Dashboard

| Method | Path                  | Description                              |
| ------ | --------------------- | ---------------------------------------- |
| GET    | `/dashboard/summary`  | Totals + low-stock list (`?low_stock_threshold=10`) |

### Status codes

`200` OK · `201` Created · `204` No Content · `404` Not Found ·
`409` Conflict (duplicate SKU/email, insufficient stock) ·
`422` Validation error.

---

## Business rules

All enforced by the backend (and re-checked at the database level):

- Product **SKU** is unique; **customer email** is unique.
- Product **quantity can never be negative** (validation + DB check constraint).
- An order **cannot be placed if stock is insufficient** → `409`.
- Placing an order **automatically reduces stock**.
- Cancelling an order **returns stock** to inventory.
- The order **total is always calculated by the backend** from current prices;
  the unit price is captured per line so historical orders stay accurate.
- All inputs are validated; all endpoints return clear error messages.

---

## Building & pushing the backend image to Docker Hub

```bash
# Log in once
docker login

# Build the backend image (run from repo root)
docker build -t <your-dockerhub-username>/iom-backend:latest ./backend

# Push it
docker push <your-dockerhub-username>/iom-backend:latest
```

Your Docker Hub image link will then be:
`https://hub.docker.com/r/<your-dockerhub-username>/iom-backend`

---

## Deployment

You deploy the **database + backend** on one platform and the **frontend** on
another. Below is the recommended path; alternatives are noted.

### 1. Backend + database on Render (free tier)

1. Push this repo to GitHub.
2. In Render, create a **PostgreSQL** instance. Copy its **Internal Database URL**.
3. Create a **Web Service** from your repo:
   - Root directory: `backend`
   - Runtime: **Docker** (it picks up `backend/Dockerfile`).
   - Add environment variables:
     - `DATABASE_URL` = the Postgres URL from step 2
     - `CORS_ORIGINS` = your frontend URL (add after step 3 below, then redeploy)
   - Render injects `PORT` automatically; the Dockerfile honours it.
4. After deploy, your backend is live at `https://<service>.onrender.com`.
   Verify `https://<service>.onrender.com/health` returns `{"status":"healthy"}`.

> **Railway / Fly.io** work the same way: provision Postgres, set `DATABASE_URL`
> and `CORS_ORIGINS`, deploy the `backend` Dockerfile. On Fly, run
> `fly launch` inside `backend/` and `fly postgres create` + `fly postgres attach`.

### 2. Frontend on Vercel (or Netlify)

1. Import the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
4. Add an environment variable:
   - `VITE_API_URL` = your deployed backend URL (e.g. `https://<service>.onrender.com`)
5. Deploy. Copy the resulting URL (e.g. `https://stockpile.vercel.app`).

> **Netlify**: same settings — base directory `frontend`, build `npm run build`,
> publish `frontend/dist`, env var `VITE_API_URL`. A `_redirects` rule of
> `/* /index.html 200` is needed for SPA routing (Vercel handles this automatically).

### 3. Connect them

Go back to the backend's `CORS_ORIGINS` env var, set it to the frontend URL from
step 2, and redeploy the backend. The two now communicate over HTTPS.

---

## Project structure

```
stockpile/
├─ docker-compose.yml          # orchestrates frontend + backend + db
├─ .env.example                # compose-level config (copy to .env)
├─ .gitignore
├─ README.md
├─ backend/
│  ├─ Dockerfile               # slim, non-root, production CMD
│  ├─ .dockerignore
│  ├─ .env.example
│  ├─ requirements.txt
│  └─ app/
│     ├─ main.py               # app, CORS, error handlers, router wiring
│     ├─ config.py             # env-driven settings (no hardcoded secrets)
│     ├─ database.py           # engine + session
│     ├─ models.py             # SQLAlchemy models + constraints
│     ├─ schemas.py            # Pydantic validation/response schemas
│     └─ routers/
│        ├─ products.py
│        ├─ customers.py
│        ├─ orders.py          # inventory + total business logic
│        └─ dashboard.py
└─ frontend/
   ├─ Dockerfile               # multi-stage build → nginx
   ├─ nginx.conf               # SPA fallback + asset caching
   ├─ .dockerignore
   ├─ .env.example
   ├─ package.json
   ├─ vite.config.js
   ├─ index.html
   └─ src/
      ├─ main.jsx, App.jsx, api.js, styles.css
      ├─ components/           # Modal, Toast, Icons, shared UI
      └─ pages/                # Dashboard, Products, Customers, Orders
```

---

## Submission checklist

- [x] GitHub repository (frontend + backend)
- [ ] Docker Hub image link for the backend — push with the commands above
- [ ] Live frontend URL (Vercel/Netlify)
- [ ] Live backend API URL (Render/Railway/Fly.io)

The code, Docker setup, and configuration are complete. The three boxes above
require **your own** GitHub / Docker Hub / hosting accounts — follow the
[Deployment](#deployment) and [Docker Hub](#building--pushing-the-backend-image-to-docker-hub)
sections to fill them in.
