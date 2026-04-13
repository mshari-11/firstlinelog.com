# fll-platform-sync-unified

Unified Lambda that pulls orders from all 6 delivery platforms (HungerStation,
Keeta, Ninja, Mrsool, ToYou, Careem) into the canonical `platform_orders_unified`
table created by migration `023_unified_platforms_orders.sql`.

## Deployment

```bash
cd lambda-code/fll-platform-sync-unified
zip -r function.zip lambda_function.py
aws lambda create-function \
  --function-name fll-platform-sync-unified \
  --runtime python3.12 \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip \
  --role arn:aws:iam::230811072086:role/fll-lambda-execution \
  --region me-south-1 \
  --timeout 60 \
  --memory-size 256
```

## Required environment variables

| Variable | Source |
|---|---|
| `SUPABASE_URL` | https://djebhztfewjfyyoortvv.supabase.co |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings → API → service_role key |
| `HUNGERSTATION_API_KEY` | HungerStation partner portal |
| `KEETA_API_KEY` | Keeta partner portal |
| `NINJA_API_KEY` | Ninja partner portal |
| `MRSOOL_API_KEY` | Mrsool business portal |
| `TOYOU_API_KEY` | ToYou partner portal |
| `CAREEM_API_KEY` | Careem Now merchant portal |

## EventBridge schedules (staggered to avoid simultaneous load)

| Platform | Cron (UTC) |
|---|---|
| HungerStation | `cron(0/5 * * * ? *)` — every 5 min on :00 |
| Keeta | `cron(1/5 * * * ? *)` — every 5 min on :01 |
| Ninja | `cron(2/5 * * * ? *)` — every 5 min on :02 |
| Mrsool | `cron(3/5 * * * ? *)` — every 5 min on :03 |
| ToYou | `cron(4/5 * * * ? *)` — every 5 min on :04 |
| Careem | `cron(0/5 * * * ? *)` — every 5 min, +30s offset |

Each schedule passes `{"platform": "<name>", "mode": "incremental", "trigger_source": "cron"}`
as the event input.

## Manual backfill

```bash
aws lambda invoke \
  --function-name fll-platform-sync-unified \
  --payload '{"platform":"hungerstation","mode":"backfill","trigger_source":"manual"}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/out.json
```

## Architecture notes

- **Idempotency:** each row uses `(platform, external_order_id)` as the unique
  key; re-running the Lambda for the same window will UPSERT (not duplicate).
- **Audit:** every run writes a row to `platform_sync_runs` with counts and
  status — visible in the admin dashboard.
- **Failure mode:** on exception, the run is marked `failed` with the error
  message, the Lambda returns 500, and SQS DLQ retries (configure separately).
- **Per-platform overrides:** if a platform's payload structure differs from
  the canonical mapping in `normalize_order()`, override the function or add
  per-platform branches.
