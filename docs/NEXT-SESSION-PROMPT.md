# Yeni Oturum Başlangıç Promptu

## Yerel devam

```
Fernas Şirketler Grubu'nun statik kurumsal sitesine devam et.
Kök: C:\Users\Erayc\fernas-web

Önce şu sırayla oku:
1. docs/AI-HANDOFF.md
2. AGENTS.md
3. docs/PLAN.md
4. docs/CONTENT-RULES.md
5. docs/STATUS.md
6. docs/CONTENT-MODEL.md
7. docs/DESIGN-SYSTEM.md

Stack: Astro 7 (static) + React 19 adaları + Tailwind 4 + Lenis + Pagefind.
Üretim: cPanel public_html. Vercel yalnızca önizleme. Node sunucu, veritabanı, CMS, Next.js, Sanity yok.
Formlar: yalnızca küçük PHP endpoint'leri.

Kurumsal, sade, fotoğraf odaklı tasarımı koru. ClientRouter/view transition/wipe ekleme.
Fotoğrafları hover arkasına saklama. Marka mavisi #045091.
Archivo + IBM Plex Sans + IBM Plex Mono. Türkçe karakterleri bozma.
Kaynaksız Fernas bilgisi uydurma. Hukuki metinleri değiştirme.

İlk iş: npm ci, npm run check, npm run validate:content, npm run build.
Sonra docs/STATUS.md açıklarından en yüksek etkili olanı seç.
Küçük ve doğrulanabilir değişiklik yap; her değişiklikten sonra check + build çalıştır.
Süre tahmini verme; çıkış kriterleriyle ilerle.
```

## GitHub'dan klonlayan model için

```
Repoyu klonla: https://github.com/Eraycann/fernas-web
Önce docs/AI-HANDOFF.md, AGENTS.md, docs/PLAN.md, docs/STATUS.md, docs/CONTENT-MODEL.md ve docs/DESIGN-SYSTEM.md oku.
npm ci && npm run check && npm run validate:content && npm run build çalıştır.
Üretim cPanel'dir; Vercel yalnızca önizlemedir.
Kurumsal havayı koru: süslü sayfa geçişi, hover arkasında fotoğraf, gereksiz animasyon yok.
İlk mesajında yalnızca repoyu doğruladığını ve sıradaki 3 işi yaz; uzun plan anlatma, işe başla.
```

## Vercel önizlemesi

- Canlı URL: <https://fernas-web.vercel.app>
- GitHub: <https://github.com/Eraycann/fernas-web>
- Formlar Vercel'de demo modundadır; gerçek gönderim yapılmaz.
- Önizleme `noindex`; arama motorlarına açık değildir.
