#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# FLL Lambda Deployment Scripts
# Region: me-south-1 (Bahrain)
# API Gateway: xr7wsfym5k (fll-platform-api-prod)
# ═══════════════════════════════════════════════════════════════════════════════
#
# Usage:
#   ./deploy-lambdas.sh auth        — Deploy fll-auth-api (updated v3.0)
#   ./deploy-lambdas.sh onboarding  — Create + deploy fll-driver-onboarding
#   ./deploy-lambdas.sh all         — Both
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - Access to me-south-1 region
#
# IMPORTANT: Before deploying fll-auth-api, you MUST set these env vars:
#   - SUPABASE_URL       (e.g. https://djebhztfewjfyyoortvv.supabase.co)
#   - SUPABASE_SERVICE_KEY (the service_role key from Supabase dashboard)
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

REGION="me-south-1"
API_ID="xr7wsfym5k"
ACCOUNT_ID="230811072086"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/fll-ai-finance-review-role"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAMBDA_DIR="${SCRIPT_DIR}/lambda-code"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
fail()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ─── Deploy fll-auth-api ──────────────────────────────────────────────────────
deploy_auth() {
  echo ""
  echo "═══ Deploying fll-auth-api v3.0 ═══"
  echo ""

  local FUNC_NAME="fll-auth-api"
  local SRC_DIR="${LAMBDA_DIR}/fll-auth-api"
  local ZIP_FILE="/tmp/fll-auth-api.zip"

  # Check source
  [ -f "${SRC_DIR}/app.py" ] || fail "Source not found: ${SRC_DIR}/app.py"

  # Create zip
  log "Packaging ${FUNC_NAME}..."
  rm -f "${ZIP_FILE}"
  cd "${SRC_DIR}"
  zip -j "${ZIP_FILE}" app.py
  cd "${SCRIPT_DIR}"

  # Update function code
  log "Uploading code..."
  aws lambda update-function-code \
    --function-name "${FUNC_NAME}" \
    --zip-file "fileb://${ZIP_FILE}" \
    --region "${REGION}" \
    --no-cli-pager

  # Wait for update to complete
  log "Waiting for update to complete..."
  aws lambda wait function-updated \
    --function-name "${FUNC_NAME}" \
    --region "${REGION}"

  # Update environment variables (add Supabase + SES config)
  # Preserve existing env vars and add new ones
  local SUPABASE_URL_VAL="${SUPABASE_URL:-https://djebhztfewjfyyoortvv.supabase.co}"
  local SUPABASE_KEY_VAL="${SUPABASE_SERVICE_KEY:-}"
  local SES_FROM_VAL="${SES_FROM_EMAIL:-FLL <no-reply@fll.sa>}"

  if [ -z "${SUPABASE_KEY_VAL}" ]; then
    warn "SUPABASE_SERVICE_KEY not set! OTP features will not work."
    warn "Set it later with:"
    warn "  aws lambda update-function-configuration \\"
    warn "    --function-name ${FUNC_NAME} \\"
    warn "    --region ${REGION} \\"
    warn "    --environment 'Variables={COGNITO_CLIENT_ID=6n49ej8fl92i9rtotbk5o9o0d1,USER_POOL_ID=me-south-1_aJtmQ0QrN,REGION=me-south-1,SUPABASE_URL=...,SUPABASE_SERVICE_KEY=...,SES_FROM_EMAIL=FLL <no-reply@fll.sa>}'"
  else
    log "Updating environment variables..."
    aws lambda update-function-configuration \
      --function-name "${FUNC_NAME}" \
      --region "${REGION}" \
      --environment "Variables={COGNITO_CLIENT_ID=6n49ej8fl92i9rtotbk5o9o0d1,USER_POOL_ID=me-south-1_aJtmQ0QrN,REGION=me-south-1,SUPABASE_URL=${SUPABASE_URL_VAL},SUPABASE_SERVICE_KEY=${SUPABASE_KEY_VAL},SES_FROM_EMAIL=${SES_FROM_VAL}}" \
      --no-cli-pager

    aws lambda wait function-updated \
      --function-name "${FUNC_NAME}" \
      --region "${REGION}"
  fi

  # Verify the routes already exist (they do — nkhpzr3 integration)
  log "Auth routes already configured on API Gateway (integration nkhpzr3)"
  log "Routes: /auth/login, /auth/register, /auth/verify, /auth/forgot, /auth/reset,"
  log "        /auth/respond-mfa, /auth/resend, /auth/me, /auth/send-otp, /auth/verify-custom-otp"

  # Add routes for custom OTP if they don't exist
  local INTEGRATION_ID="nkhpzr3"

  for route in "POST /auth/send-otp" "POST /auth/verify-custom-otp"; do
    local existing
    existing=$(aws apigatewayv2 get-routes \
      --api-id "${API_ID}" \
      --region "${REGION}" \
      --query "Items[?RouteKey=='${route}'].RouteId" \
      --output text 2>/dev/null || echo "")

    if [ -z "${existing}" ] || [ "${existing}" = "None" ]; then
      log "Creating route: ${route}"
      aws apigatewayv2 create-route \
        --api-id "${API_ID}" \
        --route-key "${route}" \
        --target "integrations/${INTEGRATION_ID}" \
        --region "${REGION}" \
        --no-cli-pager
    else
      log "Route exists: ${route}"
    fi
  done

  log "${FUNC_NAME} deployed successfully!"
  echo ""
}

# ─── Deploy fll-driver-onboarding ─────────────────────────────────────────────
deploy_onboarding() {
  echo ""
  echo "═══ Deploying fll-driver-onboarding ═══"
  echo ""

  local FUNC_NAME="fll-driver-onboarding"
  local SRC_DIR="${LAMBDA_DIR}/fll-driver-onboarding"
  local ZIP_FILE="/tmp/fll-driver-onboarding.zip"

  # Check source
  [ -f "${SRC_DIR}/lambda_function.py" ] || fail "Source not found: ${SRC_DIR}/lambda_function.py"

  # Create zip
  log "Packaging ${FUNC_NAME}..."
  rm -f "${ZIP_FILE}"
  cd "${SRC_DIR}"
  zip -j "${ZIP_FILE}" lambda_function.py
  cd "${SCRIPT_DIR}"

  # Check if function exists
  local func_exists
  func_exists=$(aws lambda get-function --function-name "${FUNC_NAME}" --region "${REGION}" 2>/dev/null && echo "yes" || echo "no")

  local SUPABASE_URL_VAL="${SUPABASE_URL:-https://djebhztfewjfyyoortvv.supabase.co}"
  local SUPABASE_KEY_VAL="${SUPABASE_SERVICE_KEY:-}"

  if [ "${func_exists}" = "no" ]; then
    log "Creating Lambda function: ${FUNC_NAME}..."

    if [ -z "${SUPABASE_KEY_VAL}" ]; then
      warn "SUPABASE_SERVICE_KEY not set — creating function without it."
      warn "You must update env vars manually later."

      aws lambda create-function \
        --function-name "${FUNC_NAME}" \
        --runtime python3.12 \
        --handler "lambda_function.lambda_handler" \
        --role "${ROLE_ARN}" \
        --zip-file "fileb://${ZIP_FILE}" \
        --timeout 30 \
        --memory-size 256 \
        --region "${REGION}" \
        --environment "Variables={AWS_REGION_NAME=${REGION},KYC_BUCKET=fll-kyc-documents-230811072086,FROM_EMAIL=FLL Platform <no-reply@fll.sa>,ADMIN_EMAILS=M.Z@FLL.SA\\,A.ALZAMIL@FLL.SA,SUPABASE_URL=${SUPABASE_URL_VAL}}" \
        --no-cli-pager
    else
      aws lambda create-function \
        --function-name "${FUNC_NAME}" \
        --runtime python3.12 \
        --handler "lambda_function.lambda_handler" \
        --role "${ROLE_ARN}" \
        --zip-file "fileb://${ZIP_FILE}" \
        --timeout 30 \
        --memory-size 256 \
        --region "${REGION}" \
        --environment "Variables={AWS_REGION_NAME=${REGION},KYC_BUCKET=fll-kyc-documents-230811072086,FROM_EMAIL=FLL Platform <no-reply@fll.sa>,ADMIN_EMAILS=M.Z@FLL.SA\\,A.ALZAMIL@FLL.SA,SUPABASE_URL=${SUPABASE_URL_VAL},SUPABASE_SERVICE_KEY=${SUPABASE_KEY_VAL}}" \
        --no-cli-pager
    fi

    log "Waiting for function to be active..."
    aws lambda wait function-active-v2 \
      --function-name "${FUNC_NAME}" \
      --region "${REGION}"
  else
    log "Updating existing Lambda: ${FUNC_NAME}..."
    aws lambda update-function-code \
      --function-name "${FUNC_NAME}" \
      --zip-file "fileb://${ZIP_FILE}" \
      --region "${REGION}" \
      --no-cli-pager

    aws lambda wait function-updated \
      --function-name "${FUNC_NAME}" \
      --region "${REGION}"
  fi

  # ── Create API Gateway Integration ──
  log "Setting up API Gateway integration..."

  local LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNC_NAME}"

  # Check if integration already exists
  local INTEGRATION_ID
  INTEGRATION_ID=$(aws apigatewayv2 get-integrations \
    --api-id "${API_ID}" \
    --region "${REGION}" \
    --query "Items[?IntegrationUri.contains(@, '${FUNC_NAME}')].IntegrationId | [0]" \
    --output text 2>/dev/null || echo "None")

  if [ "${INTEGRATION_ID}" = "None" ] || [ -z "${INTEGRATION_ID}" ]; then
    log "Creating integration for ${FUNC_NAME}..."
    INTEGRATION_ID=$(aws apigatewayv2 create-integration \
      --api-id "${API_ID}" \
      --integration-type AWS_PROXY \
      --integration-uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" \
      --payload-format-version "2.0" \
      --region "${REGION}" \
      --query "IntegrationId" \
      --output text)

    # Add Lambda permission for API Gateway
    log "Adding API Gateway invoke permission..."
    aws lambda add-permission \
      --function-name "${FUNC_NAME}" \
      --statement-id "apigateway-invoke-${FUNC_NAME}" \
      --action "lambda:InvokeFunction" \
      --principal "apigateway.amazonaws.com" \
      --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
      --region "${REGION}" \
      --no-cli-pager 2>/dev/null || log "Permission already exists"
  else
    log "Integration exists: ${INTEGRATION_ID}"
  fi

  # ── Create Routes ──
  local ROUTES=(
    "POST /driver/otp/send"
    "POST /driver/otp/verify"
    "POST /driver/apply"
    "GET /driver/application-status"
    "POST /driver/applications/{id}/approve"
    "POST /driver/applications/{id}/reject"
  )

  for route in "${ROUTES[@]}"; do
    local existing
    existing=$(aws apigatewayv2 get-routes \
      --api-id "${API_ID}" \
      --region "${REGION}" \
      --query "Items[?RouteKey=='${route}'].RouteId" \
      --output text 2>/dev/null || echo "")

    if [ -z "${existing}" ] || [ "${existing}" = "None" ]; then
      log "Creating route: ${route}"
      aws apigatewayv2 create-route \
        --api-id "${API_ID}" \
        --route-key "${route}" \
        --target "integrations/${INTEGRATION_ID}" \
        --region "${REGION}" \
        --no-cli-pager
    else
      log "Route exists: ${route}"
    fi
  done

  # Deploy the API
  log "Deploying API..."
  aws apigatewayv2 create-deployment \
    --api-id "${API_ID}" \
    --region "${REGION}" \
    --no-cli-pager 2>/dev/null || log "Auto-deploy may be enabled"

  log "${FUNC_NAME} deployed successfully!"
  echo ""
  echo "Endpoints:"
  echo "  POST https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com/driver/otp/send"
  echo "  POST https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com/driver/otp/verify"
  echo "  POST https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com/driver/apply"
  echo "  GET  https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com/driver/application-status"
  echo "  POST https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com/driver/applications/{id}/approve"
  echo "  POST https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com/driver/applications/{id}/reject"
  echo ""
}

# ─── Deploy fll-data-sync ──────────────────────────────────────────────────────
deploy_sync() {
  echo ""
  echo "═══ Deploying fll-data-sync ═══"
  echo ""

  local FUNC_NAME="fll-data-sync"
  local SRC_DIR="${LAMBDA_DIR}/fll-data-sync"
  local ZIP_FILE="/tmp/fll-data-sync.zip"

  # Check source
  [ -f "${SRC_DIR}/lambda_function.py" ] || fail "Source not found: ${SRC_DIR}/lambda_function.py"

  # Create zip
  log "Packaging ${FUNC_NAME}..."
  rm -f "${ZIP_FILE}"
  cd "${SRC_DIR}"
  zip -j "${ZIP_FILE}" lambda_function.py
  cd "${SCRIPT_DIR}"

  # Check if function exists
  local func_exists
  func_exists=$(aws lambda get-function --function-name "${FUNC_NAME}" --region "${REGION}" 2>/dev/null && echo "yes" || echo "no")

  local SUPABASE_URL_VAL="${SUPABASE_URL:-https://djebhztfewjfyyoortvv.supabase.co}"
  local SUPABASE_KEY_VAL="${SUPABASE_SERVICE_KEY:-}"

  local ENV_VARS="AWS_REGION_NAME=${REGION}"
  ENV_VARS+=",SUPABASE_URL=${SUPABASE_URL_VAL}"
  ENV_VARS+=",USER_POOL_ID=me-south-1_aJtmQ0QrN"
  ENV_VARS+=",KYC_BUCKET=fll-kyc-documents-230811072086"
  ENV_VARS+=",CHAT_TABLE=fll-chat-history"
  ENV_VARS+=",FROM_EMAIL=FLL Platform <no-reply@fll.sa>"
  ENV_VARS+=",ADMIN_EMAILS=M.Z@FLL.SA\,A.ALZAMIL@FLL.SA"
  ENV_VARS+=",LOCATION_RETENTION_HOURS=48"
  ENV_VARS+=",APPLICATION_EXPIRY_DAYS=30"
  ENV_VARS+=",BATCH_SIZE=100"

  if [ -n "${SUPABASE_KEY_VAL}" ]; then
    ENV_VARS+=",SUPABASE_SERVICE_KEY=${SUPABASE_KEY_VAL}"
  fi

  if [ "${func_exists}" = "no" ]; then
    log "Creating Lambda function: ${FUNC_NAME}..."

    aws lambda create-function \
      --function-name "${FUNC_NAME}" \
      --runtime python3.12 \
      --handler "lambda_function.lambda_handler" \
      --role "${ROLE_ARN}" \
      --zip-file "fileb://${ZIP_FILE}" \
      --timeout 300 \
      --memory-size 512 \
      --region "${REGION}" \
      --environment "Variables={${ENV_VARS}}" \
      --no-cli-pager

    log "Waiting for function to be active..."
    aws lambda wait function-active-v2 \
      --function-name "${FUNC_NAME}" \
      --region "${REGION}"
  else
    log "Updating existing Lambda: ${FUNC_NAME}..."
    aws lambda update-function-code \
      --function-name "${FUNC_NAME}" \
      --zip-file "fileb://${ZIP_FILE}" \
      --region "${REGION}" \
      --no-cli-pager

    aws lambda wait function-updated \
      --function-name "${FUNC_NAME}" \
      --region "${REGION}"

    log "Updating environment..."
    aws lambda update-function-configuration \
      --function-name "${FUNC_NAME}" \
      --timeout 300 \
      --memory-size 512 \
      --region "${REGION}" \
      --environment "Variables={${ENV_VARS}}" \
      --no-cli-pager

    aws lambda wait function-updated \
      --function-name "${FUNC_NAME}" \
      --region "${REGION}"
  fi

  # ── Setup EventBridge Scheduled Rules ──
  local LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNC_NAME}"

  # Rule 1: Full sync every 6 hours
  log "Creating EventBridge rule: fll-data-sync-full (every 6 hours)..."
  aws events put-rule \
    --name "fll-data-sync-full" \
    --schedule-expression "rate(6 hours)" \
    --state ENABLED \
    --description "FLL full data sync — Supabase <> AWS (every 6 hours)" \
    --region "${REGION}" \
    --no-cli-pager

  aws events put-targets \
    --rule "fll-data-sync-full" \
    --targets "Id=fll-data-sync-full-target,Arn=${LAMBDA_ARN}" \
    --region "${REGION}" \
    --no-cli-pager

  # Rule 2: Financial pipeline every 1 hour
  log "Creating EventBridge rule: fll-data-sync-finance (every hour)..."
  aws events put-rule \
    --name "fll-data-sync-finance" \
    --schedule-expression "rate(1 hour)" \
    --state ENABLED \
    --description "FLL financial pipeline processing (every hour)" \
    --region "${REGION}" \
    --no-cli-pager

  aws events put-targets \
    --rule "fll-data-sync-finance" \
    --targets "Id=fll-data-sync-finance-target,Arn=${LAMBDA_ARN},Input={\"tasks\":[\"financial_pipeline\",\"wallet_reconciliation\"]}" \
    --region "${REGION}" \
    --no-cli-pager

  # Rule 3: Location cleanup every 12 hours
  log "Creating EventBridge rule: fll-data-sync-cleanup (every 12 hours)..."
  aws events put-rule \
    --name "fll-data-sync-cleanup" \
    --schedule-expression "rate(12 hours)" \
    --state ENABLED \
    --description "FLL location cleanup and application expiry (every 12 hours)" \
    --region "${REGION}" \
    --no-cli-pager

  aws events put-targets \
    --rule "fll-data-sync-cleanup" \
    --targets "Id=fll-data-sync-cleanup-target,Arn=${LAMBDA_ARN},Input={\"tasks\":[\"location_cleanup\",\"application_expiry\"]}" \
    --region "${REGION}" \
    --no-cli-pager

  # Add Lambda permissions for EventBridge
  for rule_name in "fll-data-sync-full" "fll-data-sync-finance" "fll-data-sync-cleanup"; do
    aws lambda add-permission \
      --function-name "${FUNC_NAME}" \
      --statement-id "eventbridge-${rule_name}" \
      --action "lambda:InvokeFunction" \
      --principal "events.amazonaws.com" \
      --source-arn "arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/${rule_name}" \
      --region "${REGION}" \
      --no-cli-pager 2>/dev/null || log "Permission already exists for ${rule_name}"
  done

  if [ -z "${SUPABASE_KEY_VAL}" ]; then
    warn "SUPABASE_SERVICE_KEY not set! Sync will fail without it."
  fi

  log "${FUNC_NAME} deployed successfully!"
  echo ""
  echo "EventBridge Schedules:"
  echo "  Every 6h  → Full sync (all 10 tasks)"
  echo "  Every 1h  → Financial pipeline + wallet reconciliation"
  echo "  Every 12h → Location cleanup + application expiry"
  echo ""
  echo "Manual invoke:"
  echo "  aws lambda invoke --function-name ${FUNC_NAME} --region ${REGION} --payload '{}' /dev/stdout"
  echo "  aws lambda invoke --function-name ${FUNC_NAME} --region ${REGION} --payload '{\"task\":\"financial_pipeline\"}' /dev/stdout"
  echo ""
}

# ─── Main ─────────────────────────────────────────────────────────────────────
case "${1:-all}" in
  auth)
    deploy_auth
    ;;
  onboarding)
    deploy_onboarding
    ;;
  sync)
    deploy_sync
    ;;
  all)
    deploy_auth
    deploy_onboarding
    deploy_sync
    ;;
  *)
    echo "Usage: $0 {auth|onboarding|sync|all}"
    exit 1
    ;;
esac

echo "═══ Deployment complete ═══"
