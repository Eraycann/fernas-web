# Yol Haritası

> Süre tahmini yok. Her adım çıkış kriteriyle tanımlanır. Kurumsal hava korunur.

## A. Yayın öncesi zorunlu

### A1. İletişim bilgilerini kesinleştir

- Gerçek e-posta adreslerini al.
- `contact.php` ve `application.php` içindeki yer tutucuları güncelle.
- İki telefondan hangisinin güncel olduğunu teyit et.
- `src/data/site.json` ve footer/header'ı güncelle.

**Çıkış:** `npm run validate:content` telefon/e-posta uyarısı vermiyor; form testi başarılı.

### A2. İngilizce eksikleri kapat

- 4 proje: `can-dekapaj-yukleme-ve-nakliye-isi`, `ankira-hes-projesi`, `karasu-baraji-ve-hidroelektrik-santrali`, `ankara-beton-astari-fabrikasi`.
- 10 sayfa: `politikalarimiz`, `diyargaz-ik`, `insan-kaynaklari`, `test`, `ik`, `projeler`, `bilgi-toplumu-hizmetleri`, `kalite-belgelerimiz`, `uyeliklerimiz`, `ana-sayfa`.
- Kaynak yoksa uydurma çeviri yapma; dil bağlantısını o sayfada koşullu gizle.

**Çıkış:** EN sayfalarda TR gövdeye düşme yok veya bilinçli olarak dil bağlantısı gizli.

### A3. Görsel kalitesi

- 52 düşük çözünürlüklü proje görseli için yüksek çözünürlüklü orijinal iste.
- Yeni görselleri 1600/800 px WebP olarak üret.
- `low_res` alanını güncelle.
- Alt metinleri gerçek sahneye göre yaz.

**Çıkış:** `data/TODO.md` içindeki düşük çözünürlük listesi kapanır; görsel boyutları CLS'yi bozmaz.

### A4. cPanel doğrulaması

- Zip'i yükle.
- Form, CV, 404, 301, cache ve HTTPS test et.
- Pagefind aramasını kontrol et.

**Çıkış:** `docs/DEPLOYMENT.md` kontrol listesi tamam.

### A5. Lighthouse

- Mobil ve masaüstü ölç.
- Ana sayfa hero LCP'sini kontrol et.
- Header/hero CLS'sini kontrol et.
- Gerekirse font preload ve görsel boyutlarını düzelt.

**Çıkış:** Perf/A11y/BP/SEO ≥ 95; LCP < 2.0 s; CLS < 0.05.

**Mevcut (Vercel mobil):** Perf 97, A11y 100, BP 100, SEO 69 (`noindex`), LCP 2,5 s, CLS 0. LCP hedefi henüz karşılanmadı.

## B. İçerik ve editoryal

### B1. Haber güncelliği

2018 sonrası haber yok. Yeni kurumsal haber, basın bülteni veya proje duyurusu eklenmeli. Kaynak yoksa uydurma haber yazılmamalı.

### B2. Proje hikâyeleri

Mevcut proje metinleri kısa. Her proje için:

1. Ne yapıldı?
2. Kapsam (mühendislik, tedarik, yapım, montaj, test, devreye alma).
3. Ölçek.
4. Konum/yıl.
5. Varsa işveren/konsorsiyum.

### B3. Sürdürülebilirlik

- 570 MW / 485 MW / %100 yenilenebilir verilerinin kaynağını doğrula.
- ISO 14001 ve enerji yönetimi belgelerini bağla.
- Somut örnekler ekle; genel "gelecek" söylemi yok.

### B4. Kariyer

- Açık pozisyon yoksa genel başvuru akışını net tut.
- İK e-posta adresini kesinleştir.
- CV saklama ve KVKK süresini yaz.

## C. Tasarım ve deneyim

### C1. Ana sayfa cilası

- Hero fotoğrafının gerçekten en güçlü işi temsil ettiğini doğrula.
- Ölçüm şeridinin mobilde okunabilirliğini kontrol et.
- Haber şeridi 3'ten fazla habere çıktığında taşma davranışını test et.
- Sürdürülebilirlik bandındaki sayıların kaynağını netleştir.

### C2. Proje arşivi

- 105 proje için filtreleme ve arama performansını ölç.
- Kart görsellerinin lazy-load eşiklerini kontrol et.
- Çok uzun başlıklarda 2 satır taşma davranışını test et.
- Sayfalama veya "daha fazla yükle" gerekip gerekmediğine karar ver.

### C3. Erişilebilirlik

- Klavye ile header dropdown, mobil menü, form ve arama.
- Ekran okuyucu ile hero, ölçüm şeridi ve proje kartları.
- `prefers-reduced-motion` altında tüm animasyonlar duruyor mu?
- Dil değiştirici hedef sayfa yoksa gizli mi?

## D. Video ve hareket (ölçülü)

Video ancak gerçek tesis/proje görüntüsü varsa eklenir. Stok "teknoloji" klipleri kurumsal havayı bozar.

### D1. Hero video (opsiyonel)

- Sessiz, `muted`, `playsinline`, `poster`, `preload="metadata"`.
- Mobilde poster; video yalnızca masaüstünde ve `prefers-reduced-motion: no-preference` altında.
- LCP görseli video olmamalı.
- Toplam video boyutu hedefi: mümkünse < 4 MB; alternatif olarak HLS/stream.
- Otomatik ses yok; kontrol düğmesi erişilebilir.

**Çıkış:** LCP < 2.0 s korunuyor; mobilde veri tüketimi artmıyor.

### D2. Proje sayfası video

- Proje detayında gerçek saha videosu.
- Poster + süre + alt metin.
- Otomatik oynatma yok; kullanıcı başlatır.
- Video yoksa galeriye sahte medya eklenmez.

### D3. Mikro etkileşimler

- Yalnızca kart hover, bağlantı alt çizgisi ve buton geçişleri.
- 120–180 ms; `transform`/`opacity`.
- Sayfa geçişi eklenmez.
- Scroll ile her bölümde reveal yok.

## E. Teknik iyileştirmeler

### E1. Görsel boru hattı

- `scripts/optimize-images.mjs` ile tutarlı 1600/800 üretimi.
- AVIF alternatifi değerlendirilebilir; mevcut WebP yeterliyse gereksiz karmaşa yaratma.
- `srcset`/`sizes` kullanımını kartlarda gözden geçir.

### E2. Pagefind

- Türkçe karakterli aramaları test et.
- Proje/haber başlıklarının indekslendiğini doğrula.
- Sonuç sayfasında boş durum ve klavye akışı.

### E3. SEO

- Canonical/hreflang tüm sayfalarda doğru.
- JSON-LD: Organization, WebSite, BreadcrumbList, CreativeWork, NewsArticle.
- Sitemap'te 268 URL.
- 301'lerde zincir yok.

### E4. Formlar

- cPanel'de gerçek gönderim.
- PHP `mail()` yerine SMTP/PHPMailer gerekli mi?
- CV dosyalarını web dışında saklama.
- Spam/rate limit izleme.
- Vercel'de demo olduğunu kullanıcıya açıkça göster.

### E5. CI

- GitHub Actions: `npm ci`, `check`, `validate:content`, `build`.
- İsteğe bağlı: Playwright smoke.
- Vercel preview otomatik deploy.

## F. Olası ama şimdilik gereksiz

- CMS (Sanity/Strapi) — statik sınırı bozar; gerekiyorsa ayrı içerik üretim katmanı olarak değerlendirilmeli.
- PHP/MySQL yönetim paneli — ancak içerik güncelleme sıkıntısı gerçekten varsa.
- Çok dilli ek diller — kaynak metin yoksa başlatma.
- Kişiselleştirme, harita, timeline — kurumsal hava ve performans gerekçesiyle kapsam dışı.

## Öncelik sırası

1. A1 iletişim
2. A5 Lighthouse
3. A2 İngilizce
4. A4 cPanel
5. A3 görseller
6. B içerik
7. C tasarım/a11y
8. D video/hareket
9. E teknik
