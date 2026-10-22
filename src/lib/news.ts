import fallback from "../data/latest-news.json";

export type NewsRecord = {
  slug: string;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  bodyHtml: string;
  bodyHtmlEn: string;
  publishedAt: string;
  category: string;
  cover: string;
  sourceUrl: string;
};

export type NewsSummary = Pick<
  NewsRecord,
  "slug" | "title" | "excerpt" | "publishedAt" | "category" | "cover"
>;

type RawNews = Partial<{
  slug: string;
  title_tr: string;
  title_en: string;
  title: string;
  excerpt_tr: string;
  excerpt_en: string;
  excerpt: string;
  body_html_tr: string;
  body_html_en: string;
  published_at: string;
  date: string;
  category: string;
  cover: string;
  source_url: string;
}>;

function normalize(raw: RawNews): NewsRecord {
  return {
    slug: String(raw.slug ?? ""),
    title: String(raw.title_tr ?? raw.title ?? ""),
    titleEn: String(raw.title_en ?? ""),
    excerpt: String(raw.excerpt_tr ?? raw.excerpt ?? ""),
    excerptEn: String(raw.excerpt_en ?? ""),
    bodyHtml: String(raw.body_html_tr ?? ""),
    bodyHtmlEn: String(raw.body_html_en ?? ""),
    publishedAt: String(raw.published_at ?? raw.date ?? ""),
    category: String(raw.category ?? "Haber"),
    cover: String(raw.cover ?? ""),
    sourceUrl: String(raw.source_url ?? ""),
  };
}

export function loadNews(): NewsRecord[] {
  const modules = import.meta.glob("../content/news/*.json", { eager: true }) as Record<
    string,
    { default: RawNews }
  >;

  const imported = Object.values(modules)
    .map((module) => module.default)
    .filter((item): item is RawNews => Boolean(item?.slug));

  const raw = imported.length ? imported : (fallback as RawNews[]);

  const seen = new Set<string>();
  return raw
    .map(normalize)
    .filter((item) => {
      if (!item.slug || seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    })
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function toNewsSummary(item: NewsRecord): NewsSummary {
  return {
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt,
    publishedAt: item.publishedAt,
    category: item.category,
    cover: item.cover,
  };
}
