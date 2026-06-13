# 🧪 Perfume Intelligence Lab

An enterprise-grade **ERP + AI platform for perfume houses** — one system that takes a fragrance from raw materials and formulas all the way through production, finished-goods pricing, sales orders, and business analytics. Built for perfumers, production managers, and owners of fragrance-oil / attar / clone-perfume businesses.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite)

---

## 📖 Table of Contents

1. [The Big Picture](#-the-big-picture)
2. [Feature Documentation](#-feature-documentation) — how every module works
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Local Development Setup](#-local-development-setup)
6. [Production Deployment](#-production-deployment)
7. [Database Schema](#-database-schema)
8. [API Reference](#-api-reference)
9. [Authentication & Security](#-authentication--security)
10. [Migrations](#-migrations)
11. [Contributing & License](#-contributing--license)

---

## 🎯 The Big Picture

The platform is organised around one continuous business loop:

```
   MAKE                COST & PRICE            SELL                 MEASURE
┌──────────┐        ┌──────────────┐      ┌──────────┐        ┌──────────────┐
│ Formula  │        │  Products    │      │  Orders  │        │   Sales      │
│ Builder  │  ───▶  │ (Finished    │ ───▶ │    +     │  ───▶  │  Analytics   │
│ Clone    │        │  Goods)      │      │ Customers│        │              │
│ Engine   │        │  Pricing &   │      │          │        │  Revenue,    │
│ Accords  │        │  Margin      │      │ Invoices │        │  profit,     │
└──────────┘        └──────────────┘      └──────────┘        │  best-sellers│
     │                     ▲                    │             └──────────────┘
     ▼                     │                    ▼
┌──────────┐               │              ┌──────────┐
│Inventory │───────────────┘              │ Stock is │
│Packaging │   (costs feed pricing)       │ deducted │
└──────────┘                              └──────────┘
```

A batch blended in the **Clone Engine** is committed to stock as a **Product**, which is then **priced** (margin engine), **sold** through **Orders** (deducting stock and tracking profit), and finally **measured** in **Sales Analytics**.

**Default login:** `admin@pil.com` / `admin123`

---

## 🧩 Feature Documentation

### 🏠 Dashboard (`/`)
Landing view with live KPI cards (total formulas, materials, active productions, stock alerts) fetched from `/api/stats`, plus a notifications feed.

### 🤖 AI Assistant (`/ai-assistant`)
A perfumer-focused assistant surface for formulation guidance and ideas.

---

### Formulation

#### 🧪 Formula Builder (`/formulas`)
Create multi-section perfume formulas with ingredients grouped into **Top / Middle / Base / Modifier / Trace** notes.
- Each ingredient is a raw material + a percentage; the builder validates totals.
- **Versioning** — every save can snapshot the full formula state into `FormulaVersion` so you can track how a juice evolved.
- **Cost per mL** and **total fragrance %** are tracked on the formula.
- **IFRA compliance** flag per formula.
- Export to **CSV** and **PDF**.
- Status lifecycle: `draft → under_review → approved → locked → deprecated`.

#### 🧱 Accord Library (`/accords`)
A library of reusable fragrance accords — the building blocks of formulas.
- **System accords** ship built-in: Rose, Amber, Leather, Oud, Marine, White Musk, Tobacco, Vanilla Gourmand, Cedarwood Amber, Fougère, Spice Market, Blue Signature, and the classic **Grojsman Accord** (Sophia Grojsman's rosy-ionone signature).
- Each accord shows its full **ingredient composition** (with note sections + CAS numbers), a **stacked composition bar**, **projection/longevity** ratings, **recommended usage %**, and an estimated **cost per gram**.
- **Create Custom Accord** — build your own with a live percentage validator, or **"Create Based On This"** to fork a system accord.
- **Copy Formula** copies the ingredient list to your clipboard.

#### ⚗️ Clone Engine (`/clone`)
The workshop calculator that turns a concentrate into a finished, bottled, costed product. Four steps in the left panel feed a live results panel:

1. **Bottle Size** — total batch volume (presets 30/50/60/100/200 mL or custom). This is the *batch* volume (e.g. 500 mL).
2. **Perfume Type** — EDT / EDP / Parfum / Elixir / Attar, each with a preset oil % (8% → 100%) and expected longevity/projection.
3. **Achieve Goals** — pick targets (high projection, longevity, smooth dry-down, skin-friendly, rich character, freshness); the engine recommends matching **fixatives** (Ambroxan, ISO E Super, Hedione, etc.) with dosages.
4. **Oil Base (Accord)** — optionally build the fragrance oil on a **master perfumer accord**: **Grojsman**, Classic Chypre, Aldehydic Floral, Modern Ambrox Wood, or Oriental Amber. The full formulation is **scaled to your oil volume** and shown in both **grams (to weigh)** and **mL**.

The results panel then provides:
- **Composition breakdown** — oil / alcohol / fixative split (stacked bar + mix recipe).
- **Production Checklist** — tick each component (alcohol, oil/accord ingredients, fixatives) as you weigh it in, with a progress bar.
- **Bottle & Export to Stock** — pick a bottle SKU from **Packaging** (or a manual size); the engine computes **bottles filled · leftover mL · bottles consumed from stock**. Optionally enter a **fragrance-oil cost (₹/mL)** to capture COGS. **Commit to Stock** then:
  - creates a **Product** (`FinishedGood`) with real material + packaging cost,
  - records planned-vs-actual **yield**,
  - **deducts the bottles from packaging stock**.

---

### Intelligence

#### 📚 Perfume Library (`/library`)
A reference database of **4,600+ real fragrances** (designer, niche, Arabic, Indian attar) sourced from a curated Fragrantica dataset. Each entry has brand, perfumer, year, concentration, olfactory family, gender target, **Top / Middle / Base notes**, projection, longevity, season, occasion, price tier and a community score. Searchable and filterable; exportable.

#### 🧠 Olfactory Data (`/olfactory`)
Browse the olfactory-family classification used across the app.

---

### Operations

#### 📦 Inventory (`/inventory`)
Full CRUD for **raw materials** (aroma chemicals, essential oils, absolutes, fixatives, musks, solvents, etc.).
- Tracks **current stock**, **minimum stock** (reorder threshold), **cost per unit**, supplier, CAS number, odor family/intensity, volatility (Top/Mid/Base), purity, and IFRA/allergen/natural flags.
- **Per-gram & per-mL pricing** — set an optional **density (g/mL)** and the app normalises the purchase price (whether bought in g / kg / oz / mL / L) into **cost-per-gram** and **cost-per-mL**, shown in the material drawer and edit form.
- Low-stock / out-of-stock banners, inventory value totals, and CSV / PDF export.

#### 🫙 Packaging & Supplies (`/packaging`)
Tracks **non-consumable supplies**: bottles, vials, roll-ons, caps, sprayers, pumps, boxes, labels.
- Each item has a type, optional **capacity (mL)** for bottles/vials, **unit price**, **stock count**, minimum threshold, and supplier.
- Summary tiles for supply lines, total units, low-stock count, and **stock value**.
- These bottle SKUs feed the Clone Engine's "Export to Stock" step, and their stock is **automatically decremented** when batches are committed.

#### 🏭 Production (`/production`)
Production-order lifecycle for scaled batches: `draft → scheduled → in_progress → macerating → quality_check → completed` (or `rejected / cancelled`), linked to a formula, with planned/actual quantities, maceration timers, and QC results.

#### 🛡 IFRA Compliance (`/compliance`)
IFRA restriction tracking per formula and per material.

---

### Sales

#### 🏷️ Products (`/products`) — *Pricing & Margin engine + Batch profitability*
Every batch committed from the Clone Engine appears here as a sellable lot.
- The table shows **available stock** (filled − sold), **cost/bottle**, **price/bottle**, **margin %**, **yield %**, and **batch profit**.
- The editor is a full **Pricing & Margin engine**:
  - Enter **material + packaging + labor** cost → live **cost per bottle**.
  - Drag a **target gross-margin** slider → **suggested price** (one-click "Use").
  - See resulting **gross margin / markup / profit-per-bottle**, colour-coded (green healthy, amber thin, red loss).
  - **Yield** = actual bottles filled ÷ planned bottles.
- Summary tiles: products/lots, **stock at cost**, **stock at retail**, and how many products still **need pricing**.

#### 🛒 Orders (`/orders`)
Sales-order management with invoicing.
- Create an order: pick a **customer** (or walk-in), a **channel** (direct / WhatsApp / retail / wholesale / online), and add **line items** from products (auto-fills price + cost) or custom lines.
- Live **subtotal → discount → tax % → total**, plus **estimated profit** (revenue − COGS).
- **Payment tracking** — record amounts; status auto-derives to `unpaid / partial / paid`.
- **Status lifecycle** — `draft → confirmed → fulfilled → cancelled`. Marking an order **Fulfilled deducts sold bottles from product stock**; **Cancelling restores** it.
- **Print invoice** — a clean, branded printable invoice per order.

#### 👥 Customers (`/customers`)
Retail / wholesale / distributor / online accounts with contact details, **GSTIN** (tax ID), address/city, and notes. Each customer shows **lifetime order count** and **lifetime spend** (auto-aggregated from non-cancelled orders).

---

### Business

#### 💰 Costing (`/costing`)
Formula-level cost analysis — per-ingredient costing with concentration simulation, overhead rates, and tiered pricing multipliers (retail/wholesale margins).

#### 📊 Analytics (`/analytics`)
Two tabs (segmented control):
- **Sales** — revenue, gross profit (+ margin %), order count (+ units sold), average order value, MTD revenue, outstanding balance; a **6-month revenue & profit trend**; **revenue by channel** donut; **best sellers by revenue**; **top customers** (ranked, #1 crowned); and **orders by status**.
- **Operations** — total formulas/materials/productions, most-used materials, formula-creation trend, monthly production activity, and formulas-by-olfactory-family.

Charts are built with Recharts and respect the configured currency.

---

### Settings

#### ⚙️ Settings (`/settings`)
- **Organisation profile**, **currency** (₹ / $ / € …, applied app-wide), and timezone — persisted to the DB and synced through React context.
- **Profile / Security** — **change your password**, and **generate a one-time account-recovery code** (see [Authentication & Security](#-authentication--security)).

#### 🧑‍🤝‍🧑 Team (`/team`)
User management and role assignment (admin / perfumer / viewer).

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router) + **React 19** |
| Language | **TypeScript 5** |
| Database | **SQLite** via **Prisma 7.8** + `better-sqlite3` adapter |
| Charts | **Recharts 3** |
| Forms / Validation | React Hook Form + **Zod** |
| Drag & Drop | dnd-kit |
| Animation | Framer Motion |
| State | Zustand + React Context |
| Icons | lucide-react |
| Styling | Inline styles + a dark **glassmorphism** design system |
| Passwords | Node `crypto.scryptSync` (no external auth lib) |
| Process manager (prod) | **PM2** |
| Reverse proxy (prod) | **Nginx** |

---

## 🗂 Project Structure

```
perfume-intelligence-lab/
├── frontend/                         # The Next.js application (everything runs here)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/         # Login + account recovery
│   │   │   ├── (dashboard)/          # All authenticated pages
│   │   │   │   ├── accords/  ai-assistant/  analytics/  clone/
│   │   │   │   ├── compliance/  costing/  customers/  formulas/
│   │   │   │   ├── inventory/  library/  olfactory/  orders/
│   │   │   │   ├── packaging/  production/  products/  settings/  team/
│   │   │   └── api/                  # REST API route handlers
│   │   ├── components/               # Per-feature UI (clone, orders, products, …)
│   │   ├── context/                  # settings-context (currency, etc.)
│   │   └── lib/                      # db.ts (Prisma), pricing.ts, password.ts, utils, export
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema
│   │   ├── seed.ts                   # Seed data (org, materials, formulas, packaging, library)
│   │   ├── migrations/               # Prisma migration history
│   │   └── pil.db                    # SQLite database file (gitignored)
│   └── package.json
├── deploy.sh                         # First-time server setup + deploy (PM2 + Nginx)
├── update.sh                         # Fast update deploy for a live server
├── Dockerfile / docker-compose.yml   # Container deployment (see DOCKER.md)
└── README.md
```

> **Note:** the application lives entirely in `frontend/`. All `npm` commands below are run from inside that directory.

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js ≥ 20** and **npm ≥ 10**
- Build tools for the `better-sqlite3` native module: `build-essential` + `python3` (Linux) or Xcode Command Line Tools (macOS)

### Steps

```bash
# 1. Clone
git clone https://github.com/harshallakare/perfume-intelligence-lab.git
cd perfume-intelligence-lab/frontend

# 2. Install dependencies
npm install

# 3. Configure environment (defaults work out of the box for SQLite)
cp .env.example .env.local

# 4. Generate the Prisma client
npx prisma generate

# 5. Apply migrations (creates prisma/pil.db with all tables)
npx prisma migrate deploy        # or: npm run db:migrate  (for dev/new migrations)

# 6. Seed reference data (org, demo users, materials, formulas, packaging, library)
npm run db:seed

# 7. Start the dev server
npm run dev
```

Open **http://localhost:3000** and sign in with `admin@pil.com` / `admin123`.

### Useful commands

```bash
npm run dev          # Start the dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Run the production build
npm run lint         # ESLint
npm run db:seed      # (Re)seed reference data — safe; skips already-seeded tables
npm run db:migrate   # Create / apply a dev migration
npm run db:studio    # Prisma Studio — visual DB browser
```

> ⚠️ **Prisma client caching:** the dev server caches the Prisma client on `globalThis`. If you add a model or run `prisma generate` while the server is running, **restart the dev server** so the new client is loaded.

---

## 🌐 Production Deployment

Two scripts ship with the repo. Both share the same config block (`APP_DIR=/opt/pil/frontend`, `APP_USER=pil`, `APP_PORT=3000`, PM2 process `pil-frontend`).

### Option A — Bare-metal (PM2 + Nginx)

**First-time setup** (`deploy.sh --setup`) installs Node 20, PM2, Nginx and UFW, creates the `pil` user, installs deps, runs migrations + seed, builds Next.js, writes a PM2 `ecosystem.config.js`, configures Nginx as a reverse proxy (gzip + static caching), enables the firewall, and installs a nightly DB backup cron.

```bash
# On the server (Ubuntu/Debian), as root or a sudo user:
git clone https://github.com/harshallakare/perfume-intelligence-lab.git /opt/pil/repo
cd /opt/pil/repo
bash deploy.sh --setup
```

**Add HTTPS:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

**Update an existing server** — `update.sh` pulls the latest code into the staging repo (`/opt/pil/repo`), syncs it to the live app dir, **backs up the DB**, installs deps, runs `prisma migrate deploy`, **seeds** new reference data, applies any library data, rebuilds, and **hot-reloads PM2** (zero downtime). Your `.env.local` and `pil.db` are never overwritten.

```bash
bash /opt/pil/repo/update.sh
```

> After pulling new feature commits, `update.sh` automatically applies new migrations (e.g. packaging, finished-goods, customers/orders), so new tables and columns appear without manual steps.

### Option B — Docker

A `Dockerfile` and `docker-compose.yml` are provided. See **[DOCKER.md](DOCKER.md)** for the full container workflow and `.env.docker.example` for configuration.

### Where things live on the server

| Item | Path / command |
|---|---|
| App process | `pm2 list` → `pil-frontend` |
| Live app dir | `/opt/pil/frontend` |
| Staging repo | `/opt/pil/repo` |
| App / error logs | `/var/log/pil/app.log`, `/var/log/pil/error.log` |
| Database file | `/opt/pil/frontend/prisma/pil.db` |
| DB backups | `/opt/pil/backups/` (nightly cron, 30-day retention) |
| Nginx config | `/etc/nginx/sites-available/pil` |

---

## 🗃 Database Schema

SQLite via Prisma. Full definition: [`frontend/prisma/schema.prisma`](frontend/prisma/schema.prisma).

| Model | Purpose |
|---|---|
| `Organization` | Org profile + settings JSON; root of all data (single-tenant: slug `pil-default`) |
| `RawMaterial` | Inventory item — stock, **cost per unit**, **density**, supplier, CAS, odor family/intensity, IFRA/allergen flags |
| `PackagingItem` | Non-consumable supply — bottle/cap/box/etc., capacity, unit price, stock |
| `Formula` | A perfume formula — concentration, status, olfactory family, cost/mL, IFRA flag, version |
| `FormulaIngredient` | A material + percentage + section (top/middle/base/modifier/trace) within a formula |
| `FormulaVersion` | JSON snapshot of a formula at a point in time |
| `ProductionOrder` | A scaled production batch linked to a formula, with lifecycle status |
| `FinishedGood` | A **Product / lot** — batch volume, bottles filled/used/sold, cost components, sell price, yield |
| `Customer` | Retail/wholesale/distributor/online account with GSTIN + lifetime spend |
| `Order` | A sales order — totals, discount, tax, COGS, payment + fulfilment status |
| `OrderLine` | A line item on an order (optionally linked to a FinishedGood) |
| `PerfumeReference` | A row in the 4,600+ Perfume Library reference dataset |
| `UserCredential` | Login identity — email, role, **scrypt password hash**, reset token |
| `UserSession` | Active session token (cookie `pil_session`) with expiry |
| `Notification` | Per-org notification log (low stock, approvals, etc.) |

---

## 🔌 API Reference

All routes live under `/api/` and return JSON. CRUD verbs vary per route.

### Auth & session
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate against `UserCredential`, set session cookie |
| `GET` | `/api/auth/me` | Current user from session |
| `POST` | `/api/auth/logout` | Clear session |
| `POST` | `/api/auth/change-password` | Change password (verifies current) |
| `POST` | `/api/auth/reset-password` | `action: generate` (admin issues code) / `action: confirm` (use code) |

### Formulation & inventory
| Method | Route | Description |
|---|---|---|
| `GET POST` | `/api/formulas` · `/api/formulas/[id]` · `/api/formulas/[id]/ingredients` | Formula CRUD + ingredients |
| `GET POST` | `/api/materials` · `/api/materials/[id]` | Raw material CRUD (incl. density) |
| `GET POST` | `/api/packaging` · `/api/packaging/[id]` | Packaging / supplies CRUD |
| `GET POST` | `/api/productions` · `/api/productions/[id]` | Production order CRUD |
| `GET` | `/api/library` · `/api/library/[id]` | Perfume Library reference data |

### Sales
| Method | Route | Description |
|---|---|---|
| `GET POST` | `/api/finished-goods` · `/api/finished-goods/[id]` | Products / lots; commit batch, edit pricing & yield |
| `GET POST` | `/api/customers` · `/api/customers/[id]` | Customer CRUD (+ lifetime spend) |
| `GET POST PUT DELETE` | `/api/orders` · `/api/orders/[id]` | Orders; fulfilment deducts stock, cancel restores |

### Analytics & misc
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/stats` | Dashboard KPI counts |
| `GET` | `/api/analytics` | Operations charts (formulas, materials, production) |
| `GET` | `/api/analytics/sales` | Sales KPIs + revenue/profit/best-seller/customer datasets |
| `GET PATCH` | `/api/settings` | Organisation settings (currency, etc.) |
| `GET` | `/api/notifications` | Notification feed |
| `*` | `/api/db/*` | Maintenance — `test`, `migrate`, `seed`, `backup`, `restore` |

---

## 🔐 Authentication & Security

- **Passwords** are hashed with Node's built-in **`crypto.scryptSync`** (N=16384, r=8, p=1, 64-byte key), stored as `salt:hash`, and compared with `timingSafeEqual`. No external auth dependency.
- **Login** looks the user up in `UserCredential` and verifies the hash; on success a session token is stored in `UserSession` and set as the `pil_session` cookie.
- **Change password** (Settings → Profile) verifies the current password before updating.
- **Account recovery without email:** an admin generates a one-time **`PIL-XXXX-XXXX`** code (Settings → Profile). The code is shown **once**, stored **hashed** with a **24-hour expiry**, and is **single-use**. To recover, use the **"Recover access"** form on the login page (email + code + new password).
- Seeded users (change these in production): `admin@pil.com` / `admin123`, `perfumer@pil.com` / `perfumer123`, `viewer@pil.com` / `viewer123`.

---

## 🧱 Migrations

Applied in order from `frontend/prisma/migrations/`:

| Migration | Adds |
|---|---|
| `…_init` | Core schema (org, materials, formulas, ingredients, productions, settings) |
| `…_add_versions_notifications_auth` | Formula versions, notifications, sessions |
| `…_add_perfume_reference` | Perfume Library reference table |
| `…_add_user_credentials` | DB-backed login + password recovery |
| `…_add_packaging_finished_goods` | Packaging items, finished goods, material density |
| `…_add_sales_customers_orders` | Customers, orders, order lines + product pricing/yield fields |

Apply all with `npx prisma migrate deploy` (production) or `npm run db:migrate` (development).

---

## 🤝 Contributing & License

1. Branch: `git checkout -b feature/my-feature`
2. Commit, push, and open a Pull Request.

**License:** MIT — see [LICENSE](LICENSE).

<p align="center">Built with care for the art of perfumery — make · cost · sell · measure.</p>
