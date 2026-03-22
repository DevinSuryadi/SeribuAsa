# PROJECT CONTEXT - NutriGuard

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project Vision & Goals](#2-project-vision--goals)
3. [Tech Stack](#3-tech-stack)
4. [Repository Structure](#4-repository-structure)
5. [System Architecture](#5-system-architecture)
6. [Core Features](#6-core-features)
7. [Database & Models](#7-database--models)
8. [API Integrations](#8-api-integrations)
9. [CI/CD Strategy](#9-ci-cd-strategy)
10. [Branching Strategy](#10-branching-strategy)
11. [Development Workflow](#11-development-workflow)
12. [Testing Strategy](#12-testing-strategy)
13. [Deployment Strategy](#13-deployment-strategy)
14. [Documentation Structure](#14-documentation-structure)
15. [Team Guidelines](#15-team-guidelines)
16. [References](#16-references)

---

## 1. Project Overview

**Nama Project:** NutriGuard

**Deskripsi:**
Platform Donasi Pangan Berbasis AI untuk Mengatasi Food Insecurity di Indonesia.

**Masalah yang Dipecahkan:**

- Food Insecurity (ketidakamanan pangan) di Indonesia
- Kurangnya akses pangan bergizi untuk kelompok rentan
- Tidak adanya platform donasi pangan yang terintegrasi dengan monitoring nutrisi

**Target User:**

1. **Donor:** Individu atau organisasi yang ingin berdonasi pangan
2. **Penerima Donasi:** Individu atau keluarga yang membutuhkan bantuan pangan
3. **Vendor Pangan:** Penjual makanan segar/produk pangan lokal
4. **Admin:** Pengelola sistem untuk memonitor dan mengelola platform

**Status Project:**

- Phase: Infrastructure Setup
- Repository: Baru
- Branching: Setup monorepo dengan Turbo workspace

---

## 2. Project Vision & Goals

### Vision

"Platform donasi pangan berbasis AI yang menghubungkan donor dengan penerima donasi, memantau status nutrisi, dan memberikan rekomendasi makanan terpersonalisasi untuk mengatasi food insecurity di Indonesia."

### Goals

1. **Menghubungkan Donor dan Penerima:**
   - Platform donasi pangan yang mudah digunakan
   - Transparansi donasi dari donor ke penerima
   - Sistem rating dan review untuk kepercayaan

2. **Monitoring Nutrisi dengan AI:**
   - Input data nutrisi harian
   - Rekomendasi makanan berbasis AI (GPT-4.1 nano)
   - Fallback mechanism dengan rule-based recommendations

3. **Sistem Voucher Nutrisi:**
   - Voucher nutrisi untuk akses pangan terjangkau
   - Redemption system dengan validation
   - Analytics voucher usage

4. **Platform Vendor Lokal:**
   - Marketplace untuk vendor pangan lokal
   - Product management dengan nutrition info
   - Settlement system untuk vendor

5. **Donasi Langganan:**
   - Paket donasi berlangganan (mingguan/bulanan/tahunan)
   - Auto-renewal dengan payment gateway
   - Analytics langganan dan dampak

### Success Metrics

- Number of donors registered
- Total donation amount
- Number of vendors onboarded
- Number of AI recommendations generated
- User retention rate
- Food insecurity score reduction (FIES survey)

---

## 3. Tech Stack

### Frontend

**Framework & Language:**

- React 18.3.1 (UI library)
- TypeScript 5.3.3 (Type safety)
- Vite 5.1.4 (Build tool & dev server)

**Styling & UI:**

- Tailwind CSS 3.4.1 (Utility-first CSS)
- shadcn/ui (Radix UI primitives)
- Tailwind CSS Animate (Animations)
- Class Variance Authority (CVA) for component variants
- clsx + tailwind-merge (Utility for conditional classes)

**State Management:**

- Zustand 4.5.0 (Global state)
- React Context API (Local state)

**Data Fetching:**

- TanStack Query 5.22.2 (Caching, optimistic updates)
- Axios 0.26.0 (HTTP client)

**Routing:**

- React Router DOM 6.22.0 (Client-side routing)

**Forms & Validation:**

- React Hook Form 7.50.1 (Form management)
- Zod 3.22.4 (Schema validation)
- @hookform/resolvers (Zod integration)

**Animations:**

- GSAP 3.14.2 (Professional animations)
- @gsap/react 2.1.1 (React integration)

**Icons:**

- Lucide React 0.344.0 (Icon library)

**Testing:**

- Vitest 1.3.1 (Unit testing)
- @vitest/ui 1.3.1 (Vitest UI)
- Testing Library (React, Jest DOM, User Event)
- jsdom 24.0.0 (DOM environment for testing)

**Linting & Formatting:**

- ESLint 8.57.0 (Code linting)
- @typescript-eslint (TypeScript linting)
- Prettier 3.2.5 (Code formatting)
- ESLint Config Prettier (Integration)

### Backend

**Language & Framework:**

- Python 3.11 (Programming language)
- FastAPI 0.109.0 (Web framework)
- Uvicorn 0.27.0 (ASGI server)

**Database & ORM:**

- SQLAlchemy 2.0.25 (ORM)
- Alembic 1.13.1 (Database migrations)

**Validation & Serialization:**

- Pydantic 2.5.3 (Data validation)
- Pydantic Settings 2.1.0 (Configuration management)

**Authentication & Security:**

- python-jose[cryptography] 3.3.0 (JWT tokens)
- passlib[bcrypt] 1.7.4 (Password hashing)

**Background Tasks:**

- Celery 5.3.6 (Task queue)
- Redis 5.0.1 (Cache & message broker)

**HTTP Client:**

- httpx 0.26.0 (Async HTTP client)

**File Uploads:**

- aiofiles 23.2.1 (Async file operations)
- python-multipart 0.0.6 (Form data handling)

**Environment Management:**

- python-dotenv 1.0.0 (Environment variables)

**Testing:**

- Pytest 7.4.4 (Testing framework)
- pytest-asyncio 0.23.3 (Async support)
- pytest-cov 4.1.0 (Coverage)

**Linting & Type Checking:**

- Ruff 0.1.14 (Fast Python linter)
- Mypy 1.8.0 (Static type checking)

### Database

- PostgreSQL 15 (Primary database via Supabase)
- Supabase (Database hosting & management)
- Redis 7 (Caching & task queue)

### Infrastructure

- Turbo 1.12.5 (Monorepo workspace manager)
- GitHub Actions (CI/CD)
- Docker (Containerization)
- Docker Compose (Local development)

### Deployment (Future)

- Vercel (Frontend deployment)
- Render (Backend deployment)
- Supabase (Database & Auth hosting)

### External Integrations

- Midtrans (Payment gateway for Indonesian market)
- OpenAI GPT-4.1 nano (AI recommendations with fine-tuning)
- Resend/SendGrid (Transactional emails)

---

## 4. Repository Structure

```
nutri-guard/
├── apps/                              # Monorepo applications
│   ├── frontend/                       # React 18 + Vite
│   │   ├── src/
│   │   │   ├── components/             # UI components
│   │   │   │   └── ui/                # shadcn/ui components
│   │   │   ├── pages/                  # Route components
│   │   │   │   ├── landing/           # Landing page components
│   │   │   │   ├── dashboard/         # Dashboard components
│   │   │   │   ├── auth/              # Authentication pages
│   │   │   │   ├── Index.tsx          # Home page
│   │   │   │   ├── Donasi.tsx         # Donation page
│   │   │   │   ├── NotFound.tsx       # 404 page
│   │   │   │   └── ...
│   │   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── lib/                   # Utilities
│   │   │   │   └── utils.ts           # Common utilities
│   │   │   ├── store/                 # Zustand stores
│   │   │   ├── types/                 # TypeScript types
│   │   │   ├── api/                   # API client (Axios/TanStack)
│   │   │   ├── test/                  # Test setup
│   │   │   │   └── setup.ts           # Test configuration
│   │   │   ├── main.tsx               # React entry point
│   │   │   ├── App.tsx                # Root component
│   │   │   └── index.css              # Global styles
│   │   ├── public/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── tsconfig.node.json
│   │   ├── vitest.config.ts
│   │   ├── .eslintrc.cjs
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   └── components.json
│   │
│   └── backend/                        # Python FastAPI
│       ├── app/
│       │   ├── api/                    # FastAPI routers
│       │   │   ├── __init__.py
│       │   │   ├── auth/               # Auth endpoints
│       │   │   ├── users/              # User endpoints
│       │   │   ├── donations/          # Donation endpoints
│       │   │   ├── nutrition/          # Nutrition endpoints
│       │   │   ├── payments/           # Payment endpoints
│       │   │   └── vendors/           # Vendor endpoints
│       │   ├── models/                 # SQLAlchemy models
│       │   │   ├── __init__.py
│       │   │   ├── user.py
│       │   │   ├── transaction.py
│       │   │   ├── nutrition.py
│       │   │   └── ...
│       │   ├── schemas/                # Pydantic schemas
│       │   │   ├── __init__.py
│       │   │   ├── user.py
│       │   │   ├── transaction.py
│       │   │   └── ...
│       │   ├── services/               # Business logic
│       │   │   ├── __init__.py
│       │   │   ├── auth_service.py
│       │   │   ├── donation_service.py
│       │   │   ├── ai_service.py
│       │   │   └── ...
│       │   ├── repositories/           # Database operations
│       │   │   ├── __init__.py
│       │   │   ├── user_repo.py
│       │   │   └── ...
│       │   ├── middleware/             # Custom middleware
│       │   │   ├── auth.py
│       │   │   └── cors.py
│       │   ├── utils/                  # Utilities
│       │   │   ├── security.py
│       │   │   └── helpers.py
│       │   └── main.py                 # FastAPI app entry point
│       ├── tests/
│       │   ├── __init__.py
│       │   ├── unit/                   # Unit tests
│       │   ├── integration/            # Integration tests
│       │   └── conftest.py             # Pytest configuration
│       ├── requirements.txt            # Python dependencies
│       ├── pyproject.toml              # Python project config
│       ├── pytest.ini                  # Pytest config
│       ├── .env.example                # Environment variables template
│       └── Dockerfile                  # Docker image
│
├── packages/                           # Shared packages (future)
│   └── shared-types/                   # TypeScript types
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                               # Documentation
│   ├── 00-PROJECT-OVERVIEW.md
│   ├── 01-SYSTEM-ARCHITECTURE.md
│   ├── 02-FUNCTIONAL-REQUIREMENTS.md
│   ├── 03-NON-FUNCTIONAL-REQUIREMENTS.md
│   ├── 04-DATABASE-DESIGN.md
│   ├── 05-API-REQUIREMENTS.md
│   ├── 06-TESTING-STRATEGY.md
│   └── diagrams/                       # Additional diagrams
│
├── diagrams/                           # UML diagrams (PlantUML)
│   ├── 01-use-case-diagram.puml
│   ├── 02-class-diagram-backend.puml
│   ├── 03-class-diagram-frontend.puml
│   ├── 04-sequence-diagram-login.puml
│   ├── 04-sequence-diagram-donation.puml
│   ├── 04-sequence-diagram-ai.puml
│   ├── 05-package-diagram-backend.puml
│   ├── 05-package-diagram-frontend.puml
│   ├── 06-state-diagram-user.puml
│   ├── 06-state-diagram-transaction.puml
│   ├── 06-state-diagram-subscription.puml
│   ├── 07-activity-diagram-login.puml
│   ├── 07-activity-diagram-donation.puml
│   ├── 07-activity-diagram-ai.puml
│   ├── 07-activity-diagram-settlement.puml
│   ├── 08-deployment-diagram.puml
│   ├── README.md                       # PlantUML guide
│   ├── SUMMARY.md                      # Complete summary
│   └── INDEX.md                       # Quick index
│
├── .github/                            # GitHub configuration
│   ├── workflows/                      # CI/CD workflows
│   │   ├── ci-frontend.yml
│   │   ├── ci-backend.yml
│   │   └── branch-protection.yml
│   └── BRANCHING.md                    # Branching strategy docs
│
├── supabase/                           # Supabase migrations
│   ├── migrations/
│   └── config.toml
│
├── docker/                             # Docker configurations
│   ├── docker-compose.yml
│   └── .dockerignore
│
├── turbo.json                          # Turbo workspace config
├── package.json                        # Root package.json
├── .gitignore
├── .prettierrc.json
├── .prettierignore
├── README.md
├── AGENTS.md
├── PROJECT_CONTEXT.md                  # THIS FILE
├── CONTRIBUTING.md
└── LICENSE
```

---

## 5. System Architecture

### Architecture Pattern

**Modular Monolith dengan Monorepo**

NutriGuard menggunakan pendekatan modular monolith di mana frontend dan backend diorganisasi dalam monorepo dengan workspace manager (Turbo). Ini memberikan fleksibilitas untuk scaling di masa depan sambil menjaga kesederhanaan development untuk tim 2-5 orang.

### Frontend Architecture

**Component-Based Architecture (React 18)**

- **Client-Side Rendering (CSR):** React 18 dengan Vite untuk performa optimal
- **Component Structure:**
  - **UI Components:** Reusable components (shadcn/ui primitives)
  - **Page Components:** Route-level components di `pages/` folder
  - **Feature Components:** Domain-specific components
  - **Layout Components:** App shell (Navbar, Sidebar, Footer)

- **State Management:**
  - **Global State:** Zustand untuk cross-component state
  - **Local State:** React hooks (useState, useContext, useReducer)
  - **Server State:** TanStack Query untuk API data caching

- **Data Flow:**
  1. User interaction triggers event
  2. Component updates local state
  3. Component calls API (via TanStack Query)
  4. API returns data, cached by TanStack Query
  5. Component re-renders with new data

- **Routing:**
  - React Router v6 untuk client-side routing
  - Nested routes untuk complex UI
  - Lazy loading untuk performance

### Backend Architecture

**Layered Architecture (FastAPI)**

- **API Layer (Routers):**
  - Handle HTTP requests
  - Validate input (Pydantic schemas)
  - Call service layer
  - Return responses (JSON)

- **Service Layer:**
  - Business logic
  - Coordinate multiple repositories
  - Call external APIs (Midtrans, OpenAI)
  - Enforce business rules

- **Repository Layer:**
  - Database operations (SQLAlchemy)
  - Data access abstraction
  - Query optimization
  - Transaction management

- **Model Layer:**
  - SQLAlchemy models
  - Database table definitions
  - Relationships between entities

- **Middleware:**
  - CORS (Cross-Origin Resource Sharing)
  - Authentication (JWT verification)
  - Logging (request/response logging)
  - Rate limiting (future)

- **Background Tasks (Celery + Redis):**
  - Email notifications
  - Payment webhook processing
  - AI recommendation generation
  - Scheduled tasks

### Data Flow Architecture

```
User (Browser)
    ↓
Frontend (React)
    ↓ [HTTP/JSON]
API Gateway (FastAPI)
    ↓
Service Layer
    ↓ [SQLAlchemy]
Database (PostgreSQL)
    ↓
External APIs (Midtrans, OpenAI)
```

**Detailed Flow:**

1. **User Request:**
   - User interacts with React component
   - Component triggers action (submit form, click button)
   - State updated locally

2. **API Call:**
   - Component calls API function (TanStack Query)
   - Axios sends HTTP request to backend
   - Request includes JWT token (if authenticated)

3. **Backend Processing:**
   - FastAPI receives request
   - Middleware verifies JWT token
   - Router matches endpoint
   - Pydantic validates request body

4. **Service Layer:**
   - Service receives validated data
   - Executes business logic
   - Calls repository for data operations
   - Calls external APIs if needed

5. **Database Operations:**
   - Repository executes SQL query via SQLAlchemy
   - Database returns data
   - Repository returns to service

6. **Response:**
   - Service returns data to router
   - Router returns JSON response
   - TanStack Query caches response
   - Component re-renders with new data

### Security Architecture

- **Authentication:** JWT tokens with 7-day expiration
- **Password Hashing:** bcrypt with salt
- **Authorization:** Role-based (User, Vendor, Admin)
- **CORS:** Configured for specific origins
- **Input Validation:** Pydantic schemas + Zod
- **SQL Injection Prevention:** SQLAlchemy ORM
- **XSS Protection:** React automatic escaping
- **CSRF Protection:** Token-based (future)

---

## 6. Core Features

### User Features (Donor)

#### 1. Autentikasi

- **Registrasi:** Sign up sebagai Donor dengan email & password
- **Login:** Login dengan email & password + JWT token
- **Reset Password:** Lupa password dengan email link reset
- **Email Verification:** Verifikasi email setelah registrasi
- **Remember Me:** Session persistence (7 days)
- **Logout:** Session invalidation

#### 2. Dashboard

- **Overview:** Statistik donasi, saldo, aktivitas terbaru
- **Quick Actions:** Akses cepat ke fitur-fitur utama
- **Notifications:** Notifikasi sistem (donasi, pembayaran, dll)
- **Profile:** Lihat dan edit profil user

#### 3. Dompet Nutrisi

- **Cek Saldo:** Lihat saldo dompet nutrisi
- **Top Up:** Tambah saldo via Midtrans (QRIS, VA, E-Wallet, CC)
- **Riwayat Transaksi:** Daftar semua transaksi (donasi, top-up, voucher)
- **Filter & Pagination:** Filter berdasarkan tipe & tanggal
- **Download Receipt:** Download bukti transaksi

#### 4. Pemantauan Gizi

- **Input Data Nutrisi:** Input kalori, protein, karbohidrat, lemak harian
- **Grafik Progress:** Visualisasi progress nutrisi mingguan/bulanan
- **Perbandingan:** Bandingkan dengan rekomendasi harian
- **Data History:** Lihat riwayat input nutrisi
- **Edit/Delete:** Edit atau hapus input nutrisi

#### 5. Rekomendasi AI

- **Generate Rekomendasi:** Request rekomendasi nutrisi via OpenAI GPT-4.1 nano
- **Personalized:** Rekomendasi berdasarkan data nutrisi & preferensi
- **Multiple Options:** 3-5 opsi rekomendasi makanan
- **Nutrition Info:** Informasi nutrisi untuk setiap opsi
- **Health Benefits:** Manfaat kesehatan untuk setiap opsi
- **Save Preferences:** Simpan rekomendasi yang dipilih
- **Fallback:** Rule-based recommendations jika AI gagal

#### 6. Donasi

- **Donasi One-Time:** Donasi sekali dengan nominal pilihan
- **Pilih Penerima:** Pilih penerima donasi (individual, vendor, organization)
- **Pilih Payment Method:** QRIS, Virtual Account, E-Wallet, Credit Card
- **Konfirmasi:** Review detail donasi sebelum konfirmasi
- **Payment Gateway:** Redirect ke Midtrans untuk pembayaran
- **Status Tracking:** Track status pembayaran (pending, processing, completed, failed)
- **Notifikasi:** Email notifikasi setelah donasi berhasil
- **Sertifikat:** Generate sertifikat donasi (PDF)

#### 7. Donor Langganan

- **Paket Langganan:** Pilih paket (mingguan, bulanan, tahunan)
- **Custom Amount:** Input nominal custom
- **Auto-Renewal:** Pembayaran otomatis setiap periode
- **Manage Subscription:** Pause, resume, atau cancel subscription
- **Billing History:** Lihat riwayat pembayaran langganan
- **Payment Method:** Update payment method

#### 8. Riwayat Donasi

- **Daftar Donasi:** Lihat semua donasi yang sudah dilakukan
- **Filter:** Filter berdasarkan tanggal, tipe, status
- **Detail Donasi:** Lihat detail lengkap setiap donasi
- **Download Sertifikat:** Download sertifikat donasi (PDF)
- **Share:** Share donasi ke social media
- **Total Impact:** Lihat total dampak donasi (uang, penerima, dll)

#### 9. Dampak Donasi

- **Statistik Dampak:** Total donasi, jumlah penerima, dll
- **Achievement Badges:** Badges berdasarkan total donasi
- **Leaderboard:** Peringkat donor
- **Comparison:** Bandingkan dengan rata-rata
- **Real-time Update:** Update real-time saat donasi baru masuk

#### 10. Survei FIES

- **FIES Survey:** Food Insecurity Experience Scale survey
- **8 Pertanyaan:** 8 pertanyaan standar FIES
- **Hitung Skor:** Otomatis hitung skor FIES (0-27)
- **Kategori Kecamanan:** Kategorikan (food_secure, mild, moderate, severe)
- **Periodic:** Survei bisa diulang setiap 30 hari
- **History:** Lihat riwayat survei FIES

#### 11. Penukaran Voucher

- **Input Kode:** Input kode voucher
- **Validasi:** Validasi kode voucher (valid, kadaluarsa, sudah dipakai)
- **Cek Benefit:** Cek benefit voucher (diskon, gratis produk, dll)
- **Redeem:** Tukarkan voucher dan update saldo/dompet

### Vendor Features

#### 1. Autentikasi

- **Registrasi Vendor:** Sign up sebagai vendor dengan business info
- **Verifikasi Bisnis:** Upload dokumen verifikasi (NPWP, SIUP, dll)
- **Status Verifikasi:** Cek status verifikasi (pending, verified, rejected)

#### 2. Dashboard

- **Overview:** Penjualan total, order pending, saldo
- **Analytics:** Grafik penjualan (harian, mingguan, bulanan)
- **Orders:** Daftar pesanan terbaru
- **Notifications:** Notifikasi pesanan baru, settlement, dll

#### 3. Kelola Produk

- **Tambah Produk:** Create produk baru dengan info lengkap
- **Edit Produk:** Update produk yang ada
- **Hapus Produk:** Delete produk (dengan konfirmasi)
- **Upload Gambar:** Upload multiple gambar produk
- **Update Stok:** Update stok produk
- **Kategori:** Kategorisasi produk (sayur, buah, dll)
- **Nutrition Info:** Input info nutrisi produk
- **Status:** Set status aktif/nonaktif

#### 4. Kelola Pesanan

- **Daftar Pesanan:** Lihat semua pesanan yang masuk
- **Filter:** Filter berdasarkan status (pending, completed, cancelled)
- **Update Status:** Update status pesanan (confirmed, processing, shipped, delivered)
- **Detail Pesanan:** Lihat detail lengkap pesanan
- **Cetak Invoice:** Print invoice pesanan

#### 5. Vendor Settlement

- **Request Settlement:** Request penarikan dana
- **Cek Balance:** Cek saldo tersedia
- **Bank Info:** Input detail rekening bank
- **Riwayat Settlement:** Lihat riwayat penarikan dana
- **Upload Bukti:** Upload bukti transfer (untuk konfirmasi admin)
- **Status Tracking:** Track status settlement (requested, in_process, paid, rejected)

### Admin Features

#### 1. Dashboard

- **Overview Sistem:** Statistik user, vendor, donasi, transaksi
- **Analytics:** Grafik pertumbuhan, tren, dll
- **Recent Activity:** Aktivitas terbaru di sistem
- **System Health:** Status sistem (database, API, dll)

#### 2. Manage Users

- **List Users:** Lihat semua user (donor, vendor, admin)
- **Filter & Search:** Filter berdasarkan role, status, dll
- **Detail User:** Lihat detail lengkap user
- **Edit User:** Update info user
- **Delete User:** Delete user (dengan konfirmasi)
- **Ban/Unban:** Ban atau unban user

#### 3. Verify Vendor

- **Pending Verifications:** Daftar vendor yang menunggu verifikasi
- **Review Documents:** Review dokumen verifikasi vendor
- **Approve/Reject:** Approve atau reject verifikasi
- **Add Notes:** Tambah catatan untuk vendor
- **Send Notification:** Kirim notifikasi ke vendor

#### 4. Manage Vouchers

- **Create Voucher:** Create voucher baru
- **Edit Voucher:** Update voucher yang ada
- **Delete Voucher:** Delete voucher
- **View Usage:** Lihat statistik penggunaan voucher
- **Set Expiry:** Set tanggal kadaluarsa voucher
- **Generate Code:** Generate random voucher codes

#### 5. Manage Settlement Requests

- **Pending Requests:** Daftar settlement yang pending
- **Review Request:** Review detail settlement request
- **Approve/Reject:** Approve atau reject request
- **Process Payment:** Process payment ke rekening vendor
- **Upload Proof:** Upload bukti transfer
- **History:** Lihat riwayat settlement

#### 6. View Analytics

- **Donation Analytics:** Statistik donasi (total, rata-rata, tren)
- **User Analytics:** Statistik user (growth, retention, aktifitas)
- **Vendor Analytics:** Statistik vendor (penjualan, performance)
- **Product Analytics:** Statistik produk (popular, terjual)
- **Revenue Analytics:** Pendapatan platform (fees, dll)

### Guest Features

#### 1. Landing Page

- **Hero Section:** Banner utama dengan CTA
- **Impact Section:** Statistik dampak donasi
- **How It Works:** Penjelasan cara kerja
- **Trust Section:** Testimonials dan partner
- **CTA Section:** Call-to-action untuk registrasi

#### 2. Katalog Pangan

- **Browse Products:** Lihat produk dari vendor
- **Filter Kategori:** Filter berdasarkan kategori (sayur, buah, dll)
- **Search:** Cari produk berdasarkan nama/keyword
- **Detail Produk:** Lihat detail produk (nutrisi, harga, stok)
- **Add to Cart:** Tambah produk ke keranjang (future)

#### 3. Registrasi

- **Sign Up Donor:** Registrasi sebagai donor
- **Sign Up Vendor:** Registrasi sebagai vendor
- **Form Validation:** Validasi form real-time
- **Email Verification:** Kirim email verifikasi

---

## 7. Database & Models

### Database Technology

- **Primary Database:** PostgreSQL 15
- **Hosting:** Supabase (managed PostgreSQL)
- **ORM:** SQLAlchemy 2.0 (async support)
- **Migrations:** Alembic
- **Local Development:** PostgreSQL via Docker Compose

### Core Models

#### 1. User (Base Model)

```python
class User(Base):
    id: UUID
    email: String (unique, indexed)
    password_hash: String
    full_name: String
    phone_number: String (nullable)
    role: Enum["guest", "user", "vendor", "admin"]
    is_active: Boolean
    email_verified: Boolean
    created_at: DateTime
    updated_at: DateTime
    last_login: DateTime (nullable)
```

**Purpose:** Base model untuk semua user types (Donor, Vendor, Admin)

**Relationships:**

- One-to-Many → Transactions (Donor)
- One-to-Many → Subscriptions (Donor)
- One-to-Many → Products (Vendor)
- One-to-Many → Settlements (Vendor)

---

#### 2. Donor (Inherits User)

```python
class Donor(User):
    wallet_balance: Decimal (default=0)
    total_donations: Decimal (default=0)
    fies_score: Integer (nullable, 0-27)
    fies_category: Enum (nullable)
    date_of_birth: Date (nullable)
    gender: Enum["male", "female", "other"] (nullable)
    address: Text (nullable)
```

**Purpose:** Extended model untuk donor dengan specific fields

**Additional Features:**

- Dompet nutrisi (wallet balance)
- Total donasi untuk tracking
- Skor FIES untuk food insecurity assessment

---

#### 3. Vendor (Inherits User)

```python
class Vendor(User):
    business_name: String
    business_type: Enum["individual", "company"]
    tax_id: String (nullable)
    bank_account: String (nullable)
    bank_name: String (nullable)
    account_holder: String (nullable)
    verified_status: Enum["pending", "verified", "rejected"]
    balance: Decimal (default=0)
    total_sales: Decimal (default=0)
    rating: Decimal (default=0, 0-5)
```

**Purpose:** Extended model untuk vendor dengan business info

**Additional Features:**

- Verification status untuk vendor approval
- Balance untuk settlement
- Rating system untuk vendor performance

---

#### 4. Admin (Inherits User)

```python
class Admin(User):
    permission_level: Enum["super_admin", "moderator", "support"]
```

**Purpose:** Extended model untuk admin dengan permission levels

---

#### 5. Transaction

```python
class Transaction(Base):
    id: UUID
    user_id: UUID (Foreign Key → User)
    recipient_id: UUID (Foreign Key → User, nullable)
    amount: Decimal
    type: Enum["donation", "subscription", "purchase", "topup", "voucher_redemption"]
    status: Enum["pending", "processing", "completed", "failed", "cancelled", "expired"]
    payment_method: Enum["qris", "va", "ewallet", "credit_card", "wallet_balance"]
    payment_url: String (nullable)
    midtrans_order_id: String (nullable)
    transaction_time: DateTime (nullable)
    created_at: DateTime
    updated_at: DateTime
```

**Purpose:** Record semua transaksi di sistem (donasi, top-up, dll)

**Relationships:**

- Many-to-One → User (donor)
- Many-to-One → User (recipient)

**Status Flow:**

- Created → Pending → Processing → Completed/Failed/Cancelled/Expired

---

#### 6. Subscription

```python
class Subscription(Base):
    id: UUID
    user_id: UUID (Foreign Key → User)
    amount: Decimal
    frequency: Enum["weekly", "monthly", "yearly"]
    next_billing_date: Date
    status: Enum["active", "suspended", "cancelled", "expired"]
    midtrans_subscription_id: String (nullable)
    created_at: DateTime
    updated_at: DateTime
    cancelled_at: DateTime (nullable)
```

**Purpose:** Manage recurring subscriptions (donasi langganan)

**Relationships:**

- Many-to-One → User (donor)

**Status Flow:**

- Created → Active → PendingRenewal → Active/Suspended/Paused → Cancelled/Expired

---

#### 7. NutritionData

```python
class NutritionData(Base):
    id: UUID
    user_id: UUID (Foreign Key → User)
    date: Date
    calories: Integer
    protein: Decimal
    carbohydrates: Decimal
    fats: Decimal
    fiber: Decimal (nullable)
    water: Decimal (nullable)
    notes: Text (nullable)
    created_at: DateTime
    updated_at: DateTime
```

**Purpose:** Track daily nutrition intake for users

**Relationships:**

- Many-to-One → User (donor)

---

#### 8. Product

```python
class Product(Base):
    id: UUID
    vendor_id: UUID (Foreign Key → Vendor)
    name: String
    category: Enum["vegetable", "fruit", "grain", "protein", "dairy", "processed"]
    description: Text (nullable)
    price: Decimal
    unit: String (kg, kg, pcs, dll)
    stock: Integer
    nutrition_info: JSON
    images: Array[String]
    is_active: Boolean (default=True)
    rating: Decimal (default=0, 0-5)
    sold_count: Integer (default=0)
    created_at: DateTime
    updated_at: DateTime
```

**Purpose:** Manage products from vendors

**Relationships:**

- Many-to-One → Vendor
- One-to-Many → Transactions (purchase)

**Nutrition Info (JSON):**

```json
{
  "calories": 50,
  "protein": 2,
  "carbohydrates": 10,
  "fats": 0.5,
  "fiber": 3,
  "sugar": 5
}
```

---

#### 9. Voucher

```python
class Voucher(Base):
    id: UUID
    code: String (unique)
    type: Enum["percentage", "fixed"]
    value: Decimal
    max_discount: Decimal (nullable)
    min_order_amount: Decimal (default=0)
    usage_limit: Integer (nullable, 0 = unlimited)
    used_count: Integer (default=0)
    expiry_date: DateTime
    applicable_to: Enum["all", "donation", "purchase"]
    is_active: Boolean (default=True)
    created_at: DateTime
    updated_at: DateTime
```

**Purpose:** Manage promotional vouchers

**Relationships:**

- Many-to-Many → User (UserVoucher junction table)

---

#### 10. FIESSurvey

```python
class FIESSurvey(Base):
    id: UUID
    user_id: UUID (Foreign Key → User)
    answers: JSON (8 questions)
    score: Integer (0-27)
    category: Enum["food_secure", "mild_insecurity", "moderate_insecurity", "severe_insecurity"]
    survey_date: DateTime
    next_survey_date: DateTime (current + 30 days)
    created_at: DateTime
```

**Purpose:** Track Food Insecurity Experience Scale surveys

**Relationships:**

- Many-to-One → User (donor)

**FIES Categories:**

- 0-1: Food Secure
- 2-3: Mild Insecurity
- 4-5: Moderate Insecurity
- 6+: Severe Insecurity

---

#### 11. Settlement

```python
class Settlement(Base):
    id: UUID
    vendor_id: UUID (Foreign Key → Vendor)
    amount: Decimal
    status: Enum["requested", "in_process", "paid", "rejected", "cancelled"]
    bank_account: String
    bank_name: String
    account_holder: String
    proof_of_transfer: String (nullable)
    admin_notes: Text (nullable)
    requested_at: DateTime
    processed_at: DateTime (nullable)
    created_at: DateTime
    updated_at: DateTime
```

**Purpose:** Manage vendor settlement requests

**Relationships:**

- Many-to-One → Vendor

**Status Flow:**

- Requested → InProcess → Paid/Rejected/Cancelled

---

#### 12. AIRecommendation

```python
class AIRecommendation(Base):
    id: UUID
    user_id: UUID (Foreign Key → User)
    nutrition_data_id: UUID (Foreign Key → NutritionData)
    input_data: JSON
    recommendations: JSON
    model_version: String (e.g., "gpt-4.1-nano-fine-tuned")
    confidence_score: Decimal (0-1)
    is_fallback: Boolean
    created_at: DateTime
```

**Purpose:** Store AI-generated nutrition recommendations

**Relationships:**

- Many-to-One → User (donor)
- Many-to-One → NutritionData

**Recommendations (JSON):**

```json
[
  {
    "food_name": "Ayam Goreng",
    "portion": "100g",
    "calories": 250,
    "protein": 25,
    "carbohydrates": 0,
    "fats": 15,
    "benefits": "High protein, good for muscle growth"
  },
  ...
]
```

---

#### 13. Payment

```python
class Payment(Base):
    id: UUID
    order_id: String (unique)
    user_id: UUID (Foreign Key → User)
    amount: Decimal
    payment_type: Enum["donation", "subscription", "purchase", "topup"]
    midtrans_order_id: String (nullable)
    payment_method: Enum["qris", "va", "ewallet", "credit_card", "bank_transfer"]
    payment_url: String (nullable)
    status: Enum["pending", "settlement", "deny", "expire", "cancel"]
    payment_details: JSON (nullable)
    created_at: DateTime
    updated_at: DateTime
```

**Purpose:** Store payment records from Midtrans

**Relationships:**

- Many-to-One → User

**Payment Details (JSON):**

```json
{
  "va_number": "8800123456789",
  "bank": "bca",
  "expiry_time": "2025-03-07T15:00:00Z"
}
```

---

#### 14. Notification

```python
class Notification(Base):
    id: UUID
    user_id: UUID (Foreign Key → User)
    type: Enum["payment", "donation", "subscription", "settlement", "system"]
    title: String
    message: Text
    is_read: Boolean (default=False)
    created_at: DateTime
```

**Purpose:** Store user notifications

**Relationships:**

- Many-to-One → User

---

### Database Relationships Summary

```
User (Base)
├── Donor (inherits User)
│   ├── Transactions (1:N)
│   ├── Subscriptions (1:N)
│   ├── NutritionData (1:N)
│   ├── FIESSurvey (1:N)
│   ├── AIRecommendations (1:N)
│   └── Vouchers (N:M)
├── Vendor (inherits User)
│   ├── Products (1:N)
│   ├── Settlements (1:N)
│   └── Transactions (1:N, as recipient)
└── Admin (inherits User)

Transaction
├── User (N:1, donor)
├── User (N:1, recipient)
└── Payment (1:1)

Product
├── Vendor (N:1)
└── Transactions (1:N, purchases)
```

---

## 8. API Integrations

### Midtrans Payment Gateway

**Purpose:** Handle payment transactions for donations, subscriptions, and purchases.

**Integration Method:** Python `midtrans-client` library + Midtrans Snap (frontend)

**Supported Payment Methods:**

- QRIS (QR code payment)
- Virtual Account (BCA, BNI, Mandiri, Permata, etc.)
- E-Wallet (GoPay, OVO, Dana, ShopeePay)
- Credit Card (Visa, MasterCard, JCB)

**API Endpoints Used:**

- Create Transaction: POST /v2/charge
- Get Transaction Status: GET /v2/{order_id}/status
- Cancel Transaction: POST /v2/{order_id}/cancel

**Webhook:**

- Midtrans sends webhook notifications for payment status updates
- Endpoint: POST /api/webhooks/payment
- Signature verification required for security

**Implementation:**

```python
# Backend: Create Payment
def create_payment(amount, payment_method, order_id):
    midtrans_api = MidtransAPI(server_key, is_production=False)
    transaction_details = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": amount
        },
        "payment_type": payment_type,
        ...
    }
    response = midtrans_api.charge(transaction_details)
    return response

# Webhook Handler
@router.post("/webhooks/payment")
async def handle_payment_webhook(request: Request):
    signature_key = calculate_signature(request.json)
    if signature_key != request.headers["X-Signature-Key"]:
        raise HTTPException(401, "Invalid signature")

    # Process webhook
    order_id = request.json["order_id"]
    transaction_status = request.json["transaction_status"]

    # Update database
    update_transaction_status(order_id, transaction_status)
```

**Frontend Integration:**

```typescript
// Redirect to Midtrans Snap
window.location.href = payment_url; // From backend response

// Or embed Snap.js
snap.pay(snap_token, {
  onSuccess: (result) => {
    console.log("Payment success", result);
  },
  onPending: (result) => {
    console.log("Payment pending", result);
  },
  onError: (result) => {
    console.log("Payment error", result);
  },
});
```

---

### OpenAI GPT-4.1 nano

**Purpose:** Generate personalized nutrition recommendations based on user data.

**Integration Method:** `openai-python` SDK

**Model:** `gpt-4.1-nano` (optimized for nutrition recommendations with fine-tuning)

**API Endpoints Used:**

- Chat Completions: POST /v1/chat/completions

**Implementation:**

```python
# Backend: Generate Recommendations
def generate_ai_recommendations(user_nutrition_data, user_preferences):
    openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

    # Build prompt
    prompt = f"""
    Based on the following nutrition data and user preferences, generate 3-5 personalized food recommendations:

    User Nutrition Data:
    - Daily Calories: {user_nutrition_data.calories} kcal
    - Protein: {user_nutrition_data.protein}g
    - Carbohydrates: {user_nutrition_data.carbohydrates}g
    - Fats: {user_nutrition_data.fats}g

    User Preferences:
    - Dietary Restrictions: {user_preferences.restrictions}
    - Allergies: {user_preferences.allergies}
    - Cuisine Preference: {user_preferences.cuisine}

    For each recommendation, provide:
    - Food Name
    - Portion Size (in grams)
    - Calories, Protein, Carbs, Fats (per portion)
    - Health Benefits

    Respond in JSON format with an array of recommendations.
    """

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=[
                {"role": "system", "content": "You are a nutrition expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        recommendations = json.loads(response.choices[0].message.content)

        # Save to database
        save_recommendations(user_id, recommendations)

        return recommendations

    except OpenAIError as e:
        # Fallback to rule-based recommendations
        return generate_rule_based_recommendations(user_nutrition_data)
```

**Fallback Mechanism:**
If OpenAI API fails (rate limit, timeout, error), system falls back to rule-based recommendations:

```python
def generate_rule_based_recommendations(nutrition_data):
    # Simple rules based on nutrition data
    if nutrition_data.calories < 1500:
        return high_calorie_foods
    elif nutrition_data.protein < 50:
        return high_protein_foods
    else:
        return balanced_meals
```

**Fine-Tuning (Future):**
Model will be fine-tuned on Indonesian food database for more accurate and culturally relevant recommendations.

---

### Supabase

**Purpose:** Managed PostgreSQL database, authentication, and file storage.

**Integration Method:** Supabase Python SDK + Supabase JS SDK

**Components Used:**

1. **PostgreSQL Database:**
   - Primary database for all data
   - Automatic backups
   - Real-time subscriptions (future)

2. **Supabase Auth:**
   - JWT-based authentication
   - Email verification
   - Social auth (Google, GitHub) - future

3. **Supabase Storage:**
   - File storage for product images
   - User avatar uploads
   - Document uploads (vendor verification)

**Implementation:**

```python
# Backend: Supabase Database Connection
from supabase import create_client

supabase = create_client(
    supabase_url=settings.SUPABASE_URL,
    supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY
)

# Alternatively, use SQLAlchemy with Supabase connection string
from sqlalchemy import create_engine

engine = create_engine(settings.DATABASE_URL)
```

```typescript
// Frontend: Supabase JS Client
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Auth
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "password",
});

// Storage
const { data, error } = await supabase.storage.from("products").upload("image.jpg", file);
```

---

### Email Service (Resend/SendGrid)

**Purpose:** Send transactional emails (verification, donation confirmation, etc.)

**Integration Method:** Resend API or SendGrid API

**Email Types:**

1. Email Verification
2. Password Reset
3. Donation Confirmation
4. Subscription Confirmation
5. Payment Success/Failure
6. Settlement Notification
7. AI Recommendations (optional)

**Implementation:**

```python
# Backend: Send Email
import resend

resend.api_key = settings.RESEND_API_KEY

def send_verification_email(email, verification_link):
    params = {
        "from": "NutriGuard <no-reply@nutriguard.id>",
        "to": email,
        "subject": "Verify Your Email",
        "html": f"""
        <p>Click the link below to verify your email:</p>
        <a href="{verification_link}">Verify Email</a>
        """
    }

    resend.Emails.send(params)

def send_donation_confirmation(email, donation_details):
    params = {
        "from": "NutriGuard <no-reply@nutriguard.id>",
        "to": email,
        "subject": "Donation Confirmation",
        "html": f"""
        <p>Thank you for your donation!</p>
        <p>Amount: Rp {donation_details.amount}</p>
        <p>Recipient: {donation_details.recipient}</p>
        """
    }

    resend.Emails.send(params)
```

---

## 9. CI/CD Strategy

### CI/CD Tool

**GitHub Actions** - Automated workflows for Continuous Integration and Continuous Deployment

### Current CI/CD Scope

**Phase:** Infrastructure Setup
**Scope:** Lint + Unit Tests (Integration & E2E tests later)

### CI/CD Workflows

#### 1. Frontend CI Workflow

**File:** `.github/workflows/ci-frontend.yml`

**Trigger:**

- Push to branches: `main`, `staging`, `feature/**`
- Pull request to branches: `main`, `staging`

**Jobs:**

1. **Lint:**
   - Runs ESLint
   - Ensures code quality
   - Fails if linting errors found

2. **Unit Tests:**
   - Runs Vitest unit tests
   - Ensures code functionality
   - Fails if tests fail

**Quality Gates:**

- All linting must pass
- All unit tests must pass

**Commands:**

```bash
# Lint
cd apps/frontend && npm run lint

# Unit Tests
cd apps/frontend && npm run test:run
```

---

#### 2. Backend CI Workflow

**File:** `.github/workflows/ci-backend.yml`

**Trigger:**

- Push to branches: `main`, `staging`, `feature/**`
- Pull request to branches: `main`, `staging`

**Jobs:**

1. **Lint:**
   - Runs Ruff (Python linter)
   - Runs Mypy (Type checker)
   - Ensures code quality
   - Fails if linting errors found

2. **Unit Tests:**
   - Runs Pytest unit tests
   - Ensures code functionality
   - Fails if tests fail

**Quality Gates:**

- All linting must pass
- All unit tests must pass

**Commands:**

```bash
# Lint
cd apps/backend && ruff check .
cd apps/backend && mypy app/

# Unit Tests
cd apps/backend && pytest tests/unit/
```

---

#### 3. Branch Protection Workflow

**File:** `.github/workflows/branch-protection.yml`

**Trigger:**

- Pull request to branches: `main`, `staging`

**Purpose:**

- Placeholder workflow for branch protection
- Actual enforcement via GitHub branch protection settings

---

### CI/CD Quality Gates

**Before Merge to Staging:**

- ✅ Frontend Lint (ESLint) must pass
- ✅ Frontend Unit Tests (Vitest) must pass
- ✅ Backend Lint (Ruff, Mypy) must pass
- ✅ Backend Unit Tests (Pytest) must pass
- ✅ Code review required (min 1 reviewer)
- ✅ Conversation resolution required

**Before Merge to Main:**

- ✅ All staging quality gates
- ✅ All tests pass (including staging tests)

### Future CI/CD Enhancements

**Integration Tests:**

- Frontend: API integration tests
- Backend: Database integration tests

**E2E Tests:**

- Playwright for critical user flows
- Run on staging environment

**Deployment:**

- Auto-deploy to Vercel (frontend) on merge to `main`/`staging`
- Auto-deploy to Render (backend) on merge to `main`/`staging`

---

## 10. Branching Strategy

### Branches

#### 1. Main

**Purpose:** Production-ready code

**Protected:** Yes

**Merge from:**

- `staging` (PR required, CI must pass)

**Deployment:**

- Manual (currently)
- Auto (future: on merge to main)

**Rules:**

- Require pull request before merging
- Require status checks to pass (Frontend CI, Backend CI)
- Require conversation resolution
- Restrict pushes (admin only)

---

#### 2. Staging

**Purpose:** Pre-production testing environment

**Protected:** Yes

**Merge from:**

- `feature/*` (PR required, CI must pass)

**Deployment:**

- Manual (currently)
- Auto (future: on merge to staging)

**Rules:**

- Require pull request before merging
- Require status checks to pass (Frontend CI, Backend CI)
- Require conversation resolution
- Restrict pushes (maintainer+)

---

#### 3. Feature/\*

**Purpose:** Feature development

**Protected:** No

**Merge to:**

- `staging` (PR required)

**Deployment:**

- None

**Rules:**

- No restrictions
- Developer can push directly

---

### Branch Naming Conventions

- `feature/feature-name` - New features
  - Example: `feature/tambah-fitur-dompet-nutrisi`
  - Example: `feature/integrasi-openai-api`

- `fix/bug-description` - Bug fixes
  - Example: `fix/fix-login-error-invalid-credentials`

- `hotfix/critical-bug` - Critical production bugs (direct to main)
  - Example: `hotfix/fix-payment-gateway-timeout`

- `refactor/refactor-description` - Code refactoring
  - Example: `refactor/refactor-user-service-architecture`

- `docs/documentation-update` - Documentation updates
  - Example: `docs/update-api-documentation`

- `test/test-improvement` - Testing improvements
  - Example: `test/add-integration-tests-for-donation-api`

- `chore/maintenance-task` - Maintenance tasks
  - Example: `chore/update-dependencies-to-latest-versions`

---

### Workflow

#### 1. Feature Development

```bash
# Create feature branch from staging
git checkout staging
git pull origin staging
git checkout -b feature/tambah-fitur-dompet-nutrisi

# Work on feature
# ... make changes ...

# Commit and push
git add .
git commit -m "feat: tambah fitur dompet nutrisi"
git push origin feature/tambah-fitur-dompet-nutrisi

# Create PR on GitHub: feature/* -> staging
# Wait for CI (Lint + Unit Tests)
# After CI passes, request review
# After review and approval, merge to staging
```

#### 2. Testing in Staging

```bash
# After PR merged to staging
# Auto-deploy to staging (future) or manual deploy
# QA testing in staging environment

# Bug fixes (new PR to staging)
git checkout staging
git pull origin staging
git checkout -b fix/fix-dompet-nutrisi-bug
# ... fix ...
git push origin fix/fix-dompet-nutrisi-bug
# Create PR to staging
```

#### 3. Production Deployment

```bash
# After staging is tested and ready
# Merge staging to main for production
git checkout main
git pull origin main
git merge staging
git push origin main

# Auto-deploy to production (future) or manual deploy
```

---

## 11. Development Workflow

### Prerequisites

**Software Required:**

- Node.js 20+ (Frontend)
- Python 3.11+ (Backend)
- npm (Package manager)
- Git
- Docker (optional, for local development)

**Account Required:**

- GitHub account (for repository)
- Supabase account (for database)
- Midtrans account (for payment testing)
- OpenAI account (for AI testing)

---

### Local Development

#### Setup Repository

```bash
# Clone repository
git clone https://github.com/USERNAME/nutri-guard.git
cd nutri-guard

# Install root dependencies
npm install
```

#### Frontend Setup

```bash
# Install frontend dependencies
cd apps/frontend
npm install

# Create environment file
cp .env.example .env

# Update environment variables
nano .env
```

**Environment Variables (Frontend):**

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

#### Backend Setup

```bash
# Install backend dependencies
cd apps/backend
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Update environment variables
nano .env
```

**Environment Variables (Backend):**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/nutriguard
REDIS_URL=redis://localhost:6379
ENVIRONMENT=development
DEBUG=True
SECRET_KEY=your-secret-key-here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_MERCHANT_ID=your_midtrans_merchant_id
```

---

### Running Applications

#### Option 1: Run Individually

**Frontend:**

```bash
cd apps/frontend
npm run dev
# Runs on http://localhost:3000
```

**Backend:**

```bash
cd apps/backend
uvicorn app.main:app --reload
# Runs on http://localhost:8000
```

---

#### Option 2: Run All with Turbo

```bash
# From root
npm run dev
# Runs both frontend and backend
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

---

### Testing

#### Frontend Tests

```bash
cd apps/frontend

# Run tests (watch mode)
npm run test

# Run tests (single run)
npm run test:run

# Run tests with UI
npm run test:ui
```

#### Backend Tests

```bash
cd apps/backend

# Run all tests
pytest

# Run unit tests only
pytest tests/unit/

# Run with coverage
pytest --cov=app

# Run with coverage report
pytest --cov=app --cov-report=html
```

---

### Linting

#### Frontend Linting

```bash
cd apps/frontend

# Run ESLint
npm run lint

# Fix ESLint issues (auto-fix)
npm run lint -- --fix
```

#### Backend Linting

```bash
cd apps/backend

# Run Ruff
ruff check .

# Fix Ruff issues (auto-fix)
ruff check . --fix

# Run Mypy (type checking)
mypy app/
```

---

### Code Formatting

```bash
# Format all code (Prettier)
npm run format

# Format frontend only
cd apps/frontend && npx prettier --write "src/**/*.{ts,tsx}"

# Format backend (Black)
cd apps/backend && black .
```

---

## 12. Testing Strategy

### Scope: Lint + Unit Tests (Current)

### Frontend Testing

#### Unit Tests (Vitest)

**Framework:** Vitest with jsdom environment

**Test Location:** `apps/frontend/src/**/*.{test,spec}.{ts,tsx}`

**Test Setup:** `apps/frontend/src/test/setup.ts`

**Coverage Goal:** >80%

**Example Test:**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "../App";

describe("App", () => {
  it("renders IndexPage on root path", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(screen.getByText("NutriGuard")).toBeInTheDocument();
  });

  it("renders NotFoundPage on unknown path", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    // Navigate to unknown path
    // expect(screen.getByText("404")).toBeInTheDocument();
  });
});
```

**Test Categories:**

- Components: UI components testing
- Pages: Page-level testing
- Hooks: Custom hooks testing
- Utils: Utility function testing
- API: API client testing

---

### Backend Testing

#### Unit Tests (Pytest)

**Framework:** Pytest with asyncio support

**Test Location:** `apps/backend/tests/unit/`

**Test Setup:** `apps/backend/tests/conftest.py`

**Coverage Goal:** >80%

**Example Test:**

```python
def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Welcome to NutriGuard API"

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
```

**Test Categories:**

- Models: SQLAlchemy model testing
- Schemas: Pydantic schema testing
- Services: Business logic testing
- Repositories: Database operation testing
- Utils: Utility function testing

---

### Future Testing Enhancements

#### Integration Tests

**Frontend:**

- API integration tests
- State management tests
- Router tests

**Backend:**

- Database integration tests (with test database)
- API endpoint tests (integration with real database)
- External API integration tests (mocked Midtrans, OpenAI)

#### E2E Tests (Playwright)

**Purpose:** Test critical user flows end-to-end

**Test Location:** `apps/frontend/e2e/`

**Test Flows:**

1. **Auth Flow:** Register → Email verify → Login → Logout
2. **Donation Flow:** Login → Donasi → Payment → Success
3. **AI Recommendation Flow:** Login → Input Nutrisi → Generate Recommendation → Save
4. **Vendor Flow:** Register Vendor → Add Product → Settlement Request

**Example E2E Test:**

```typescript
import { test, expect } from "@playwright/test";

test("user can login", async ({ page }) => {
  await page.goto("http://localhost:3000");
  await page.click("text=Login");
  await page.fill("input[name='email']", "test@example.com");
  await page.fill("input[name='password']", "password");
  await page.click("button[type='submit']");
  await expect(page).toHaveURL("http://localhost:3000/dashboard");
});
```

---

### Testing Workflow

**Before Commit:**

1. Run linting: `npm run lint`
2. Run unit tests: `npm run test:run`
3. Fix any errors

**Before PR:**

1. Update tests if needed
2. Ensure all tests pass
3. Check coverage (>80%)

**During CI/CD:**

1. Linting runs automatically
2. Unit tests run automatically
3. Tests must pass before merge

---

## 13. Deployment Strategy

### Current Status: Manual Deployment

**Phase:** Infrastructure Setup
**Deployment:** Manual (CI/CD workflows setup, deployment workflows not yet implemented)

### Deployment Targets (Future)

#### Frontend Deployment

**Platform:** Vercel

**Environments:**

- Staging: Pre-production testing
- Production: Live production

**Process (Future):**

```yaml
# GitHub Action: Deploy to Staging
on: push to staging
steps:
  - Build frontend
  - Deploy to Vercel (staging environment)
  - Update environment variables

# GitHub Action: Deploy to Production
on: push to main
steps:
  - Build frontend
  - Deploy to Vercel (production environment)
  - Update environment variables
```

**Configuration:**

- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: Set via Vercel dashboard

---

#### Backend Deployment

**Platform:** Render

**Environments:**

- Staging: Pre-production testing
- Production: Live production

**Process (Future):**

```yaml
# GitHub Action: Deploy to Staging
on: push to staging
steps:
  - Build Docker image
  - Push to GitHub Container Registry
  - Deploy to Render (staging service)
  - Update environment variables

# GitHub Action: Deploy to Production
on: push to main
steps:
  - Build Docker image
  - Push to GitHub Container Registry
  - Deploy to Render (production service)
  - Update environment variables
```

**Configuration:**

- Runtime: Docker
- Dockerfile: `apps/backend/Dockerfile`
- Port: 8000
- Environment Variables: Set via Render dashboard

---

### Database Deployment

**Platform:** Supabase

**Process:**

- Supabase manages database automatically
- Migrations via Alembic
- Backups via Supabase dashboard

**Environments:**

- Production: Main Supabase project
- Staging: Separate Supabase project (future)

---

### Deployment Workflow (Future)

1. **Feature Development:**
   - Develop on `feature/*` branch
   - Test locally
   - Commit and push

2. **Merge to Staging:**
   - Create PR: `feature/*` → `staging`
   - CI runs (Lint + Unit Tests)
   - Code review
   - Merge to `staging`
   - Auto-deploy to staging environment
   - QA testing

3. **Merge to Production:**
   - After staging tested and approved
   - Merge `staging` → `main`
   - CI runs (Lint + Unit Tests)
   - Auto-deploy to production environment
   - Monitor production

---

## 14. Documentation Structure

### Root Documentation

- **README.md** - Project overview, quick start guide
- **AGENTS.md** - Agent guidelines, build commands
- **PROJECT_CONTEXT.md** - Project context (THIS FILE)
- **CONTRIBUTING.md** - Contributing guidelines
- **LICENSE** - MIT License

---

### Documentation (`docs/`)

- **00-PROJECT-OVERVIEW.md** - Project overview
- **01-SYSTEM-ARCHITECTURE.md** - System architecture
- **02-FUNCTIONAL-REQUIREMENTS.md** - Functional requirements
- **03-NON-FUNCTIONAL-REQUIREMENTS.md** - Non-functional requirements
- **04-DATABASE-DESIGN.md** - Database design
- **05-API-REQUIREMENTS.md** - API requirements
- **06-TESTING-STRATEGY.md** - Testing strategy

---

### UML Diagrams (`diagrams/`)

- **17 PlantUML files** for all diagram types
- **README.md** - PlantUML guide
- **SUMMARY.md** - Complete summary of all diagrams
- **INDEX.md** - Quick index for navigation

**Diagram Types:**

1. Use Case Diagram - Actor-system interactions
2. Class Diagrams - Backend & Frontend structure
3. Sequence Diagrams - Communication flows (Login, Donation, AI)
4. Package Diagrams - Module organization
5. State Diagrams - Entity lifecycles (User, Transaction, Subscription)
6. Activity Diagrams - Business processes (Login, Donation, AI, Settlement)
7. Deployment Diagram - Cloud architecture

---

### GitHub Documentation (`.github/`)

- **BRANCHING.md** - Branching strategy
- **Workflows** in `.github/workflows/` - CI/CD configuration

---

## 15. Team Guidelines

### Team Size

**2-5 People** (Small team)

### Roles

#### Frontend Developer

- **Focus:** React 18 + TypeScript + Vite
- **Responsibilities:**
  - Build and maintain frontend components
  - Implement UI/UX designs
  - State management (Zustand)
  - Data fetching (TanStack Query)
  - Unit testing (Vitest)

#### Backend Developer

- **Focus:** Python 3.11 + FastAPI
- **Responsibilities:**
  - Build and maintain API endpoints
  - Database design (SQLAlchemy)
  - Business logic (Services)
  - API integration (Midtrans, OpenAI)
  - Unit testing (Pytest)

#### Full Stack Developer

- **Focus:** Both frontend and backend
- **Responsibilities:**
  - End-to-end feature development
  - API integration (Frontend → Backend)
  - Data flow implementation
  - Testing (Frontend + Backend)

#### DevOps Engineer

- **Focus:** CI/CD, deployment, infrastructure
- **Responsibilities:**
  - Setup CI/CD workflows
  - Configure deployment (Vercel, Render)
  - Manage GitHub repositories
  - Monitor system health

#### QA Engineer

- **Focus:** Testing, quality assurance
- **Responsibilities:**
  - Write tests (Unit, Integration, E2E)
  - Manual testing
  - Bug reporting
  - Quality gate enforcement

---

### Development Rules

1. **Branching:**
   - Always create `feature/*` branch for new features
   - Never commit directly to `main` or `staging`

2. **Commits:**
   - Follow [Conventional Commits](https://www.conventionalcommits.org/):
     - `feat:` New feature
     - `fix:` Bug fix
     - `docs:` Documentation changes
     - `style:` Code style changes
     - `refactor:` Code refactoring
     - `test:` Test changes
     - `chore:` Maintenance tasks
   - Write clear commit messages

3. **Code Quality:**
   - All linting must pass before commit
   - All tests must pass before commit
   - Code review required (min 1 reviewer)
   - Fix review comments before merge

4. **Testing:**
   - Write tests for new features
   - Maintain >80% test coverage
   - Run tests before commit

5. **Documentation:**
   - Update documentation for new features
   - Keep README up-to-date
   - Document API changes

---

### Coding Standards

#### Frontend (TypeScript)

1. **Imports:**
   - Use `@/` alias for imports
   - Group imports: external libraries first, then internal
   - Use named exports for components and functions

   ```typescript
   import { useState, useEffect } from "react";
   import { Button } from "@/components/ui/button";
   import { supabase } from "@/integrations/supabase/client";
   ```

2. **Components:**
   - Functional components with hooks only
   - Use `forwardRef` when component needs ref forwarding
   - Set `displayName` on forwardRef components
   - Export components as named exports

   ```typescript
   export function ComponentName({ prop }: Props) {
     return <div />;
   }

   const Component = forwardRef<HTMLDivElement, Props>(({ ...props }, ref) => {
     return <div ref={ref} {...props} />;
   });
   Component.displayName = "Component";
   ```

3. **Styling:**
   - Use Tailwind utility classes
   - Use `cn()` from `@/lib/utils` for conditional class merging
   - Reference CSS variables for theming

   ```typescript
   import { cn } from "@/lib/utils";

   <div className={cn("base-classes", condition && "conditional-classes")} />
   ```

4. **TypeScript:**
   - Type definitions in separate files when shared
   - Use `interface` for component props, `type` for unions

---

#### Backend (Python)

1. **PEP 8 Compliance:**
   - Follow PEP 8 style guide
   - Use Ruff for linting
   - Fix linting issues before commit

2. **Type Hints (Optional for Now):**
   - Type hints are optional but recommended
   - Use `typing` module for complex types
   - Use `mypy` for type checking

   ```python
   def create_user(email: str, password: str) -> User:
       pass
   ```

3. **Docstrings:**
   - Write docstrings for functions and classes
   - Follow Google style docstrings

   ```python
   def create_user(email: str, password: str) -> User:
       """Create a new user.

       Args:
           email: User email address.
           password: User password.

       Returns:
           Created user object.
       """
       pass
   ```

4. **Error Handling:**
   - Use try-except for async operations
   - Raise appropriate HTTPException for API errors

   ```python
   try:
       user = create_user(email, password)
   except Exception as e:
       raise HTTPException(400, str(e))
   ```

---

## 16. References

### Documentation

- [Turbo Documentation](https://turbo.build/repo/docs) - Monorepo workspace manager
- [Vite Documentation](https://vitejs.dev/) - Build tool for frontend
- [FastAPI Documentation](https://fastapi.tiangolo.com/) - Web framework for backend
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Utility-first CSS framework
- [React Documentation](https://react.dev/) - React 18 documentation

### APIs

- [Midtrans API Documentation](https://docs.midtrans.com/) - Payment gateway
- [OpenAI API Documentation](https://platform.openai.com/docs) - AI recommendations
- [Supabase Documentation](https://supabase.com/docs) - Database, Auth, Storage

### Tools

- [GitHub Actions](https://docs.github.com/en/actions) - CI/CD
- [Vercel Documentation](https://vercel.com/docs) - Frontend deployment
- [Render Documentation](https://render.com/docs) - Backend deployment
- [PlantUML Documentation](https://plantuml.com/PlantUML_Language_Specification) - UML diagrams

### Community

- [PlantUML GitHub](https://github.com/plantuml/plantuml)
- [FastAPI GitHub](https://github.com/tiangolo/fastapi)
- [React GitHub](https://github.com/facebook/react)
- [Vite GitHub](https://github.com/vitejs/vite)

---

## Summary

This PROJECT_CONTEXT.md file contains comprehensive information about the NutriGuard project, including:

- Project overview, vision, and goals
- Complete tech stack (frontend, backend, database, infrastructure)
- Detailed repository structure
- System architecture (frontend, backend, data flow, security)
- Core features (user, vendor, admin, guest)
- Database models and relationships
- API integrations (Midtrans, OpenAI, Supabase, Email)
- CI/CD strategy and workflows
- Branching strategy and workflow
- Development workflow and setup
- Testing strategy (unit, integration, E2E)
- Deployment strategy (Vercel, Render, Supabase)
- Documentation structure
- Team guidelines and coding standards
- References and resources

This file serves as a single source of truth for developers, AI agents, and stakeholders to understand the project context and development guidelines.

---

**Last Updated:** 2025-03-07
**Version:** 1.0.0
**Status:** Infrastructure Setup Phase

---

**Ready for Development!** 🚀
