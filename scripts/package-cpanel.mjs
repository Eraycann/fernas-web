import { createWriteStream } from "node:fs";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ZipArchive } from "archiver";

const projectRoot = process.cwd();
const dist = join(projectRoot, "dist");
const releaseDir = join(projectRoot, "release");
const htaccessPath = join(dist, ".htaccess");
const templatePath = join(projectRoot, "public", ".htaccess");
const redirectsPath = join(projectRoot, "docs", "redirects.csv");

if (!existsSync(dist)) {
  console.error("dist/ bulunamadı. Önce `npm run build` çalıştırın.");
  process.exit(1);
}

for (const required of ["index.html", "404.html", "contact.php", "application.php"]) {
  if (!existsSync(join(dist, required))) {
    console.error(`Eksik dosya: dist/${required}`);
    process.exit(1);
  }
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const csv = await readFile(redirectsPath, "utf8");
const redirects = [];
for (const line of csv.split(/\r?\n/).slice(1)) {
  if (!line.trim()) continue;
  const [oldPath, newPath, status = "301"] = line.split(",");
  if (!oldPath || !newPath) continue;
  if (status.trim() !== "301") continue;
  const source = oldPath.trim().replace(/\/+$/, "");
  const target = newPath.trim();
  redirects.push(`RedirectMatch ${status.trim()} ^${escapeRegex(source)}/?$ ${target}`);
}

const htaccess = (await readFile(templatePath, "utf8")).replace(
  "# RULE_INSERT_POINT",
  [
    "# BEGIN FERNAS REDIRECTS",
    ...redirects,
    "# END FERNAS REDIRECTS",
    "",
    "# WordPress entry points",
    "RewriteRule ^feed/?$ /haberler/ [R=301,L]",
    "RewriteRule ^wp-login\\.php$ / [R=301,L]",
    "RewriteRule ^wp-admin/?$ / [R=301,L]",
  ].join("\n"),
);

await writeFile(htaccessPath, htaccess, "utf8");

await mkdir(releaseDir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const zipPath = join(releaseDir, `fernas-cpanel-${stamp}.zip`);

await new Promise((resolve, reject) => {
  const output = createWriteStream(zipPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  output.on("close", resolve);
  output.on("error", reject);
  archive.on("error", reject);

  archive.pipe(output);
  archive.directory(dist, false, (entry) => {
    if (entry.name === ".DS_Store" || entry.name.startsWith("__MACOSX")) return false;
    return entry;
  });
  archive.finalize();
});

const bytes = (await import("node:fs/promises")).stat(zipPath).then((stats) => stats.size);
const size = await bytes;

console.log(`cPanel paketi hazır: ${zipPath}`);
console.log(`  ${redirects.length} adet 301 yönlendirme .htaccess içine yazıldı.`);
console.log(`  Arşiv boyutu: ${(size / 1024 / 1024).toFixed(2)} MB`);
