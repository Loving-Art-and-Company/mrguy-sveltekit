create table if not exists crm_campaign_sends (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id),
  created_by_user_id uuid references users(id) on delete set null,
  segment_id text not null,
  segment_name text not null,
  template_id text not null,
  template_name text not null,
  requested_recipient_count integer not null,
  suppressed_recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  status text not null default 'sending',
  failed_recipients jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_crm_campaign_sends_brand_id on crm_campaign_sends(brand_id);
create index if not exists idx_crm_campaign_sends_created_at on crm_campaign_sends(created_at);

create table if not exists crm_email_unsubscribes (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id),
  email text not null,
  source text not null,
  reason text,
  campaign_send_id uuid references crm_campaign_sends(id) on delete set null,
  created_by_user_id uuid references users(id) on delete set null,
  unsubscribed_at timestamptz not null default now()
);

create index if not exists idx_crm_email_unsubscribes_brand_id on crm_email_unsubscribes(brand_id);
create index if not exists idx_crm_email_unsubscribes_unsubscribed_at on crm_email_unsubscribes(unsubscribed_at);
create unique index if not exists uidx_crm_email_unsubscribes_brand_email on crm_email_unsubscribes(brand_id, email);
