import { readFile } from "node:fs/promises";
import { join } from "node:path";

const pages = (await readFile(join(process.cwd(), "data", "raw", "pages.json"), "utf8"))
  .toString();
const parsed = JSON.parse(pages);
const pageMap = new Map(parsed.pages.map((page) => [page.slug, page]));

for (const slug of [
  "uyeliklerimiz",
  "kalite-belgelerimiz",
  "politikalarimiz",
  "bilgi-toplumu-hizmetleri",
  "insan-kaynaklari",
  "ik",
  "diyargaz-ik",
  "hakkimizda",
  "iletisim",
  "insaat-2",
  "enerji",
  "dogal-gaz-dagitim",
  "sanayi",
  "gida",
  "turizm",
]) {
  const page = pageMap.get(slug);
  if (!page) {
    console.log(`\n## ${slug} — MISSING\n`);
    continue;
  }
  const images = [
    ...String(page.body_html_tr ?? "").matchAll(
      /https?:\/\/[^"'\s>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s>]*)?/gi,
    ),
  ].map((match) => match[0]);
  const pdfs = [
    ...String(page.body_html_tr ?? "").matchAll(
      /https?:\/\/[^"'\s>]+\.pdf/gi,
    ),
  ].map((match) => match[0]);
  console.log(`\n## ${slug} — ${page.title_tr}`);
  console.log(`length: ${page.body_html_tr?.length ?? 0}`);
  console.log(`images: ${images.length}`, images.slice(0, 3));
  console.log(`pdfs: ${pdfs.length}`, pdfs.slice(0, 3));
  console.log(String(page.body_text_tr ?? "").slice(0, 500).replace(/\s+/g, " "));
}
