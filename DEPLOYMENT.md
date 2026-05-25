# Deployment Guide - SeribuAsa

## Overview

- **Frontend (Vercel)**: React + Vite + TypeScript
- **Backend (Railway)**: FastAPI + Python
- **Database**: Supabase PostgreSQL (external)

---

## 1. Vercel (Frontend) Setup

### Prerequisites

- Akun Vercel (bisa signup dengan GitHub)
- Repository sudah di-push ke GitHub

### Langkah Deploy Frontend

1. **Login ke Vercel**
   - Buka https://vercel.com
   - Login dengan GitHub account

2. **Import Project**
   - Klik "Add New Project"
   - Pilih repository `Project-PPL1`
   - Pilih folder `apps/frontend` sebagai Root Directory

3. **Environment Variables**
   Masukkan ke Settings → Environment Variables:

   ```
   VITE_SUPABASE_URL=https://ydglsytahhjdoznvnfnc.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   VITE_API_BASE_URL=https://nutriguard-api.railway.app/api/v1
   VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
   VITE_MIDTRANS_IS_PRODUCTION=false
   ```

   ⚠️ **Catatan**: Ganti `VITE_API_BASE_URL` dengan URL Railway nanti setelah backend deploy.

4. **Build Settings** (biasanya auto-detected)
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Deploy**
   - Klik "Deploy"
   - Tunggu build selesai
   - Akan dapat URL seperti `https://seribuasa.vercel.app`

---

## 2. Railway (Backend) Setup

### Prerequisites

- Akun Railway (https://railway.app)
- Repository di GitHub

### Langkah Deploy Backend

1. **Login ke Railway**
   - Buka https://railway.app
   - Login dengan GitHub

2. **New Project**
   - Klik "New Project"
   - Pilih "Deploy from GitHub repo"
   - Pilih repository `Project-PPL1`

3. **Configure Service**
   - Railway akan auto-detect Python
   - Set Root Directory: `apps/backend`

4. **Environment Variables**
   Masukkan semua variable di bawah ke Railway → Variables:

   ### Core Application

   ```
   APP_NAME=NutriGuard API
   APP_VERSION=1.0.0
   API_VERSION=v1
   LOG_LEVEL=INFO
   ```

   ### Database (Supabase)

   ```
   DATABASE_URL=postgresql://postgres:g0QkMSFPbrR5YMEW@db.ydglsytahhjdoznvnfnc.supabase.co:5432/postgres
   ```

   ### Supabase Auth

   ```
   SUPABASE_URL=https://ydglsytahhjdoznvnfnc.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   ```

   ### CORS (Frontend URL)

   ```
   CORS_ORIGINS=https://seribuasa.vercel.app,https://www.seribuasa.id,http://localhost:5173
   ```

   ### JWT Security

   ```
   JWT_SECRET_KEY=ganti-dengan-key-yang-sangat-panjang-dan-random-32-karakter-atau-lebih
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```

   ### Midtrans Payment

   ```
   MIDTRANS_SERVER_KEY=your_midtrans_server_key
   MIDTRANS_CLIENT_KEY=your_midtrans_client_key
   MIDTRANS_IS_PRODUCTION=false
   ```

   ### Storage

   ```
   STORAGE_BUCKET_NAME=nutriguard-uploads
   MAX_FILE_SIZE_MB=5
   ```

5. **Start Command**
   Railway biasanya auto-detect, tapi kalau perlu set manually:

   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

6. **Deploy**
   - Railway akan auto-deploy saat push ke GitHub
   - URL akan muncul di dashboard (contoh: `https://nutriguard-api.up.railway.app`)

---

## 3. Update Frontend URL

Setelah backend deploy di Railway:

1. Copy URL Railway (misal: `https://nutriguard-api.up.railway.app`)
2. Update Vercel Environment Variable:
   ```
   VITE_API_BASE_URL=https://nutriguard-api.up.railway.app/api/v1
   ```
3. Re-deploy frontend di Vercel

---

## 4. Custom Domain (Opsional)

### Vercel (Frontend)

1. Di Vercel Dashboard → Project → Settings → Domains
2. Add custom domain: `seribuasa.id`
3. Ikuti instruksi DNS (tambahkan CNAME record)

### Railway (Backend)

1. Railway Dashboard → Service → Settings → Domains
2. Generate Domain atau Connect Custom Domain
3. Tambahkan CNAME record di DNS provider

---

## 5. Post-Deployment Checklist

- [ ] Frontend accessible di Vercel URL
- [ ] Backend API responding (test dengan `/health` endpoint)
- [ ] Database connection working (test login/register)
- [ ] Supabase auth working
- [ ] Midtrans payment test (sandbox mode)
- [ ] CORS configured correctly (no CORS errors in browser)
- [ ] Environment variables all set correctly

---

## Troubleshooting

### Frontend build fail di Vercel

```bash
# Check build locally first
cd apps/frontend
npm run build
```

### Backend fail di Railway

```bash
# Check logs di Railway dashboard
# Common issues:
# - Missing env vars
# - Database connection fail
# - Port not set correctly
```

### CORS Error

Pastikan `CORS_ORIGINS` di Railway sudah include URL Vercel frontend.

### Database Connection Fail

- Check Supabase dashboard → Database → Connection string
- Pastikan IP Railway tidak diblokir (Supabase → Settings → Network)

---

## File Penting

- `apps/frontend/.env` → Copy ke Vercel Environment Variables
- `apps/backend/.env` → Copy ke Railway Environment Variables
- `apps/frontend/vercel.json` → Config khusus Vercel (SPA routing)
- `apps/backend/Procfile` → Start command untuk Railway
