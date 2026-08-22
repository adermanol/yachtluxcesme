# YachtLux Çeşme — Proje Bağlamı

> Bu dosya projenin tek referans kaynağıdır. Kod yazmadan önce tamamını oku.
> Bir karar bu dosyayla çelişiyorsa, bu dosya kazanır. Emin olamadığın yerde
> tahmin yürütme, sor.

---

## 1. Proje Nedir

Çeşme'de lüks tekne kiralama işi için **tek sayfalık, yüksek dönüşümlü bir landing
page + admin paneli**.

**Birincil iş hedefi:** Google Ads ile gelen ziyaretçiyi WhatsApp üzerinden bir
rezervasyon talebine dönüştürmek. Site bir katalog değil, bir **dönüşüm aracı**.

**İlk ve şu an tek tekne:** `Kahkaha`. Ama sistem baştan çok tekneli kurulacak —
ikinci tekne eklendiğinde kod değişikliği gerekmemeli, sadece admin panelinden
veri girilmeli.

**Ayırt edici özellik:** Kahkaha'nın güvertesinde **jakuzi** var. Bu hem duygusal
hem SEM açısından projenin merkezinde (bkz. Bölüm 8).

**Hedef kitle:** Türk ve yabancı turist, eşit ağırlıkta. Site iki dilli (TR/EN).

---

## 2. Bu Proje Neyi Yanlış Yapmamalı

Bunlar önceki bir projeden çıkarılmış derslerdir. Tekrarlanmamalı:

| ❌ Yapma | ✅ Yap |
|---|---|
| Veriyi `localStorage`'da tutma | Baştan gerçek bir depo (Netlify Blobs) kullan. Hiçbir aşamada localStorage'ı kalıcı veri deposu olarak kullanma. |
| Admin panelini korumasız bırakma | İlk commit'ten itibaren auth gate olsun. `admin.html`'i asla açık deploy etme. |
| Placeholder'ları koda gömme | Tüm dinamik değerler (WhatsApp no, GA4 ID, IBAN) `settings` tablosundan gelsin. |
| i18n'i sonraya bırakma | İki dil baştan kurulacak. Sonradan eklemek 3 kat iş. |
| Ağır animasyonla LCP'yi öldürme | Performans bütçesi (Bölüm 7) pazarlık konusu değil. |

---

## 3. Teknik Stack

```
Frontend   : Vanilla HTML / CSS / JS (framework yok)
Hosting    : Netlify (ücretsiz Starter — ticari kullanıma açık)
Backend    : Netlify Functions (serverless)
Veritabanı : Netlify Blobs (key-value, Netlify'a dahil — ek hesap/servis yok)
Auth       : Kendi yazılmış tek-şifre + imzalı oturum token'ı (Bölüm 12) — 3. parti Auth servisi yok
Domain     : yachtluxcesme.com  ⚠️ müsaitlik henüz doğrulanmadı
SSL        : Netlify otomatik
```

**Neden framework yok:** Sayfa tek. Framework'ün getireceği bundle maliyeti,
performans bütçesine (Bölüm 7) doğrudan zarar verir. Vanilla JS + modern CSS
yeterli.

**Neden Netlify (Vercel değil):** Vercel'in ücretsiz planı ticari kullanıma
kapalıdır. Bu ticari bir sitedir.

**Neden Supabase değil, Netlify Blobs:** Proje kararı olarak tamamen ücretsiz
ve tek sağlayıcı (Netlify) içinde kalınması istendi. Bunun bedeli: Postgres'in
ilişkisel sorgu/join gücü yok — veri, tekne başına gömülü `media[]`/`pricing[]`
dizileriyle tek bir JSON belgesi gibi tutuluyor (bkz. Bölüm 5). Az sayıda tekne
için yeterli; çok sayıda tekne/karmaşık filtreleme gerekirse yeniden
değerlendirilmeli.

---

## 4. Klasör Yapısı

```
/
├── index.html              TR landing (kök)
├── en/index.html           EN landing
├── admin/index.html        Admin paneli (auth korumalı)
├── 404.html
├── robots.txt
├── sitemap.xml
├── netlify.toml
├── css/
│   ├── tokens.css          Design token'ları — TEK kaynak
│   ├── base.css            Reset, tipografi, layout primitives
│   ├── sections.css        Bölüm bazlı stiller
│   └── admin.css
├── js/
│   ├── api.js              Tüm veri erişimi buradan. Başka yerden fetch YOK.
│   ├── i18n.js             Dil yönetimi
│   ├── motion.js           Scroll/animasyon motoru
│   ├── whatsapp.js         Lead akışı (Bölüm 6)
│   ├── analytics.js        GA4 + Ads conversion
│   └── admin/
├── netlify/functions/
│   ├── _store.js        Netlify Blobs okuma/yazma yardımcıları
│   ├── _auth.js          Oturum token üretme/doğrulama
│   ├── auth.js            Admin girişi (şifre → token)
│   ├── yachts.js
│   ├── leads.js
│   ├── settings.js
│   ├── upload.js          Admin medya yükleme (Blobs'a binary yazar)
│   ├── media.js           Yüklenen medyayı sunar (/api/media/:id)
│   └── seed.js            Kahkaha başlangıç verisini Blobs'a yazar (tek seferlik)
└── assets/
    ├── images/             WebP + JPG fallback
    ├── video/
    └── fonts/
```

**Kural:** `api.js` tek veri erişim katmanıdır. Hiçbir sayfa doğrudan Supabase'e
veya bir endpoint'e istek atmaz. Bu, ileride backend değişirse tek dosya
değiştirmeyi sağlar.

---

## 5. Veri Modeli

⚠️ Aşağıdaki şema **kavramsal**dır — gerçek depolama Netlify Blobs'ta (Postgres
değil) key-value/JSON belge olarak tutulur (Bölüm 3). `yacht_media` ve
`pricing`, ayrı tablo değil, ilgili `yachts` kaydının içinde gömülü
`media[]`/`pricing[]` dizileridir. `leads` ve `settings` kendi Blobs
anahtarlarında (`leads`, `settings`) tek bir JSON dizi/nesne olarak durur.

```sql
-- Tekneler
yachts (
  id            uuid pk,
  slug          text unique,        -- 'kahkaha'
  isim          text,
  aciklama_tr   text,
  aciklama_en   text,
  kapasite      int,                -- kişi
  uzunluk_m     numeric,
  kabin_sayisi  int,
  yil           int,
  ozellikler    text[],             -- ['jakuzi','flybridge','ses_sistemi']
  one_cikan     boolean default false,
  sira          int,
  aktif         boolean default true
)

-- Görsel / video
yacht_media (
  id           uuid pk,
  yacht_id     uuid fk,
  tip          text,                -- 'foto' | 'video'
  url          text,
  poster_url   text,                -- video için
  kategori     text,                -- 'hero'|'jakuzi'|'guverte'|'ic_mekan'|'gece'|'detay'
  alt_text_tr  text,
  alt_text_en  text,
  sira         int
)

-- Fiyat
pricing (
  id          uuid pk,
  yacht_id    uuid fk,
  sezon       text,                 -- 'yuksek'|'dusuk'
  gun_tipi    text,                 -- 'hafta_ici'|'hafta_sonu'
  birim       text,                 -- 'saatlik'|'gunluk'
  fiyat_try   numeric,
  fiyat_eur   numeric,
  min_sure    int
)

-- Talepler
leads (
  id                 uuid pk,
  created_at         timestamptz default now(),
  isim               text,
  telefon            text,
  yacht_id           uuid fk,
  istenen_tarih      date,
  kisi_sayisi        int,
  organizasyon_tipi  text,          -- 'aile'|'cift'|'arkadas'|'ozel_etkinlik'
  dil                text,          -- 'tr'|'en'
  utm_source         text,
  utm_campaign       text,
  whatsapp_acildi    boolean,
  durum              text,          -- 'yeni'|'gorusuldu'|'rezerve'|'iptal'
  not                text
)

-- Ayarlar (key-value)
settings (
  key    text pk,                   -- 'whatsapp_no','ga4_id','ads_conversion_id',
  value  text                       -- 'iban','telefon','instagram','email'
)
```

⚠️ `organizasyon_tipi` ve `utm_*` alanları kritik: hangi reklam kampanyasının
**kârlı** müşteri getirdiğini ölçmek için gerekli. Sadece lead sayısı yanıltıcıdır.

---

## 6. WhatsApp Lead Akışı — Sıralama Önemli

Kullanıcı "Rezervasyon Talebi" butonuna bastığında, **tam olarak bu sırayla**:

```
1. Mini form açılır (modal)
   Alanlar: tarih • kişi sayısı • organizasyon tipi • isim • telefon
   ⚠️ 5 alandan fazlası dönüşümü düşürür. Alan ekleme.

2. Lead Supabase'e YAZILIR
   → WhatsApp'a hiç gitmese bile lead kaybolmaz

3. Google Ads conversion event TETİKLENİR
   → Bu adım atlanırsa reklam performansı ölçülemez

4. wa.me deep link ile yönlendirilir
```

**Ön-doldurulmuş mesaj (dil bazlı):**

```
TR: "Merhaba, Kahkaha teknesi için 14 Ağustos'ta 8 kişilik günlük
     kiralama hakkında bilgi almak istiyorum."

EN: "Hello, I'd like information about a full-day charter on Kahkaha
     for 8 people on August 14th."
```

Mesaj `settings.whatsapp_no` + form verisinden runtime'da üretilir. Hard-code edilmez.

Sayfada ayrıca sabit bir floating WhatsApp butonu bulunur — o, formu atlayıp
doğrudan genel mesajla açar.

---

## 7. Performans Bütçesi (Pazarlık Konusu Değil)

Site reklam bütçeli. Yavaş sayfa = düşük Quality Score = daha pahalı tıklama.

| Metrik | Hedef |
|---|---|
| LCP | < 2.5s (4G mobil) |
| CLS | < 0.1 |
| INP | < 200ms |
| Lighthouse Performance | ≥ 90 mobil |
| Toplam sayfa ağırlığı (ilk ekran) | < 1.2 MB |

**Uygulama kuralları:**
- Hero'da otomatik oynayan ağır video **yok**. Poster görsel + lazy-load video.
- Tüm görseller WebP, `<picture>` ile JPG fallback, `loading="lazy"` (hero hariç).
- Hero görseli `fetchpriority="high"` + preload.
- Animasyonlar sadece `transform` ve `opacity` (GPU). `top/left/width` animasyonu yok.
- Canvas efektleri: `prefers-reduced-motion` ve düşük FPS tespitinde kapanır.
- Font: `font-display: swap`, sadece kullanılan ağırlıklar, self-hosted (Google Fonts CDN değil).

---

## 8. Konumlandırma: Jakuzi

Kahkaha'nın güvertesinde jakuzi var. Bu, projenin ayırt edici özelliği.

**Katmanlı strateji:**

- **Site üzerinde:** Jakuzi *sessizce* var. "BAK JAKUZİ VAR" demeyen, ama görenin
  aklına kazınan bir kare. Lüks kitle bunu "iyi zevk" olarak okur. Aegean Nights'ın
  gece bölümü jakuzi için doğal sahnedir: karanlık lacivert, teknede yanan ışıklar,
  buhar, su yüzeyinde ışık kırılması.

- **Reklam tarafında:** Ayrı kampanya, ayrı görsel, ayrı dil. `denizde jakuzili tekne`,
  `jakuzili tekne kiralama çeşme` gibi düşük rekabetli terimler. Bu kitle spesifik
  olarak bunu arıyor; onlara doğrudan konuşulur.

Aynı site, farklı giriş kapısı. `?utm_campaign=jakuzi` ile gelen ziyaretçide
jakuzi bölümü daha yukarı taşınabilir (v2 özelliği, ilk sürümde şart değil).

**⚠️ Görsel politikası:** Vücut/mayo odaklı görseller Google Ads ve özellikle Meta'da
"yetişkin içerik" bayrağı yiyip reklam reddine yol açabilir. Görseller **nesne, ışık
ve doku odaklı** olmalı; insan varsa yüzsüz silüet/kısmi kadraj. "Sexy" hissi ışıkla
verilir, tenle değil.

---

## 9. Tasarım Yönü: "Aegean Nights"

**Konsept:** Sayfa bir günün hikâyesidir. Kullanıcı scroll ettikçe gündüzden geceye
geçilir. Üstte Ege'nin parlak öğle ışığı, altta teknede yanan ışıklar ve jakuzi buharı.

Üç şehrin sentezi: **LA'in yapısal disiplini** (sert grid, editoryal fotoğraf, hız)
+ **Ibiza'nın duygusal akışı** (gündüz→gece geçişi) + **Miami'nin aksanı** (krom
tipografi, ince film grain, tek neon renk).

⚠️ 80's Miami estetiği **tema değil, aksan katmanıdır**. Tam Vice temaya gidilirse
yüksek bütçeli rezervasyonda güven algısı düşer. Neon aksan rengi sayfada **2-3 yerden
fazla görünmemeli.** Bu disiplin, konseptin çalışıp çalışmamasını belirleyen tek şeydir.

### Renk Token'ları

```css
:root {
  --gece-lacivert:  #071620;  /* gece bölümü zemini */
  --derin-ege:      #0E3346;  /* gündüz zemini */
  --deniz-teal:     #1B6B7A;  /* ara ton, gradient köprüsü */
  --gun-batimi:     #E8944A;  /* geçiş anı, sıcak glow */
  --keten:          #E8DFD2;  /* gövde metni, kart zemini */
  --sicak-beyaz:    #FAF7F2;  /* başlıklar */
  --neon-mercan:    #FF5E6C;  /* TEK aksan — sadece CTA + hover */
}
```

Krom gradient (başlık metal efekti): `#E8DFD2 → #9FB3BF → #5D8494`

⚠️ Palet, gerçek fotoğraflar geldiğinde kalibre edilecek. Token dosyası tek kaynak
olduğu için değişiklik tek yerden yapılır.

### Tipografi

| Rol | Font | Kullanım |
|---|---|---|
| Display | Bodoni Moda | Başlıklar. Yüksek kontrast, editoryal. |
| Gövde | DM Sans | Paragraf, form, UI. |
| Etiket | Geniş grotesk, uppercase, `letter-spacing: 0.2em` | 80's aksan. Sadece küçük etiketlerde: `KAHKAHA · ÇEŞME · 2026` |

⚠️ **Türkçe karakter testi zorunlu.** Seçilen her font `ş ğ ı İ ç ö ü` render
etmeli. Popüler 80's display fontlarının çoğunda Türkçe desteği eksiktir — font
eklemeden önce test et.

### Hareket Kademeleri

| Kademe | İçerik | Nerede |
|---|---|---|
| Zorunlu | Gündüz→gece gradient geçişi, fade-in reveal | Her cihaz |
| Zengin | Su parıltısı (canvas), teknede ışık yanması, krom parlama, film grain | Masaüstü + güçlü mobil |
| Kapalı | Hepsi | `prefers-reduced-motion`, düşük FPS |

### İmza Öğesi

**Scroll'a bağlı gündüz→gece geçişi ve gece bölümünde jakuzi buharı.**
Sayfanın hatırlanacağı tek şey budur. Etrafındaki her şey sakin ve disiplinli kalır.
Başka "wow" öğesi eklenmez.

---

## 10. Sayfa Yapısı

```
┌────────────────────────────────────────┐
│ HERO           — gündüz, tam ekran     │  Tekne + Ege. Tek CTA.
│                  Kahkaha geniş açı     │  Poster görsel, video lazy.
├────────────────────────────────────────┤
│ TEKNE          — öğleden sonra         │  Özellikler, teknik bilgi.
│                  detay + iç mekân      │  Güven kurar.
├────────────────────────────────────────┤
│ JAKUZİ         — gün batımı            │  Geçişin başladığı yer.
│                  altın saat            │  Sessiz vurgu.
├────────────────────────────────────────┤
│ GALERİ         — akşam                 │  Lightbox. 15sn video burada.
├────────────────────────────────────────┤
│ GECE           — tam gece              │  İmza sahne. Işıklar, buhar.
│                  jakuzi + ışıklar      │  Duygusal zirve.
├────────────────────────────────────────┤
│ FİYAT & TALEP  — gece                  │  Şeffaf fiyat + form CTA.
├────────────────────────────────────────┤
│ FOOTER         — gece                  │  İletişim, KVKK, sosyal.
└────────────────────────────────────────┘
```

Floating WhatsApp butonu tüm scroll boyunca sabit.

---

## 11. İki Dil (i18n)

- URL: `yachtluxcesme.com/` (TR) ve `yachtluxcesme.com/en/` (EN)
- Query param (`?lang=en`) **kullanılmaz** — SEO'da zayıf, Ads takibi zor
- `hreflang` etiketleri karşılıklı tanımlanır
- Metinler `js/i18n.js` içindeki JSON'dan gelir; DB metinleri çift alanlı (`_tr`/`_en`)
- WhatsApp mesajı, form etiketleri, hata mesajları dile göre değişir
- Para birimi: TR → TRY, EN → EUR (`pricing` tablosunda ikisi de var)
- Admin panelinde her metin alanının yanında TR/EN sekmesi

---

## 12. Admin Paneli

Tek kullanıcı, mobil uyumlu (tekne sahibi telefondan girecek).

**Yapabilmeli:**
- Tekne ekle / düzenle / pasifleştir
- Fotoğraf yükle, sürükle-bırak sırala, kategori ata, alt-text yaz (TR+EN)
- Video yükle + poster belirle
- Fiyat güncelle (sezon × gün tipi × birim matrisi)
- Öne çıkan tekneyi değiştir
- Lead listesi: filtrele, durum değiştir, not ekle, WhatsApp'tan aç
- Ayarlar: WhatsApp no, telefon, e-posta, sosyal, GA4 ID, IBAN

**Güvenlik:**
- Tek şifre (`ADMIN_PASSWORD` ortam değişkeni) + imzalı, 12 saatlik oturum
  token'ı (`netlify/functions/_auth.js`, HMAC-SHA256, `SESSION_SECRET`
  ortam değişkeniyle imzalanır). 3. parti Auth servisi yok. Session yoksa
  içerik render edilmez.
- `robots.txt` içinde `Disallow: /admin`
- `netlify.toml`'da `/admin/*` için `X-Robots-Tag: noindex, nofollow` header'ı

---

## 13. Analytics & Ads

- GA4 + Google Ads conversion tracking (`analytics.js`)
- Conversion event'i: form gönderildiğinde, **wa.me yönlendirmesinden önce**
- UTM parametreleri `leads` tablosuna yazılır
- Google Search Console doğrulaması
- Ayrı kampanyalar: TR / EN / jakuzi — tek kampanyada karıştırılmaz

**Ads uyumluluğu için sayfada bulunması zorunlu:**
- Net iletişim bilgisi (telefon + e-posta + adres)
- Fiyat şeffaflığı (en azından "başlangıç fiyatı")
- KVKK aydınlatma metni + form onay kutusu
- Kiralama koşulları / iptal politikası

---

## 14. Copy Tonu

- **TR:** Sen-siz dengesi profesyonel ama sıcak. Abartılı sıfat yok. "Eşsiz bir
  deneyim" gibi jenerik ifadeler kullanma. Somut ol: "8 kişi, 6 saat, gün batımı."
- **EN:** Sade, doğal İngilizce. Çeviri kokmamalı. Yer adları açıklanmalı
  (Çeşme'yi bilmeyen okuyucu var).
- Butonlar ne yaptığını söyler: "Tarih Sor" / "Check Availability" — "Gönder" değil.
- Boş durum ve hata mesajları yön gösterir, özür dilemez.

---

## 15. Yapılacaklar Sırası

```
FAZ 0  Domain müsaitlik doğrulaması + Supabase proje kurulumu
FAZ 1  tokens.css + base.css + tipografi (Türkçe karakter testi dahil)
       Statik hero prototipi — sadece hero, tam kalitede
FAZ 2  Görsel/video pipeline: WebP dönüşümü, kategori ayrımı
FAZ 3  Tüm bölümler + scroll motion motoru (motion.js)
FAZ 4  Netlify Blobs veri modeli + api.js + Netlify Functions
FAZ 5  Admin paneli + auth
FAZ 6  i18n (EN sürümü)
FAZ 7  WhatsApp akışı + analytics + conversion tracking
FAZ 8  KVKK, 404, sitemap, robots, OG görselleri
FAZ 9  Lighthouse optimizasyonu + cross-browser test + deploy
```

**Faz 1'i tam kalitede bitir, sonra devam et.** Hero doğru olmadan diğer bölümlere
geçme — tüm sayfanın tonunu o belirliyor.

---

## 16. Henüz Netleşmemiş

Bunlar için varsayım üretme, sor:

1. `yachtluxcesme.com` müsait mi? Alındı mı?
2. Kahkaha'nın gerçek teknik bilgileri (uzunluk, kabin, kapasite, yıl, motor)
3. Fiyat listesi (sezon, gün tipi, min süre, depozito)
4. WhatsApp Business numarası
5. Mevcut fotoğraf seti — kalite ve kapsam değerlendirilecek
6. Seedance videoları (8sn hero loop + 15sn galeri) henüz üretilmedi
7. Şirket bilgileri: unvan, adres, vergi no (KVKK metni ve footer için)
8. GA4 ve Google Ads hesapları açıldı mı?

---

## 17. Çalışma Kuralları

- Her fazın sonunda ne yaptığını özetle, sonraki faza geçmeden onay bekle.
- Placeholder değer koyman gerekirse `TODO:` ile işaretle ve sonunda listele.
- Görsel eksikse gri kutu koyup devam etme — hangi görselin eksik olduğunu bildir.
- Bir tasarım kararı bu dokümanda yoksa, önce öner, onay al, sonra uygula.
- Kod yorumları Türkçe olabilir; değişken/fonksiyon isimleri İngilizce.
