# Durum — 22 Ekim 2026

## Nerede kaldık

Kurumsal sadeleştirme, görsel yenileme ve yayın altyapısı tamamlandı. Site artık hover ile açılan fotoğraf önizlemeleri, pinlenmiş yatay tarihçe, Türkiye haritası, süslü sayfa geçişi ve aşırı büyük editoryal başlıklar kullanmıyor.

- Ana sayfa (TR + EN) tam genişlikte fotoğraflı hero, altında ölçüm şeridi, haber şeridi, beyaz/gri bölümler ve görünür fotoğraf kartlarıyla yeniden yazıldı. Referans: MASİS kurumsal sitesinin net hiyerarşisi.
- `ClientRouter` ve `blueprint-wipe` tamamen kaldırıldı; sayfalar normal tam yükleme ile açılıyor.
- Header'a koyu üst bilgi şeridi, beyaz zemin, büyütülmüş logo, dropdown okları ve daha güçlü iletişim butonu eklendi.
- Proje arşivi ve sektör sayfaları görünür fotoğraf kartlarına çevrildi.
- Header'a kurumsal alt menü eklendi: Hakkımızda, Tarihçe, Üyelikler, Kalite belgeleri, Politikalar, Bilgi toplumu.
- Anlamsız 01/02/03 numaralandırmaları kaldırıldı; ölçüm bandı tek kaynak olarak kaldı.
- Sayfa H1'leri sadeleştirildi; footer dili doğrudan faaliyet alanlarını söylüyor.
- Logo alt yazısının beyaz header üzerindeki kontrastı düzeltildi.
- Vercel'de formların PHP'ye istek atmasını önleyen demo modu eklendi (`src/lib/demo.ts`).

## Yayın altyapısı

- GitHub: `https://github.com/Eraycann/fernas-web` (public)
- Vercel: `https://fernas-web.vercel.app` (production alias, public; `noindex`)
- CI: `.github/workflows/ci.yml` — `npm ci`, `check`, `validate:content`, `build`.
- Vercel ayarları: `vercel.json`, `.vercelignore`, `.nvmrc`.
- Üretim hedefi: cPanel `public_html`. Vercel yalnızca önizleme; PHP ve `.htaccess` orada çalışmaz.

## Yeni devir dosyaları

- `docs/AI-HANDOFF.md` — başka model/ajan için tam bağlam ve başlangıç promptu.
- `docs/CONTENT-MODEL.md` — JSON alanları, içerik ekleme, TR/EN.
- `docs/DESIGN-SYSTEM.md` — renk, tipografi, bileşen, hareket kuralları.
- `docs/DEPLOYMENT.md` — Vercel ve cPanel adımları.
- `docs/ROADMAP.md` — yayın öncesi işler, video/animasyon sınırları.
- `docs/REFERENCE.md` + `docs/reference/` — referans ve mevcut tasarım görüntüleri.

## Doğrulama

- `npm run check`: **0 hata, 0 uyarı** (10 hint).
- `npm run build`: **268 sayfa**; Pagefind **266 sayfa** indeksledi.
- Playwright + axe (`npm run qa`): **54 sayfa/genişlik kombinasyonu, 0 sorun** (Vercel production alias üzerinde de doğrulandı).
- `npm run validate:content`: hata yok, 10 uyarı (4 projede İngilizce eksik, iletişim e-postası boş, iki farklı telefon).
- Önceki cPanel paketi: `release/fernas-cpanel-2026-10-22.zip` — **26.17 MB**, 129 adet 301. **Yeni tasarım sonrası paket yeniden üretilmeli.**
- Lighthouse son hâl için çalıştırıldı: Vercel mobilde Perf 97, A11y 100, BP 100, SEO 69 (önizleme `noindex`). LCP 2,5 s; 2,0 s hedefi açık. CLS 0, TBT 30 ms.

## Önizleme

- Yerel: `http://localhost:4322/` (preview portu değişebilir)
- Vercel: `https://fernas-web.vercel.app` — GitHub reposuna bağlı, production alias. Formlar `PUBLIC_DEMO_MODE=true` ile demo.
- Ekran görüntüleri: `screenshots/` (git dışı) ve `docs/reference/`.

## Bilinen açıklar / yayın öncesi

- Gerçek iletişim e-postası bilinmiyor; `contact.php` içinde `info@fernas.com.tr`, `application.php` içinde `ik@fernas.com.tr` yer tutucu.
- İki telefon var: `+90 312 454 16 00` ve `+90 312 426 6262`; hangisinin güncel olduğu teyit edilmeli.
- PHP lokalde yok; form endpoint'leri cPanel'de veya taşınabilir PHP ile test edilmeli.
- İngilizce proje: **101/105**, İngilizce sayfa: **13/23**.
- İngilizce hukuki/politika kaynak metni yok; İngilizce sayfalar Türkçe PDF'lere bağlanıyor.
- 52 proje görseli düşük çözünürlüklü.
- Vektörel logo yok; mevcut PNG 328×145.
- 2018-02-08 sonrası haber yok.
- `test`, `insaat-2`, `devam-eden-projeler-2`, `tamamlanan-projeler-2` demo kayıtları yayına alınmamalı.
- Vercel formları demo; gerçek gönderim cPanel'de.

## Sıradaki işler

1. Vercel deployment'ını doğrula; TR/EN ana sayfa ve bir proje detayını aç.
2. LCP'yi 2,0 s altına indir; hero görseli ve kritik CSS teslimini iyileştir.
3. Gerçek e-posta/telefon bilgisini al ve form endpoint'lerini güncelle.
4. İngilizce eksik 4 proje ve 10 sayfayı tamamla veya dil bağlantısını koşullu yap.
5. Yüksek çözünürlüklü görselleri temin et.
6. cPanel'de zip'i açıp `.htaccess` 301'lerini, 404'ü ve formları doğrula.
7. Son cPanel paketini üret.

## Hızlı komutlar

```powershell
$env:PATH = 'C:\Users\Erayc\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64;' + $env:PATH

npm run check
npm run validate:content
npm run build
npm run preview
npm run qa
npm run package
```

- Türkçe karakterli dosyaları PowerShell `Set-Content` ile yazma; `write`/`edit` veya Node kullan.
- Vercel'de `.htaccess` ve PHP çalışmaz.
