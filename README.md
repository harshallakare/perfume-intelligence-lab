# 🧪 Perfume Intelligence Lab

An enterprise-grade ERP and AI platform for perfume houses — built for perfumers, production managers, and business owners who need a single system to manage raw materials, formulas, production, costing, and analytics.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss)

---

## ✨ Features

| Module | Description |
|---|---|
| **Dashboard** | Live KPI cards — formulas, materials, productions, and alerts |
| **Formula Builder** | Create multi-section formulas (Top / Middle / Base / Modifier / Trace), manage versions, export CSV & PDF |
| **Inventory** | Full CRUD for raw materials — track stock, cost per unit, supplier, olfactory family, CAS number |
| **Production** | Production order lifecycle — Draft → In Progress → Completed / Cancelled |
| **Costing Engine** | Real-time formula cost calculation with concentration simulation and margin targets |
| **Analytics** | Recharts-powered dashboards — top materials, formula trends, production activity, family distribution |
| **Olfactory Library** | Browse and manage the full olfactory-family classification tree |
| **Accord Builder** | Compose and save fragrance accords |
| **AI Assistant** | AI-powered perfume formulation assistant |
| **Compliance** | IFRA compliance tracking per formula |
| **Team** | User management and role assignments |
| **Settings** | Organisation profile, currency, timezone — persisted to DB and synced across the app |

---

## 🗂 Project Structure

```
perfume-intelligence-lab/
├── frontend/                  # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/        # Login
│   │   │   ├── (dashboard)/   # All authenticated pages
│   │   │   └── api/           # REST API routes
│   │   ├── components/        # Shared UI components
│   │   ├── context/           # React contexts (auth, settings)
│   │   └── lib/               # Prisma client, utilities
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── seed.ts            # Initial seed data
│   │   └── migrations/        # Prisma migration history
│   └── package.json
├── deploy.sh                  # Linux deployment script
└── README.md
```

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 — dark glassmorphism UI
- **Database**: SQLite via Prisma 7.8 + `better-sqlite3`
- **Charts**: Recharts 3
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Drag & Drop**: dnd-kit
- **State**: Zustand + React Context
- **Process Manager**: PM2 (production)
- **Web Server**: Nginx (reverse proxy)

---

## 🚀 Local Development

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/harshallakare/perfume-intelligence-lab.git
cd perfume-intelligence-lab/frontend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local if needed (default SQLite path works out of the box)

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations
npx prisma migrate dev

# 6. Seed the database
npm run db:seed

# 7. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Default credentials:**
```
Email:    admin@pil.com
Password: admin123
```

### Useful dev commands

```bash
npm run db:studio     # Open Prisma Studio (visual DB browser)
npm run db:migrate    # Create a new migration
npm run db:seed       # Re-run seed data
npm run lint          # Run ESLint
npm run build         # Production build
```

---

## 🌐 Production Deployment (Linux)

The repo ships with `deploy.sh` — a fully automated deployment script for Ubuntu/Debian servers.

### First-time server setup

```bash
# On your server (run as root or sudo user)
git clone https://github.com/harshallakare/perfume-intelligence-lab.git
cd perfume-intelligence-lab

# Edit config variables at the top of deploy.sh first
nano deploy.sh   # set REPO_URL, APP_DIR, APP_PORT, APP_USER

bash deploy.sh --setup
```

This single command will:
- Install Node.js 20, PM2, Nginx, UFW
- Create a dedicated `pil` system user
- Clone the repo, install dependencies, run migrations & seed
- Build Next.js, write a PM2 `ecosystem.config.js`, start the app
- Configure Nginx as a reverse proxy with gzip + static asset caching
- Enable UFW firewall (SSH + HTTP/HTTPS only)
- Install a nightly DB backup cron (retains 30 days)

### SSL / HTTPS (after setup)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Update deploys

After every `git push`, deploy in seconds:

```bash
bash deploy.sh
```

This will: backup DB → pull latest code → install deps → migrate → build → `pm2 reload` (zero downtime) → health check.

### What's running where

| Service | Location |
|---|---|
| App process | `pm2 list` → `pil-frontend` |
| App logs | `/var/log/pil/app.log` |
| Error logs | `/var/log/pil/error.log` |
| DB file | `/opt/pil/frontend/prisma/pil.db` |
| DB backups | `/opt/pil/backups/` |
| Nginx config | `/etc/nginx/sites-available/pil` |

---

## 🔌 API Reference

All routes are under `/api/` and return JSON.

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user |
| `DELETE` | `/api/auth/logout` | Clear session |
| `GET` | `/api/auth/me` | Current user info |
| `GET` | `/api/stats` | Dashboard KPI counts |
| `GET/POST` | `/api/formulas` | List / create formulas |
| `GET/PATCH/DELETE` | `/api/formulas/[id]` | Single formula CRUD |
| `GET/POST/DELETE` | `/api/formulas/[id]/ingredients` | Formula ingredients |
| `GET/POST` | `/api/materials` | List / create raw materials |
| `GET/PATCH/DELETE` | `/api/materials/[id]` | Single material CRUD |
| `GET/POST` | `/api/productions` | List / create production orders |
| `GET/PATCH` | `/api/productions/[id]` | Single production CRUD |
| `GET` | `/api/analytics` | KPIs + chart datasets |
| `GET/PATCH` | `/api/settings` | Organisation settings |
| `GET` | `/api/notifications` | User notifications |

---

## 🗃 Database Schema (highlights)

```
Organization     — org profile + settings JSON
User             — auth, roles
RawMaterial      — inventory items (name, CAS, family, costPerUnit, stock)
Formula          — perfume formula (name, concentration, status: draft/active/locked)
FormulaIngredient — material + % + section (top/middle/base/modifier/trace)
FormulaVersion   — version history snapshots
ProductionOrder  — batch orders linked to a formula
Accord           — saved accord compositions
OlfactoryFamily  — family taxonomy tree
Notification     — per-user notification log
```

Full schema: [`frontend/prisma/schema.prisma`](frontend/prisma/schema.prisma)

---

## 📸 Screenshots

> UI uses a dark glassmorphism theme throughout.

| Dashboard | Formula Builder | Analytics |
|---|---|---|
| Live KPI cards + notifications | Drag & drop ingredient sections | Recharts bar, area & pie charts |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">Built with ❤️ for the art of perfumery</p>
