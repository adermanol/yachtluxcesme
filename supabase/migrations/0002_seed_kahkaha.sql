-- ============================================================================
-- Seed: Kahkaha — bilinen tek veri kümesi.
-- ⚠️ Teknik bilgiler (uzunluk, kabin sayısı, yıl, kapasite) henüz doğrulanmadı
-- (CLAUDE (1).md Bölüm 16, madde 2). NULL bırakıldı — admin panelinden girilecek.
-- Fotoğraflardan doğrulanan tek özellik: 'jakuzi' (foredeck'te gerçek jakuzi var).
-- ============================================================================

insert into yachts (slug, isim, aciklama_tr, aciklama_en, kapasite, uzunluk_m, kabin_sayisi, yil, ozellikler, one_cikan, sira, aktif)
values (
  'kahkaha',
  'Kahkaha',
  null, -- TODO: TR açıklama
  null, -- TODO: EN açıklama
  null, -- TODO: kapasite doğrulanmadı
  null, -- TODO: uzunluk doğrulanmadı
  3,    -- fotoğraflarda 3 farklı kamara görülüyor (2 kişilik+1 kişilik / iki tek kişilik / baklava pencereli) — doğrulama gerekir
  null, -- TODO: yıl doğrulanmadı
  array['jakuzi'],
  true,
  1,
  true
);

-- yacht_media — assets/images/media.json ile birebir eşleşir
insert into yacht_media (yacht_id, tip, url, kategori, alt_text_tr, alt_text_en, sira)
select id, 'foto', '/assets/images/kahkaha-disgorunus-01-800.webp', 'detay',
  'Kahkaha teknesi, Çeşme koyunda demirli, güneşli bir günde',
  'Kahkaha yacht anchored in a Çeşme bay on a sunny day', 1
from yachts where slug = 'kahkaha';

insert into yacht_media (yacht_id, tip, url, kategori, alt_text_tr, alt_text_en, sira)
select id, 'foto', '/assets/images/kahkaha-jakuzi-01-800.webp', 'jakuzi',
  'Kahkaha''nın ön güvertesindeki jakuzi ve oturma alanı',
  'The hot tub and lounge area on Kahkaha''s foredeck', 2
from yachts where slug = 'kahkaha';

insert into yacht_media (yacht_id, tip, url, kategori, alt_text_tr, alt_text_en, sira)
select id, 'foto', '/assets/images/kahkaha-salon-01-800.webp', 'ic_mekan',
  'Kahkaha''nın iç mekan salonu, oturma grubu ve yemek masası',
  'Kahkaha''s interior salon with lounge seating and dining table', 3
from yachts where slug = 'kahkaha';

insert into yacht_media (yacht_id, tip, url, kategori, alt_text_tr, alt_text_en, sira)
select id, 'foto', '/assets/images/kahkaha-kamara-01-800.webp', 'ic_mekan',
  'Çift ve tek kişilik yataklı kamara',
  'Cabin with a double bed and a single bed', 4
from yachts where slug = 'kahkaha';

insert into yacht_media (yacht_id, tip, url, kategori, alt_text_tr, alt_text_en, sira)
select id, 'foto', '/assets/images/kahkaha-mutfak-01-800.webp', 'ic_mekan',
  'Kahkaha''nın mutfağı, ankastre ocak ve fırın',
  'Kahkaha''s galley with built-in hob and oven', 5
from yachts where slug = 'kahkaha';

insert into yacht_media (yacht_id, tip, url, kategori, alt_text_tr, alt_text_en, sira)
select id, 'foto', '/assets/images/kahkaha-kamara-02-800.webp', 'ic_mekan',
  'İki tek kişilik yataklı kamara',
  'Cabin with two single beds', 6
from yachts where slug = 'kahkaha';

insert into yacht_media (yacht_id, tip, url, kategori, alt_text_tr, alt_text_en, sira)
select id, 'foto', '/assets/images/kahkaha-kamara-03-800.webp', 'ic_mekan',
  'Baklava desenli pencereli kamara, akşam ışığında',
  'Cabin with a diamond-shaped window in evening light', 7
from yachts where slug = 'kahkaha';

-- pricing: TODO — fiyat listesi henüz paylaşılmadı (Bölüm 16, madde 3). Satır eklenmedi.
