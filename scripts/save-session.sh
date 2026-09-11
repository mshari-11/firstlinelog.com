#!/bin/bash
# حفظ حالة جلسة كلود كود تلقائياً قبل ضغط السياق أو عند نهاية الجلسة

# حلّ الروابط الرمزية للوصول للمسار الحقيقي للسكربت (readlink -f غير محمول)
SCRIPT_PATH="${BASH_SOURCE[0]}"
while [ -L "$SCRIPT_PATH" ]; do
  LINK_DIR=$(cd -- "$(dirname -- "$SCRIPT_PATH")" && pwd)
  SCRIPT_PATH=$(readlink -- "$SCRIPT_PATH")
  [ "${SCRIPT_PATH#/}" = "$SCRIPT_PATH" ] && SCRIPT_PATH="$LINK_DIR/$SCRIPT_PATH"
done
SCRIPT_DIR=$(cd -- "$(dirname -- "$SCRIPT_PATH")" && pwd)

# جذر المشروع: من git toplevel، وإلا من موقع السكربت نفسه (المجلد الأب لـ scripts/)
PROJECT_DIR=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null) || PROJECT_DIR=$(dirname -- "$SCRIPT_DIR")

SESSIONS_FILE="$PROJECT_DIR/CLAUDE_SESSIONS.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# هل نحن داخل مستودع git؟ يُميّز "لا تغييرات" عن "ليس مستودعاً"
if git -C "$PROJECT_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  IS_GIT_REPO=1
  BRANCH=$(git -C "$PROJECT_DIR" branch --show-current 2>/dev/null)
  [ -z "$BRANCH" ] && BRANCH="(detached HEAD)"
else
  IS_GIT_REPO=0
  BRANCH="(ليس مستودع git)"
fi

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

if [ "$IS_GIT_REPO" -eq 0 ]; then
  echo "(غير متاح — $PROJECT_DIR ليس مستودع git)" >> "$SESSIONS_FILE"
else
  LOG=$(git -C "$PROJECT_DIR" log --oneline -10 2>/dev/null)
  if [ -n "$LOG" ]; then
    echo "$LOG" >> "$SESSIONS_FILE"
  else
    echo "(لا يوجد commits بعد)" >> "$SESSIONS_FILE"
  fi
fi

cat >> "$SESSIONS_FILE" << 'EOF'

### الملفات المعدّلة:
EOF

if [ "$IS_GIT_REPO" -eq 0 ]; then
  echo "(غير متاح — $PROJECT_DIR ليس مستودع git)" >> "$SESSIONS_FILE"
else
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
fi

echo "" >> "$SESSIONS_FILE"
echo "*(ملاحظات الجلسة — تُكتب يدوياً عبر أمر /save-session)*" >> "$SESSIONS_FILE"

echo "✅ تم حفظ حالة الجلسة في $SESSIONS_FILE"
