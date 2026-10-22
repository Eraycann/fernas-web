import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { ProjectSummary } from "../../lib/projects";

type Props = {
  projects: ProjectSummary[];
  lang?: "tr" | "en";
  basePath?: string;
};

const copy = {
  tr: {
    all: "Tümü",
    filterLabel: "Sektöre göre filtrele",
    searchLabel: "Proje ara",
    searchPlaceholder: "Proje, şehir veya yıl ara",
    count: "proje",
    clear: "Filtreleri temizle",
    emptyTitle: "Sonuç bulunamadı.",
    emptyBody: "Farklı bir arama veya sektör deneyin.",
    view: "Projeyi incele",
  },
  en: {
    all: "All",
    filterLabel: "Filter by sector",
    searchLabel: "Search projects",
    searchPlaceholder: "Search project, city or year",
    count: "projects",
    clear: "Clear filters",
    emptyTitle: "No results found.",
    emptyBody: "Try a different search term or sector.",
    view: "View project",
  },
} as const;

export default function ProjectArchive({
  projects,
  lang = "tr",
  basePath = "/projeler",
}: Props) {
  const t = copy[lang];
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("all");
  const deferredQuery = useDeferredValue(query);

  const sectors = useMemo(() => {
    const seen = new Set<string>();
    const items: Array<{ slug: string; label: string }> = [{ slug: "all", label: t.all }];

    for (const project of projects) {
      if (!project.sectorSlug || seen.has(project.sectorSlug)) continue;
      seen.add(project.sectorSlug);
      items.push({
        slug: project.sectorSlug,
        label: lang === "en" ? project.sectorEn || project.sector : project.sector,
      });
    }

    return items;
  }, [projects, lang, t.all]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("sector");
    if (requested && sectors.some((item) => item.slug === requested)) {
      setSector(requested);
    }
  }, [sectors]);

  const filtered = useMemo(() => {
    const search = deferredQuery.trim().toLocaleLowerCase(lang);
    return projects.filter((project) => {
      if (sector !== "all" && project.sectorSlug !== sector) return false;
      if (!search) return true;
      return [
        project.title,
        project.titleEn,
        project.sector,
        project.sectorEn,
        project.city,
        project.country,
        project.year,
        project.capacity,
      ]
        .join(" ")
        .toLocaleLowerCase(lang)
        .includes(search);
    });
  }, [projects, sector, deferredQuery, lang]);

  const projectTitle = (project: ProjectSummary) =>
    lang === "en" ? project.titleEn || project.title : project.title;
  const projectSector = (project: ProjectSummary) =>
    lang === "en" ? project.sectorEn || project.sector : project.sector;
  const sectorLabel = sectors.find((item) => item.slug === sector)?.label ?? t.all;

  return (
    <div>
      <div className="flex flex-col gap-5 border-y border-steel/30 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label={t.filterLabel}>
            {sectors.map((item) => (
              <button
                key={item.slug}
                type="button"
                className={`border px-3 py-2 text-[0.72rem] font-medium transition-colors ${
                  sector === item.slug
                    ? "border-blue bg-blue text-white"
                    : "border-steel/35 text-ink/70 hover:border-blue hover:text-blue"
                }`}
                aria-pressed={sector === item.slug}
                onClick={() => setSector(item.slug)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="flex min-h-11 w-full items-center gap-2 border border-steel/35 bg-white px-3 lg:w-72">
            <span className="sr-only">{t.searchLabel}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="m9.5 9.5 3 3" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-transparent text-[0.85rem] outline-none placeholder:text-steel/80"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="mono text-[0.64rem] text-steel" aria-live="polite">
            {filtered.length} {t.count}
            {sector !== "all" ? ` · ${sectorLabel}` : ""}
          </p>
          {(query || sector !== "all") && (
            <button
              type="button"
              className="mono text-[0.64rem] text-blue underline decoration-blue/40 underline-offset-4"
              onClick={() => {
                setQuery("");
                setSector("all");
              }}
            >
              {t.clear}
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border-b border-steel/30 py-16 text-center">
          <p className="font-display text-[1.5rem] font-semibold tracking-[-0.03em]">{t.emptyTitle}</p>
          <p className="mt-2 text-[0.9rem] text-ink/60">{t.emptyBody}</p>
          <button
            type="button"
            className="btn btn-ghost mt-6"
            onClick={() => {
              setQuery("");
              setSector("all");
            }}
          >
            {t.clear}
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <a
              key={project.slug}
              className="group flex flex-col border border-steel/30 bg-white transition-colors hover:border-blue"
              href={`${basePath}/${project.slug}/`}
            >
              {project.cover && (
                <img
                  src={project.cover}
                  alt={`${projectTitle(project)} — Fernas`}
                  width="800"
                  height="500"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/10] w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-5">
                <p className="mono text-[0.62rem] text-steel">
                  {[projectSector(project), project.city, project.year]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <h3 className="mt-3 font-display text-[1.2rem] font-semibold leading-[1.1] tracking-[-0.03em] transition-colors group-hover:text-blue">
                  {projectTitle(project)}
                </h3>
                <span className="mono mt-auto pt-5 text-[0.64rem] text-blue">
                  {t.view} →
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
