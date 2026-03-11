# FLL Driver Onboarding Lambda

New Lambda package for courier/driver onboarding without touching the existing `fll-kyc-upload` handler.

## Routes

- `POST /driver/otp/send`
- `POST /driver/otp/verify`
- `POST /driver/apply`
- `POST /driver/applications/{id}/approve`
- `POST /driver/applications/{id}/reject`
- `GET /driver/application-status?ref=APP-...`

## Required environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `KYC_BUCKET` (optional, defaults to current FLL bucket)
- `FROM_EMAIL` (optional, defaults to `FLL Platform <no-reply@fll.sa>`)
- `ADMIN_EMAILS` (comma-separated; optional)
- `OTP_TTL_MINUTES` (optional)
- `OTP_SEND_LIMIT` (optional)
- `OTP_VERIFY_LIMIT` (optional)

## Notes

- This file targets the schema in `supabase/migrations/003_driver_applications.sql`.
- It stores uploaded docs as S3 keys in the `driver_applications` table.
- It uses the existing `approve_driver_application(p_application_id uuid)` RPC.
- It intentionally leaves `src/App.tsx` and `vercel.json` untouched.
