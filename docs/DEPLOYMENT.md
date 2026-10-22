# Dağıtım

Üretim hedefi **cPanel**'dir. **Vercel** yalnızca önizleme, paylaşım ve görsel inceleme içindir.

## 1. Gereksinimler

- Node.js **22.23.4+** (Vercel için `.nvmrc` → 24)
- npm
- cPanel: Apache, PHP 8+ (yalnızca form endpoint'leri için)
- GitHub hesabı
- Vercel hesabı (önizleme için)

## 2. GitHub

Repo ilk kez yayınlanacaksa:

```bash
git init -b main
git add .
git commit -m "chore: initial Fernas static site"
gh repo create Eraycann/fernas-web --public --source=. --remote=origin --push
```

Sonraki değişiklikler:

```bash
git add .
git commit -m "feat: ..."
git push
```

`node_modules`, `dist`, `screenshots`, `release`, `data/raw` ve `.playwright-mcp` git dışındadır. `public/images` ve `public/belgeler` repodadır; bu yüzden repo boyutu ilk klonda birkaç on MB olabilir.

## 3. Vercel önizleme

### Panelden

1. Vercel → **Add New → Project**.
2. GitHub reposunu içe aktar.
3. Ayarlar:
   - Framework Preset: **Astro**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`
4. Environment Variables:
   - `PUBLIC_DEMO_MODE=true` (isteğe bağlı; `.vercel.app` alan adında formlar zaten demo)
5. Deploy.

`vercel.json` bu ayarları ve güvenlik başlıklarını içerir:

- `X-Robots-Tag: noindex, nofollow` → önizleme aramalarda indekslenmez.
- `_astro/*` için uzun cache.
- `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`.

### CLI ile

```bash
vercel login
vercel link
vercel --prod
```

### Vercel'de formlar

Vercel PHP çalıştıramaz. `src/lib/demo.ts` şu durumlarda formu demo moduna alır:

- `npm run dev`
- `PUBLIC_DEMO_MODE=true`
- alan adı `.vercel.app` ile bitiyorsa

Demo modunda ağ isteği yapılmaz; başarı mesajı gösterilir, e-posta gönderilmez. Gerçek form gönderimi için cPanel gerekir. Vercel'de gerçek form isteniyorsa ayrı bir serverless fonksiyon veya harici form servisi gerekir; bu projenin kapsamı dışındadır.

### Vercel'de bilinmesi gerekenler

- `astro.config.ts` içindeki `site` üretim adresidir (`https://www.fernas.com.tr`). Canonical ve sitemap üretim adresini gösterir; önizlemede bu normaldir.
- Pagefind `dist/pagefind/` altında statik olarak servis edilir.
- `.htaccess` Vercel'de çalışmaz; 301'ler yalnızca cPanel'de geçerlidir.
- Vercel önizlemesi `noindex` olduğu için arama motorlarında görünmez.

## 4. cPanel üretim

### Paket üret

```bash
npm ci
npm run check
npm run validate:content
npm run build
npm run package
```

Çıktı: `release/fernas-cpanel-YYYY-MM-DD.zip`

Zip içinde:

- `index.html`, tüm statik sayfalar
- `_astro/` (CSS, JS, font)
- `images/`, `belgeler/`
- `pagefind/`
- `.htaccess`
- `contact.php`, `application.php`
- `404.html`
- 301 yönlendirmeleri `.htaccess` içinde

### Yükle

1. cPanel → **File Manager** → `public_html`.
2. Mevcut siteyi yedekle.
3. Zip'i yükle ve **Extract** et.
4. `.htaccess` dosyasının görünür olduğundan emin ol.
5. `https://www.fernas.com.tr/` adresini test et.

### PHP ayarları

`public/contact.php`:

```php
const DEMO_MODE = false;
const CONTACT_TO = 'gercek-adres@fernas.com.tr';
const FROM_EMAIL = 'no-reply@fernas.com.tr';
```

`public/application.php`:

```php
const DEMO_MODE = false;
const HR_TO = 'gercek-ik@fernas.com.tr';
const FROM_EMAIL = 'no-reply@fernas.com.tr';
```

`application.php` CV'leri `public_html` dışında `../storage/applications` altına yazar. Bu dizinin PHP tarafından yazılabilir olduğundan emin ol.

`SITE_HOSTS` yalnızca `www.fernas.com.tr` ve `fernas.com.tr` kabul eder. Farklı bir alan adı kullanılacaksa güncelle.

### Form testi

1. Geçerli bir mesaj gönder.
2. E-posta ulaştı mı?
3. Honeypot ve 2,5 saniye zaman tuzağı çalışıyor mu?
4. KVKK onayı olmadan gönderim reddediliyor mu?
5. CV yükleme: PDF/DOC/DOCX, maksimum 5 MB.
6. 45/60 saniye throttle çalışıyor mu?

PHP lokalde yoksa cPanel'de veya taşınabilir PHP ile test et.

## 5. `.htaccess`

`public/.htaccess` şunları içerir:

- `Options -MultiViews`
- HTTPS yönlendirmesi
- `ErrorDocument 404 /404.html`
- Güvenlik başlıkları
- `mod_deflate`
- `mod_expires` + cache
- MIME tipleri
- 301 yönlendirme bloğu (`RULE_INSERT_POINT`)

301 listesi `docs/redirects.csv` dosyasından üretilir. Eski WordPress URL'leri korunur.

## 6. DNS / alan adı

- Üretim: `www.fernas.com.tr`
- `fernas.com.tr` → `www` yönlendirmesi
- Vercel önizleme: `*.vercel.app` (noindex)

Alan adı değişirse `astro.config.ts` içindeki `site`, `src/data/site.json` ve PHP `SITE_HOSTS` güncellenmeli.

## 7. Yayın sonrası kontrol

- [ ] Ana sayfa TR/EN açılıyor.
- [ ] Header dropdown ve mobil menü çalışıyor.
- [ ] Proje arşivi ve 105 proje detayı açılıyor.
- [ ] Pagefind arama sonuç veriyor.
- [ ] 404 sayfası özel.
- [ ] Eski URL'ler 301 veriyor.
- [ ] Formlar e-posta gönderiyor.
- [ ] CV yükleme çalışıyor.
- [ ] Lighthouse hedefleri tutuyor.
- [ ] `.htaccess` cache ve güvenlik başlıkları aktif.
- [ ] Sitemap ve robots.txt doğru.
- [ ] Görseller CDN/cache üzerinden hızlı geliyor.

## 8. Geri alma

- cPanel yedeğini geri yükle.
- Önceki `release/fernas-cpanel-*.zip` dosyasını tekrar aç.
- DNS değişikliği yapıldıysa TTL süresini bekle.

## 9. Güvenlik notları

- `PUBLIC_*` değişkenlerine gizli anahtar koyma; istemciye gider.
- PHP endpoint'lerinde `DEMO_MODE = false` yapmadan yayına alma.
- `storage/applications` dizinini web'den erişilemez tut.
- Form spam'ini izle; gerekirse rate limit'i güçlendir.
- Vercel önizlemesini herkese açık paylaşırken kişisel veri içeren form gönderimi yapılmamalı.
