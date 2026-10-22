import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const dir = "src/content/pages";
for (const file of (await readdir(dir)).filter((name) => name.endsWith(".json"))) {
  const page = JSON.parse(await readFile(join(dir, file), "utf8"));
  if (!String(page.body_html_tr ?? "").trim()) console.log("EMPTY", page.slug);
}

const policies = JSON.parse(await readFile(join(dir, "politikalarimiz.json"), "utf8"));
const links = [...String(policies.body_html_tr).matchAll(/href="([^"]+\.pdf)"/gi)].map(
  (match) => match[1],
);
console.log("policy pdfs", links.length, links.slice(0, 3));

const certificates = JSON.parse(
  await readFile(join(dir, "kalite-belgelerimiz.json"), "utf8"),
);
const images = [...String(certificates.body_html_tr).matchAll(/src="([^"]+)"/gi)].map(
  (match) => match[1],
);
console.log("cert imgs", images.length, images.slice(0, 3));

const memberships = JSON.parse(await readFile(join(dir, "uyeliklerimiz.json"), "utf8"));
console.log("membership h4", (String(memberships.body_html_tr).match(/<h4/gi) ?? []).length);
