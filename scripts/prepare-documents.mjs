import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { load } from "cheerio";
import sharp from "sharp";

const root = process.cwd();
const pagesDir = join(root, "src", "content", "pages");
const publicDir = join(root, "public");
const dataDir = join(root, "src", "data");

const report = {
  policies: { ok: 0, failed: [] },
  certificates: { ok: 0, failed: [] },
  memberships: { ok: 0, failed: [] },
};

function transliterate(value) {
  return String(value)
    .replaceAll("ı", "i")
    .replaceAll("İ", "I")
    .replaceAll("ş", "s")
    .replaceAll("Ş", "S")
    .replaceAll("ğ", "g")
    .replaceAll("Ğ", "G")
    .replaceAll("ü", "u")
    .replaceAll("Ü", "U")
    .replaceAll("ö", "o")
    .replaceAll("Ö", "O")
    .replaceAll("ç", "c")
    .replaceAll("Ç", "C");
}

function slugify(value) {
  return transliterate(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function absoluteUrl(value) {
  return new URL(value, "https://www.fernas.com.tr").toString();
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
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
          accept: "application/pdf,image/avif,image/webp,image/*,*/*;q=0.8",
          referer: "https://www.fernas.com.tr/",
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 500) throw new Error(`too small (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
    }
  }
  throw lastError;
}

async function downloadPdf(url, outputPath) {
  const buffer = await fetchBuffer(url);
  await mkdir(join(outputPath, ".."), { recursive: true });
  await writeFile(outputPath, buffer);
}

async function downloadWebp(url, outputPath, width = 1400) {
  const buffer = await fetchBuffer(url);
  await mkdir(join(outputPath, ".."), { recursive: true });
  await sharp(buffer)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(outputPath);
  return sharp(outputPath).metadata();
}

// ---------- Policies ----------
const policyPage = await readJson(join(pagesDir, "politikalarimiz.json"));
const policy$ = load(policyPage.body_html_tr);
const policies = [];
const seenPolicyUrls = new Set();

for (const anchor of policy$("a[href]").toArray()) {
  const href = policy$(anchor).attr("href") ?? "";
  if (!/\.pdf(?:\?|$)/i.test(href)) continue;
  const source = absoluteUrl(href);
  if (seenPolicyUrls.has(source)) continue;
  seenPolicyUrls.add(source);

  const rawTitle = policy$(anchor).text().replace(/\s+/g, " ").trim();
  const codeMatch = rawTitle.match(/\(([^)]+)\)\s*$/);
  const code = codeMatch?.[1]?.trim() ?? "";
  const title = (codeMatch ? rawTitle.slice(0, codeMatch.index) : rawTitle).trim();
  const fileName = decodeURIComponent(basename(new URL(source).pathname));
  const localName = fileName.replace(/[^A-Za-z0-9._-]+/g, "-");
  const outputPath = join(publicDir, "belgeler", localName);

  try {
    await downloadPdf(source, outputPath);
    report.policies.ok += 1;
    policies.push({
      title,
      code,
      file: `/belgeler/${localName}`,
      source,
    });
  } catch (error) {
    report.policies.failed.push({ title, source, reason: String(error.message) });
  }
}

await writeFile(
  join(dataDir, "policies.json"),
  `${JSON.stringify(policies, null, 2)}\n`,
  "utf8",
);

// ---------- Certificates ----------
const certificatePage = await readJson(join(pagesDir, "kalite-belgelerimiz.json"));
const certificate$ = load(certificatePage.body_html_tr);
const certificates = [];
const seenCertificateUrls = new Set();

for (const image of certificate$("img").toArray()) {
  const src = certificate$(image).attr("src") ?? "";
  if (!src || seenCertificateUrls.has(src)) continue;
  seenCertificateUrls.add(src);

  const title =
    certificate$(image).attr("title") ||
    certificate$(image).attr("alt") ||
    `Kalite belgesi ${certificates.length + 1}`;
  const source = absoluteUrl(src);
  const localName = `${slugify(title) || `belge-${certificates.length + 1}`}.webp`;
  const outputPath = join(publicDir, "images", "certificates", localName);

  try {
    const metadata = await downloadWebp(source, outputPath, 1400);
    report.certificates.ok += 1;
    certificates.push({
      title,
      image: `/images/certificates/${localName}`,
      width: metadata.width,
      height: metadata.height,
    });
  } catch (error) {
    report.certificates.failed.push({ title, source, reason: String(error.message) });
  }
}

await writeFile(
  join(dataDir, "certificates.json"),
  `${JSON.stringify(certificates, null, 2)}\n`,
  "utf8",
);

// ---------- Memberships ----------
const membershipPage = await readJson(join(pagesDir, "uyeliklerimiz.json"));
const membership$ = load(membershipPage.body_html_tr);
const memberships = [];

for (const heading of membership$("h4").toArray()) {
  const name = membership$(heading).text().replace(/\s+/g, " ").trim();
  if (!name) continue;

  const block = membership$(heading).nextUntil("h4");
  const description = block
    .filter("p")
    .toArray()
    .map((node) => membership$(node).text().replace(/\s+/g, " ").trim())
    .find(Boolean) ?? "";
  const image = block.find("img").first();
  const src = image.attr("src") ?? "";
  const localName = `${slugify(name) || `uyelik-${memberships.length + 1}`}.webp`;
  const outputPath = join(publicDir, "images", "memberships", localName);
  let logo = "";

  if (src) {
    try {
      await downloadWebp(absoluteUrl(src), outputPath, 320);
      logo = `/images/memberships/${localName}`;
      report.memberships.ok += 1;
    } catch (error) {
      report.memberships.failed.push({ name, src, reason: String(error.message) });
    }
  }

  memberships.push({ name, description, logo });
}

await writeFile(
  join(dataDir, "memberships.json"),
  `${JSON.stringify(memberships, null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify(report, null, 2));
console.log("policies", policies.length, "certificates", certificates.length, "memberships", memberships.length);
