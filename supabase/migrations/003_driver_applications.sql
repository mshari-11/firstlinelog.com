-- ============================================================
-- FLL Driver Applications & Onboarding
-- Migration: 003_driver_applications.sql
--
-- Full onboarding workflow:
--   1. Applicant submits registration
--   2. Email OTP verified
--   3. Documents uploaded to S3
--   4. Status = PENDING → Admin reviews
--   5. Admin approves → driver created, wallet auto-created
-- ============================================================

-- ─── Driver Application ────────────────────────────────────────────────────────
create table if not exists driver_applications (
  id                    uuid primary key default gen_random_uuid(),
  app_ref               text not null unique,           -- e.g. APP-20250311-XXXX

  -- Personal info
  full_name             text not null,
  national_id           text not null,
  nationality           text not null default 'سعودي',
  date_of_birth         date,
  city                  text not null,
  phone                 text not null,
  email                 text not null,
  platform_app          text,                           -- e.g. 'جاهز', 'هنقرستيشن'

  -- Contract
  contract_type         text not null check (contract_type in ('freelance','full_time','part_time')),

  -- Bank info
  bank_name             text,
  bank_account          text,
  iban                  text,

  -- Documents (S3 keys)
  doc_national_id       text,                           -- S3 key: {id}/id_card/...
  doc_national_id_back  text,
  doc_selfie            text,                           -- S3 key: {id}/selfie/...
  doc_liveness_video    text,                           -- S3 key: {id}/liveness/...
  doc_bank_cert         text,                           -- S3 key: {id}/bank_cert/...
  doc_driver_license    text,

  -- Vehicle (optional)
  has_vehicle           boolean not null default false,
  vehicle_type          text check (vehicle_type in ('bike','car','van') or vehicle_type is null),
  vehicle_brand         text,
  vehicle_model         text,
  vehicle_year          smallint,
  vehicle_plate         text,
  vehicle_color         text,
  doc_vehicle_front     text,
  doc_vehicle_back      text,
  doc_vehicle_side      text,
  doc_vehicle_reg       text,
  doc_vehicle_insurance text,
  doc_vehicle_license   text,

  -- Verification metadata
  face_similarity_score numeric(5,2),                  -- 0-100 from face-api
  liveness_passed       boolean,
  email_verified        boolean not null default false,
  otp_code              text,                           -- hashed 6-digit OTP
  otp_expires_at        timestamptz,
  otp_attempts          smallint not null default 0,

  -- Security / fraud prevention
  device_fingerprint    text,
  ip_address            text,
  user_agent            text,

  -- Workflow
  status                text not null default 'pending'
                        check (status in ('pending','under_review','approved','rejected','requires_correction','info_required')),
  admin_notes           text,
  rejection_reason      text,
  reviewed_by           uuid,                          -- references users.id
  reviewed_at           timestamptz,

  -- Timestamps
  submitted_at          timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Unique constraints to prevent duplicate registrations
create unique index if not exists uniq_app_national_id on driver_applications(national_id)
  where status not in ('rejected');

create unique index if not exists uniq_app_email on driver_applications(email)
  where status not in ('rejected');

create unique index if not exists uniq_app_phone on driver_applications(phone)
  where status not in ('rejected');

-- ─── Archive (immutable copy of every application state change) ────────────────
create table if not exists driver_applications_archive (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references driver_applications(id) on delete restrict,
  snapshot       jsonb not null,              -- full row snapshot at time of change
  changed_by     uuid,
  change_type    text not null,               -- 'submitted','reviewed','approved','rejected','corrected'
  ip_address     text,
  created_at     timestamptz not null default now()
);

-- ─── OTP rate-limit log ────────────────────────────────────────────────────────
create table if not exists otp_attempts (
  id                 uuid primary key default gen_random_uuid(),
  identifier         text not null,           -- email or IP
  action             text not null,           -- 'send' | 'verify'
  code_hash          text,                    -- HMAC-SHA256 of code (only for 'send')
  expires_at         timestamptz,             -- OTP expiry time
  used               boolean not null default false,
  ip_address         text,
  device_fingerprint text,
  created_at         timestamptz not null default now()
);

create index if not exists idx_otp_attempts_identifier on otp_attempts(identifier, created_at desc);

-- ─── Trigger: auto-archive on status change ───────────────────────────────────
create or replace function archive_application_change()
returns trigger language plpgsql as $$
begin
  if (old.status is distinct from new.status) or (TG_OP = 'INSERT') then
    insert into driver_applications_archive (application_id, snapshot, change_type)
    values (
      new.id,
      to_jsonb(new),
      case TG_OP
        when 'INSERT' then 'submitted'
        else new.status
      end
    );
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_archive_application on driver_applications;
create trigger trg_archive_application
  before insert or update on driver_applications
  for each row execute function archive_application_change();

-- ─── Function: approve application → create courier + wallet ──────────────────
create or replace function approve_driver_application(
  p_application_id uuid,
  p_reviewed_by    uuid default null
) returns uuid language plpgsql as $$
declare
  v_app    driver_applications;
  v_courier_id uuid;
begin
  -- Lock and fetch
  select * into v_app from driver_applications
    where id = p_application_id for update;

  if not found then
    raise exception 'Application not found: %', p_application_id;
  end if;

  if v_app.status = 'approved' then
    raise exception 'Application already approved';
  end if;

  -- Create courier record
  insert into couriers (
    full_name, phone, city, vehicle_type, status
  ) values (
    v_app.full_name, v_app.phone, v_app.city,
    coalesce(
      case v_app.vehicle_type
        when 'bike' then 'دراجة'
        when 'car'  then 'سيارة'
        when 'van'  then 'ون'
        else 'دراجة'
      end,
      'دراجة'
    ),
    'active'
  ) returning id into v_courier_id;

  -- Update application status
  update driver_applications set
    status      = 'approved',
    reviewed_by = p_reviewed_by,
    reviewed_at = now()
  where id = p_application_id;

  return v_courier_id;   -- wallet auto-created by trg_create_driver_wallet
end;
$$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_driver_apps_status  on driver_applications(status);
create index if not exists idx_driver_apps_created on driver_applications(created_at desc);
create index if not exists idx_driver_apps_email   on driver_applications(email);
