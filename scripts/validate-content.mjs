import { access, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicDir = join(root, "public");
const errors = [];
const warnings = [];

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function listJson(folder) {
  const files = await readdir(join(root, folder));
  return files.filter((file) => file.endsWith(".json")).sort();
}

async function checkFile(assetPath, label) {
  if (!assetPath || typeof assetPath !== "string") {
    errors.push(`${label}: dosya yolu yok`);
    return;
  }
  const local = join(publicDir, assetPath.replace(/^\//, ""));
  if (!(await exists(local))) {
    errors.push(`${label}: eksik dosya ${assetPath}`);
  }
}

const projects = [];
for (const file of await listJson("src/content/projects")) {
  const project = await readJson(join(root, "src/content/projects", file));
  projects.push(project);
  for (const field of ["slug", "title_tr", "sector", "cover"]) {
    if (!project[field]) errors.push(`projects/${file}: ${field} boş`);
  }
  await checkFile(project.cover, `projects/${file} kapak`);
  for (const image of project.gallery ?? []) {
    await checkFile(image, `projects/${file} galeri`);
  }
}
if (new Set(projects.map((project) => project.slug)).size !== projects.length) {
  errors.push("projects: yinelenen slug var");
}

const news = [];
for (const file of await listJson("src/content/news")) {
  const item = await readJson(join(root, "src/content/news", file));
  news.push(item);
  for (const field of ["slug", "title_tr", "published_at", "cover"]) {
    if (!item[field]) errors.push(`news/${file}: ${field} boş`);
  }
  await checkFile(item.cover, `news/${file} kapak`);
}
if (new Set(news.map((item) => item.slug)).size !== news.length) {
  errors.push("news: yinelenen slug var");
}

const pages = [];
for (const file of await listJson("src/content/pages")) {
  const page = await readJson(join(root, "src/content/pages", file));
  pages.push({ file, ...page });
  if (!page.title_tr) errors.push(`pages/${file}: title_tr boş`);
}

const policies = await readJson(join(root, "src/data/policies.json"));
const certificates = await readJson(join(root, "src/data/certificates.json"));
const memberships = await readJson(join(root, "src/data/memberships.json"));
const bilgi = await readJson(join(root, "src/data/bilgi-toplumu.json"));
const site = await readJson(join(root, "src/data/site.json"));

for (const policy of policies) await checkFile(policy.file, `policy ${policy.title}`);
for (const certificate of certificates) await checkFile(certificate.image, `certificate ${certificate.title}`);
for (const membership of memberships) await checkFile(membership.logo, `membership ${membership.name}`);

for (const file of [
  "/belgeler/FERNAS-KVKK-POLITIKASI-PDPP.pdf",
  "/belgeler/kvkk/AYDINLATMA_FORMU.pdf",
  "/belgeler/kvkk/FERNAS_AS_IMHA_POLITIKA.pdf",
]) {
  await checkFile(file, "KVKK");
}

for (const slug of ["insaat", "enerji", "dogalgaz-dagitim", "sanayi", "gida", "turizm"]) {
  await checkFile(`/images/sectors/${slug}.webp`, `sector ${slug}`);
}

for (const project of projects) {
  if (!project.title_en) warnings.push(`projects/${project.slug}: İngilizce başlık yok`);
  if (!project.body_html_en) warnings.push(`projects/${project.slug}: İngilizce gövde yok`);
}
for (const item of news) {
  if (!item.title_en) warnings.push(`news/${item.slug}: İngilizce başlık yok`);
  if (!item.body_html_en) warnings.push(`news/${item.slug}: İngilizce gövde yok`);
}

const lowRes = projects.filter((project) => project.low_res).length + news.filter((item) => item.low_res).length;
const englishPages = pages.filter((page) => page.title_en && page.body_html_en).length;
const englishProjects = projects.filter((project) => project.title_en && project.body_html_en).length;

if (!site.email) warnings.push("site.json: iletişim e-postası boş");
if (site.phone === "+90 312 454 16 00") {
  warnings.push("site.json: iki kaynakta farklı telefon numarası var; yayın öncesi doğrulanmalı");
}
if (bilgi.html.includes('id="bolum-4"') && !bilgi.html.includes("Belgeler</h2>")) {
  warnings.push("bilgi-toplumu: boş bölüm başlığı olabilir");
}

console.log("İçerik doğrulama");
console.log(`  Projeler: ${projects.length}`);
console.log(`  Haberler: ${news.length}`);
console.log(`  Sayfalar: ${pages.length}`);
console.log(`  Politikalar: ${policies.length}`);
console.log(`  Sertifikalar: ${certificates.length}`);
console.log(`  Üyelikler: ${memberships.length}`);
console.log(`  İngilizce proje: ${englishProjects}/${projects.length}`);
console.log(`  İngilizce sayfa: ${englishPages}/${pages.length}`);
console.log(`  Düşük çözünürlüklü görsel: ${lowRes}`);

if (warnings.length) {
  console.log(`\nUyarılar (${warnings.length}):`);
  for (const warning of warnings.slice(0, 30)) console.log(`  - ${warning}`);
  if (warnings.length > 30) console.log(`  ... ${warnings.length - 30} uyarı daha`);
}

if (errors.length) {
  console.error(`\nHatalar (${errors.length}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log("\nHata yok.");
