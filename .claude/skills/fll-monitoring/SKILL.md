---
name: fll-monitoring
description: "OpenTelemetry monitoring and observability for FLL: telemetry configuration, metrics tracking, cost monitoring, usage analytics, and alerting. Use when setting up monitoring, debugging telemetry, or analyzing Claude Code usage across the team."
---

# FLL Monitoring & Observability Skill

You are configuring OpenTelemetry monitoring for the FLL (First Line Logistics) project.

## Quick Setup

```bash
# Enable telemetry
export CLAUDE_CODE_ENABLE_TELEMETRY=1

# Configure exporters
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp

# OTLP endpoint (gRPC)
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Authentication (if required)
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer your-token"

# FLL team identification
export OTEL_RESOURCE_ATTRIBUTES="department=engineering,team.id=fll,cost_center=fll-ops,region=me-south-1"
```

## FLL-Specific Configuration

### Environment Variables

| Variable | FLL Value | Description |
|----------|-----------|-------------|
| `CLAUDE_CODE_ENABLE_TELEMETRY` | `1` | تفعيل المراقبة |
| `OTEL_METRICS_EXPORTER` | `otlp` | مُصدِّر المقاييس |
| `OTEL_LOGS_EXPORTER` | `otlp` | مُصدِّر السجلات |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `grpc` | بروتوكول OTLP |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | AWS-specific | نقطة نهاية OTLP |
| `OTEL_METRIC_EXPORT_INTERVAL` | `60000` | فترة التصدير (60 ثانية) |
| `OTEL_LOGS_EXPORT_INTERVAL` | `5000` | فترة تصدير السجلات (5 ثوان) |
| `OTEL_LOG_USER_PROMPTS` | `0` | تسجيل محتوى الأوامر (معطل للأمان) |
| `OTEL_LOG_TOOL_DETAILS` | `1` | تسجيل أسماء الأدوات و MCP |

### Cardinality Control

| Variable | FLL Setting | Purpose |
|----------|-------------|---------|
| `OTEL_METRICS_INCLUDE_SESSION_ID` | `true` | تتبع الجلسات |
| `OTEL_METRICS_INCLUDE_VERSION` | `true` | تتبع الإصدارات |
| `OTEL_METRICS_INCLUDE_ACCOUNT_UUID` | `true` | تتبع المستخدمين |

### Resource Attributes for FLL Teams

```bash
# Finance Team
export OTEL_RESOURCE_ATTRIBUTES="department=finance,team.id=fll-finance,cost_center=fin-001,region=me-south-1"

# Operations Team
export OTEL_RESOURCE_ATTRIBUTES="department=operations,team.id=fll-ops,cost_center=ops-001,region=me-south-1"

# Engineering Team
export OTEL_RESOURCE_ATTRIBUTES="department=engineering,team.id=fll-eng,cost_center=eng-001,region=me-south-1"
```

## Available Metrics

### Session & Usage
| Metric | Description | الوصف |
|--------|-------------|-------|
| `claude_code.session.count` | Sessions started | عدد الجلسات |
| `claude_code.active_time.total` | Active time (seconds) | الوقت الفعّال |
| `claude_code.token.usage` | Tokens used (by type) | التوكنات المستخدمة |
| `claude_code.cost.usage` | Cost in USD | التكلفة بالدولار |

### Development Activity
| Metric | Description | الوصف |
|--------|-------------|-------|
| `claude_code.lines_of_code.count` | Lines added/removed | الأسطر المضافة/المحذوفة |
| `claude_code.commit.count` | Git commits | عدد الـ commits |
| `claude_code.pull_request.count` | Pull requests | عدد طلبات الدمج |
| `claude_code.code_edit_tool.decision` | Edit tool accept/reject | قرارات أداة التحرير |

### Token Breakdown Attributes
- `type`: `input`, `output`, `cacheRead`, `cacheCreation`
- `model`: Model identifier (e.g., `claude-sonnet-4-6`)

## Available Events

### Event Types
| Event | Name | الوصف |
|-------|------|-------|
| User Prompt | `claude_code.user_prompt` | عند إرسال أمر |
| Tool Result | `claude_code.tool_result` | عند اكتمال أداة |
| API Request | `claude_code.api_request` | عند طلب API |
| API Error | `claude_code.api_error` | عند فشل API |
| Tool Decision | `claude_code.tool_decision` | عند قبول/رفض أداة |

### Event Correlation
All events within a single prompt share a `prompt.id` (UUID v4) for tracing.

## Settings File Configuration

### Managed Settings (`.claude/settings.json`)

Add monitoring config to enforce across all team members:

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "grpc",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://collector.fll.sa:4317"
  }
}
```

### Dynamic Headers

For token refresh, add to `.claude/settings.json`:

```json
{
  "otelHeadersHelper": "/path/to/generate_headers.sh"
}
```

Script must output JSON: `{"Authorization": "Bearer <token>"}`
Refreshes every 29 minutes by default.

## Backend Options

### For FLL (AWS me-south-1)

| Backend | Use Case |
|---------|----------|
| **CloudWatch** | Native AWS integration, basic metrics |
| **Prometheus + Grafana** | Self-hosted, full control |
| **Datadog** | Full observability platform |
| **Honeycomb** | Advanced querying, event correlation |

### Recommended: Prometheus + Grafana Stack

```bash
# Prometheus exporter (local scraping)
export OTEL_METRICS_EXPORTER=prometheus

# Or OTLP to collector that forwards to Prometheus
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
```

## Alerting Recommendations

| Alert | Condition | الوصف |
|-------|-----------|-------|
| Cost Spike | `cost.usage` > threshold per hour | ارتفاع مفاجئ في التكلفة |
| High Token Usage | `token.usage` > 1M per session | استخدام عالي للتوكنات |
| Error Rate | `api_error` events > 5% | نسبة أخطاء عالية |
| Session Volume | `session.count` unusual spike | حجم جلسات غير عادي |

## Security Notes

- User prompt content NOT collected by default (only length)
- Enable `OTEL_LOG_USER_PROMPTS=1` only for debugging
- Tool parameters may contain file paths — configure backend to redact if needed
- `user.email` included when OAuth authenticated — redact if privacy concern
- MCP/skill names disabled by default — enable with `OTEL_LOG_TOOL_DETAILS=1`

## Debugging

```bash
# Console output for debugging (short intervals)
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=console
export OTEL_LOGS_EXPORTER=console
export OTEL_METRIC_EXPORT_INTERVAL=1000
export OTEL_LOGS_EXPORT_INTERVAL=1000
```

## Service Info

All metrics exported with:
- `service.name`: `claude-code`
- `service.version`: Current version
- `os.type`: Operating system
- `host.arch`: Architecture
- Meter: `com.anthropic.claude_code`
