import { readFile } from "node:fs/promises";

const page = JSON.parse(
  await readFile("src/content/pages/bilgi-toplumu-hizmetleri.json", "utf8"),
);
console.log(page.body_html_tr);
