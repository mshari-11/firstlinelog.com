-- ============================================================
-- FLL Driver Wallet & Double-Entry Ledger System
-- Migration: 002_driver_wallet_ledger.sql
--
-- Architecture inspired by Stripe's ledger design:
-- Every money movement creates immutable double-entry records.
-- This ensures every SAR is accounted for and auditable.
-- ============================================================

-- ============================================================
-- 1. LEDGER ACCOUNTS
--    Represents the "buckets" money moves between.
-- ============================================================
create table if not exists ledger_accounts (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,          -- e.g. 'driver:uuid', 'company_revenue', 'platform:jahez'
  account_type text not null check (account_type in ('asset', 'liability', 'revenue', 'expense')),
  label        text not null,
  driver_id    uuid references couriers(id) on delete set null,  -- null for system accounts
  created_at   timestamptz not null default now()
);

-- System accounts (insert once)
insert into ledger_accounts (code, account_type, label) values
  ('platform_receivable', 'asset',     'مستحقات من المنصات'),
  ('company_revenue',     'revenue',   'إيرادات الشركة'),
  ('bonus_pool',          'liability', 'حوافز غير موزعة'),
  ('penalty_pool',        'asset',     'خصومات محصلة'),
  ('vehicle_cost',        'expense',   'تكاليف المركبات'),
  ('payout_clearing',     'asset',     'تسوية الدفعات')
on conflict (code) do nothing;

-- ============================================================
-- 2. DRIVER WALLETS
--    One wallet per driver. Holds current balance.
-- ============================================================
create table if not exists driver_wallets (
  id               uuid primary key default gen_random_uuid(),
  driver_id        uuid not null unique references couriers(id) on delete cascade,
  balance          numeric(12, 2) not null default 0.00 check (balance >= 0),
  pending_balance  numeric(12, 2) not null default 0.00 check (pending_balance >= 0),
  total_earned     numeric(12, 2) not null default 0.00,
  total_paid_out   numeric(12, 2) not null default 0.00,
  last_payout_at   timestamptz,
  is_frozen        boolean not null default false,
  freeze_reason    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- 3. LEDGER ENTRIES (immutable double-entry records)
--    Each financial event = two rows (debit + credit).
--    Sum of all amounts per transaction must = 0.
-- ============================================================
create table if not exists ledger_entries (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null,              -- groups the debit/credit pair
  account_id     uuid not null references ledger_accounts(id),
  amount         numeric(12, 2) not null,    -- positive = debit, negative = credit
  entry_type     text not null check (entry_type in ('debit', 'credit')),
  description    text,
  reference_type text,                        -- 'order', 'payout', 'bonus', 'penalty', 'adjustment'
  reference_id   text,
  created_at     timestamptz not null default now()
);

-- Prevent any modification of ledger entries (immutability)
create or replace rule ledger_no_update as on update to ledger_entries do instead nothing;
create or replace rule ledger_no_delete as on delete to ledger_entries do instead nothing;

-- ============================================================
-- 4. WALLET TRANSACTIONS
--    Human-readable log of what happened to a driver wallet.
-- ============================================================
create table if not exists wallet_transactions (
  id             uuid primary key default gen_random_uuid(),
  driver_id      uuid not null references couriers(id) on delete cascade,
  wallet_id      uuid not null references driver_wallets(id),
  transaction_id uuid not null,               -- matches ledger_entries.transaction_id
  event_type     text not null check (event_type in (
                   'order_payment', 'bonus', 'penalty',
                   'vehicle_cost', 'adjustment', 'payout',
                   'freeze', 'unfreeze'
                 )),
  amount         numeric(12, 2) not null,      -- positive = credit to driver, negative = debit
  balance_before numeric(12, 2) not null,
  balance_after  numeric(12, 2) not null,
  description    text,
  reference_type text,
  reference_id   text,
  created_by     uuid,                         -- staff user who triggered this
  created_at     timestamptz not null default now()
);

-- ============================================================
-- 5. PAYOUT BATCHES
--    Groups many driver payouts into one bank transfer batch.
-- ============================================================
create table if not exists payout_batches (
  id              uuid primary key default gen_random_uuid(),
  batch_ref       text not null unique,        -- e.g. 'PAY-2025-003-W12'
  status          text not null default 'draft' check (status in ('draft', 'pending', 'processing', 'completed', 'failed')),
  total_amount    numeric(12, 2) not null default 0.00,
  driver_count    integer not null default 0,
  period_start    date not null,
  period_end      date not null,
  notes           text,
  created_by      uuid,
  approved_by     uuid,
  approved_at     timestamptz,
  processed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- 6. PAYOUT ITEMS
--    Individual driver payout within a batch.
-- ============================================================
create table if not exists payout_items (
  id               uuid primary key default gen_random_uuid(),
  batch_id         uuid not null references payout_batches(id) on delete cascade,
  driver_id        uuid not null references couriers(id),
  wallet_id        uuid not null references driver_wallets(id),
  transaction_id   uuid,                       -- ledger transaction created on execution
  gross_amount     numeric(12, 2) not null,
  deductions       numeric(12, 2) not null default 0.00,
  net_amount       numeric(12, 2) not null,
  bank_account     text,
  status           text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'skipped')),
  failure_reason   text,
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- 7. INDEXES for performance
-- ============================================================
create index if not exists idx_ledger_entries_transaction   on ledger_entries(transaction_id);
create index if not exists idx_ledger_entries_account       on ledger_entries(account_id);
create index if not exists idx_ledger_entries_created       on ledger_entries(created_at desc);
create index if not exists idx_wallet_txn_driver            on wallet_transactions(driver_id);
create index if not exists idx_wallet_txn_created           on wallet_transactions(created_at desc);
create index if not exists idx_payout_items_batch           on payout_items(batch_id);
create index if not exists idx_payout_items_driver          on payout_items(driver_id);

-- ============================================================
-- 8. HELPER FUNCTION — record a double-entry event
--    Usage: select record_wallet_event(
--             p_driver_id, p_event_type, p_amount,
--             p_description, p_reference_type, p_reference_id
--           )
-- ============================================================
create or replace function record_wallet_event(
  p_driver_id      uuid,
  p_event_type     text,
  p_amount         numeric,        -- positive credits the driver, negative debits
  p_description    text default null,
  p_reference_type text default null,
  p_reference_id   text default null,
  p_created_by     uuid default null
) returns uuid language plpgsql as $$
declare
  v_wallet          driver_wallets;
  v_driver_account  ledger_accounts;
  v_contra_code     text;
  v_contra_account  ledger_accounts;
  v_txn_id          uuid := gen_random_uuid();
  v_new_balance     numeric;
begin
  -- Get wallet
  select * into v_wallet from driver_wallets where driver_id = p_driver_id for update;
  if not found then
    raise exception 'Wallet not found for driver %', p_driver_id;
  end if;

  -- Get or create driver ledger account
  select * into v_driver_account
    from ledger_accounts where code = 'driver:' || p_driver_id::text;
  if not found then
    insert into ledger_accounts (code, account_type, label, driver_id)
      values ('driver:' || p_driver_id::text, 'liability', 'محفظة السائق', p_driver_id)
      returning * into v_driver_account;
  end if;

  -- Determine contra account by event type
  v_contra_code := case p_event_type
    when 'order_payment' then 'platform_receivable'
    when 'bonus'         then 'bonus_pool'
    when 'penalty'       then 'penalty_pool'
    when 'vehicle_cost'  then 'vehicle_cost'
    when 'adjustment'    then 'company_revenue'
    when 'payout'        then 'payout_clearing'
    else 'company_revenue'
  end;

  select * into v_contra_account from ledger_accounts where code = v_contra_code;

  -- Calculate new balance
  v_new_balance := v_wallet.balance + p_amount;
  if v_new_balance < 0 and p_event_type = 'payout' then
    raise exception 'Insufficient wallet balance for payout';
  end if;

  -- Insert double-entry ledger records
  insert into ledger_entries (transaction_id, account_id, amount, entry_type, description, reference_type, reference_id)
  values
    (v_txn_id, v_driver_account.id,  p_amount,  case when p_amount >= 0 then 'credit' else 'debit' end, p_description, p_reference_type, p_reference_id),
    (v_txn_id, v_contra_account.id, -p_amount,  case when p_amount >= 0 then 'debit' else 'credit' end, p_description, p_reference_type, p_reference_id);

  -- Insert human-readable wallet transaction
  insert into wallet_transactions (
    driver_id, wallet_id, transaction_id, event_type,
    amount, balance_before, balance_after,
    description, reference_type, reference_id, created_by
  ) values (
    p_driver_id, v_wallet.id, v_txn_id, p_event_type,
    p_amount, v_wallet.balance, v_new_balance,
    p_description, p_reference_type, p_reference_id, p_created_by
  );

  -- Update wallet balance
  update driver_wallets set
    balance      = v_new_balance,
    total_earned = case when p_amount > 0 then total_earned + p_amount else total_earned end,
    total_paid_out = case when p_event_type = 'payout' then total_paid_out + abs(p_amount) else total_paid_out end,
    updated_at   = now()
  where id = v_wallet.id;

  return v_txn_id;
end;
$$;

-- ============================================================
-- 9. TRIGGER — auto-create wallet when courier is inserted
-- ============================================================
create or replace function create_driver_wallet_on_insert()
returns trigger language plpgsql as $$
begin
  insert into driver_wallets (driver_id) values (new.id)
  on conflict (driver_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_create_driver_wallet on couriers;
create trigger trg_create_driver_wallet
  after insert on couriers
  for each row execute function create_driver_wallet_on_insert();

-- Backfill wallets for existing couriers
insert into driver_wallets (driver_id)
  select id from couriers
  where id not in (select driver_id from driver_wallets)
on conflict do nothing;
