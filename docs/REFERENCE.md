# Referanslar

## 1. Dış referans

- **Canlı önizleme:** <https://fernas-web.vercel.app>\n- **GitHub:** <https://github.com/Eraycann/fernas-web>\n- **MASİS kurumsal site:** <https://masis-six.vercel.app/index.html>
- **Fernas mevcut site:** <https://www.fernas.com.tr/>
- **Yerel önizleme:** `http://localhost:4322/` (preview portu değişebilir)

MASİS yalnızca **düzen ve hiyerarşi** referansıdır. Logo, metin, görsel veya marka öğeleri kopyalanmaz.

## 2. Alınan fikirler

- Koyu ince üst bilgi şeridi + beyaz sticky header.
- Tam genişlikte fotoğraflı hero ve hemen altında ölçüm şeridi.
- Beyaz/gri bölüm ritmi; aşırı koyu ve yoğun sayfa yok.
- Görünür fotoğraf kartları; hover ile gizlenen görsel yok.
- Sektör ve proje kartlarında kısa metin + tek metrik.
- Koyu sürdürülebilirlik bandı ve mavi CTA.
- Büyük ama kontrollü başlık ölçeği.

## 3. Alınmayanlar

- MASİS'in kendi logosu, metinleri, görselleri.
- Süslü sayfa geçişleri, tam ekran perdeler.
- Her bölümde aynı fade-up.
- Aşırı büyük, ekranı kaplayan editoryal başlıklar.
- Hover arkasına saklanan proje fotoğrafları.
- Türkiye haritası, pinlenmiş yatay tarihçe, custom cursor.

## 4. Ekran görüntüleri

### Referans site

| Dosya | Ne gösterir |
|---|---|
| `docs/reference/masis-reference-top.png` | Üst header, hero, ölçüm şeridi |
| `docs/reference/masis-reference-mid.png` | Orta bölüm ritmi |
| `docs/reference/masis-reference-mid2.png` | Kart/haber düzeni |
| `docs/reference/masis-reference-mobile.png` | Mobil hero ve menü |

### Mevcut Fernas tasarımı

| Dosya | Ne gösterir |
|---|---|
| `docs/reference/review-2026-home-hero-2.png` | TR ana sayfa hero |
| `docs/reference/review-2026-home-sectors.png` | Sektör kartları |
| `docs/reference/review-2026-home-projects.png` | Proje kartları |
| `docs/reference/review-2026-home-news.png` | Haber bölümü |
| `docs/reference/review-2026-home-sustain.png` | Sürdürülebilirlik bandı |
| `docs/reference/review-2026-home-footer.png` | Footer |
| `docs/reference/review-2026-mobile-menu.png` | Mobil menü |
| `docs/reference/review-2026-subpage-desktop.png` | Alt sayfa düzeni |

> Bu görüntüler tasarım kaynağı değil, inceleme kaydıdır. Güncel site için `npm run dev` veya Vercel önizlemesini kullan.

## 5. Tasarım karşılaştırma notları

| Konu | Eski/ilk deneme | Şimdiki |
|---|---|---|
| Sayfa geçişi | `ClientRouter` + blueprint wipe | Normal tam yükleme |
| Proje fotoğrafı | Hover ile açılan önizleme | Her zaman görünür kart |
| Ana sayfa | Yoğun editoryal bloklar | Hero + ölçüm + net bölümler |
| Tarihçe | Pinlenmiş yatay track | Normal dikey akış |
| Harita | Türkiye haritası | Kaldırıldı |
| Başlıklar | Aşırı büyük | Kontrollü ölçek |
| Zemin | Krem | `#F2F4F5` nötr |
| Numara | 01/02/03 | Kaldırıldı |

## 6. İçerik kaynakları

- WordPress REST/sitemap ve HTML: `https://www.fernas.com.tr/`
- İçerik envanteri: `docs/content-inventory.csv`
- 301 haritası: `docs/redirects.csv`
- İçerik notları: `data/TODO.md`
- Politikalar: `src/data/policies.json`, `public/belgeler/`

## 7. Yeni referans eklerken

- Görseli `docs/reference/` altına koy.
- Kaynağı ve tarihi bu dosyaya yaz.
- Başka bir şirketin logosunu/metnini projeye taşıma.
- Ekran görüntüsünde kişisel veri varsa maskele.
