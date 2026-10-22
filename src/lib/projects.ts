import featured from "../data/featured-projects.json";

export type ProjectRecord = {
  slug: string;
  legacySlug: string;
  title: string;
  titleEn: string;
  sector: string;
  sectorEn: string;
  sectorSlug: string;
  status: string;
  city: string;
  country: string;
  year: string;
  client: string;
  capacity: string;
  scope: string;
  scopeEn: string;
  bodyHtml: string;
  bodyHtmlEn: string;
  cover: string;
  gallery: string[];
  video: string;
  videoPoster: string;
  alt: string;
  featured: boolean;
  sort: number;
  sourceUrl: string;
  lowRes: boolean;
};

export type ProjectSummary = Pick<
  ProjectRecord,
  | "slug"
  | "title"
  | "titleEn"
  | "sector"
  | "sectorEn"
  | "sectorSlug"
  | "city"
  | "country"
  | "year"
  | "capacity"
  | "cover"
  | "status"
>;

type RawProject = Partial<{
  slug: string;
  legacy_slug: string;
  title_tr: string;
  title_en: string;
  title: string;
  sector: string;
  status: string;
  city: string;
  location: string;
  country: string;
  year: string | number;
  client: string;
  capacity: string;
  scale: string;
  scope_tr: string;
  scope_en: string;
  body_html_tr: string;
  body_html_en: string;
  cover: string;
  image: string;
  gallery: string[];
  video?: string;
  video_poster?: string;
  alt_tr: string;
  featured: boolean;
  sort: number;
  source_url: string;
  low_res: boolean;
}>;

const sectorNames: Record<string, string> = {
  insaat: "İnşaat",
  enerji: "Enerji",
  "dogalgaz-dagitim": "Doğalgaz Dağıtımı",
  sanayi: "Sanayi",
  gida: "Gıda",
  turizm: "Turizm",
  diger: "Diğer",
};

const sectorNamesEn: Record<string, string> = {
  insaat: "Construction",
  enerji: "Energy",
  "dogalgaz-dagitim": "Gas Distribution",
  sanayi: "Industry",
  gida: "Food",
  turizm: "Tourism",
  diger: "Other",
};

function normalize(raw: RawProject): ProjectRecord {
  const sectorSlug = String(raw.sector ?? "diger");
  return {
    slug: String(raw.slug ?? ""),
    legacySlug: String(raw.legacy_slug ?? ""),
    title: String(raw.title_tr ?? raw.title ?? ""),
    titleEn: String(raw.title_en ?? ""),
    sector: sectorNames[sectorSlug] ?? sectorSlug,
    sectorEn: sectorNamesEn[sectorSlug] ?? sectorSlug,
    sectorSlug,
    status: String(raw.status ?? ""),
    city: String(raw.city ?? raw.location ?? ""),
    country: String(raw.country ?? "Türkiye"),
    year: String(raw.year ?? ""),
    client: String(raw.client ?? ""),
    capacity: String(raw.capacity ?? raw.scale ?? ""),
    scope: String(raw.scope_tr ?? ""),
    scopeEn: String(raw.scope_en ?? ""),
    bodyHtml: String(raw.body_html_tr ?? ""),
    bodyHtmlEn: String(raw.body_html_en ?? ""),
    cover: String(raw.cover ?? raw.image ?? ""),
    gallery: Array.isArray(raw.gallery) ? raw.gallery.filter(Boolean) : [],
    video: String(raw.video ?? ""),
    videoPoster: String(raw.video_poster ?? ""),
    alt: String(raw.alt_tr ?? `${raw.title_tr ?? raw.title ?? "Proje"} — Fernas`),
    featured: Boolean(raw.featured),
    sort: Number(raw.sort ?? 0),
    sourceUrl: String(raw.source_url ?? ""),
    lowRes: Boolean(raw.low_res),
  };
}

export function loadProjects(): ProjectRecord[] {
  const modules = import.meta.glob("../content/projects/*.json", { eager: true }) as Record<
    string,
    { default: RawProject }
  >;

  const imported = Object.values(modules)
    .map((module) => module.default)
    .filter((item): item is RawProject => Boolean(item?.slug));

  const raw = imported.length
    ? imported
    : (featured as RawProject[]).map((item) => ({
        ...item,
        title_tr: item.title,
        location: item.city ?? "",
        country: "Türkiye",
      }));

  const seen = new Set<string>();
  return raw
    .map(normalize)
    .filter((item) => {
      if (!item.slug || seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    })
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      const yearDiff = Number(b.year) - Number(a.year);
      if (Number.isFinite(yearDiff) && yearDiff !== 0) return yearDiff;
      return a.title.localeCompare(b.title, "tr");
    });
}

export function toProjectSummary(project: ProjectRecord): ProjectSummary {
  return {
    slug: project.slug,
    title: project.title,
    titleEn: project.titleEn,
    sector: project.sector,
    sectorEn: project.sectorEn,
    sectorSlug: project.sectorSlug,
    city: project.city,
    country: project.country,
    year: project.year,
    capacity: project.capacity,
    cover: project.cover,
    status: project.status,
  };
}
