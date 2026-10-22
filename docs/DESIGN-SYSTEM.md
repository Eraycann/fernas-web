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

1. **Hero:** Tam genişlik fotoğraf, koyu lacivert overlay, sol hizalı başlık, iki buton.
2. **Ölçüm şeridi:** Hero altında 5 değer; mono sayı, küçük etiket.
3. **Haber şeridi:** En yeni 3 haber, ince çizgi, "Tüm haberler".
4. **Hakkımızda:** 5/7 kolon; kısa metin, üç bağlantı.
5. **Sektörler:** Görünür fotoğraf kartları; 3 kolon.
6. **Projeler:** Görünür fotoğraf kartları; 3 kolon.
7. **Sürdürülebilirlik:** Koyu lacivert geniş bant; 570 MW / 485 MW / %100.
8. **Haberler:** Editoryal liste veya kart.
9. **CTA:** Mavi zemin, tek net eylem.

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

Mevcut kurulum: **tek Lenis + GSAP ticker** (`src/scripts/motion.ts`).

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
