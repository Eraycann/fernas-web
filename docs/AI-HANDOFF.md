# AI Devir Dosyası

> Bu dosya, projeyi başka bir model, ajan takımı veya geliştirici devraldığında gereken bağlamı tek yerde toplar.
> Son güncelleme: 22 Ekim 2026.

## 1. Görev

Fernas Şirketler Grubu'nun mevcut WordPress sitesini, cPanel'de Node gerektirmeden çalışan modern, kurumsal ve yüksek performanslı bir statik siteye dönüştürmek.

Görsel referans: <https://masis-six.vercel.app/index.html>

Kullanıcının son yönü:

- Site GitHub'a taşınacak, Vercel'de paylaşılabilir bir önizleme duracak.
- Başka modeller, beceriler (skills), MCP'ler ve ajan takımlarıyla geliştirmeye devam edilecek.
- Video, görsel ve animasyon eklemeleri yapılabilecek.
- **Kurumsal hava korunacak.** Gösterişli sayfa geçişleri, gereksiz hareket ve "AI demo" estetiği istenmiyor.

Üretim hedefi cPanel'dir. Vercel yalnızca önizleme/paylaşım içindir.

## 2. Önce oku

1. Bu dosya.
2. `AGENTS.md` — çalışma sınırları.
3. `docs/PLAN.md` — ürün planı ve kabul kriterleri.
4. `docs/CONTENT-RULES.md` — dil, doğruluk, hukuki metin kuralları.
5. `docs/STATUS.md` — son doğrulama sonuçları ve açıklar.
6. `docs/CONTENT-MODEL.md` — JSON alanları ve içerik ekleme.
7. `docs/DESIGN-SYSTEM.md` — renk, tipografi, bileşen ve hareket kuralları.
8. `docs/DEPLOYMENT.md` — Vercel ve cPanel.
9. `docs/REFERENCE.md` — referans ekran görüntüleri.
10. `docs/ROADMAP.md` — sıradaki iyileştirmeler.

## 3. Değiştirilmemesi gerekenler

- **Marka:** Fernas logosu ve `#045091` mavi korunur.
- **Dil:** TR varsayılan, EN `/en/` altında. İki dil birlikte yaşar.
- **Statik çıktı:** `dist/` Node'sız açılmalı. Üretimde Node, veritabanı, CMS veya server-side render yok.
- **Formlar:** Yalnızca `contact.php` ve `application.php` gibi küçük PHP endpoint'leri kullanılabilir.
- **Hukuki metinler:** KVKK, politikalar ve çerez metinleri anlamca değiştirilmez.
- **Doğruluk:** Fernas hakkında kaynaksız bilgi, uydurma kapasite, uydurma müşteri veya uydurma görsel eklenmez. Kaynak yoksa `TODO` yazılır.
- **Fotoğraflar:** Proje ve sektör fotoğrafları her zaman görünür. Hover ile açılan gizli görsel deseni kullanılmaz.
- **Sayfa geçişleri:** `ClientRouter`, view transition, blueprint wipe, tam ekran perde veya gecikmeli crossfade yok. Normal tam sayfa yükleme kullanılır.
- **Tasarım klişeleri:** Krem + serif + terracotta, near-black + acid green, her yerde eşit yuvarlak kart, anlamsız `01 / 02 / 03`, her başlık üstünde all-caps mono etiket yok.

## 4. Mevcut durum

### İçerik

| İçerik | Adet | Konum |
|---|---:|---|
| Proje | 105 | `src/content/projects/*.json` |
| Haber | 13 | `src/content/news/*.json` |
| Kurumsal sayfa | 23 | `src/content/pages/*.json` |
| Sektör | 6 | `src/data/sectors.json` |
| Politika | 16 | `src/data/policies.json` + `public/belgeler/` |
| Kalite belgesi | 8 | `src/data/certificates.json` |
| Üyelik | 16 | `src/data/memberships.json` |
| Optimize görsel | 269 | `public/images/` |
| Belge/PDF | 18 | `public/belgeler/` |

### Build ve kalite

- `npm run check`: 0 hata, 0 uyarı (10 hint).
- `npm run build`: 268 sayfa; Pagefind 266 sayfa indeksliyor.
- `npm run validate:content`: 0 hata, 10 uyarı.
- Playwright + axe: 54 sayfa/genişlik kombinasyonu, 0 sorun.
- Vercel mobil Lighthouse: Perf 97, A11y 100, BP 100, SEO 69 (önizleme `noindex`). LCP 2,5 s; 2,0 s hedefi açık. CLS 0, TBT 30 ms.

### Son tasarım kararları

- MASİS referansındaki net kurumsal hiyerarşi benimsendi.
- Koyu üst bilgi şeridi + beyaz sticky header + büyük logo + dropdown okları.
- Tam genişlikte fotoğraflı hero; altında 570 MW / 485 MW / 14 tesis / 1,5M / 60+ şeridi.
- Ana sayfada haber şeridi, hakkımızda, sektörler, projeler, sürdürülebilirlik bandı, haberler ve CTA.
- Proje arşivi ve sektör sayfaları görünür fotoğraf kartları kullanıyor.
- Türkiye haritası, pinlenmiş yatay tarihçe, hover ile fotoğraf açma ve süslü sayfa geçişi kaldırıldı.
- `ClientRouter` ve eski `blueprint-wipe` CSS'i tamamen silindi.
- Chalk zemini `#F2F4F5`; gövde metni `ink` tonlarında.
- Vercel'de formlar `PUBLIC_DEMO_MODE=true` ile demo modundadır (`src/lib/demo.ts`).

## 5. Mimari

```text
Astro 7 (static)
├── src/pages/*.astro           route'lar
├── src/layouts/Base.astro      HTML shell, SEO, font, motion
├── src/components/layout       Header, Footer
├── src/components/home         ana sayfa parçaları
├── src/components/projects     React proje arşivi
├── src/components/forms        React formlar
├── src/components/ui           Logo, Seo
├── src/lib                     JSON loader + demo
├── src/content                 proje/haber/sayfa JSON
├── src/data                    sektör, istatistik, politika...
├── src/styles/global.css       Tailwind 4 token + bileşenler
├── src/scripts/motion.ts       Lenis + GSAP
├── public/images               optimize WebP
├── public/belgeler             PDF'ler
├── public/*.php                cPanel form endpoint'leri
└── scripts/                    ithal, optimize, paket, QA
```

### Önemli dosyalar

| Dosya | Görev |
|---|---|
| `src/layouts/Base.astro` | Tüm sayfaların shell'i; `ClientRouter` yok |
| `src/styles/global.css` | Tailwind token'ları, header, hero, kartlar |
| `src/components/layout/Header.astro` | Üst şerit, masaüstü/mobil menü, dil bağlantısı |
| `src/pages/index.astro` | TR ana sayfa |
| `src/pages/en/index.astro` | EN ana sayfa |
| `src/lib/projects.ts` | Proje JSON normalizasyonu |
| `src/lib/news.ts` | Haber JSON normalizasyonu |
| `src/scripts/motion.ts` | Tek Lenis + GSAP ticker |
| `scripts/qa.mjs` | Playwright + axe kontrolü |
| `scripts/package-cpanel.mjs` | cPanel zip + 301 üretimi |

## 6. Çalıştırma

```bash
npm ci
npm run dev
npm run check
npm run validate:content
npm run build
npm run preview
```

QA:

```powershell
$env:QA_BASE = "http://localhost:4322"
npm run qa
```

Node 22.23.4+ gerekir. Proje npm kullanır; pnpm/yarn karıştırılmaz.

## 7. Açık işler ve riskler

### Yayın öncesi zorunlu

1. **İletişim bilgileri:** Gerçek e-posta bilinmiyor. `contact.php` içinde `info@fernas.com.tr`, `application.php` içinde `ik@fernas.com.tr` yer tutucu.
2. **Telefon:** Kaynakta iki numara var: `+90 312 454 16 00` ve `+90 312 426 6262`. Site şu an ilkini kullanıyor; teyit edilmeli.
3. **İngilizce eksikleri:** 4 proje ve 10 sayfa EN içeriksiz. Uydurma çeviri yapılmamalı.
4. **Hukuki EN:** İngilizce politika/KVKK kaynak metni yok; EN sayfalar Türkçe PDF'lere gidiyor.
5. **Form testi:** PHP lokalde yok. cPanel'de gerçek gönderim, ek dosya ve 301'ler test edilmeli.
6. **cPanel paketi:** Son tasarımdan sonra yeniden üretilmeli.
7. **Lighthouse:** Vercel mobilde Perf 97 / A11y 100 / BP 100 / SEO 69 (noindex); LCP 2,5 s. 2,0 s hedefi için hero teslimi iyileştirilmeli.

### İçerik kalitesi

- 52 proje görseli düşük çözünürlüklü; büyütülmemeli, yüksek çözünürlüklü orijinal istenmeli.
- Vektörel logo yok; mevcut PNG 328×145.
- 2018-02-08 sonrası haber yok.
- Bazı proje görselleri birden fazla kayıtta tekrar ediyor olabilir.
- Demo/duplike sayfalar yayına alınmamalı: `test`, `insaat-2`, `devam-eden-projeler-2`, `tamamlanan-projeler-2`.

### Teknik

- `@astrojs/check` TypeScript 5/6 ister; TS 7 kullanılmaz.
- Astro 7'de `@astrojs/db` yok.
- Windows'ta Türkçe dosyaları PowerShell `Set-Content` ile yazmak bozabilir; `write`/`edit` veya Node kullanılmalı.
- cPanel'de `Options -MultiViews` olmadan uzantısız URL'ler çakışabilir.
- Vercel PHP çalıştırmaz; formlar demo modundadır.

## 8. Önerilen sıra

1. GitHub ve Vercel önizlemesini doğrula; linkleri paylaş.
2. Lighthouse (mobil + masaüstü) ölç; LCP'yi 2,0 s altına indir (CLS zaten 0).
3. Telefon/e-posta teyidini al; PHP endpoint'lerini güncelle.
4. Eksik EN proje ve sayfaları tamamla; dil bağlantısını koşullu yap.
5. Yüksek çözünürlüklü görselleri temin et; düşük çözünürlüklü olanları değiştir.
6. Video ve gelişmiş animasyonları **ölçülü** ekle (aşağıdaki kurallar).
7. cPanel'de form, 404, 301 ve cache doğrulaması yap.
8. Son cPanel paketini üret.

## 9. Video ve animasyon eklerken

Kurumsal havayı bozmamak için:

- Video yalnızca gerçek bir sahne/tesis gösteriyorsa kullanılır; stok "teknoloji" klipleri yok.
- Hero videosu sessiz, `muted`, `playsinline`, `poster` ve `preload="metadata"` olmalı; otomatik ses yok.
- `prefers-reduced-motion` altında video durmalı veya poster gösterilmeli.
- Mobilde video yerine poster kullanmak tercih edilir; LCP görseli video olmamalı.
- Sayfa geçişi eklenmeyecek. Gerekirse yalnızca 120–180 ms opaklık; tam ekran perde yok.
- Scroll animasyonu tek güçlü momentte kalmalı; her bölümde fade-up yok.
- Animasyonlar `transform` ve `opacity` ağırlıklı olmalı; layout/paint tetikleyen özelliklerden kaçınılmalı.
- GSAP + Lenis tek ticker kuralı korunmalı.
- Alt metin, poster ve kaynak bilgisi olmadan medya eklenmez.

## 10. Başka bir modele verilecek başlangıç promptu

```text
Fernas Şirketler Grubu'nun statik kurumsal sitesini devralıyorsun.
Repo: https://github.com/Eraycann/fernas-web
Önizleme: https://fernas-web.vercel.app

Önce şu sırayla oku:
1. docs/AI-HANDOFF.md
2. AGENTS.md
3. docs/PLAN.md
4. docs/CONTENT-RULES.md
5. docs/STATUS.md
6. docs/CONTENT-MODEL.md
7. docs/DESIGN-SYSTEM.md
8. docs/DEPLOYMENT.md

Stack: Astro 7 (static) + React 19 adaları + Tailwind 4 + Lenis/GSAP + Pagefind.
Üretim: cPanel public_html. Vercel yalnızca önizleme. Node sunucu, veritabanı, CMS, Next.js, Sanity yok.
Formlar: yalnızca küçük PHP endpoint'leri.

Kurumsal, sade, fotoğraf odaklı tasarımı koru. ClientRouter/view transition/wipe ekleme.
Fotoğrafları hover arkasına saklama. Marka mavisi #045091, Archivo + IBM Plex Sans + IBM Plex Mono.
Kaynaksız Fernas bilgisi uydurma. Hukuki metinleri değiştirme. Türkçe karakterleri bozma.

İlk iş: repoyu klonla, npm ci, npm run check ve npm run build çalıştır.
Sonra docs/STATUS.md'deki açıklardan en yüksek etkili olanı seç ve küçük, doğrulanabilir bir değişiklik yap.
Her değişiklikten sonra check + build + mümkünse QA çalıştır.
Süre tahmini verme; çıkış kriterleriyle ilerle.
```

## 11. Ajan takımı önerisi

Aynı dosyaya iki ajan yazmasın.

- **İçerik ajanı:** EN eksikleri, haber güncellemeleri, kaynak doğrulama.
- **Görsel ajanı:** Yüksek çözünürlüklü görsel ithali, WebP üretimi, alt metinler.
- **Tasarım ajanı:** Ana sayfa ve bileşen cilası; `global.css`, `Header.astro`.
- **Performans/a11y ajanı:** Lighthouse, axe, CLS/LCP, klavye testleri.
- **Dağıtım ajanı:** Vercel/cPanel, 301, PHP form testi.

Her ajana `AGENTS.md`, `docs/PLAN.md` ve bu dosya okutulur. Çıktı: değişen dosyalar, komut sonuçları, ekran görüntüsü.

## 12. Bitti tanımı

- `npm run check`, `npm run validate:content` ve `npm run build` hatasız.
- Playwright smoke + axe temiz.
- Lighthouse hedefleri: Perf/A11y/BP/SEO ≥ 95; LCP < 2.0 s; CLS < 0.05.
- TR ve EN ana sayfa masaüstü/mobilde doğru.
- Formlar cPanel'de çalışıyor; Vercel'de demo.
- 301'ler, 404 ve `.htaccess` doğrulandı.
- `dist/` Node'sız açılıyor.
- Yeni cPanel zip'i üretildi ve sürüm notu yazıldı.
