# Tasarım Sistemi

> Kurumsal, sade ve fotoğraf odaklı. Amaç "etkileyici demo" değil, güven veren bir grup sitesi.

## 1. Tasarım ilkeleri

1. **Fotoğraf iş kanıtıdır.** Proje ve sektör görselleri her zaman görünür; hover arkasına saklanmaz.
2. **Mavi taşıyıcıdır.** `#045091` geniş yüzeylerde ve ana eylemlerde kullanılır; süs rengi değildir.
3. **Amber yalnızca ölçüm verisidir.** Kapasite, MW, yıl gibi değerlerde sınırlı kalır.
4. **Tek güçlü moment.** Her bölümde animasyon yok; hero ve gerekli geçişler yeterli.
5. **Net hiyerarşi.** Büyük başlık, kısa açıklama, ölçü, eylem. Fazlalık yok.
6. **Doğrudan gezinme.** Sayfalar normal yüklenir; süslü geçiş yok.

## 2. Renkler

`src/styles/global.css` içindeki Tailwind 4 token'ları:

| Token | Hex | Kullanım |
|---|---|---|
| `--color-ink` | `#061522` | Koyu bölüm, footer, ana metin |
| `--color-blue` | `#045091` | Fernas mavisi, CTA, bağlantı vurgusu |
| `--color-blue-deep` | `#033A6B` | Hover/koyu mavi |
| `--color-chalk` | `#F2F4F5` | Ana zemin |
| `--color-steel` | `#586B76` | İkincil metin, çizgi |
| `--color-amber` | `#E08A2B` | Yalnızca ölçüm/odak |
| `--color-white` | `#FFFFFF` | Kart, header, açık metin |

Kurallar:

- Krem + serif + terracotta yok.
- Near-black + acid green/vermilion yok.
- Geniş gradient wash yok.
- Aynı yuvarlak kart + aynı gölge kiti yok. Kartlar büyük ölçüde köşesiz; gölge yerine çizgi ve boşluk kullanılır.
- Odak halkası amber: `outline: 2px solid var(--color-amber); outline-offset: 4px`.

## 3. Tipografi

Astro Fonts API ile Google'dan self-host edilir; `font-display: swap`.

| Rol | Font | Kullanım |
|---|---|---|
| Display | **Archivo** | H1/H2, büyük sayılar |
| Gövde | **IBM Plex Sans** | Paragraf, buton, form |
| Veri | **IBM Plex Mono** | Kapasite, yıl, koordinat, küçük etiket |

Ölçek:

```css
--text-hero: clamp(3.25rem, 8.2vw, 8.75rem);
--text-section: clamp(2rem, 3.4vw, 3.6rem);
--text-lede: clamp(1.05rem, 1.35vw, 1.35rem);
```

Başlıklar `line-height: 0.94`, `letter-spacing: -0.035em`. Gövde `1rem / 1.6`.

Kurallar:

- All-caps mono eyebrow yok. `eyebrow` sınıfı normal büyük/küçük harf kullanır.
- Her başlığın üstüne etiket koyma.
- Uzun başlıklarda `text-wrap: balance`; paragraflarda `pretty`.

## 4. Boşluk ve ızgara

```css
--spacing-gutter: clamp(1.25rem, 4vw, 4.5rem);
```

- `.shell` → maksimum `96rem`, yatay gutter.
- `.shell-narrow` → maksimum `74rem`.
- `.section` → dikey bölüm boşluğu.
- Masaüstünde 12 kolon; metin 5/7 veya 4/8 olarak bölünür.
- Mobilde tek kolon; kartlar `sm:grid-cols-2`, masaüstünde `lg:grid-cols-3`.

## 5. Header

- Üstte koyu **utility bar**: Ankara konum, telefon, Haberler/Kariyer/İletişim.
- Altında beyaz **sticky header**: logo, ana menü, dil, arama, mavi iletişim butonu.
- Logo beyaz zeminde okunur; alt yazı kontrastı düzeltildi.
- Dropdown okları görünür; hover ve klavye ile açılır.
- Mobilde menü düğmesi; aynı kurumsal bağlantılar.
- Header yüksekliği `--header-h: 4.5rem`; sticky anchor boşluğu buna göre.

## 6. Ana sayfa bölümleri

1. **Hero:** Tam genişlik gerçek fotoğraf; sol hizalı başlık, iki eylem, sağ altta
   proje plakası, altta 5 değerli ölçü rayı. Fotoğraf 24 saniyede çok hafif
   yerleşir; `prefers-reduced-motion` altında durur.
2. **Haber şeridi:** Koyu mavi ince bant; en yeni 3 haber.
3. **Grup girişi:** Solda yapışkan başlık + iki paragraf; sağda iki fotoğraf ve
   kaynaklı kilometre taşları (`timeline.json`).
4. **Saha şeridi:** Koyu zeminde yatay kaydırmalı 8 gerçek proje; ok düğmeleri,
   ilerleme çizgisi, mono künye. Tek etkileşimli moment.
5. **Sektör mozaiği:** 2×2 büyük kare + 5 kare; her kare gerçek proje fotoğrafı,
   mono metrik. Eşit kart ızgarası değil.
6. **Projeler:** Bir geniş "feature" (21:9) + 3 kart (4:3); plaka fotoğrafın
   altında, üstünde değil.
7. **Sürdürülebilirlik:** Gerçek üretim fotoğrafı üzerinde koyu blok; amber ölçü.
8. **Haberler:** Tarih raylı editoryal liste; kart değil.
9. **CTA:** Mavi zemin, büyük başlık, adres/telefon satırı.

### İmza öğeleri

- **Proje plakası:** Fotoğrafın altında duran mono blok; proje · konum · yıl ·
  kapasite. Her zaman görünür, hover'a saklanmaz.
- **Saha şeridi:** Yatay snap'li fotoğraf bandı; her karede yıl/sektör ve
  kapasite. Ana sayfada bir kez.
- **Ölçü rayı:** Eşit kart değil, tek çizgi üzerinde bölümlenmiş değerler.
- **Fotoğraflı sessiz blok:** Düz lacivert zemin yerine gerçek tesis fotoğrafı +
  ölçülü koyu overlay.

Kural: Bu öğelerden en fazla üçü aynı sayfada kullanılır.

## 7. Kartlar

- Görsel üstte, her zaman görünür.
- Gövdede başlık, kısa açıklama, mono metrik.
- Hover: kart hafif yükselir, başlık maviye döner.
- Görsel zoom yok; hover'da fotoğraf büyütülmez.
- Köşe yarıçapı yok veya çok sınırlı; gölge yerine `border`/boşluk.
- Tıklama alanı kartın tamamıdır.

## 8. Butonlar ve bağlantılar

- `btn-primary`: mavi zemin, beyaz metin.
- `btn-white`: beyaz zemin, ink metin; hero üzerinde.
- `btn-light`: açık zemin; koyu bölümde.
- `btn-ghost`: çizgili, şeffaf.
- `link-underline`: alt çizgi; hover'da boşluk ve renk değişimi.
- Metne otomatik `→` eklenmez; ok yalnızca gerçek yönlendirmede ve `aria-hidden` ile.

## 9. Hareket

Mevcut kurulum: **Lenis smooth scroll** (`src/scripts/motion.ts`); GSAP kaldırıldı.

- Script ilk yüklemede değil, `requestIdleCallback` (veya `load`) sonrası
  dinamik import edilir; hero teslimini bloklamaz.
- Ana sayfada tek hareket: hero fotoğrafının 24 saniyelik yerleşmesi. Saha
  şeridi kullanıcı etkileşimiyle çalışır, otomatik kaymaz.
- Lenis yalnızca `prefers-reduced-motion` yoksa çalışır.
- Ağır animasyonlar `min-width: 1024px` ve `prefers-reduced-motion: no-preference` koşuluna bağlıdır.
- Mobilde native scroll; sadece CSS reveal.
- `ScrollTrigger.refresh()` font/görsel yüklemesinden sonra.
- **Sayfa geçişi yok.** `ClientRouter`, `astro:page-load`, `astro:before-swap`, wipe, perde, gecikmeli crossfade kullanılmaz.
- Animasyonlar `transform` + `opacity` ağırlıklı olmalı.
- Video eklenirse poster, `muted`, `playsinline`, `preload="metadata"`; LCP görseli video olmamalı.

## 10. Erişilebilirlik

- WCAG 2.2 AA hedefi.
- Tüm etkileşimler klavye ile; görünür odak.
- Skip link: "İçeriğe geç".
- Formlarda `label`, hata `role="alert"`, başarı `role="status"`.
- Renk kontrastı: mavi üzerinde beyaz, ink üzerinde beyaz; amber yalnızca koyu metinle.
- `prefers-reduced-motion` tüm animasyonları durdurur.
- Görsellerde anlamlı alt metin; dekoratif görsellerde `alt=""`.
- Dil değiştirici hedef sayfanın EN/TR karşılığına gitmeli; yoksa gösterilmemeli.

## 11. Yapılmaması gerekenler

- Her bölümde fade-up.
- Anlamsız `01 / 02 / 03`.
- Her başlık üstünde all-caps mono etiket.
- Hover'da açılan gizli fotoğraf.
- Custom cursor, ses, gereksiz 3D.
- Metin yerine dekoratif gradient.
- Sayfa geçişinde tam ekran perde.
- Aynı anda birden fazla scroll kütüphanesi.
- Video arka planı yüzünden LCP'yi geciktirmek.

## 12. Referans

- Görsel referans: <https://masis-six.vercel.app/index.html>
- Ekran görüntüleri: `docs/reference/`
- Mevcut sayfa örnekleri: `screenshots/` (git dışı)
