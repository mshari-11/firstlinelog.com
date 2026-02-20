#!/bin/bash
# =============================================================
# سكريبت الإعداد التلقائي - First Line Logistics
# شغّل هذا السكريبت من مجلد المشروع: bash scripts/setup.sh
# =============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  إعداد First Line Logistics - FLL.SA  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ------ الخطوة 1: تثبيت الحزم ------
echo -e "${YELLOW}[1/4] تثبيت حزم المشروع...${NC}"
if [ ! -d "node_modules" ]; then
  npm install
  echo -e "${GREEN}✓ تم تثبيت الحزم${NC}"
else
  echo -e "${GREEN}✓ الحزم مثبتة مسبقاً${NC}"
fi
echo ""

# ------ الخطوة 2: إنشاء جداول Supabase ------
echo -e "${YELLOW}[2/4] إعداد قاعدة البيانات Supabase...${NC}"
echo ""
echo -e "${BLUE}افتح Supabase SQL Editor:${NC}"
echo -e "  https://supabase.com/dashboard/project/djebhztfewjfyyoortvv/sql/new"
echo ""
echo -e "ثم الصق محتوى الملف التالي وشغّله:"
echo -e "  ${GREEN}supabase/schema.sql${NC}"
echo ""
echo -e "أو انسخ الأمر التالي والصقه في المتصفح:"
echo ""

# نسخ SQL للحافظة إذا كان pbcopy أو xclip متاح
if command -v pbcopy &> /dev/null; then
  cat supabase/schema.sql | pbcopy
  echo -e "${GREEN}✓ تم نسخ SQL للحافظة! الصقه في SQL Editor${NC}"
elif command -v xclip &> /dev/null; then
  cat supabase/schema.sql | xclip -selection clipboard
  echo -e "${GREEN}✓ تم نسخ SQL للحافظة! الصقه في SQL Editor${NC}"
else
  echo -e "${YELLOW}انسخ محتوى الملف supabase/schema.sql والصقه في SQL Editor${NC}"
fi

echo ""
read -p "اضغط Enter بعد ما تشغّل SQL في Supabase... "
echo -e "${GREEN}✓ تم إعداد قاعدة البيانات${NC}"
echo ""

# ------ الخطوة 3: إعداد Vercel ------
echo -e "${YELLOW}[3/4] إعداد متغيرات البيئة في Vercel...${NC}"
echo ""

# تحقق من وجود Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}جاري تثبيت Vercel CLI...${NC}"
  npm i -g vercel
fi

# تحقق من تسجيل الدخول
echo -e "${BLUE}تأكد إنك مسجل دخول في Vercel:${NC}"
vercel whoami 2>/dev/null || vercel login

echo ""
echo -e "${BLUE}إضافة متغيرات البيئة...${NC}"

# إضافة VITE_SUPABASE_URL
echo "https://djebhztfewjfyyoortvv.supabase.co" | vercel env add VITE_SUPABASE_URL production preview development 2>/dev/null && \
  echo -e "${GREEN}✓ VITE_SUPABASE_URL تمت إضافته${NC}" || \
  echo -e "${YELLOW}⚠ VITE_SUPABASE_URL موجود مسبقاً${NC}"

# إضافة VITE_SUPABASE_ANON_KEY
echo ""
echo -e "${BLUE}أدخل Supabase Anon Key:${NC}"
read -s -p "Anon Key: " ANON_KEY
echo ""
echo "$ANON_KEY" | vercel env add VITE_SUPABASE_ANON_KEY production preview development 2>/dev/null && \
  echo -e "${GREEN}✓ VITE_SUPABASE_ANON_KEY تمت إضافته${NC}" || \
  echo -e "${YELLOW}⚠ VITE_SUPABASE_ANON_KEY موجود مسبقاً${NC}"

echo ""
echo -e "${GREEN}✓ تم إعداد Vercel${NC}"
echo ""

# ------ الخطوة 4: إعادة النشر ------
echo -e "${YELLOW}[4/4] إعادة نشر الموقع...${NC}"
read -p "هل تبغى تنشر الموقع الحين؟ (y/n): " DEPLOY
if [ "$DEPLOY" = "y" ] || [ "$DEPLOY" = "Y" ]; then
  vercel --prod
  echo -e "${GREEN}✓ تم النشر!${NC}"
else
  echo -e "${YELLOW}تقدر تنشر لاحقاً بالأمر: vercel --prod${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  ✓ الإعداد اكتمل!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${BLUE}الخطوة الأخيرة - ضبط DNS:${NC}"
echo -e "روح لمسجّل الدومين fll.sa وأضف:"
echo -e "  ${GREEN}A Record:     fll.sa → 76.76.21.21${NC}"
echo -e "  ${GREEN}CNAME Record: www.fll.sa → cname.vercel-dns.com${NC}"
echo ""
echo -e "بعدها اربط الدومين في Vercel:"
echo -e "  https://vercel.com/dashboard → مشروعك → Settings → Domains"
echo -e "  أضف: ${GREEN}fll.sa${NC} و ${GREEN}www.fll.sa${NC}"
echo ""
