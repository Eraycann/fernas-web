# İçerik Modeli

Bu proje CMS kullanmaz. İçerik, build sırasında JSON dosyalarından okunur ve statik HTML'e dönüşür.

## 1. Kaynaklar

| Tür | Konum | Adet |
|---|---|---:|
| Proje | `src/content/projects/*.json` | 105 |
| Haber | `src/content/news/*.json` | 13 |
| Kurumsal sayfa kaydı | `src/content/pages/*.json` | 23 |
| Sektör | `src/data/sectors.json` | 6 |
| Sektör sayfa metni | `src/data/sector-pages.json` | 6 |
| İstatistik | `src/data/stats.json` | 5 |
| Politika | `src/data/policies.json` | 16 |
| Kalite belgesi | `src/data/certificates.json` | 8 |
| Üyelik | `src/data/memberships.json` | 16 |
| Zaman çizgisi | `src/data/timeline.json` | 4 |
| Site bilgileri | `src/data/site.json` | 1 |
| Bilgi toplumu | `src/data/bilgi-toplumu.json` | 1 |

`src/content/pages` bir route tanımı değildir; WordPress'ten alınan sayfa gövdelerinin arşividir. Yayınlanan kurumsal sayfalar `src/pages/grup/*.astro` içinde elle kurulur. `test`, `insaat-2`, `devam-eden-projeler-2`, `tamamlanan-projeler-2` yayına alınmaz.

## 2. Proje

Dosya adı genelde slug ile aynıdır. Zorunlu alanlar: `slug`, `title_tr`, `sector`, `cover`.

```json
{
  "slug": "sinop-ayancik-devlet-yolu",
  "legacy_slug": "sinop-ayancik-devlet-yolu",
  "title_tr": "Sinop Ayancık Devlet Yolu",
  "title_en": "Sinop Ayancık State Road",
  "sector": "insaat",
  "status": "tamamlandi",
  "country": "Türkiye",
  "city": "Sinop",
  "year": 2015,
  "client": "",
  "capacity": "42 km",
  "scope_tr": "Yol yapım işi.",
  "scope_en": "Road construction works.",
  "body_html_tr": "<p>Yol yapım işi.</p>",
  "body_html_en": "<p>Road construction works.</p>",
  "cover": "/images/projects/sinop-ayancik-devlet-yolu/cover-1600.webp",
  "gallery": [],
  "alt_tr": "Sinop Ayancık Devlet Yolu — inşaat",
  "alt_en": "Sinop Ayancık State Road — construction",
  "featured": false,
  "sort": 1,
  "source_url": "https://www.fernas.com.tr/portfolio/.../",
  "source_url_en": "https://www.fernas.com.tr/portfolio/.../?lang=en",
  "low_res": false
}
```

### Alanlar

| Alan | Tip | Not |
|---|---|---|
| `slug` | string | Benzersiz, URL güvenli |
| `legacy_slug` | string | Eski WordPress slug'ı; 301 için |
| `title_tr` / `title_en` | string | EN yoksa TR kullanılır |
| `sector` | enum | `insaat`, `enerji`, `dogalgaz-dagitim`, `sanayi`, `gida`, `turizm` |
| `status` | enum | `tamamlandi`, `devam-ediyor`, `isletmede`, `planlama` |
| `country`, `city` | string | Boş bırakılabilir |
| `year` | number \| null | Bilinmiyorsa `null` |
| `client` | string | Kaynak yoksa boş |
| `capacity` | string | Ölçüm değeri; amber/mono vurgu |
| `scope_tr` / `scope_en` | string | Kısa kapsam |
| `body_html_tr` / `body_html_en` | string | Güvenilir kaynaktan HTML |
| `cover` | string | `/images/...` yolu |
| `gallery` | string[] | Çoğu projede boş |
| `alt_tr` / `alt_en` | string | Görseli betimleyen metin |
| `featured` | boolean | Ana sayfa/öne çıkan sıralaması |
| `sort` | number | Eşit yıl içinde sıra |
| `source_url` | string | Zorunlu kaynak |
| `low_res` | boolean | Kaynak genişliği < 800 px |

`src/lib/projects.ts` alanları normalize eder, sektör adlarını TR/EN'e çevirir ve `featured` + yıl + başlığa göre sıralar. Yeni alan eklerken hem JSON'u hem bu loader'ı güncelle.

### Görsel kuralı

```text
public/images/projects/<slug>/cover-1600.webp   → kart/detay
public/images/projects/<slug>/cover-800.webp    → mobil/küçük kart
```

Görsel yolu ve alt metin olmadan kayıt eklenmez. Düşük çözünürlüklü kaynak büyütülmez; `low_res: true` kalır.

## 3. Haber

```json
{
  "slug": "ornek-haber",
  "title_tr": "Başlık",
  "title_en": "Title",
  "excerpt_tr": "Kısa özet.",
  "excerpt_en": "Short summary.",
  "body_html_tr": "<p>Gövde.</p>",
  "body_html_en": "<p>Body.</p>",
  "published_at": "2018-02-08",
  "category": "Genel",
  "cover": "/images/news/ornek-haber/cover-1600.webp",
  "source_url": "https://www.fernas.com.tr/.../",
  "source_url_en": ""
}
```

`src/lib/news.ts` tarihe göre yeniden eskiye sıralar. Ana sayfa ve haber şeridi en yeni 3 kaydı kullanır. Yeni haber eklerken `published_at` ISO tarih (`YYYY-MM-DD`) olmalı.

## 4. Kurumsal sayfa kaydı

```json
{
  "slug": "hakkimizda",
  "title_tr": "Hakkımızda",
  "title_en": "About",
  "body_html_tr": "<p>...</p>",
  "body_html_en": "<p>...</p>",
  "template": "about",
  "source_url": "https://www.fernas.com.tr/.../",
  "source_url_en": "",
  "modified_at": "2024-11-19T10:49:25"
}
```

`template` değerleri kaynak WordPress şablonunu gösterir: `home`, `about`, `contact`, `careers`, `sector`, `projects-index`, `news-index`, `policies`, `certificates`, `memberships`, `corporate-info`, `test`.

Yeni bir sayfa yayınlarken önce `src/pages/` altında Astro route'u oluştur; JSON tek başına sayfa üretmez.

## 5. Veri dosyaları

### `sectors.json`

```json
{
  "slug": "enerji",
  "name": "Enerji",
  "nameEn": "Energy",
  "short": "Kısa açıklama",
  "shortEn": "Short description",
  "metric": "570 MW",
  "image": "/images/sectors/enerji.webp"
}
```

### `stats.json`

```json
{ "value": "570", "valueEn": "570", "unit": "MW", "label": "Kurulu güç" }
```

`valueEn` yalnızca ondalık ayırıcı farkı olan kayıtlarda kullanılır (ör. `1,5` → `1.5`).

### `policies.json`

```json
{
  "title": "ÇEVRE VE SÜRDÜRÜLEBİLİRLİK POLİTİKASI",
  "code": "E&SP",
  "file": "/belgeler/FERNAS-CEVRE-VE-SURDURULEBILIRLIK-POLITIKASI-ESP.pdf",
  "source": "https://www.fernas.com.tr/wp-content/uploads/..."
}
```

PDF'ler `public/belgeler/` altındadır. Hukuki metin değiştirilmez.

### `certificates.json`

`title`, `image`, `width`, `height`. Görseller `public/images/certificates/`.

### `memberships.json`

`name`, `description`, `logo`. Logolar `public/images/memberships/`.

### `timeline.json`

`year`, `title`, `text` alanları. Tarihçe sayfası bunu kullanır.

### `site.json`

Adres, telefon, e-posta ve sosyal hesaplar. E-posta şu an boş; gerçek adres teyit edilmeden doldurulmamalı.

## 6. TR / EN kuralları

- TR varsayılan dildir; EN `/en/` altındadır.
- EN alanı boşsa sayfa TR içeriğe düşer. Bu bir çözüm değil, geçici davranıştır.
- Eksik EN içerik `npm run validate:content` uyarısında görünür.
- Çeviri uydurulmaz. Kaynak yoksa alan boş bırakılır ve `TODO` olarak raporlanır.
- Sayı biçimi: TR `1.500.000`, `570,5 MW`; EN `1,500,000`, `570.5 MW`.
- Özel adlar korunur: Diyarbakır, Çamlı, Necat Nasıroğlu.

## 7. Doğrulama

```bash
npm run validate:content
```

Kontrol ettikleri:

- Zorunlu alanlar.
- Yinelenen slug.
- Kapak ve galeri dosyalarının varlığı.
- İletişim e-postası ve telefon tutarlılığı.
- Eksik EN alanları (uyarı).

Yeni içerik ekledikten sonra her zaman `npm run validate:content` ve `npm run build` çalıştır.
