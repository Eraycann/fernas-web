# Araç, Kaynak ve Ajan Yığını

> Bu dosya, Fernas web yenilemesinde kullanılan ve kullanılmak üzere değerlendirilen
> skill, MCP, kaynak ve araçları tek yerde toplar. Amaç araç kalabalığı değil;
> **statik siteyi bozmayan, doğrulanabilir** bir çalışma hattı.
>
> Son güncelleme: 22 Ekim 2026.

## 1. Kurulu skill'ler

Proje içine kuruldu (`.agents/skills/`), başka oturumlarda `skill` aracıyla yüklenebilir:

| Skill | Kaynak | Bu projede işi |
|---|---|---|
| `astro` | `astrolicious/agent-skills` | Astro 7 bileşen, static output, image/font API, routing |
| `accessibility` | `addyosmani/web-quality-skills` | WCAG 2.2 AA, klavye, ARIA, kontrast denetimi |
| `core-web-vitals` | `addyosmani/web-quality-skills` | LCP/CLS/INP bütçesi, hero teslimi |
| `performance` | `addyosmani/web-quality-skills` | Görsel, font, JS yükü, kritik yol |
| `seo` | `addyosmani/web-quality-skills` | Meta, canonical, JSON-LD, sitemap |
| `best-practices` | `addyosmani/web-quality-skills` | Güvenlik, modern tarayıcı uyumu |

Kurulum komutları (yeniden üretilebilir):

```bash
npx skills add astrolicious/agent-skills --skill astro --yes
npx skills add addyosmani/web-quality-skills \
  --skill accessibility --skill performance --skill core-web-vitals \
  --skill seo --skill best-practices --yes
```

Oturum içinde hazır gelen ve bu işte kullanılan skill'ler:

- `frontend-design` — tasarım yönü, tipografi, şablon görünümünden kaçınma.
- `animate` — hareket kararı, süre/easing, tek güçlü moment.
- `animation-performance` — composite-only animasyon, jank avı.
- `web-design-guidelines` — arayüz denetimi.

### Kurulmayan, önerilen skill'ler

Bunlar üçüncü taraf; kurulmadan önce kullanıcı onayı gerekir. Kurulum yapılırsa
`.agents/skills/` altına girer ve `skill` aracıyla yüklenir.

| Skill | Ne için | Komut |
|---|---|---|
| `vercel-labs/agent-skills@web-design-guidelines` | Arayüz kural denetimi | `npx skills add vercel-labs/agent-skills --skill web-design-guidelines` |
| `emilkowalski/skills@animation-vocabulary` | Hareket dili, doğru easing | `npx skills add emilkowalski/skills --skill animation-vocabulary` |
| `pbakaus/impeccable@impeccable` | Görsel kalite cilası | `npx skills add pbakaus/impeccable --skill impeccable` |
| `nextlevelbuilder/ui-ux-pro-max-skill@ui-ux-pro-max` | UX akışı ve hiyerarşi | `npx skills add nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max` |

Kural: Bir skill yalnızca **iş tarifini** getirir; proje sınırlarını (`AGENTS.md`)
ezmez. Statik çıktı, PHP form, kaynaksız içerik yasağı her zaman üstündür.

## 2. MCP sunucuları

Bu proje için anlamlı olanlar, önem sırasıyla:

### 2.1 Playwright MCP (öncelik 1)

Tarayıcıyı erişilebilirlik ağacı üzerinden sürer; form, menü, filtre ve klavye
akışını gerçek DOM'da doğrular. Repoda `.playwright-mcp/` izleri var; `npm run qa`
zaten Playwright + axe kullanıyor. MCP, QA'yı **keşif** için tamamlar.

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

### 2.2 Astro Docs MCP (öncelik 1)

Astro 7 API'lerini güncel dokümandan okur; sürüm uydurmasını engeller.
Resmî: `withastro/docs-mcp`.

```json
{
  "mcpServers": {
    "astro-docs": {
      "type": "http",
      "url": "https://mcp.docs.astro.build/mcp"
    }
  }
}
```

### 2.3 Lighthouse MCP (öncelik 2)

Mobil Lighthouse koşusunu ajan içinden çalıştırır; LCP/CLS raporunu doğrudan
okur. Topluluk sunucusu; çıktı yine `lighthouse` CLI ile teyit edilir.

```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "npx",
      "args": ["-y", "lighthouse-mcp-server"]
    }
  }
}
```

### 2.4 Context7 (öncelik 2)

Kütüphane sürümlerine göre doküman verir (Astro, React 19, Tailwind 4).
Sürüm karışıklığında ilk başvuru.

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp@latest
```

### 2.5 GitHub MCP (öncelik 3)

Issue/PR ve Actions çıktısını okumak için. Push yetkisi verilmez; yalnızca okuma.

### 2.6 Chrome DevTools MCP (öncelik 3)

Performans trace'i, layout shift ve ağ waterfall'u. LCP 2,0 s hedefi kovalanırken
Lighthouse'tan daha ayrıntılı kanıt verir.

**Kural:** MCP'ler yalnızca okuma/ölçme için. Hiçbir MCP üretim cPanel'ine
bağlanmaz, form göndermez, veri tabanı açmaz. Bu projede CMS/DB yok.

## 3. Medya ve görsel araçları

| Araç | Kullanım | Not |
|---|---|---|
| `sharp` (kurulu) | WebP 1600/800/400, AVIF denemesi, duotone | `scripts/optimize-images.mjs` |
| Squoosh (web) | Tek görsel için hızlı karşılaştırma | Repoya bağımlılık eklemez |
| `ffmpeg` | Gerçek saha videosundan H.264 + WebM + poster | Video yalnızca gerçek kaynakla |
| SVG filtre / CSS grain | Düşük çözünürlüklü arşiv görselleri için duotone | Büyütme yok |
| `@astrojs/sitemap`, Pagefind | Keşif ve arama | Mevcut |

Görsel kaynağı sırası:

1. Fernas arşivi ve proje klasörleri (`public/images/projects/**`).
2. Fernas'ın yayınlanmış kurumsal materyalleri (kaynak notuyla).
3. Yalnızca doku/moodboard için stok (Unsplash, Pexels). **Fernas tesisi gibi
   gösterilmez.** Pinterest yalnızca ilham panosudur; doğrudan indirilip
   yayınlanmaz (lisans ve kaynak belirsiz).

Video politikası için `docs/ROADMAP.md` §D ve `docs/REFRESH-BRIEF.md` §7 geçerli:
gerçek saha görüntüsü yoksa video yayınlanmaz; `VideoFacade` yuvaları boş kalır.

## 4. Ölçüm ve kalite hattı

```bash
npm run check            # astro check (TS 6)
npm run validate:content # içerik kuralları
npm run build            # 268 sayfa + Pagefind
npm run preview          # http://localhost:4322
$env:QA_BASE="http://localhost:4322"; npm run qa
```

- Lighthouse hedefi: Perf/A11y/BP/SEO ≥ 95, LCP < 2,0 s, CLS < 0,05.
- `noindex` nedeniyle Vercel'de SEO skoru düşük görünür; bu bilinçlidir.
- Axe: 0 kritik/seri. Klavye: menü, filtre, arama, form, saha şeridi.

## 5. Okuma listesi

- Astro docs — <https://docs.astro.build> (özellikle Images, Fonts, View Transitions **değil**)
- web.dev Core Web Vitals — <https://web.dev/articles/vitals>
- Inclusive Components — <https://inclusive-components.design>
- MDN Erişilebilirlik — <https://developer.mozilla.org/en-US/docs/Web/Accessibility>
- Pagefind — <https://pagefind.app>
- Lenis dokümanı (tek scroll kütüphanesi kuralı için)

## 6. Yapılmayacaklar

- Statik sınırı bozan MCP/CMS/DB entegrasyonu.
- Üçüncü taraf stok görseli Fernas projesi gibi sunmak.
- Lisansı belirsiz Pinterest/Instagram medyasını repoya indirmek.
- Skill/MCP adına otomatik `npm install` ile bağımlılık şişirmek.
- Ölçüm almadan "hızlandı" demek.
