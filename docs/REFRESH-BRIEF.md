# Fernas Web — Yenileme Brief'i

> Bu dosya, 2026 Ekim yenileme dalgasının ortak yönünü tanımlar.
> Çalışma sırası: `AGENTS.md` → `docs/AI-HANDOFF.md` → `docs/PLAN.md` → bu dosya.
> Buradaki kurallar, `docs/DESIGN-SYSTEM.md` ile birlikte okunur. Çelişki varsa
> `AGENTS.md` ve `docs/CONTENT-RULES.md` üstündür.

## 1. Amaç

Site teknik olarak sağlam; eksik olan **sahne ve editoryal güç**. Yenilemenin
hedefi, Fernas'ı "kurumsal bir iskelet" gibi değil, **1982'den beri sahada
çalışan, ölçülebilir iş üreten bir grup** gibi göstermek.

- Daha fazla gerçek fotoğraf; daha az boş gri alan.
- Daha güçlü ana sayfa hiyerarşisi; şablon hissi vermeyen bir ritim.
- Proje arşivi ve proje detayında gerçek bir keşif deneyimi.
- Video için hazır, dürüst bir altyapı: gerçek kaynak yoksa sahte video yok.
- LCP < 2,0 s, CLS < 0,05, a11y ve klavye akışı korunarak.

## 2. Değişmeyen sınırlar

- Statik çıktı; Node/CMS/veritabanı yok. Formlar yalnızca PHP endpoint.
- `ClientRouter`, view transition, wipe, perde, gecikmeli crossfade yok.
- Marka mavisi `#045091` taşıyıcı; amber yalnızca ölçüm verisi.
- Archivo + IBM Plex Sans + IBM Plex Mono.
- Fotoğraflar her zaman görünür; hover arkasına saklanmaz.
- Fernas hakkında kaynaksız bilgi, uydurma kapasite/müşteri/görsel yok.
- Hukuki metinler anlamca değişmez.
- Türkçe karakterler bozulmaz; dosyalar UTF-8 yazılır (`write`/`edit`/Node).
- Her bölümde animasyon yok: **tek güçlü moment**.
- Krem + serif + terracotta, near-black + acid green, anlamsız 01/02/03,
  her başlık üstünde all-caps mono etiket yok.

## 3. Sanat yönü: "Ölçülü saha modernizmi"

Site bir inşaat mühendisliği defteri gibi okunmalı: **fotoğraf, ölçü, konum,
yıl**. Süs değil kanıt. Üç katmanlı bir görsel dil:

1. **Saha fotoğrafı** — gerçek proje/tesis görseli, geniş ve net.
2. **Ölçü çizgisi** — ince yatay çizgi, mono birim, küçük etiket.
3. **Editoryal başlık** — Archivo, sıkı tracking, iki satırı geçmeyen güçlü cümle.

İmza öğeleri (en fazla üçü aynı sayfada):

- **Proje plakası:** Fotoğrafın üzerine binmeyen, altında duran küçük mono blok:
  proje adı · konum · yıl · kapasite. Yeni bir "hover reveal" değil; her zaman görünür.
- **Saha şeridi:** Yatay kaydırılan, snap'li gerçek fotoğraf bandı. Her karede
  proje adı ve yıl. Tek güçlü moment olarak ana sayfada bir kez.
- **Ölçü rayı:** 570 MW / 485 MW / 14 tesis / 1,5M / 60+ değerleri; eşit kartlar
  değil, tek çizgi üzerinde bölümlenmiş bir ray.
- **Fotoğraflı sessiz blok:** Koyu lacivert zemin yerine gerçek bir tesis
  fotoğrafı + üzerinde ölçülü koyu overlay. Metin okunabilirliği korunur.

Fotoğraf kalitesi düşükse (kaynak < 800 px) büyütme yok; **duotone + ince grain**
ile bilinçli bir arşiv estetiğine çevrilir. Bu, 52 düşük çözünürlüklü görsel için
tek tutarlı çözümdür.

## 4. Sayfa bazlı hedefler

### Ana sayfa
- Hero: en güçlü gerçek fotoğraf; başlık korunur; altında proje plakası ve ölçü rayı.
- "Grup hakkında": iki fotoğraflı editoryal blok + kaynaklı kilometre taşları.
- Sektörler: eşit 3×2 grid yerine asimetrik mozaik; her karede fotoğraf ve metrik.
- Öne çıkan projeler: ilk proje geniş "feature", kalanı dengeli grid.
- Saha şeridi: 8 gerçek fotoğraf, yatay kaydırma, mono caption.
- Sürdürülebilirlik: fotoğraflı koyu blok; sayılar amber ölçü olarak.
- Haberler: 3 eşit kart yerine tarih raylı editoryal liste.
- CTA ve footer: mevcut netlik korunur, boşluk ritmi sıkılaşır.

### Kurumsal sayfalar (hakkımızda, tarihçe, sürdürülebilirlik, sektörler)
- Her sayfada en az bir gerçek fotoğraf bandı ve bir ölçü/proje bağlantısı.
- Hakkımızda: 1982–bugün omurgası, kaynaklı dönüm noktaları.
- Sürdürülebilirlik: üretim fotoğrafı + ISO/ölçüm bloğu.

### Proje arşivi
- 105 kaydı tek seferde basmak yerine ilk 24 + "daha fazla" (JS'siz de çalışır).
- Sektör, durum, ülke filtreleri; arama; sonuç sayısı; URL state.
- Kartlar 4:3, her zaman görünür fotoğraf, mono meta.

### Proje detayı
- Tam genişlik kapak; başlık ve ölçüler kapak üzerinde değil, hemen altında.
- Yapışkan bilgi paneli (sektör, yıl, kapasite, durum, kaynak).
- Galeri + erişilebilir lightbox (gerçek fotoğraf varsa).
- İlgili projeler ve önceki/sonraki.

### Arama
- Pagefind sonuçlarını marka diline yaklaştır; klavye ve boş durum düzgün.

## 5. Hareket

- Tek güçlü moment: ana sayfadaki saha şeridinin ilk görünümü veya hero
  fotoğrafının 600 ms'lik yavaş yerleşmesi. İkisi aynı anda olmaz.
- Diğer her şey 120–180 ms `opacity`/`transform`.
- `prefers-reduced-motion` altında hareket sıfır.
- Mobilde native scroll; Lenis yalnızca masaüstünde ve LCP sonrası yüklenir.

## 6. Performans bütçesi

- Ana sayfa LCP < 2,0 s (mobil 4G, Vercel).
- Ana sayfa JS < 120 KB gzip; GSAP/Lenis ilk yüklemede kritik değil.
- Hero: AVIF/WebP, `srcset`, doğru `sizes`, `fetchpriority="high"`, preload.
- Görseller: kapak 1600/800/400; galeri 1200/800; lazy + boyut.
- Font: yalnızca kullanılan ağırlıklar; preload en fazla 2 dosya.
- LCP görseli asla video veya JS ile üretilmez.

## 7. Video politikası

Gerçek Fernas sahası/tesisi görüntüsü yoksa video **yayınlanmaz**. Bunun yerine:

- `VideoFacade` bileşeni ve `site.json` içinde `video` alanı hazırlanır.
- Kaynak eklendiğinde poster + tıkla-oynat; otomatik oynatma yok.
- Mobilde poster; `preload="none"`; LCP etkilenmez.

Sahte stok klip, yapay "teknoloji" montajı veya fotoğraflardan üretilmiş sahte
kurumsal film yok.

## 8. İş akışları ve dosya sahipliği

| Akış | Sorumlu | Dosyalar |
|---|---|---|
| Araştırma / skill / MCP | Araştırma ajanı | `docs/RESEARCH-STACK.md`, `.opencode/skills/**` |
| Medya | Medya ajanı | `public/images/**`, `data/media-*.json`, `scripts/media-*.mjs` |
| İçerik | İçerik ajanı | `src/content/**`, `src/lib/i18n.ts`, `docs/CONTENT-*` |
| Tasarım | Tasarım ajanı | `src/styles/**`, `src/components/home/**`, `src/components/layout/**`, `src/pages/index.astro`, `src/pages/en/index.astro` |
| UX | UX ajanı | `src/components/projects/**`, `src/components/ui/Gallery*`, `src/pages/projeler/**`, `src/pages/en/projects/**`, `src/pages/arama.astro`, `src/pages/en/search.astro`, `src/styles/archive.css` |
| Performans / a11y | Performans ajanı | `src/layouts/Base.astro`, `astro.config.ts`, `src/scripts/motion.ts`, `vercel.json`, `.htaccess` |
| QA | QA ajanı | `scripts/qa.mjs`, raporlar |

Kural: aynı dosyaya iki ajan yazmaz. Bir akış diğerinin dosyasına ihtiyaç
duyuyorsa önce brief'e not düşer, sonra orkestratör sırayı belirler.

## 9. Bitti tanımı

- `npm run check`, `npm run validate:content`, `npm run build` hatasız.
- Playwright + axe: 0 kritik/seri sorun; klavye akışları çalışıyor.
- Mobil Lighthouse: Perf ≥ 95, A11y ≥ 95, BP ≥ 95; LCP < 2,0 s; CLS < 0,05.
- TR/EN ana sayfa, proje arşivi, proje detayı, iletişim 390 px ve 1440 px'te doğru.
- Yeni görsellerin alt metni, kaynağı ve boyutları var.
- `dist/` Node'sız açılıyor; yeni cPanel paketi üretildi.
