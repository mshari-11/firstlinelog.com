---
name: fll-onboarding
description: "Driver onboarding and KYC workflow for FLL: application submission, document upload, OTP verification, admin approval, and automatic wallet creation. Use when working on driver registration, applications, KYC, or onboarding flows."
---

# FLL Driver Onboarding Skill

You are working on the FLL Driver Onboarding System — a multi-step workflow for registering delivery drivers at First Line Logistics (fll.sa).

## Workflow

```
1. Driver submits application (personal info + documents)
   ↓
2. Email OTP verification (SES → driver_email_otps)
   ↓
3. Document upload to S3 (selfie, national ID, bank cert, liveness video)
   ↓
4. Application status: pending
   ↓
5. Admin review (under_review)
   ↓
6. Approve → creates courier record + auto-creates wallet
   OR Reject / Requires correction
```

## Key Files

### Lambda (Backend)
- `lambda-code/fll-driver-onboarding/lambda_function.py` — Main onboarding Lambda (Python 3.12)
  - Routes: `/driver/otp/send`, `/driver/otp/verify`, `/driver/apply`, `/driver/application-status`, `/driver/applications/{id}/approve`, `/driver/applications/{id}/reject`
  - Environment: `KYC_BUCKET=fll-kyc-documents-230811072086`, `FROM_EMAIL=FLL Platform <no-reply@fll.sa>`, `ADMIN_EMAILS=M.Z@FLL.SA, A.ALZAMIL@FLL.SA`
- `lambda-code/fll-kyc-upload/lambda_function.py` — Document upload (pre-signed URLs, S3)
- `lambda-code/fll-otp-email/lambda_function.py` — OTP email dispatch (SES)

### Database (Supabase)
- `supabase/migrations/003_driver_applications.sql` — Applications schema
  - Table: `driver_applications` (personal info, national_id, contract_type, bank info, document refs, face_similarity_score, liveness_passed, email_verified, otp_code, device_fingerprint, ip_address)
  - Table: `driver_applications_archive` (immutable snapshots on status change)
  - Table: `otp_attempts` (rate limiting)
  - Function: `approve_driver_application()` (approve → create courier + auto-wallet)
  - Trigger: `trg_archive_application` (archive on status change)
- `supabase/migrations/004_driver_onboarding_security.sql` — OTP management
  - Table: `driver_email_otps` (email, otp_hash, otp_expires_at, attempts, verified_at, ip_address)

### Frontend
- `src/pages/courier/Register.tsx` — Registration form
- `src/pages/courier/Portal.tsx` — Courier self-service portal
- `src/pages/courier/ApplicationStatus.tsx` — Application tracking
- `src/pages/admin/Couriers.tsx` — Admin courier management
- `courier-dashboard.html` — Courier dashboard (vanilla HTML)

## Application States

| State | Description |
|-------|-------------|
| `pending` | Just submitted, awaiting review |
| `under_review` | Admin is reviewing |
| `approved` | Creates courier record + wallet |
| `rejected` | Final rejection |
| `requires_correction` | Sent back for fixes |

## Unique Constraints (excluding rejected)

- `national_id` — One active application per national ID
- `email` — One active application per email
- `phone` — One active application per phone

## Security

- OTP rate limiting via `otp_attempts` table
- Device fingerprinting + IP tracking
- Documents stored in S3 with pre-signed URLs (time-limited)
- Admin notification emails on new applications
- OTP codes hashed in `driver_applications.otp_code`

## Integration Points

- **Veri5now** (`lambda-code/integrations/veri5now-adapter.js`) — eSign for contracts (feature-flagged)
- **Wallet creation** — Auto-triggered by `trg_create_driver_wallet` on courier insert

## When Modifying Onboarding Code

1. Read existing Lambda first (`lambda-code/fll-driver-onboarding/lambda_function.py`)
2. Preserve all existing application states and transitions
3. Archive all status changes automatically (trigger handles this)
4. Never bypass OTP verification
5. Keep document uploads going to S3 (never store files in DB)
6. Admin emails must be notified on new applications
7. Test the full flow: apply → verify → upload → review → approve → courier + wallet created
