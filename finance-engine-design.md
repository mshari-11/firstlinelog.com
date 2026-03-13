# FLL Finance Engine Design
## تصميم المحرك المالي — فيرست لاين لوجستيكس

### Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                    Finance Engine                          │
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Wallets  │  │ Payouts  │  │  Recon   │  │  Fraud   │  │
│  │  Ledger   │  │ Batches  │  │  Engine  │  │  Queue   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │              │              │       │
│  ┌────┴──────────────┴──────────────┴──────────────┴───┐   │
│  │              DynamoDB (current) / Aurora (future)    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Nected  │  │   n8n    │  │Veri5now  │  │ Turiya   │  │
│  │  Rules   │  │  Integ.  │  │  eSign   │  │ AI Pilot │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Platform Report Ingestion**
   - S3 upload → n8n trigger → Lambda parse → staging tables
   - Validate columns against platform_file_templates
   - Map to canonical model (platform_reports_staging)

2. **Payout Calculation**
   - Read staging data + rate cards (via Nected rules)
   - Calculate: gross - platform_commission - fll_commission - vehicle_cost + bonus - penalty = net
   - Write to platform_orders_fact / platform_driver_day_fact
   - Post earnings to wallet ledger (append-only)

3. **Reconciliation**
   - Compare platform totals vs internal calculated totals
   - Flag variances above threshold (default: 2%)
   - Create reconciliation items per driver

4. **Payout Execution**
   - Create payout batch → calculate → review → approve → execute
   - Separation of duties: creator cannot approve
   - Ledger entry created for each driver payout
   - Export to STC Bank / bank transfer format

### Ledger Invariants

- **Append-only**: No UPDATE or DELETE on wallet_ledger
- **Corrections via reversal**: Wrong entry → create reversal entry
- **Running balance**: Each entry carries running_balance
- **Wallet balance = derived**: Sum of all ledger entries = wallet.balance
- **All amounts in SAR**: 2 decimal places

### Feature Flags

All new functionality behind DynamoDB feature flags:
- `FEATURE_FINANCE_ENGINE`: Master switch
- `FEATURE_WALLET_LEDGER`: Wallet + ledger operations
- `FEATURE_RECONCILIATION`: Reconciliation runs
- `FEATURE_FRAUD_DETECTION`: Fraud flags
- `FEATURE_NECTED_ENABLED`: Nected rules engine
- `FEATURE_N8N_ENABLED`: n8n automations
- `FEATURE_VERI5NOW_ENABLED`: eSign integration
- `FEATURE_AI_FINANCE_INSIGHTS`: AI analysis
- `FEATURE_TURIYA_ENABLED`: Multi-agent pilot

### Migration Path: DynamoDB → Aurora

Current implementation uses DynamoDB for speed of deployment.
When Aurora is provisioned:
1. Enable `FEATURE_AURORA_ENABLED` flag
2. Run `fll-finance-schema.sql` on Aurora cluster
3. Migrate data from DynamoDB tables → Aurora schemas
4. Switch Lambda connection strings
5. DynamoDB tables become backup/cache layer
