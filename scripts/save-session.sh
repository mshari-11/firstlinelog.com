#!/bin/bash
# حفظ حالة جلسة كلود كود تلقائياً قبل ضغط السياق أو عند نهاية الجلسة

PROJECT_DIR="/home/user/firstlinelog.com"
SESSIONS_FILE="$PROJECT_DIR/CLAUDE_SESSIONS.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
BRANCH=$(git -C "$PROJECT_DIR" branch --show-current 2>/dev/null || echo "unknown")

# إنشاء الملف إذا لم يكن موجوداً
if [ ! -f "$SESSIONS_FILE" ]; then
  cat > "$SESSIONS_FILE" << 'HEADER'
# سجل جلسات كلود كود — FLL Platform

> هذا الملف يُحدَّث تلقائياً في كل جلسة لحفظ المستجدات والتغييرات.
> لا تحذف هذا الملف — هو ذاكرة الجلسات.

HEADER
fi

# كتابة رأس الجلسة الجديدة
cat >> "$SESSIONS_FILE" << EOF

---

## جلسة: $TIMESTAMP | Branch: $BRANCH

### آخر 10 commits:
EOF

git -C "$PROJECT_DIR" log --oneline -10 2>/dev/null >> "$SESSIONS_FILE" || echo "(لا يوجد commits)" >> "$SESSIONS_FILE"

cat >> "$SESSIONS_FILE" << 'EOF'

### الملفات المعدّلة:
EOF

DIFF=$(git -C "$PROJECT_DIR" diff --stat HEAD 2>/dev/null)
STATUS=$(git -C "$PROJECT_DIR" status --short 2>/dev/null)

if [ -n "$DIFF" ]; then
  echo "$DIFF" >> "$SESSIONS_FILE"
fi

if [ -n "$STATUS" ]; then
  echo "" >> "$SESSIONS_FILE"
  echo "**Untracked / Staged:**" >> "$SESSIONS_FILE"
  echo "$STATUS" >> "$SESSIONS_FILE"
fi

if [ -z "$DIFF" ] && [ -z "$STATUS" ]; then
  echo "(لا يوجد تغييرات غير محفوظة)" >> "$SESSIONS_FILE"
fi

echo "" >> "$SESSIONS_FILE"
echo "*(ملاحظات الجلسة — تُكتب يدوياً عبر أمر /save-session)*" >> "$SESSIONS_FILE"

echo "✅ تم حفظ حالة الجلسة في CLAUDE_SESSIONS.md"
