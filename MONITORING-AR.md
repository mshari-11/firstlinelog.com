# دليل المراقبة — FLL (فيرست لاين لوجستيكس)

**التاريخ:** 2026-03-12
**النظام:** First Line Logistics — fll.sa
**التقنية:** OpenTelemetry (OTel)

---

## 1. نظرة عامة

المراقبة في FLL تتم عبر OpenTelemetry — معيار مفتوح لتصدير المقاييس والسجلات والأحداث. تُمكّنك من تتبع:

- استخدام Claude Code عبر الفريق
- التكاليف والتوكنات المستهلكة
- نشاط الأدوات (أوامر، تحرير ملفات، etc.)
- أداء الجلسات والإنتاجية

---

## 2. البدء السريع

### متغيرات البيئة الأساسية

```bash
# 1. تفعيل المراقبة
export CLAUDE_CODE_ENABLE_TELEMETRY=1

# 2. اختيار المُصدِّرات
export OTEL_METRICS_EXPORTER=otlp       # الخيارات: otlp, prometheus, console
export OTEL_LOGS_EXPORTER=otlp          # الخيارات: otlp, console

# 3. إعداد نقطة نهاية OTLP
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# 4. المصادقة (إن لزم)
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer your-token"

# 5. تعريف فريق FLL
export OTEL_RESOURCE_ATTRIBUTES="department=engineering,team.id=fll,cost_center=fll-ops,region=me-south-1"

# 6. تشغيل Claude Code
claude
```

### للتصحيح (فترات قصيرة)

```bash
export OTEL_METRIC_EXPORT_INTERVAL=10000  # 10 ثوان (الافتراضي: 60 ثانية)
export OTEL_LOGS_EXPORT_INTERVAL=1000     # ثانية واحدة (الافتراضي: 5 ثوان)
```

---

## 3. الإعداد المركزي للفريق

### ملف الإعدادات (`.claude/settings.json`)

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "grpc",
    "OTEL_METRIC_EXPORT_INTERVAL": "60000",
    "OTEL_LOGS_EXPORT_INTERVAL": "5000",
    "OTEL_LOG_TOOL_DETAILS": "1",
    "OTEL_METRICS_INCLUDE_SESSION_ID": "true",
    "OTEL_METRICS_INCLUDE_VERSION": "true",
    "OTEL_METRICS_INCLUDE_ACCOUNT_UUID": "true",
    "OTEL_RESOURCE_ATTRIBUTES": "department=engineering,team.id=fll,cost_center=fll-ops,region=me-south-1"
  }
}
```

هذا الإعداد يُطبَّق على جميع أعضاء الفريق تلقائياً.

---

## 4. المقاييس المتاحة

### الاستخدام والجلسات

| المقياس | الوصف | الوحدة |
|---------|-------|--------|
| `claude_code.session.count` | عدد الجلسات المبدوءة | عدد |
| `claude_code.active_time.total` | إجمالي الوقت الفعّال | ثوان |
| `claude_code.token.usage` | عدد التوكنات المستخدمة | توكنات |
| `claude_code.cost.usage` | تكلفة الجلسة | دولار أمريكي |

### نشاط التطوير

| المقياس | الوصف | الوحدة |
|---------|-------|--------|
| `claude_code.lines_of_code.count` | الأسطر المضافة/المحذوفة | عدد |
| `claude_code.commit.count` | عدد الـ commits | عدد |
| `claude_code.pull_request.count` | عدد طلبات الدمج | عدد |
| `claude_code.code_edit_tool.decision` | قرارات قبول/رفض أداة التحرير | عدد |

### تفاصيل التوكنات

| النوع (`type`) | الوصف |
|----------------|-------|
| `input` | توكنات الإدخال |
| `output` | توكنات الإخراج |
| `cacheRead` | توكنات القراءة من الذاكرة المؤقتة |
| `cacheCreation` | توكنات إنشاء الذاكرة المؤقتة |

---

## 5. الأحداث المتاحة

### أنواع الأحداث

| الحدث | الاسم | الوصف | متى يُسجَّل |
|-------|-------|-------|------------|
| أمر المستخدم | `claude_code.user_prompt` | عند إرسال أمر | كل أمر |
| نتيجة أداة | `claude_code.tool_result` | عند اكتمال أداة | كل أداة |
| طلب API | `claude_code.api_request` | عند طلب Claude | كل طلب |
| خطأ API | `claude_code.api_error` | عند فشل طلب | كل فشل |
| قرار أداة | `claude_code.tool_decision` | عند قبول/رفض أداة | كل قرار |

### ربط الأحداث

جميع الأحداث ضمن أمر واحد تشترك بـ `prompt.id` (UUID v4) لتتبع السلسلة الكاملة.

---

## 6. السمات القياسية

كل مقياس وحدث يتضمن:

| السمة | الوصف | التحكم |
|-------|-------|--------|
| `session.id` | معرّف الجلسة | `OTEL_METRICS_INCLUDE_SESSION_ID` |
| `app.version` | إصدار Claude Code | `OTEL_METRICS_INCLUDE_VERSION` |
| `organization.id` | معرّف المنظمة | تلقائي |
| `user.account_uuid` | معرّف الحساب | `OTEL_METRICS_INCLUDE_ACCOUNT_UUID` |
| `user.id` | معرّف الجهاز | تلقائي دائماً |
| `user.email` | البريد الإلكتروني | عند المصادقة بـ OAuth |
| `terminal.type` | نوع الطرفية | تلقائي |

---

## 7. إعدادات الفرق المتعددة

### فريق المالية
```bash
export OTEL_RESOURCE_ATTRIBUTES="department=finance,team.id=fll-finance,cost_center=fin-001,region=me-south-1"
```

### فريق العمليات
```bash
export OTEL_RESOURCE_ATTRIBUTES="department=operations,team.id=fll-ops,cost_center=ops-001,region=me-south-1"
```

### فريق الهندسة
```bash
export OTEL_RESOURCE_ATTRIBUTES="department=engineering,team.id=fll-eng,cost_center=eng-001,region=me-south-1"
```

### فريق الموارد البشرية
```bash
export OTEL_RESOURCE_ATTRIBUTES="department=hr,team.id=fll-hr,cost_center=hr-001,region=me-south-1"
```

**تنبيه مهم:** قيم `OTEL_RESOURCE_ATTRIBUTES` لا تدعم المسافات! استخدم الشرطة السفلية `_` أو camelCase.

---

## 8. خيارات الخلفية (Backend)

### للمقاييس

| الخلفية | الاستخدام | ملاحظات |
|---------|-----------|---------|
| **Prometheus + Grafana** | مستضاف ذاتياً، تحكم كامل | الأفضل للبداية |
| **CloudWatch** | تكامل AWS أصلي | مناسب لـ me-south-1 |
| **Datadog** | منصة مراقبة شاملة | مدفوع |
| **Honeycomb** | استعلامات متقدمة | ربط الأحداث |

### للسجلات/الأحداث

| الخلفية | الاستخدام |
|---------|-----------|
| **Elasticsearch + Kibana** | بحث نصي، تحليل سجلات |
| **Loki + Grafana** | تجميع سجلات خفيف |
| **ClickHouse** | تحليل أحداث مُهيكلة |

---

## 9. التنبيهات الموصى بها

| التنبيه | الشرط | الأولوية |
|---------|-------|----------|
| **ارتفاع التكلفة** | `cost.usage` > حد معين بالساعة | عالية |
| **استخدام توكنات عالي** | `token.usage` > 1 مليون بالجلسة | متوسطة |
| **نسبة أخطاء عالية** | أحداث `api_error` > 5% | عالية |
| **حجم جلسات غير عادي** | `session.count` ارتفاع مفاجئ | متوسطة |

---

## 10. الرؤوس الديناميكية (للمؤسسات)

لتجديد التوكنات تلقائياً:

### الإعداد في `.claude/settings.json`
```json
{
  "otelHeadersHelper": "/path/to/generate_headers.sh"
}
```

### سكربت التوليد
```bash
#!/bin/bash
echo "{\"Authorization\": \"Bearer $(get-token.sh)\"}"
```

يُنفَّذ عند البداية ثم كل 29 دقيقة.
للتغيير: `CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS=900000` (15 دقيقة)

---

## 11. أمثلة تكوين متنوعة

### طباعة على الشاشة (للتصحيح)
```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=console
export OTEL_LOGS_EXPORTER=console
export OTEL_METRIC_EXPORT_INTERVAL=1000
```

### OTLP/gRPC (إنتاج)
```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://collector.fll.sa:4317
```

### Prometheus فقط
```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=prometheus
```

### خلفيات منفصلة للمقاييس والسجلات
```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_METRICS_PROTOCOL=http/protobuf
export OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://metrics.fll.sa:4318
export OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://logs.fll.sa:4317
```

---

## 12. الأمان والخصوصية

| الإعداد | الافتراضي | ملاحظة |
|---------|-----------|--------|
| تسجيل محتوى الأوامر | **معطَّل** | فعِّل بـ `OTEL_LOG_USER_PROMPTS=1` |
| تسجيل أسماء الأدوات/MCP | **معطَّل** | فعِّل بـ `OTEL_LOG_TOOL_DETAILS=1` |
| محتوى الملفات | **لا يُجمع أبداً** | — |
| البريد الإلكتروني | يُضمَّن مع OAuth | اضبط الخلفية لحذفه إن لزم |
| أوامر Bash | تُضمَّن في `tool_parameters` | قد تحتوي على مسارات حساسة |

**تحذيرات:**
- لا تفعِّل `OTEL_LOG_USER_PROMPTS` في الإنتاج
- اضبط خلفيتك لحذف `tool_parameters` إن كانت الأوامر تحتوي أسرار
- `user.email` يُرسَل تلقائياً — اضبط الحذف إن كانت الخصوصية مهمة

---

## 13. معلومات الخدمة

جميع المقاييس والأحداث تُصدَّر مع:

| السمة | القيمة |
|-------|--------|
| `service.name` | `claude-code` |
| `service.version` | الإصدار الحالي |
| `os.type` | نوع نظام التشغيل |
| `os.version` | إصدار نظام التشغيل |
| `host.arch` | المعمارية (مثل `amd64`, `arm64`) |
| اسم العدّاد | `com.anthropic.claude_code` |

---

## 14. قياس العائد على الاستثمار (ROI)

للحصول على دليل شامل لقياس العائد على الاستثمار من Claude Code:
- إعداد المراقبة
- تحليل التكاليف
- مقاييس الإنتاجية
- التقارير الآلية

راجع: [Claude Code ROI Measurement Guide](https://github.com/anthropics/claude-code-monitoring-guide)

يوفر تكوينات Docker Compose جاهزة، إعدادات Prometheus و OpenTelemetry، وقوالب لتوليد تقارير الإنتاجية.
