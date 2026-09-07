#!/bin/bash
# ============================================
# SERIBUASA DEPLOYMENT SETUP SCRIPT
# ============================================

echo "🚀 SeribuAsa Deployment Setup"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}PRASYARAT:${NC}"
echo "1. Akun Vercel (https://vercel.com)"
echo "2. Akun Railway (https://railway.app)"
echo "3. Repository sudah di-push ke GitHub"
echo "4. Akun Supabase (https://supabase.com)"
echo ""

echo -e "${GREEN}LANGKAH 1: DEPLOY BACKEND KE RAILWAY${NC}"
echo "=============================="
echo "1. Buka https://railway.app"
echo "2. Login dengan GitHub"
echo "3. Klik 'New Project' → 'Deploy from GitHub repo'"
echo "4. Pilih repository Project-PPL1"
echo "5. Set Root Directory: apps/backend"
echo "6. Klik 'Add Variables' dan copy-paste dari file:"
echo "   apps/backend/.env.railway"
echo "7. Railway akan auto-deploy"
echo "8. Copy URL Railway (contoh: https://nutriguard-api.up.railway.app)"
echo ""

echo -e "${GREEN}LANGKAH 2: DEPLOY FRONTEND KE VERCEL${NC}"
echo "=============================="
echo "1. Buka https://vercel.com"
echo "2. Login dengan GitHub"
echo "3. Klik 'Add New Project'"
echo "4. Pilih repository Project-PPL1"
echo "5. Set Root Directory: apps/frontend"
echo "6. Framework: Vite (auto-detect)"
echo "7. Klik 'Environment Variables' dan copy-paste dari file:"
echo "   apps/frontend/.env.production"
echo "   ⚠️  Ganti VITE_API_BASE_URL dengan URL Railway dari Langkah 1"
echo "8. Klik 'Deploy'"
echo ""

echo -e "${GREEN}LANGKAH 3: UPDATE ENVIRONMENT VARIABLES${NC}"
echo "=============================="
echo "1. Copy URL Vercel frontend (contoh: https://seribuasa.vercel.app)"
echo "2. Buka Railway Dashboard → Project → Variables"
echo "3. Update CORS_ORIGINS dengan URL Vercel:"
echo "   CORS_ORIGINS=https://seribuasa.vercel.app,http://localhost:5173"
echo "4. Railway akan auto-redeploy dengan CORS yang benar"
echo ""

echo -e "${YELLOW}CHECKLIST:${NC}"
echo "=============================="
echo "[ ] Backend deployed di Railway"
echo "[ ] Frontend deployed di Vercel"
echo "[ ] Environment variables di-set dengan benar"
echo "[ ] CORS_ORIGINS sudah include URL frontend"
echo "[ ] VITE_API_BASE_URL mengarah ke Railway"
echo "[ ] Test login/register berfungsi"
echo "[ ] Test pembayaran Midtrans (sandbox)"
echo ""

echo -e "${GREEN}CATATAN PENTING:${NC}"
echo "=============================="
echo "• JWT_SECRET_KEY harus sangat panjang dan rahasia (min 32 karakter)"
echo "• Gunakan https://generate-secret.vercel.app/32 untuk generate"
echo "• Jangan pernah commit file .env dengan credential asli ke GitHub"
echo "• Midtrans dalam mode sandbox (false), ganti ke true untuk production"
echo "• Database Supabase sudah external, tidak perlu setup lagi"
echo ""

echo -e "${GREEN}TROUBLESHOOTING:${NC}"
echo "=============================="
echo "• CORS Error: Pastikan CORS_ORIGINS di Railway sudah include URL Vercel"
echo "• Build Fail: Check logs di Railway/Vercel dashboard"
echo "• Database Error: Pastikan Supabase IP tidak memblokir Railway"
echo "• Auth Error: Check SUPABASE_SERVICE_KEY dan JWT_SECRET_KEY"
echo ""

echo "🎉 Setup selesai! Baca DEPLOYMENT.md untuk detail lengkap."
