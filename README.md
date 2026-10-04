# Spendly — Smart Personal Expense Tracker

**Spendly** is a production-quality, multi-currency personal finance management SaaS platform built with React, TypeScript, Tailwind CSS, and PostgreSQL (Supabase).

> **Core Philosophy:** Strictly **NO DUMMY DATA**, **NO FAKE USERS**, and **NO FABRICATED STATISTICS**. Every dashboard card, chart, insight, budget threshold, and financial health score is calculated purely from your authenticated account data.

---

## Key Features

### 1. Complete Authentication & Profile System
- **Sign Up** with full name, email, password, confirm password, primary currency, country/region, and optional monthly income.
- **Login, Logout, Forgot Password, and Reset Password** workflows with secure password hashing (SHA-256) and session persistence.
- **Protected routes** with strict per-user data isolation.
- **Profile & Preference controls**: currency switcher, password updates, theme picker, data wipe, and account deletion.

### 2. 6-Step First-Time Onboarding Experience
1. **Primary Currency Selection** (searchable across 35+ global ISO 4217 currencies).
2. **Monthly Income Baseline** (optional).
3. **Monthly Spending Target** (for proactive budget threshold tracking).
4. **Expense Categories Selection** (customize which categories to track).
5. **Smart Notifications Configuration** (budget warnings, subscription alerts).
6. **Appearance** (Light Mode, Dark Mode, or System Default).
*Skip optional steps anytime without creating fake transactions.*

### 3. Global Multi-Currency Support (ISO 4217)
- Support for 35+ world currencies (USD, EUR, GBP, INR, JPY, AUD, CAD, CHF, CNY, SGD, AED, SAR, and more).
- Accurate decimal precision rules (e.g., JPY & KRW with 0 decimals, KWD & BHD with 3 decimals, USD & INR with 2 decimals).
- **Dynamic Exchange Rate Layer**: Fetches live exchange rates via open API with cached fallback.
- **Historical Stability**: The exchange rate used at the exact moment of each transaction is snapshotted into the record so historical balances never unpredictably fluctuate.
- Real-time display currency switcher with inline conversion preview: `Original Amount → Exchange Rate → Converted Amount`.

### 4. Zero-Data Empty States
- When a new user registers, they experience a genuine empty account.
- No placeholder ₹84,520 or fake chart lines.
- Clear guided calls to action: `Add Expense`, `Add Income`, and `Import Transactions`.

### 5. Powerful Transaction Management
- Types: **Expense**, **Income**, and **Transfer**.
- Fields: Amount, Currency, Category, Subcategory, Date, Merchant, Payment Method (Cash, Credit Card, Debit Card, UPI, Bank Transfer), Notes, Tags, Recurring status, and Receipt upload.
- Actions: **Add**, **Edit**, **Delete**, **Duplicate**, instant global search, and multi-field filters.
- Collapsible advanced fields with responsive keyboard shortcuts (`Esc` to dismiss).

### 6. Interactive Receipt Management
- Upload receipts (JPG, PNG, WEBP, PDF up to 5MB).
- Modal receipt viewer with zoom, direct preview, and download support.
- Architectural data model ready for OCR metadata parsing.

### 7. Smart Category & Budget Engine
- Expandable category system with customizable icons and color badges.
- Monthly budgets and category limits.
- Visual progress indicators:
  - `< 80%`: On track
  - `80% - 99%`: Approaching budget warning
  - `≥ 100%`: Over budget alert
- Notifications generated automatically on threshold crossings.

### 8. Automated Recurring Engine
- Schedules for Daily, Weekly, Monthly, and Yearly frequencies.
- Automated generation engine executes on app load as due dates mature.
- Controls to pause, edit, and cancel recurring schedules.

### 9. Subscription Tracker
- Tracks recurring services: Netflix, Spotify, cloud tools, gym memberships, etc.
- Displays Total Monthly Cost, Total Yearly Commitment, and Upcoming Renewals within 7 days.

### 10. Financial Goals & Target Calculations
- Create targeted funds: Emergency Fund, Travel, Laptop, Investments, etc.
- Accurately computes **Required Monthly Saving**: `(Target Amount - Current Amount) / Remaining Months`.
- Direct **Deposit / Contribution** flow that automatically records a savings transfer entry.

### 11. Unique Feature — Financial Health Score (0-100)
- Does **not** render until at least 3 genuine transactions exist to prevent arbitrary ratings.
- Computed from 6 transparent, verifiable criteria:
  1. Spending Control (25%)
  2. Savings Capacity (25%)
  3. Budget Discipline (20%)
  4. Recurring Burden (15%)
  5. Goal Progress (10%)
  6. Income Stability (5%)
- Displays complete breakdown with letter grade (`A+` to `D`) and actionable suggestions.

### 12. Unique Feature — "Where Did My Money Go?"
- Interactive visual waterfall breakdown:
  `Income → Essential Living → Lifestyle & Discretionary → Subscriptions → Savings Surplus → Goals Allocated`.

### 13. Unique Feature — Behavioral Spending Patterns
- Analyzes actual transaction history:
  - Weekend vs Weekday spending surge detection.
  - Subscription load percentage against total spending.
  - Dominant expense category concentration.
  - Primary payment method distribution.

### 14. Data Import & Export
- **Export**: One-click download to RFC 4180 CSV, JSON backup, and print-optimized PDF financial statements.
- **Import**: CSV bank statement upload with an **interactive column mapping interface** (map Date, Amount, Merchant, Category, Type) and real-time validation preview (Valid, Invalid, Skipped).

### 15. Dual Architecture: Supabase Cloud & Local Persistent Engine
- **Local Persistent Engine (IndexedDB / LocalStorage)**: Works immediately out-of-the-box with complete offline capability and per-user data isolation.
- **Supabase Cloud Sync**: Enter your Supabase Project URL and Anon Public Key in Settings (or `.env`) to sync with live Supabase PostgreSQL tables and Row Level Security policies.
- Full SQL migration script available at `supabase/schema.sql`.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

The application runs at **`http://localhost:5173/`**.

---

## Database Setup (Supabase)

To connect Spendly to your own Supabase project:
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in Supabase and paste the contents of `supabase/schema.sql`.
3. Copy your **Project URL** and **Anon Public Key**.
4. In Spendly, go to **Settings → Database & Cloud Sync**, paste your credentials, and click **Connect Cloud Database** (or define `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your `.env` file).

---

## Tech Stack
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (Fintech dark & light theme system)
- **Icons:** Lucide React
- **Backend / Database:** Supabase (PostgreSQL with RLS) + Local Persistent Storage Adapter
