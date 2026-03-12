#!/bin/bash
# ============================================
# Claude Code OpenTelemetry Setup Script
# ============================================
# Usage: source ./setup-telemetry.sh
# ============================================

# 1. Enable telemetry
export CLAUDE_CODE_ENABLE_TELEMETRY=1

# 2. Choose exporters (both are optional - configure only what you need)
#    Options for metrics: otlp, prometheus, console
#    Options for logs: otlp, console
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp

# 3. Configure OTLP endpoint
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# 4. Set authentication (uncomment and set your token if required)
# export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer your-token"

# 5. Export intervals (debugging - shorter intervals)
export OTEL_METRIC_EXPORT_INTERVAL=10000   # 10 seconds (default: 60000ms)
export OTEL_LOGS_EXPORT_INTERVAL=5000      # 5 seconds (default: 5000ms)

echo "Claude Code telemetry configured successfully."
echo "  Metrics exporter: $OTEL_METRICS_EXPORTER"
echo "  Logs exporter:    $OTEL_LOGS_EXPORTER"
echo "  OTLP endpoint:    $OTEL_EXPORTER_OTLP_ENDPOINT"
echo "  Protocol:         $OTEL_EXPORTER_OTLP_PROTOCOL"
echo ""
echo "Run 'claude' to start Claude Code with telemetry enabled."
