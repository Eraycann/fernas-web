# İçerik Göçü TODO

> Otomatik üretildi: 2026-10-22T00:28:45.421Z — `scripts/import-wordpress.mjs`
> Kaynak: https://www.fernas.com.tr (WP REST + sitemap + HTML)

## 1. Demo / spam görünen post slug'ları

Bu kayıtların gövdesi gerçek kurumsal haber içeriyor; yalnızca slug'ları demo içerikten kalma. Silinmediler, Türkçe başlıktan okunabilir slug üretildi. Eski URL → yeni URL 301 olarak `docs/redirects.csv` içinde.

| Eski slug | Yeni slug | Başlık |
|---|---|---|
| `continually-engage-distributed-infrastructures-2` | `tanap-ile-lot-1-icin-sozlesme-imzalandi` | TANAP ile  Lot-1 için Sözleşme imzalandı |
| `seamlessly-initiate-distinctive-niches-without-2` | `cumhurbaskani-sayin-abdullah-gul-fabrika-acilis-torenimizde` | Cumhurbaşkanı Sayın Abdullah GÜL Fabrika Açılış Törenimizde |
| `seamlessly-initiate-distinctive-niches-without` | `18-yilligina-36-500-000-ton-komur-uretimi-projesi` | 18 yıllığına 36.500.000 ton Kömür Üretimi Projesi |
| `distinctively-promote-real-time-strategic-theme-areas-2` | `ltisiz-1-milyon-adam-saat` | LTI’sız 1 Milyon Adam-Saat |
| `distinctively-promote-real-time-strategic-theme-areas` | `3-adet-akarsu-santralinin-49-yillik-isletme-hakki` | 3 Adet Akarsu Santrali’nin 49 Yıllık İşletme Hakkı |

`/test/` sayfası demo/test içeriği taşıyor; sayfa JSON'u denetim için tutuldu, yayına alınmamalı.

## 2. Birleştirilen / tekrar eden projeler

Aynı başlık + aynı görsel ile eşleşen kayıt bulunamadı.

Aynı başlık fakat farklı kapak görseli olan kayıtlar ayrı proje kabul edildi.

## 3. Eksik İngilizce

- Projeler: 4/105 — `can-dekapaj-yukleme-ve-nakliye-isi`, `ankira-hes-projesi`, `karasu-baraji-ve-hidroelektrik-santrali`, `ankara-beton-astari-fabrikasi`
- Haberler: 0/13
- Sayfalar: 10/23 — `politikalarimiz`, `diyargaz-ik`, `insan-kaynaklari`, `test`, `ik`, `projeler`, `bilgi-toplumu-hizmetleri`, `kalite-belgelerimiz`, `uyeliklerimiz`, `ana-sayfa`

Boş bırakılan EN alanları uydurma çeviri ile doldurulmadı.

## 4. Düşük çözünürlüklü görseller

57 kaynak görsel 800 px'in altında: 52 proje, 4 haber, 1 sektör. WebP'ler büyütülmeden kaynak genişliğinde üretildi; en küçük kaynak 364 px. Tam liste `data/raw/image-report.json` (`lowRes`) ve `data/raw/media.json` (`low_res: true`) içinde.

| Kayıt | Kaynak genişliği | Kaynak |
|---|---|---|
| `project/asya-yakasi-atik-su-kanali-insaati` | 364px | https://www.fernas.com.tr/wp-content/uploads/2018/01/asyayakasi_su.jpeg |
| `project/umm-bab-mesaieed-gaz-temini-projesi` | 440px | https://www.fernas.com.tr/wp-content/uploads/2018/01/umm2.jpg |
| `project/sinan-batman-demiryolu-yapimi-isi` | 468px | https://www.fernas.com.tr/wp-content/uploads/2017/11/Sinan-%E2%80%93-Batman-.jpg |
| `project/ankira-hes-projesi` | 500px | https://www.fernas.com.tr/wp-content/uploads/2017/11/ankira.jpg |
| `project/18-mart-can-kirectasi-temini` | 540px | https://www.fernas.com.tr/wp-content/uploads/2018/01/canakkale_simav.jpg |
| `project/afsin-elbistan-acik-isletmesi-dekapaj-isi` | 540px | https://www.fernas.com.tr/wp-content/uploads/2018/01/afsin_elbistan.jpg |
| `project/aporny-yuzey-tesisleri-insaati-isi` | 540px | https://www.fernas.com.tr/wp-content/uploads/2018/01/aporny.jpg |
| `project/artvin-meydancik-yolu-yapim-isi` | 540px | https://www.fernas.com.tr/wp-content/uploads/2018/01/artvin_yol-1.jpg |
| `project/bala-baglantisi-aksaray-eregli-yol-yapim` | 540px | https://www.fernas.com.tr/wp-content/uploads/2018/01/fergun.jpg |
| `project/balikesir-tavsanli-yol-yapim-isi` | 540px | https://www.fernas.com.tr/wp-content/uploads/2018/01/balikesir-yol_4_1.jpg |
| … | 47 kayıt daha | `data/raw/media.json` |

## 5. Kırık / şüpheli bağlantılar

- **Kozbükü HES haberi Sebenoba URL'sinde:** `/hatay-sebenoba-ruzgar-santrali-anlasmasi/` başlığı "Ordu Kozbükü Hidroelektrik Santrali Anlaşması". İçerik doğru, URL yanlış. Haber kaydı yeni slug ile üretildi; eski URL korunmalı.
- **Kozbükü projesi:** `/portfolio/kozbuku-hidroelektrik-santrali/` ayrı proje kaydı olarak duruyor.
- İletişim sayfasındaki e-posta Cloudflare e-posta koruması nedeniyle `[email protected]` olarak görünüyor; gerçek adres HTML'de yok.
- Politika metinleri PDF bağlantıları halinde; PDF'ler indirilmedi. Yayına alınacaksa PDF'ler ayrıca `public/` altına alınmalı.

## 6. Telefon / e-posta çelişkileri

- Kaynak sitede iki telefon görülüyor: `+90 312 454 16 00` ve `+90 312 426 6262`.
- Footer'da `+90 (312) 426 6262`, bazı sayfalarda `+90 312 454 16 00` kullanılıyor. Hangisinin güncel olduğu doğrulanmalı.
- Faks: `+90 (312) 426 3838`. E-posta adresi HTML'de gizli.

## 7. Belirsiz sektörler

Tüm projeler altı sektörden birine atandı.

## 8. Görsel notları

- Proje sayfalarında ayrı galeri yok; çoğu projede tek kapak görseli var. Galeri alanları bu yüzden çoğunlukla boş.
- Aynı görsel birden fazla projede kullanılıyor olabilir; `data/raw/media.json` içinde kaynak URL'leri karşılaştırılabilir.
- Görseller 800/1600 px WebP olarak üretildi; kaynak 800 px'den küçükse `low_res: true`.
- Sektör görselleri ilgili sektör sayfasındaki ilk yüksek çözünürlüklü görselden alındı.

## 9. Sayfa / içerik notları

- WP REST `pages` içeriği çoğu sayfada boş (Zion Builder); sayfa gövdeleri HTML'den çıkarıldı.
- `tamamlanan-projeler-2` ve `devam-eden-projeler-2` sayfaları eski/duplike varyantlar.
- `insan-kaynaklari`, `ik` ve `diyargaz-ik` sayfaları aynı işe alım içeriğini farklı biçimlerde taşıyor.
- Hukuki/politika metinleri HTML'den birebir alındı; yalnızca script/style/sosyal medya blokları ve sunum attribute'ları temizlendi.
- 2018 sonrası yeni haber bulunmuyor; en yeni yayın tarihi 2018-02-08.

## 10. Sonraki adımlar

- `docs/redirects.csv` içindeki sayfa yönlendirmelerini Astro rotalarıyla doğrula.
- Görsel alt metinlerini gerçek sahne bilgisiyle zenginleştir (şu an başlık + sektör + şehir).
- Politikaların PDF'lerini indirip `public/belgeler/` altına koy.
- Kozbükü haberinin URL'sini düzelt ve eski URL'yi 301 ile yönlendir.
- İletişim bilgilerini (telefon/e-posta) teyit et.

