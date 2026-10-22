import { createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const publicDir = join(root, "public");
const report = {
  startedAt: new Date().toISOString(),
  projects: { ok: 0, skipped: 0, failed: [] },
  news: { ok: 0, skipped: 0, failed: [] },
  sectors: { ok: 0, skipped: 0, failed: [] },
};

function normalizeUrl(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function fileExists(path) {
  try {
    const info = await stat(path);
    return info.size > 1000;
  } catch {
    return false;
  }
}

async function fetchBuffer(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45_000);
      const response = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
          accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          referer: "https://www.fernas.com.tr/",
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 1000) throw new Error(`too small (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
    }
  }
  throw lastError;
}

async function downloadWebp(url, outputPath) {
  if (await fileExists(outputPath)) return "skipped";
  const buffer = await fetchBuffer(url);
  await mkdir(dirname(outputPath), { recursive: true });
  await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(outputPath);
  return "ok";
}

async function pool(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

const portfolio = await readJson(join(root, "data", "raw", "portfolio.json"));
const projectFiles = (await readdir(join(root, "src", "content", "projects")))
  .filter((file) => file.endsWith(".json"))
  .map((file) => join(root, "src", "content", "projects", file));

const projects = [];
for (const file of projectFiles) {
  const project = await readJson(file);
  const legacy = normalizeUrl(project.source_url);
  const raw = portfolio.records.find(
    (record) => normalizeUrl(record.source_url) === legacy,
  );
  projects.push({ project, raw });
}

await pool(projects, 6, async ({ project, raw }) => {
  if (!project.cover || !raw?.cover_source) {
    report.projects.failed.push({ slug: project.slug, reason: "no source" });
    return;
  }
  try {
    const result = await downloadWebp(raw.cover_source, join(publicDir, project.cover));
    report.projects[result] += 1;
    if (result === "failed") {
      report.projects.failed.push({ slug: project.slug, reason: "unknown" });
    }
  } catch (error) {
    report.projects.failed.push({ slug: project.slug, reason: String(error.message) });
  }
});

const posts = (await readJson(join(root, "data", "raw", "posts.json"))).posts;
const newsFiles = (await readdir(join(root, "src", "content", "news")))
  .filter((file) => file.endsWith(".json"))
  .map((file) => join(root, "src", "content", "news", file));

const news = [];
for (const file of newsFiles) {
  const item = await readJson(file);
  const raw = posts.find((post) => post.slug === item.slug);
  news.push({ item, raw });
}

await pool(news, 4, async ({ item, raw }) => {
  if (!item.cover || !raw?.cover_source) {
    report.news.failed.push({ slug: item.slug, reason: "no source" });
    return;
  }
  try {
    const result = await downloadWebp(raw.cover_source, join(publicDir, item.cover));
    report.news[result] += 1;
  } catch (error) {
    report.news.failed.push({ slug: item.slug, reason: String(error.message) });
  }
});

const pages = (await readJson(join(root, "data", "raw", "pages.json"))).pages;
const pageBySlug = new Map(pages.map((page) => [page.slug, page]));
const sectorPages = [
  ["insaat", "insaat-2"],
  ["enerji", "enerji"],
  ["dogalgaz-dagitim", "dogal-gaz-dagitim"],
  ["sanayi", "sanayi"],
  ["gida", "gida"],
  ["turizm", "turizm"],
];

function firstImage(html) {
  const matches = String(html ?? "").match(
    /https?:\/\/[^"'\s>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s>]*)?/gi,
  );
  return matches?.[0] ?? "";
}

for (const [sectorSlug, pageSlug] of sectorPages) {
  const outputPath = join(publicDir, "images", "sectors", `${sectorSlug}.webp`);
  const page = pageBySlug.get(pageSlug);
  const source = firstImage(page?.body_html_tr) || firstImage(page?.body_html_en);
  if (!source) {
    report.sectors.failed.push({ slug: sectorSlug, reason: "no image in page" });
    continue;
  }
  try {
    const result = await downloadWebp(source, outputPath);
    report.sectors[result] += 1;
  } catch (error) {
    report.sectors.failed.push({ slug: sectorSlug, reason: String(error.message) });
  }
}

report.finishedAt = new Date().toISOString();
await mkdir(join(root, "data", "raw"), { recursive: true });
await writeFile(
  join(root, "data", "raw", "image-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify(report, null, 2));
