import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { load } from "cheerio";

const root = process.cwd();
const source = JSON.parse(
  await readFile(join(root, "src", "content", "pages", "bilgi-toplumu-hizmetleri.json"), "utf8"),
);
const $ = load(source.body_html_tr);

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      referer: "https://www.fernas.com.tr/",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

let index = 0;
for (const anchor of $("a[href]").toArray()) {
  const href = $(anchor).attr("href") ?? "";
  index += 1;

  if (href.includes("bilgi-toplumu-hizmetleri/#")) {
    const label = $(anchor).text().replace(/\s+/g, " ").trim();
    const id = `bolum-${index}`;
    $(anchor).replaceWith(`<h2 id="${id}">${label}</h2>`);
    continue;
  }

  if (/\.pdf(?:\?|$)/i.test(href)) {
    const url = new URL(href, "https://www.fernas.com.tr").toString();
    const fileName = decodeURIComponent(basename(new URL(url).pathname));
    const localName = fileName.replace(/[^A-Za-z0-9._-]+/g, "-");
    const outputPath = join(root, "public", "belgeler", "kvkk", localName);
    try {
      await mkdir(join(root, "public", "belgeler", "kvkk"), { recursive: true });
      const buffer = await fetchBuffer(url);
      await writeFile(outputPath, buffer);
      $(anchor).attr("href", `/belgeler/kvkk/${localName}`);
    } catch (error) {
      console.error("PDF indirilemedi", url, error.message);
    }
  }
}

const html = $("body").html() ?? $.root().html() ?? "";

await writeFile(
  join(root, "src", "data", "bilgi-toplumu.json"),
  `${JSON.stringify({ html, modifiedAt: source.modified_at }, null, 2)}\n`,
  "utf8",
);

console.log("bilgi toplumu hazır", html.length);
