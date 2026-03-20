#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# FLL Infrastructure Deploy — CloudWatch Alarms + WAF + Secrets Manager
# Direct AWS CLI deploy (no CDK required)
# Region: me-south-1 (Bahrain)
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

REGION="me-south-1"
ACCOUNT_ID="230811072086"
API_ID_MAIN="xr7wsfym5k"
API_ID_AI="51n1gng40f"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
info()  { echo -e "${CYAN}[i]${NC} $1"; }
fail()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: SNS Topic for Alarm Notifications
# ═══════════════════════════════════════════════════════════════════════════════
deploy_sns() {
  echo ""
  echo "═══ Step 1: SNS Alarm Topic ═══"

  local TOPIC_ARN
  TOPIC_ARN=$(aws sns create-topic --name fll-alarm-notifications --region "$REGION" --query "TopicArn" --output text --no-cli-pager)
  log "Topic: $TOPIC_ARN"

  aws sns subscribe --topic-arn "$TOPIC_ARN" --protocol email --notification-endpoint "M.Z@FLL.SA" --region "$REGION" --no-cli-pager > /dev/null 2>&1 || true
  aws sns subscribe --topic-arn "$TOPIC_ARN" --protocol email --notification-endpoint "A.ALZAMIL@FLL.SA" --region "$REGION" --no-cli-pager > /dev/null 2>&1 || true
  log "Subscribed admin emails"
  warn "Check email to CONFIRM SNS subscriptions!"

  echo "$TOPIC_ARN"
}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: CloudWatch Alarms
# ═══════════════════════════════════════════════════════════════════════════════
deploy_alarms() {
  local TOPIC_ARN="$1"
  echo ""
  echo "═══ Step 2: CloudWatch Alarms ═══"

  # Lambda error alarms
  local LAMBDAS=(
    "fll-auth-api"
    "fll-otp-service"
    "fll-driver-onboarding"
    "fll-kyc-upload"
    "fll-ai-chatbot"
    "fll-ai-finance-api"
    "fll-ai-finance-review"
    "fll-ai-dashboard-api"
    "fll-data-sync"
    "fll-contact-confirm"
    "fll-user-management"
    "fll-sla-scanner"
    "fll-generate-stc-excel"
    "fll-db-migration"
    "fll-platform-api-prod"
    "fll-complaints-classifier-prod"
  )

  for func in "${LAMBDAS[@]}"; do
    # Error alarm
    aws cloudwatch put-metric-alarm \
      --alarm-name "fll-${func}-errors" \
      --alarm-description "Lambda ${func} errors > 3 in 5 min" \
      --namespace AWS/Lambda \
      --metric-name Errors \
      --dimensions "Name=FunctionName,Value=${func}" \
      --statistic Sum \
      --period 300 \
      --evaluation-periods 1 \
      --threshold 3 \
      --comparison-operator GreaterThanOrEqualToThreshold \
      --treat-missing-data notBreaching \
      --alarm-actions "$TOPIC_ARN" \
      --region "$REGION" \
      --no-cli-pager 2>/dev/null

    # Throttle alarm
    aws cloudwatch put-metric-alarm \
      --alarm-name "fll-${func}-throttles" \
      --alarm-description "Lambda ${func} throttled" \
      --namespace AWS/Lambda \
      --metric-name Throttles \
      --dimensions "Name=FunctionName,Value=${func}" \
      --statistic Sum \
      --period 300 \
      --evaluation-periods 1 \
      --threshold 1 \
      --comparison-operator GreaterThanOrEqualToThreshold \
      --treat-missing-data notBreaching \
      --alarm-actions "$TOPIC_ARN" \
      --region "$REGION" \
      --no-cli-pager 2>/dev/null

    log "Alarms: ${func}"
  done

  # API Gateway 5xx alarm
  for api in "$API_ID_MAIN" "$API_ID_AI"; do
    aws cloudwatch put-metric-alarm \
      --alarm-name "fll-api-${api}-5xx" \
      --alarm-description "API ${api} 5xx > 10 in 5 min" \
      --namespace AWS/ApiGateway \
      --metric-name 5xx \
      --dimensions "Name=ApiId,Value=${api}" \
      --statistic Sum \
      --period 300 \
      --evaluation-periods 1 \
      --threshold 10 \
      --comparison-operator GreaterThanOrEqualToThreshold \
      --treat-missing-data notBreaching \
      --alarm-actions "$TOPIC_ARN" \
      --region "$REGION" \
      --no-cli-pager 2>/dev/null
    log "Alarm: API ${api} 5xx"
  done

  # Billing alarm (us-east-1 required for billing)
  aws cloudwatch put-metric-alarm \
    --alarm-name "fll-monthly-billing-500" \
    --alarm-description "FLL monthly AWS cost > \$500" \
    --namespace AWS/Billing \
    --metric-name EstimatedCharges \
    --dimensions "Name=Currency,Value=USD" \
    --statistic Maximum \
    --period 21600 \
    --evaluation-periods 1 \
    --threshold 500 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --treat-missing-data notBreaching \
    --alarm-actions "$TOPIC_ARN" \
    --region us-east-1 \
    --no-cli-pager 2>/dev/null || warn "Billing alarm requires us-east-1 access"

  log "All CloudWatch alarms created!"
}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: WAF
# ═══════════════════════════════════════════════════════════════════════════════
deploy_waf() {
  echo ""
  echo "═══ Step 3: WAF Web ACL ═══"

  # Check if WAF already exists
  local EXISTING
  EXISTING=$(aws wafv2 list-web-acls --scope REGIONAL --region "$REGION" --query "WebACLs[?Name=='fll-platform-waf'].Id" --output text --no-cli-pager 2>/dev/null || echo "")

  if [ -n "$EXISTING" ] && [ "$EXISTING" != "None" ]; then
    log "WAF already exists: $EXISTING"
    return
  fi

  aws wafv2 create-web-acl \
    --name "fll-platform-waf" \
    --scope REGIONAL \
    --default-action '{"Allow":{}}' \
    --description "FLL Platform API Protection" \
    --visibility-config '{"SampledRequestsEnabled":true,"CloudWatchMetricsEnabled":true,"MetricName":"fll-waf"}' \
    --rules '[
      {
        "Name":"fll-rate-limit",
        "Priority":1,
        "Action":{"Block":{}},
        "Statement":{"RateBasedStatement":{"Limit":2000,"AggregateKeyType":"IP"}},
        "VisibilityConfig":{"SampledRequestsEnabled":true,"CloudWatchMetricsEnabled":true,"MetricName":"fll-rate-limit"}
      },
      {
        "Name":"aws-common-rules",
        "Priority":10,
        "OverrideAction":{"None":{}},
        "Statement":{"ManagedRuleGroupStatement":{"VendorName":"AWS","Name":"AWSManagedRulesCommonRuleSet"}},
        "VisibilityConfig":{"SampledRequestsEnabled":true,"CloudWatchMetricsEnabled":true,"MetricName":"aws-common"}
      },
      {
        "Name":"aws-sqli-rules",
        "Priority":20,
        "OverrideAction":{"None":{}},
        "Statement":{"ManagedRuleGroupStatement":{"VendorName":"AWS","Name":"AWSManagedRulesSQLiRuleSet"}},
        "VisibilityConfig":{"SampledRequestsEnabled":true,"CloudWatchMetricsEnabled":true,"MetricName":"aws-sqli"}
      },
      {
        "Name":"aws-bad-inputs",
        "Priority":30,
        "OverrideAction":{"None":{}},
        "Statement":{"ManagedRuleGroupStatement":{"VendorName":"AWS","Name":"AWSManagedRulesKnownBadInputsRuleSet"}},
        "VisibilityConfig":{"SampledRequestsEnabled":true,"CloudWatchMetricsEnabled":true,"MetricName":"aws-bad-inputs"}
      }
    ]' \
    --region "$REGION" \
    --no-cli-pager

  log "WAF created: fll-platform-waf"
  info "Note: API Gateway association requires HTTP API stage ARN — associate manually or via CDK"
}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: Secrets Manager
# ═══════════════════════════════════════════════════════════════════════════════
deploy_secrets() {
  echo ""
  echo "═══ Step 4: Secrets Manager ═══"

  # Check if secret exists
  local EXISTS
  EXISTS=$(aws secretsmanager describe-secret --secret-id "fll-platform/prod/credentials" --region "$REGION" 2>/dev/null && echo "yes" || echo "no")

  if [ "$EXISTS" = "yes" ]; then
    log "Secret fll-platform/prod/credentials already exists"
  else
    aws secretsmanager create-secret \
      --name "fll-platform/prod/credentials" \
      --description "FLL Platform credentials — Supabase, Cognito, services" \
      --secret-string '{
        "SUPABASE_URL": "https://djebhztfewjfyyoortvv.supabase.co",
        "SUPABASE_SERVICE_KEY": "REPLACE_ME",
        "COGNITO_CLIENT_ID": "6n49ej8fl92i9rtotbk5o9o0d1",
        "COGNITO_CLIENT_SECRET": "REPLACE_ME",
        "USER_POOL_ID": "me-south-1_aJtmQ0QrN",
        "KYC_BUCKET": "fll-kyc-documents-230811072086",
        "CHAT_TABLE": "fll-chat-history",
        "FROM_EMAIL": "FLL Platform <no-reply@fll.sa>",
        "ADMIN_EMAILS": "M.Z@FLL.SA,A.ALZAMIL@FLL.SA"
      }' \
      --region "$REGION" \
      --no-cli-pager
    log "Secret created: fll-platform/prod/credentials"
    warn "Update SUPABASE_SERVICE_KEY and COGNITO_CLIENT_SECRET values!"
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════
echo "╔═══════════════════════════════════════════════╗"
echo "║   FLL Infrastructure Deploy — me-south-1      ║"
echo "╚═══════════════════════════════════════════════╝"

case "${1:-all}" in
  sns)     deploy_sns ;;
  alarms)  TOPIC_ARN=$(deploy_sns); deploy_alarms "$TOPIC_ARN" ;;
  waf)     deploy_waf ;;
  secrets) deploy_secrets ;;
  all)
    TOPIC_ARN=$(deploy_sns)
    deploy_alarms "$TOPIC_ARN"
    deploy_waf
    deploy_secrets
    echo ""
    echo "═══ All infrastructure deployed! ═══"
    echo ""
    echo "Next steps:"
    echo "  1. Confirm SNS email subscriptions (check M.Z@FLL.SA and A.ALZAMIL@FLL.SA)"
    echo "  2. Update Secrets Manager with actual keys:"
    echo "     aws secretsmanager update-secret --secret-id fll-platform/prod/credentials --region $REGION --secret-string '{...}'"
    echo "  3. Associate WAF with API Gateway stages (if HTTP API)"
    echo ""
    ;;
  *)
    echo "Usage: $0 {sns|alarms|waf|secrets|all}"
    exit 1
    ;;
esac
