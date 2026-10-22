# AGENTS.md — Fernas Statik Site

## Önce oku
1. `docs/AI-HANDOFF.md` — kapsam, kararlar, açık işler.
2. `docs/PLAN.md` — ürün planı.
3. `docs/CONTENT-RULES.md` — içerik ve dil kuralları.
4. `docs/STATUS.md` — nerede kaldığımız.
5. `docs/CONTENT-MODEL.md` — JSON alanları.
6. `docs/DESIGN-SYSTEM.md` — görsel dil.

## Proje
Fernas Şirketler Grubu için **statik** kurumsal site. Üretim çıktısı cPanel `public_html` altına yüklenir; sunucuda Node çalışmaz. Vercel yalnızca önizleme ve paylaşım içindir.

- Kök: `C:\Users\Erayc\fernas-web`
- Stack: Astro 7 + React 19 adaları + Tailwind 4 + GSAP/Lenis + Pagefind
- Paket yöneticisi: **npm** (pnpm/yarn yok)
- Dil: TypeScript (strict), Node 22.23.4+

## Kesin sınırlar
- **Sanity, Next.js, ISR, server actions, veritabanı, CMS yok.**
- Site statik kalacak; formlar için yalnızca küçük PHP endpoint'leri kullanılabilir (`contact.php`, `application.php`).
- Vercel yalnızca preview'dir. Vercel'de PHP çalışmaz; formlar demo modundadır.
- Tüm metin dosyaları UTF-8. Türkçe karakterleri bozma.
- Fernas hakkında **uydurma bilgi yazma**. Kaynak yoksa `TODO` veya `data/TODO.md` kullan.
- Hukuki metinleri (politikalar, KVKK) anlamca değiştirme.
- Görsel yolları ve alt metinleri olmadan görsel ekleme.
- `test`, `insaat-2`, `devam-eden-projeler-2`, `tamamlanan-projeler-2` kayıtlarını yayına alma.

## Tasarım kuralları
- Krem + serif + terracotta, near-black + acid green, eşit yuvarlak kart kiti, her yerde fade-up, anlamsız 01/02/03, all-caps mono eyebrow **kullanma**.
- Mavi taşıyıcı renk (`#045091`); amber yalnızca ölçüm verisi.
- Tipografi: Archivo (display), IBM Plex Sans (gövde), IBM Plex Mono (veri).
- Fotoğraflar her zaman görünür; hover yalnızca hafif yükselme ve başlık rengi.
- Hareket: tek Lenis+GSAP ticker; mobilde ve `prefers-reduced-motion` altında sade.
- Her bölümde animasyon değil, tek güçlü moment.
- **Sayfa geçişi ekleme.** `ClientRouter`, view transition, wipe, perde, gecikmeli crossfade yok. Sayfalar normal tam yükleme ile açılır.

## Komutlar
```bash
npm ci
npm run dev
npm run build
npm run preview
npm run check
npm run validate:content
npm run qa
npm run package
```

QA öncesi preview çalışmalı:
```powershell
$env:QA_BASE = "http://localhost:4322"
npm run qa
```

## Dosya düzeni
```
src/components/{layout,home,projects,forms,ui}
src/content/{projects,news,pages}
src/data/{sectors,stats,site,policies,certificates,memberships,...}.json
src/i18n/{tr,en}.ts
src/layouts/Base.astro
src/lib/{projects,news,demo}.ts
src/pages/...
src/styles/global.css
src/scripts/motion.ts
public/{.htaccess,contact.php,application.php,images,belgeler}
scripts/{import-wordpress,optimize-images,generate-redirects,package-cpanel,qa}.mjs
docs/
```

## Alt ajan kullanımı
- Büyük ve bağımsız işleri paralel alt ajanlara ver:
  - içerik ithali / EN çeviri / doğrulama
  - görsel indirme + optimize + alt metin
  - belirli sayfa grupları
  - test / audit / Lighthouse
- Aynı dosyaya iki ajan yazmasın. Dosya sahipliğini açıkça belirt.
- Alt ajanlara `AGENTS.md`, `docs/AI-HANDOFF.md` ve `docs/PLAN.md` okut.

## Kalite kapısı
- `npm run check` ve `npm run build` hatasız.
- `npm run validate:content` hata vermiyor.
- Playwright smoke + axe temiz.
- Lighthouse hedefleri: Perf/A11y/BP/SEO ≥ 95, LCP < 2.0 s, CLS < 0.05.
- `dist/` Node'sız açılmalı; `.htaccess` 404/301/cache içermeli.

## Bilinen tuzaklar
- Astro 7'de `@astrojs/db` yok; kullanma.
- `@astrojs/check` TypeScript 5/6 ister; TS 7 kullanma.
- Windows'ta yollar; `path` için `node:path` kullan.
- PowerShell çıktısı Türkçe karakterleri bozabilir; dosya yazmayı `write`/`edit` veya Node ile yap.
- cPanel'de `Options -MultiViews` olmadan uzantısız URL'ler çakışabilir.
- Vercel'de `.htaccess` ve PHP çalışmaz; 301'ler ve formlar yalnızca cPanel'de gerçektir.
- `src/content/pages` route değildir; yayınlanan sayfa için `src/pages/` altında Astro dosyası gerekir.
