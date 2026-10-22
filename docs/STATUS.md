# Durum — 22 Ekim 2026

## Nerede kaldık

Ekim yenileme dalgası tamamlandı. Site artık kurumsal iskeletin ötesinde bir
**saha defteri** gibi okunuyor: gerçek fotoğraf, mono ölçü, editoryal başlık.
Statik sınır, PHP formlar ve kaynaksız içerik yasağı korunuyor.

### Ana sayfa (TR + EN)

- Yeni hero: Sebenoba Rüzgâr Enerji Santrali, önceden kırpılmış 640/1080/1600
  WebP seti, `fetchpriority="high"` + preload, 24 saniyelik çok yavaş yerleşme
  (yalnızca `prefers-reduced-motion: no-preference`).
- Hero altında proje plakası ve beş değerli ölçü rayı.
- **Saha şeridi:** yatay kaydırmalı 8 gerçek proje; ok düğmeleri, ilerleme çizgisi,
  klavye ile kaydırma. Sayfanın tek etkileşimli momenti.
- **Sektör mozaiği:** 2×2 büyük İnşaat karesi + 5 kare; görseller sektör
  stokları değil, gerçek proje kapakları (`home.json` → `sectorMedia`).
- **Öne çıkan proje:** Şirvan Barajı geniş format + 3 proje kartı.
- **Sürdürülebilirlik:** güneş santrali fotoğrafı üzerinde koyu blok, amber ölçüler.
- **Haberler:** kart yerine tarih raylı editoryal liste.
- CTA ve footer aynı netlikte; boşluk ritmi sıkılaştırıldı.
- Eski `home-hero` / `content-card` / `sustain-panel` CSS'i silindi; ana sayfa
  stilleri ayrı `src/styles/home.css` dosyasında.

### Proje arşivi ve detayı

- Arşiv ilk 24 kaydı basıyor; "Daha fazla proje" 24'er artırıyor. Filtre
  değişince limit sıfırlanıyor. JS kapalıyken de ilk 24 sunucudan geliyor.
- Sektör filtresi URL'e yazılıyor (`?sector=enerji`), sayfa yenilenince korunuyor.
- Filtre sırası sabit: İnşaat, Enerji, Doğalgaz, Sanayi, Gıda, Turizm.
- Kartlar 4:3, her zaman görünür fotoğraf, mono künye, durum etiketi.
- Proje detayı: tam genişlik kapak → başlık → 4'lü ölçü satırı → gövde →
  yapışkan künye → aynı sektörden 3 proje → önceki/sonraki.
- `video` + `video_poster` alanları eklendi; dolu olduğunda `VideoFacade`
  tıkla-oynat olarak çalışır. Sahte stok video yok, alanlar boş.

### Kurumsal sayfalar

- Hakkımızda ve Sürdürülebilirlik sayfalarına üçlü **fotoğraf bandı** eklendi
  (gerçek proje görselleri, mono alt yazı).
- Tarihçe İngilizce metinleri `timeline.json` içine eklendi.

### Hareket ve teslim

- GSAP ve kullanılmayan kütüphaneler (`gsap`, `embla-carousel`, `zod`)
  kaldırıldı. Yalnızca Lenis kaldı; `motion.ts` ilk yüklemede değil
  `requestIdleCallback` sonrası yükleniyor ve gzip 5,4 KB.
- Sadece iki preload kaldı: Archivo ve hero görseli. IBM Plex Sans `swap` ile
  yükleniyor.
- Hero görselleri `public/images/hero/` altında; 1080 sürümü 29 KB.

### Araç yığını

- `docs/RESEARCH-STACK.md` yazıldı.
- Kurulan skill'ler: `astro`, `accessibility`, `performance`, `core-web-vitals`,
  `seo`, `best-practices` (`.agents/skills/`).
- MCP önerileri: Playwright, Astro Docs, Lighthouse, Context7 (kurulum komutları
  dokümanda; hiçbiri üretim cPanel'ine bağlanmaz).

## Yayın altyapısı

- GitHub: `https://github.com/Eraycann/fernas-web` (public)
- Vercel: `https://fernas-web.vercel.app` (`noindex`, formlar demo)
- CI: `.github/workflows/ci.yml` — `npm ci`, `check`, `validate:content`, `build`.
- Üretim hedefi: cPanel `public_html`. Vercel'de PHP ve `.htaccess` çalışmaz.

## Doğrulama

- `npm run check`: **0 hata, 0 uyarı** (10 hint).
- `npm run build`: **268 sayfa**; Pagefind **266 sayfa** indeksledi.
- `npm run validate:content`: **0 hata, 10 uyarı** (4 projede İngilizce eksik,
  e-posta boş, iki farklı telefon).
- `npm run qa`: **54 sayfa/genişlik, 0 sorun**.
- Lighthouse (yerel preview, mobil simülasyon): **Perf 95**, A11y 100, BP 100,
  LCP 2,4 s, CLS 0, TBT 0 ms. Vercel ölçümü yeniden alınmalı; önceki koşu 97 /
  2,5 s idi ve hero görseli şimdi 5× daha küçük.
- Etkileşim testi: saha şeridi okları (scrollLeft 0 → 1140), arşiv filtresi
  (105 → 20, URL `?sector=enerji`), "daha fazla" (24 → 48), mobil menü.

## Bilinen açıklar / yayın öncesi

- Gerçek e-posta ve telefon hâlâ teyit edilmedi.
- PHP formları cPanel'de test edilmedi; Vercel'de demo.
- İngilizce proje 101/105, sayfa 13/23.
- 52 proje görseli düşük çözünürlüklü; büyütülmedi.
- Gerçek Fernas saha videosu yok; `video` alanları boş.
- 2018 sonrası haber yok.
- Vercel production Lighthouse yeniden ölçülmedi.
- `dist/` yeni tasarımla üretildi; cPanel zip'i yeniden paketlenmeli.

## Sıradaki işler

1. Vercel'e push edip TR/EN ana sayfa, arşiv ve detayı gerçek cihazda doğrula;
   Lighthouse'u yeniden ölç.
2. Gerçek e-posta/telefonu al, `contact.php` ve `application.php`'yi güncelle.
3. cPanel'de form, CV, 404, 301 ve cache testlerini yap; yeni zip üret.
4. Gerçek saha videosu gelirse `video` + `video_poster` alanlarını doldur.
5. Yüksek çözünürlüklü görselleri temin et; `low_res` listesini kapat.
6. İngilizce eksik 4 proje ve 10 sayfa için kaynak metin tamamla.

## Hızlı komutlar

```bash
npm run dev
npm run check
npm run validate:content
npm run build
npm run preview
QA_BASE=http://localhost:4322 npm run qa
npm run package
```

- Node 22.23.4+ gerekir; makinede yolu `node -v` ile doğrula.
- Türkçe karakterli dosyaları PowerShell `Set-Content` ile yazma.
