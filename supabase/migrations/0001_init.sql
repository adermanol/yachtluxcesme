-- ============================================================================
-- YachtLux Çeşme — İlk şema (Bölüm 5, CLAUDE (1).md)
-- Supabase SQL Editor'da tek seferde çalıştırılır.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tekneler
-- ---------------------------------------------------------------------------
create table yachts (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  isim          text not null,
  aciklama_tr   text,
  aciklama_en   text,
  kapasite      int,
  uzunluk_m     numeric,
  kabin_sayisi  int,
  yil           int,
  ozellikler    text[] default '{}',
  one_cikan     boolean not null default false,
  sira          int not null default 0,
  aktif         boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Görsel / video
-- ---------------------------------------------------------------------------
create table yacht_media (
  id           uuid primary key default gen_random_uuid(),
  yacht_id     uuid not null references yachts(id) on delete cascade,
  tip          text not null check (tip in ('foto', 'video')),
  url          text not null,
  poster_url   text,
  kategori     text check (kategori in ('hero','jakuzi','guverte','ic_mekan','gece','detay')),
  alt_text_tr  text,
  alt_text_en  text,
  sira         int not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Fiyat
-- ---------------------------------------------------------------------------
create table pricing (
  id          uuid primary key default gen_random_uuid(),
  yacht_id    uuid not null references yachts(id) on delete cascade,
  sezon       text not null check (sezon in ('yuksek','dusuk')),
  gun_tipi    text not null check (gun_tipi in ('hafta_ici','hafta_sonu')),
  birim       text not null check (birim in ('saatlik','gunluk')),
  fiyat_try   numeric not null,
  fiyat_eur   numeric not null,
  min_sure    int,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Talepler (lead)
-- ---------------------------------------------------------------------------
create table leads (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  isim               text not null,
  telefon            text not null,
  yacht_id           uuid references yachts(id),
  istenen_tarih      date,
  kisi_sayisi        int,
  organizasyon_tipi  text check (organizasyon_tipi in ('aile','cift','arkadas','ozel_etkinlik')),
  dil                text check (dil in ('tr','en')),
  utm_source         text,
  utm_campaign       text,
  whatsapp_acildi    boolean not null default false,
  durum              text not null default 'yeni' check (durum in ('yeni','gorusuldu','rezerve','iptal')),
  not_               text
);

-- ---------------------------------------------------------------------------
-- Ayarlar (key-value)
-- ---------------------------------------------------------------------------
create table settings (
  key    text primary key,
  value  text
);

-- Başlangıç anahtarları — değerler admin panelinden girilecek (TODO)
insert into settings (key, value) values
  ('whatsapp_no', ''),
  ('telefon', ''),
  ('email', ''),
  ('instagram', ''),
  ('iban', ''),
  ('ga4_id', ''),
  ('ads_conversion_id', '');

-- ---------------------------------------------------------------------------
-- İndeksler
-- ---------------------------------------------------------------------------
create index yacht_media_yacht_id_idx on yacht_media(yacht_id);
create index pricing_yacht_id_idx on pricing(yacht_id);
create index leads_created_at_idx on leads(created_at desc);
create index leads_durum_idx on leads(durum);
create index yachts_aktif_idx on yachts(aktif) where aktif = true;

-- ============================================================================
-- Row Level Security
-- Herkes: sadece aktif teknelerin genel verisini okuyabilir, lead oluşturabilir.
-- Sadece giriş yapmış admin: tam CRUD.
-- ============================================================================

alter table yachts enable row level security;
alter table yacht_media enable row level security;
alter table pricing enable row level security;
alter table leads enable row level security;
alter table settings enable row level security;

-- yachts: herkes aktif olanları okuyabilir
create policy "public read active yachts" on yachts
  for select using (aktif = true);
create policy "admin full access yachts" on yachts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- yacht_media: herkes aktif teknenin medyasını okuyabilir
create policy "public read media of active yachts" on yacht_media
  for select using (
    exists (select 1 from yachts y where y.id = yacht_media.yacht_id and y.aktif = true)
  );
create policy "admin full access media" on yacht_media
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- pricing: herkes aktif teknenin fiyatını okuyabilir
create policy "public read pricing of active yachts" on pricing
  for select using (
    exists (select 1 from yachts y where y.id = pricing.yacht_id and y.aktif = true)
  );
create policy "admin full access pricing" on pricing
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- leads: herkes YENİ lead oluşturabilir (INSERT), ama okuyamaz/değiştiremez.
-- Sadece admin okur/günceller.
create policy "public insert leads" on leads
  for insert with check (true);
create policy "admin full access leads" on leads
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- settings: herkes okuyabilir (whatsapp no, iban vb. sitede gösterilecek), sadece admin yazar
create policy "public read settings" on settings
  for select using (true);
create policy "admin write settings" on settings
  for insert with check (auth.role() = 'authenticated');
create policy "admin update settings" on settings
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin delete settings" on settings
  for delete using (auth.role() = 'authenticated');

-- ============================================================================
-- Storage: medya yükleme için bucket (Netlify Function ile service_role kullanılır)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('yacht-media', 'yacht-media', true)
on conflict (id) do nothing;

create policy "public read yacht-media bucket" on storage.objects
  for select using (bucket_id = 'yacht-media');
create policy "admin write yacht-media bucket" on storage.objects
  for insert with check (bucket_id = 'yacht-media' and auth.role() = 'authenticated');
create policy "admin update yacht-media bucket" on storage.objects
  for update using (bucket_id = 'yacht-media' and auth.role() = 'authenticated');
create policy "admin delete yacht-media bucket" on storage.objects
  for delete using (bucket_id = 'yacht-media' and auth.role() = 'authenticated');
