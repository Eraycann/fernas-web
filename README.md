# Fernas — Statik Kurumsal Site

Fernas Şirketler Grubu için yeniden tasarlanmış, iki dilli (TR/EN), statik kurumsal web sitesi. Üretim çıktısı cPanel'e yüklenir; Vercel yalnızca önizleme ve paylaşım içindir.

- Görsel referans: <https://masis-six.vercel.app/index.html>
- Canlı önizleme: <https://fernas-web.vercel.app>
- GitHub: <https://github.com/Eraycann/fernas-web>
- Kurumsal kaynak: <https://www.fernas.com.tr/>
- Marka mavisi: `#045091`
- Çıktı: `dist/` — Node, veritabanı veya CMS gerektirmez

## Hızlı başlangıç

Gereksinim: **Node.js 22.23.4 veya üzeri** ve **npm**.

```bash
npm ci
npm run dev        # http://localhost:4321
npm run build      # dist/ + Pagefind indeksi
npm run preview    # üretim çıktısını yerelde aç
```

Yerelde önizleme genelde `http://localhost:4322/` olur. Script çıktısındaki adresi kullan.

## Doğrulama

```bash
npm run check              # Astro + TypeScript
npm run validate:content   # JSON, görsel ve iletişim tutarlılığı
npm run build              # 268 sayfa + Pagefind
npm run qa                 # Playwright + axe (önce preview çalışmalı)
npm run package            # cPanel zip'i (release/)
```

`npm run qa` varsayılan olarak `http://127.0.0.1:4321` adresini kontrol eder. Preview farklı porttaysa:

```powershell
$env:QA_BASE = "http://localhost:4322"
npm run qa
```

## Teknoloji

| Katman | Seçim |
|---|---|
| Framework | Astro 7, `output: "static"` |
| UI adaları | React 19 |
| Stil | Tailwind CSS 4 |
| Hareket | Lenis + GSAP (tek ticker) |
| Arama | Pagefind |
| Görseller | WebP, statik dosyalar |
| Dil | Astro i18n, TR varsayılan + `/en/` |
| Formlar | Küçük PHP endpoint'leri (yalnızca cPanel) |

Sunucu tarafı render, ISR, server action, veritabanı, Sanity veya Next.js **yoktur**.

## Sayfa yapısı

```text
/                              Ana sayfa
/grup/hakkimizda               Kurumsal
/grup/tarihce
/grup/uyelikler
/grup/kalite-belgeleri
/grup/politikalar
/grup/bilgi-toplumu
/sektorler/[slug]              6 sektör
/projeler                      Proje arşivi
/projeler/[slug]               105 proje detayı
/haberler                      13 haber
/haberler/[slug]
/kariyer
/surdurulebilirlik
/iletisim
/kvkk
/arama                         Pagefind arama
/en/...                        İngilizce karşılıklar
/styleguide                    Tasarım sistemi (noindex)
```

URL'ler uzantısızdır: Astro `build.format: "directory"` kullanır, her sayfa `.../index.html` olarak üretilir.

## Dizin haritası

```text
src/
  components/    layout, home, projects, forms, ui
  content/       projects (105), news (13), pages (23)
  data/          sectors, stats, site, policies, certificates...
  i18n/          tr.ts, en.ts
  layouts/       Base.astro
  lib/           projects.ts, news.ts, demo.ts
  pages/         route'lar
  scripts/       motion.ts
  styles/        global.css
public/
  images/        269 optimize WebP
  belgeler/      politika ve KVKK PDF'leri
  .htaccess      cPanel 301/404/cache
  contact.php    iletişim endpoint'i
  application.php iş başvurusu endpoint'i
scripts/         import, optimize, redirect, package, QA
docs/            plan, durum, AI devir dosyaları
tests/           e2e / a11y
```

## İçerik

- Projeler: `src/content/projects/*.json`
- Haberler: `src/content/news/*.json`
- Kurumsal sayfa gövdeleri: `src/content/pages/*.json`
- Veri: `src/data/*.json`
- Görseller: `public/images/{projects,news,sectors}/...`

Yeni proje eklerken `slug`, `title_tr`, `sector`, `cover` ve `source_url` zorunludur. Görsel yolu ve alt metin olmadan görsel eklenmez. Ayrıntılı alan listesi: [`docs/CONTENT-MODEL.md`](docs/CONTENT-MODEL.md).

## Tasarım yönü

- Beyaz sticky header + koyu ince üst bilgi şeridi.
- Tam genişlikte fotoğraflı hero ve altında ölçüm şeridi.
- Fotoğraflar her zaman görünür; hover yalnızca hafif yükselme ve başlık rengi.
- Mavi taşıyıcı renk, amber yalnızca ölçüm verisi.
- Archivo (display), IBM Plex Sans (gövde), IBM Plex Mono (veri).
- Süslü sayfa geçişi, `ClientRouter`, wipe ve gecikmeli crossfade **yok**.
- Her bölümde animasyon değil, tek güçlü moment.

Ayrıntılar: [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md).

## Yayın

### Vercel (önizleme)

Repo Vercel'e bağlanabilir. Ayarlar:

- Build command: `npm run build`
- Output directory: `dist`
- Node: `.nvmrc` → 24

Vercel PHP çalıştıramaz. Vercel projesinde `PUBLIC_DEMO_MODE=true` tanımlıdır; formlar demo modundadır ve gerçek e-posta göndermez.

### cPanel (üretim)

```bash
npm run package
```

`release/fernas-cpanel-*.zip` dosyasını `public_html` altına aç. Zip; `dist/`, `.htaccess`, `contact.php`, `application.php` ve 301 yönlendirmelerini içerir.

Ayrıntılar: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## AI / model devri

Başka bir model veya ajanla devam edeceksen şu sırayla oku:

1. [`docs/AI-HANDOFF.md`](docs/AI-HANDOFF.md) — kapsam, kararlar, açık işler
2. [`AGENTS.md`](AGENTS.md) — çalışma kuralları
3. [`docs/PLAN.md`](docs/PLAN.md) — ürün planı
4. [`docs/CONTENT-RULES.md`](docs/CONTENT-RULES.md) — dil ve doğruluk
5. [`docs/STATUS.md`](docs/STATUS.md) — son durum
6. [`docs/CONTENT-MODEL.md`](docs/CONTENT-MODEL.md) — veri şeması
7. [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) — görsel dil
8. [`docs/REFERENCE.md`](docs/REFERENCE.md) — referans görseller
9. [`docs/ROADMAP.md`](docs/ROADMAP.md) — sonraki iyileştirmeler

## Bilinen açıklar

- Gerçek iletişim e-postası ve güncel telefon henüz teyit edilmedi.
- 4 projede ve 10 sayfada İngilizce içerik eksik.
- İngilizce hukuki metin kaynağı yok; EN sayfalar Türkçe PDF'lere bağlanıyor.
- 52 proje görseli düşük çözünürlüklü.
- 2018 sonrası haber yok.
- Vektörel logo yok.
- PHP formlar yalnızca cPanel'de gerçek gönderim yapar.

## Haklar

Fernas adı, logosu, fotoğrafları ve kurumsal metinleri Fernas Şirketler Grubu'na aittir. Bu repo, sitenin geliştirilmesi ve gösterimi için hazırlanmıştır; açık kaynak lisansı verilmez.
