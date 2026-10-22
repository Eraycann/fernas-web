# Fernas Şirketler Grubu — Statik Site Yenileme Planı

> Bu dosya, projenin temel ürün planıdır. Yeni oturumda önce bunu, sonra `AGENTS.md` ve `docs/AI-HANDOFF.md` dosyasını oku.

## 1. Hedef ve Kısıtlar

**Hedef:** fernas.com.tr'yi baştan aşağı modern, kurumsal, editoryal ve yüksek performanslı bir statik siteye dönüştürmek.

**Kesin kısıtlar:**
- Site **statik** olacak. Çıktı `dist/` klasörü; cPanel `public_html` altına yüklenecek.
- Sunucuda Node, Composer, veritabanı **gerekmeyecek**.
- **Sanity, Next.js, ISR, server actions yok.**
- **Vercel yalnızca statik önizleme/paylaşım içindir; üretim cPanel'dir.** Vercel'de PHP ve `.htaccess` çalışmaz.
- Formlar için isteğe bağlı, veritabanısız küçük PHP endpoint'leri kullanılabilir (`contact.php`, `application.php`). Site yine statik kalır.
- Beğenilirse sonraki fazda **PHP 8 + MySQL + PDO** panel yapılacak. Statik site bu geçişi zorlaştırmayacak.
- Tasarım jenerik AI estetiğinden uzak olacak; `frontend-design` skill'inin kuralları geçerli.
- Süre tahmini verilmeyecek; fazlar çıkış kriterleriyle tanımlanacak.

## 2. Marka ve Tasarım Sistemi

### 2.1 Konumlandırma
"Bir grup, altı uzmanlık." 1982'den beri inşaat, enerji, doğalgaz dağıtımı, sanayi, gıda ve turizm. Anlatı; abartılı "gelecek" vaatleri değil, **ölçülebilir iş** üzerine kurulu.

### 2.2 Renkler
| Token | Hex | Kullanım |
|---|---|---|
| `--ink` | `#061522` | Koyu bölümler, footer, metin |
| `--blue` | `#045091` | Fernas mavisi; büyük yüzeyler |
| `--chalk` | `#EEF2F1` | Ana zemin (soğuk, krem değil) |
| `--steel` | `#7A8C97` | İkincil metin, çizgi |
| `--amber` | `#E08A2B` | Yalnızca ölçüm/kapasite/harita düğümü |
| `--white` | `#FFFFFF` | Metin, boşluk |

Kurallar:
- Mavi "accent" değil, taşıyıcı renk.
- Amber yalnızca veri vurgusu; geniş zemin olarak kullanılmaz.
- Krem + serif + terracotta kombinasyonu yasak (AI klişesi).
- Near-black + acid green/vermilion kombinasyonu yasak.
- Her yerde eşit yuvarlak kart, aynı gölge, gradient wash yasak.

### 2.3 Tipografi
- **Archivo** (değişken, genişlik ekseni 110–125) — başlıklar ve büyük sayılar.
- **IBM Plex Sans** — gövde.
- **IBM Plex Mono** — yalnızca koordinat, kapasite, yıl gibi ölçülen veriler.
- Kendi sunucumuzda barındır; `latin-ext` subset; `font-display: swap`.
- Astro Fonts API (`fonts` config) kullanılacak.

### 2.4 İmza Öğeler
1. **Tam genişlikte hero:** Tek güçlü fotoğraf, koyu lacivert overlay, net başlık ve altta ölçüm şeridi.
2. **Kurumsal header:** Beyaz zemin, ince üst bilgi şeridi, dropdown'lı ana menü ve mavi iletişim butonu.
3. **Görünür fotoğraf kartları:** Sektör, proje ve haber kartlarında fotoğraf her zaman görünür; hover yalnızca hafif yükselme ve başlık rengi.
4. **Sürdürülebilirlik bandı:** Koyu lacivert zemin, 570 MW / 485 MW / %100 yenilenebilir ölçüleri.
5. **Doğrudan sayfa geçişi:** Süslü view transition, wipe veya gecikmeli crossfade yok; sayfalar normal yüklenir.

### 2.5 Kaçınılacaklar
- Her bölümde fade-up.
- Anlamsız 01/02/03 numaraları (sadece gerçek sıra varsa).
- Her başlık üstünde all-caps mono etiket.
- Link metnine otomatik "→" ekleme.
- Custom cursor, ses, gereksiz 3D.
- Metin yerine geçen dekoratif gradyanlar.

## 3. Bilgi Mimarisi

```
/                           Ana sayfa
/grup/hakkimizda            Hikâye, misyon, vizyon, değerler
/grup/tarihce               1982 → bugün
/grup/uyelikler             ASMÜD, TÜSİAD, TMB, IPLOCA, TUREB...
/grup/kalite-belgeleri      ISO 9001 / 14001 / 45001
/grup/politikalar           Politika listesi
/grup/politikalar/[slug]    17 politika detayı
/grup/bilgi-toplumu
/grup/necat-nasiroglu-vakfi
/sektorler/insaat
/sektorler/enerji
/sektorler/dogalgaz-dagitim
/sektorler/sanayi
/sektorler/gida
/sektorler/turizm
/projeler                   Filtrelenebilir arşiv (tablo/grid)
/projeler/[slug]            Proje detayı
/haberler                   Haber arşivi
/haberler/[slug]            Haber detayı
/kariyer                    Açık pozisyonlar + genel başvuru
/iletisim                   Merkez, harita, form
/surdurulebilirlik          570 MW yenilenebilir, ISO 14001, politikalar
/kvkk
/cerez-politikasi
/kullanim-kosullari
/styleguide                 Noindex tasarım sistemi sayfası
/404
/en/...                    İngilizce karşılıkları
```

Navigasyon: Kurumsal · Sektörler · Projeler · Sürdürülebilirlik · Haberler · Kariyer · İletişim + TR/EN + "Bize ulaşın".

URL'ler uzantısız: Astro `build.format: "directory"` → `/projeler/x/index.html`.

## 4. İçerik Modeli

Tüm içerik `src/content/` altında JSON/Markdown; Zod ile doğrulanır. Alan adları ileride MySQL kolonlarıyla aynı olacak.

### 4.1 Proje
```ts
interface Project {
  slug: string;
  title_tr: string;
  title_en: string;
  sector: 'insaat' | 'enerji' | 'dogalgaz-dagitim' | 'sanayi' | 'gida' | 'turizm';
  status: 'tamamlandi' | 'devam-ediyor' | 'isletmede';
  country: string;
  city?: string;
  year?: number;
  client?: string;
  capacity?: string;
  scope_tr: string;
  scope_en: string;
  cover: string;
  gallery: string[];
  featured: boolean;
  sort: number;
  seo_title?: string;
  seo_description?: string;
  source_url?: string;
}
```

### 4.2 Haber
`slug, title_tr, title_en, excerpt_tr, excerpt_en, body_tr, body_en, published_at, category, cover, source_url`.

### 4.3 Diğer
- `sectors.json` — slug, ad, açıklama, metrikler, görsel.
- `pages/*.md` — hakkımızda, tarihçe, politikalar (hukuki metinler birebir).
- `news/*.json`
- `timeline.json` — yıl, başlık, metin, görsel.
- `stats.json` — 570 MW, 485 MW, 14 tesis, 1.5M, 60+.
- `site.json` — iletişim, sosyal, SEO varsayılanları.

## 5. Teknoloji

| Katman | Seçim |
|---|---|
| Framework | Astro 7.4 (statik output) |
| UI adaları | React 19.3 (`@astrojs/react`) |
| Stil | Tailwind CSS 4.3 (`@tailwindcss/vite`) |
| Animasyon | GSAP 3.15 (ScrollTrigger, SplitText, Flip, DrawSVG) + Lenis 1.3 |
| Görsel | `astro:assets` + Sharp 0.35 |
| İçerik doğrulama | Zod 4 |
| Arama | Pagefind 1.5 |
| Test | Playwright 1.64 + axe + Lighthouse CI |
| Dil | Astro i18n (`tr` varsayılan, `/en/`) |
| Paketleme | Node script → `dist.zip` + `.htaccess` |
| Paket yöneticisi | npm (pnpm kurulu değil) |

### 5.1 React adaları
- `SectorIndex` (hero) — `client:load`
- `ProjectExplorer` — `client:visible` veya `client:load`
- `SearchDialog` — `client:idle`
- `MobileNav` — `client:load`
- `ContactForm` / `ApplicationForm` — `client:visible`

Geri kalan her şey Astro bileşeni; JS yok.

### 5.2 Motion kuralları
- Tek bir ortak Lenis + GSAP ticker.
- `matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)')` dışında ağır animasyon yok.
- Mobilde native scroll; sadece CSS reveal.
- `ScrollTrigger.refresh()` font/görsel yüklemesinden sonra.
- Sayfa geçişleri doğrudan tam yükleme; `ClientRouter` ve özel view transition yok.

### 5.3 Görsel
- Hero ilk dilim eager + `fetchpriority="high"`; diğerleri lazy.
- LQIP + `width`/`height` zorunlu.
- Proje kapakları 1600px, galeri 1200px; AVIF/WebP.
- Düşük çözünürlüklü görsellerde duotone + grain + teknik overlay.

### 5.4 SEO
- `generateMetadata` eşdeğeri: `<Seo>` bileşeni.
- Canonical, hreflang, OG/Twitter.
- JSON-LD: Organization, WebSite, BreadcrumbList, CreativeWork (proje), NewsArticle, JobPosting.
- `@astrojs/sitemap` + i18n alternates.
- Eski URL → yeni URL 301 haritası `.htaccess`'e.

### 5.5 Formlar
- HTML form + istemci doğrulama + PHP endpoint.
- `contact.php`: ad, e-posta, konu, mesaj, KVKK onayı, honeypot, süre tuzağı.
- `application.php`: ad, iletişim, pozisyon, CV (PDF/DOCX, max 5 MB), KVKK onayı.
- Demo modunda ağ isteği yok; başarı mesajı gösterilir.
- cPanel'de `mail()`; gerekirse PHPMailer'a geçiş için `config.php`.

### 5.6 Analitik / KVKK
- Varsayılan: Plausible veya GA4 (tercihe bağlı).
- Çerez yoksa banner yok; GA4 varsa `vanilla-cookieconsent` ile onay.
- KVKK metni ve çerez politikası ayrı sayfa.

## 6. cPanel Dağıtımı

- `npm run build` → `dist/`
- `dist/` içinde: HTML, `_astro/`, görseller, `pagefind/`, `contact.php`, `application.php`, `.htaccess`, `404.html`.
- `.htaccess`:
  - HTTPS yönlendirme
  - `ErrorDocument 404 /404.html`
  - 301 haritası
  - `mod_deflate` / `mod_expires`
  - Güvenlik başlıkları
  - `Options -MultiViews`
- Demo alt dizin desteği: `BASE_PATH` şu an uygulanmadı; alt dizin gerekirse `astro.config.ts` içinde `base` eklenmeli.
- `npm run package` → `fernas-site.zip`.

## 7. PHP + MySQL'e Geçiş Yolu

Statik site korunacak şekilde tasarlanır:
- Her sayfa ayrı HTML → PHP'de `include 'inc/header.php'` yapısına birebir çevrilir.
- JSON alan adları = MySQL kolon adları.
- URL yapısı korunur; 301 gerekmez.
- CSS sınıfları ve bileşen yapısı korunur.
- `docs/php-migration.md` içinde bileşen → PHP eşlemesi ve şema bulunur.

Örnek tablolar: `projects`, `project_images`, `sectors`, `news`, `pages`, `policies`, `memberships`, `certificates`, `timeline`, `stats`, `jobs`, `applications`, `settings`, `users`.

Panel (sonraki faz): PHP 8 + PDO + session auth + CSRF + görsel yükleme + TR/EN sekmeleri + taslak/yayın + slug + SEO alanları + rol yönetimi.

## 8. İçerik Göçü Kuralları

- Kaynak: `https://www.fernas.com.tr/` ve WP REST/sitemap.
- 105 portfolio URL'si, 13 haber, 23 sayfa taranacak.
- Şüpheli/spam içerik ayıklanacak (ör. "seamlessly initiate distinctive niches").
- Tekrarlanan projeler birleştirilecek; okunabilir slug üretilecek.
- Görseller indirilecek, optimize edilecek, alt metinleri yazılacak.
- Hukuki metinler (politikalar, KVKK) birebir korunacak.
- Eksik İngilizce alanlar raporlanacak; uydurma çeviri yapılmayacak.
- Bilinen hatalar: Kozbükü haberi Sebenoba'ya gidiyor; iki farklı telefon; bazı görseller tekrar; `portfolio-1-2` gibi slug'lar.

## 9. Kabul Kriterleri

- Lighthouse (mobil): Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- LCP < 2.0 s, CLS < 0.05, INP < 200 ms (4G).
- WCAG 2.2 AA; klavye ile tüm akışlar; görünür odak.
- Tüm sayfalar 320px–1920px arası sorunsuz.
- Formlar cPanel'de çalışır; demo modunda güvenli.
- 301'ler aktif; eski URL'ler kaybolmaz.
- `dist/` Node'sız çalışır.
- `/styleguide` tüm token ve bileşenleri gösterir.

## 10. Fazlar

| Faz | İş | Çıkış kriteri |
|---|---|---|
| 0 | Skill/MCP, iskelet, içerik ithali, görsel envanteri | Çalışan build + envanter + redirect haritası |
| 1 | Token, layout, header/footer, i18n, SEO, styleguide | Tasarım sistemi hazır |
| 2 | Ana sayfa (hero, ölçüm, projeler, harita, timeline) | Onay prototipi |
| 3 | Kurumsal + 6 sektör | Tüm metinler ve belgeler |
| 4 | Proje arşivi + detay + filtre | 60+ proje, temiz slug |
| 5 | Haberler, kariyer, iletişim, arama, yasal | Formlar + Pagefind |
| 6 | Cila, a11y, performans, cPanel paketi | Lighthouse + zip |
| 7 | (Opsiyonel) PHP/MySQL panel | Aynı URL, aynı tasarım |

## 11. Skill / MCP

Kurulu/ kurulacak:
- `frontend-design` (Anthropic)
- `web-design-guidelines` (Vercel)
- `accessibility`, `core-web-vitals`, `seo` (Addy Osmani)
- `animate`, `animation-performance`, `review-animations`, `emil-design-eng` (Emil Kowalski)
- proje özel: `fernas-web`

MCP:
- Context7
- Chrome DevTools
- Playwright
- GitHub (opsiyonel)

## 12. Varsayılan Kararlar

1. Logo ve `#045091` korunur; kimlik modernize edilir.
2. TR + EN birlikte.
3. Formlar PHP endpoint; demo modunda mock.
4. Mevcut içerikle başlanır; 2018 sonrası içerik sonra eklenir.
5. Düşük çözünürlüklü görseller duotone/teknik overlay ile kullanılır.
